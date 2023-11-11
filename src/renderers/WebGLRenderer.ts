import type { Camera } from "../cameras/Camera";
import type { Scene } from "../core/Scene";

import SortWorker from "web-worker:./webgl/utils/Worker.ts";

import { vertex } from "./webgl/shaders/vertex.glsl";
import { frag } from "./webgl/shaders/frag.glsl";
import { ShaderPass } from "./webgl/passes/ShaderPass";
import { FadeInPass } from "./webgl/passes/FadeInPass";

export class WebGLRenderer {
    domElement: HTMLCanvasElement;
    gl: WebGL2RenderingContext;

    resize: () => void;
    setSize: (width: number, height: number) => void;
    render: (scene: Scene, camera: Camera) => void;
    dispose: () => void;

    constructor(optionalCanvas: HTMLCanvasElement | null = null, optionalShaderPasses: ShaderPass[] | null = null) {
        const canvas: HTMLCanvasElement = optionalCanvas || document.createElement("canvas");
        if (!optionalCanvas) {
            canvas.style.display = "block";
            canvas.style.boxSizing = "border-box";
            canvas.style.width = "100%";
            canvas.style.height = "100%";
            canvas.style.margin = "0";
            canvas.style.padding = "0";
            document.body.appendChild(canvas);
        }
        canvas.style.background = "#000";
        this.domElement = canvas;

        const gl = canvas.getContext("webgl2", { antialias: false }) as WebGL2RenderingContext;
        this.gl = gl;

        const shaderPasses = optionalShaderPasses || [];
        if (!optionalShaderPasses) {
            shaderPasses.push(new FadeInPass());
        }

        let activeScene: Scene;
        let activeCamera: Camera;

        let worker: Worker;

        let vertexShader: WebGLShader;
        let fragmentShader: WebGLShader;
        let program: WebGLProgram;

        let u_projection: WebGLUniformLocation;
        let u_viewport: WebGLUniformLocation;
        let u_focal: WebGLUniformLocation;
        let u_view: WebGLUniformLocation;
        let u_texture: WebGLUniformLocation;

        let positionAttribute: number;
        let indexAttribute: number;

        let vertexBuffer: WebGLBuffer;
        let centerBuffer: WebGLBuffer;
        let colorBuffer: WebGLBuffer;
        let covABuffer: WebGLBuffer;
        let covBBuffer: WebGLBuffer;

        let initialized = false;

        this.resize = () => {
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            if (canvas.width !== width || canvas.height !== height) {
                this.setSize(width, height);
            }
        };

        this.setSize = (width: number, height: number) => {
            canvas.width = width;
            canvas.height = height;

            if (!activeCamera) return;

            gl.viewport(0, 0, canvas!.width, canvas.height);
            activeCamera.update(canvas.width, canvas.height);

            u_projection = gl.getUniformLocation(program, "projection") as WebGLUniformLocation;
            gl.uniformMatrix4fv(u_projection, false, activeCamera.projectionMatrix.buffer);

            u_viewport = gl.getUniformLocation(program, "viewport") as WebGLUniformLocation;
            gl.uniform2fv(u_viewport, new Float32Array([canvas.width, canvas.height]));
        };

        const initWebGL = () => {
            worker = new SortWorker();
            const serializedScene = {
                positions: activeScene.positions,
                vertexCount: activeScene.vertexCount,
            };
            worker.postMessage({ scene: serializedScene });

            gl.viewport(0, 0, canvas.width, canvas.height);

            vertexShader = gl.createShader(gl.VERTEX_SHADER) as WebGLShader;
            gl.shaderSource(vertexShader, vertex);
            gl.compileShader(vertexShader);
            if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(vertexShader));
            }

            fragmentShader = gl.createShader(gl.FRAGMENT_SHADER) as WebGLShader;
            gl.shaderSource(fragmentShader, frag);
            gl.compileShader(fragmentShader);
            if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(fragmentShader));
            }

            program = gl.createProgram() as WebGLProgram;
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            gl.useProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.error(gl.getProgramInfoLog(program));
            }

            gl.disable(gl.DEPTH_TEST);
            gl.enable(gl.BLEND);
            gl.blendFuncSeparate(gl.ONE_MINUS_DST_ALPHA, gl.ONE, gl.ONE_MINUS_DST_ALPHA, gl.ONE);
            gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);

            activeCamera.update(canvas.width, canvas.height);

            u_projection = gl.getUniformLocation(program, "projection") as WebGLUniformLocation;
            gl.uniformMatrix4fv(u_projection, false, activeCamera.projectionMatrix.buffer);

            u_viewport = gl.getUniformLocation(program, "viewport") as WebGLUniformLocation;
            gl.uniform2fv(u_viewport, new Float32Array([canvas.width, canvas.height]));

            u_focal = gl.getUniformLocation(program, "focal") as WebGLUniformLocation;
            gl.uniform2fv(u_focal, new Float32Array([activeCamera.fx, activeCamera.fy]));

            u_view = gl.getUniformLocation(program, "view") as WebGLUniformLocation;
            gl.uniformMatrix4fv(u_view, false, activeCamera.viewMatrix.buffer);

            const triangleVertices = new Float32Array([-2, -2, 2, -2, 2, 2, -2, 2]);
            vertexBuffer = gl.createBuffer() as WebGLBuffer;
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);

            positionAttribute = gl.getAttribLocation(program, "position");
            gl.enableVertexAttribArray(positionAttribute);
            gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);

            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);

            u_texture = gl.getUniformLocation(program, "u_texture") as WebGLUniformLocation;
            gl.uniform1i(u_texture, 0);

            const indexBuffer = gl.createBuffer() as WebGLBuffer;
            indexAttribute = gl.getAttribLocation(program, "index");
            gl.enableVertexAttribArray(indexAttribute);
            gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
            gl.vertexAttribIPointer(indexAttribute, 1, gl.INT, 0, 0);
            gl.vertexAttribDivisor(indexAttribute, 1);

            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA32UI,
                activeScene.width,
                activeScene.height,
                0,
                gl.RGBA_INTEGER,
                gl.UNSIGNED_INT,
                activeScene.data,
            );
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);

            for (const shaderPass of shaderPasses) {
                shaderPass.init(this, program);
            }

            worker.onmessage = (e) => {
                if (e.data.depthIndex) {
                    const { depthIndex } = e.data;
                    gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, depthIndex, gl.STATIC_DRAW);
                }
            };

            initialized = true;
        };

        const onSceneChange = () => {
            if (initialized) {
                this.dispose();
            }

            initWebGL();
        };

        this.render = (scene: Scene, camera: Camera) => {
            if (scene !== activeScene || camera !== activeCamera) {
                if (initialized) {
                    this.dispose();
                }

                activeCamera = camera;

                if (scene !== activeScene) {
                    if (activeScene) {
                        activeScene.removeEventListener("change", onSceneChange);
                    }
                    activeScene = scene;
                    activeScene.addEventListener("change", onSceneChange);
                }

                initWebGL();
            }

            activeCamera.update(canvas.width, canvas.height);
            worker.postMessage({ viewProj: activeCamera.viewProj });

            if (activeScene.vertexCount > 0) {
                for (const shaderPass of shaderPasses) {
                    shaderPass.render();
                }
                gl.uniformMatrix4fv(u_view, false, activeCamera.viewMatrix.buffer);
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, 4, activeScene.vertexCount);
            } else {
                gl.clear(gl.COLOR_BUFFER_BIT);
            }
        };

        this.dispose = () => {
            worker.terminate();

            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            gl.deleteProgram(program);

            gl.deleteBuffer(vertexBuffer);
            gl.deleteBuffer(centerBuffer);
            gl.deleteBuffer(colorBuffer);
            gl.deleteBuffer(covABuffer);
            gl.deleteBuffer(covBBuffer);

            initialized = false;
        };

        this.resize();
    }
}
