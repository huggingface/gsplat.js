import { Splatv } from "../../../splats/Splatv";
import { SplatvData } from "../../../splats/SplatvData";
import { WebGLRenderer } from "../../WebGLRenderer";
import { ShaderPass } from "../passes/ShaderPass";
import { ShaderProgram } from "./ShaderProgram";
import { ObjectAddedEvent, ObjectChangedEvent, ObjectRemovedEvent } from "../../../events/Events";
import { Matrix4 } from "../../../math/Matrix4";

const vertexShaderSource = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
  
uniform highp usampler2D u_texture;
uniform mat4 projection, view;
uniform vec2 focal;
uniform vec2 viewport;
uniform float time;
  
in vec2 position;
in int index;
  
out vec4 vColor;
out vec2 vPosition;
  
void main () {
    gl_Position = vec4(0.0, 0.0, 2.0, 1.0);

    uvec4 motion1 = texelFetch(u_texture, ivec2(((uint(index) & 0x3ffu) << 2) | 3u, uint(index) >> 10), 0);
    vec2 trbf = unpackHalf2x16(motion1.w);
    float dt = time - trbf.x;

    float topacity = exp(-1.0 * pow(dt / trbf.y, 2.0));
    if(topacity < 0.02) return;

    uvec4 motion0 = texelFetch(u_texture, ivec2(((uint(index) & 0x3ffu) << 2) | 2u, uint(index) >> 10), 0);
    uvec4 static0 = texelFetch(u_texture, ivec2(((uint(index) & 0x3ffu) << 2), uint(index) >> 10), 0);

    vec2 m0 = unpackHalf2x16(motion0.x), m1 = unpackHalf2x16(motion0.y), m2 = unpackHalf2x16(motion0.z), 
         m3 = unpackHalf2x16(motion0.w), m4 = unpackHalf2x16(motion1.x); 
      
    vec4 trot = vec4(unpackHalf2x16(motion1.y).xy, unpackHalf2x16(motion1.z).xy) * dt;
    vec3 tpos = (vec3(m0.xy, m1.x) * dt + vec3(m1.y, m2.xy) * dt*dt + vec3(m3.xy, m4.x) * dt*dt*dt);
      
    vec4 cam = view * vec4(uintBitsToFloat(static0.xyz) + tpos, 1);
    vec4 pos = projection * cam;
  
    float clip = 1.2 * pos.w;
    if (pos.z < -clip || pos.x < -clip || pos.x > clip || pos.y < -clip || pos.y > clip) return;
    uvec4 static1 = texelFetch(u_texture, ivec2(((uint(index) & 0x3ffu) << 2) | 1u, uint(index) >> 10), 0);

    vec4 rot = vec4(unpackHalf2x16(static0.w).xy, unpackHalf2x16(static1.x).xy) + trot;
    vec3 scale = vec3(unpackHalf2x16(static1.y).xy, unpackHalf2x16(static1.z).x);
    rot /= sqrt(dot(rot, rot));
  
    mat3 S = mat3(scale.x, 0.0, 0.0, 0.0, scale.y, 0.0, 0.0, 0.0, scale.z);
    mat3 R = mat3(
        1.0 - 2.0 * (rot.z * rot.z + rot.w * rot.w), 2.0 * (rot.y * rot.z - rot.x * rot.w), 2.0 * (rot.y * rot.w + rot.x * rot.z),
        2.0 * (rot.y * rot.z + rot.x * rot.w), 1.0 - 2.0 * (rot.y * rot.y + rot.w * rot.w), 2.0 * (rot.z * rot.w - rot.x * rot.y),
        2.0 * (rot.y * rot.w - rot.x * rot.z), 2.0 * (rot.z * rot.w + rot.x * rot.y), 1.0 - 2.0 * (rot.y * rot.y + rot.z * rot.z));
    mat3 M = S * R;
    mat3 Vrk = 4.0 * transpose(M) * M;
    mat3 J = mat3(
        focal.x / cam.z, 0., -(focal.x * cam.x) / (cam.z * cam.z), 
        0., -focal.y / cam.z, (focal.y * cam.y) / (cam.z * cam.z), 
        0., 0., 0.
    );
  
    mat3 T = transpose(mat3(view)) * J;
    mat3 cov2d = transpose(T) * Vrk * T;
  
    float mid = (cov2d[0][0] + cov2d[1][1]) / 2.0;
    float radius = length(vec2((cov2d[0][0] - cov2d[1][1]) / 2.0, cov2d[0][1]));
    float lambda1 = mid + radius, lambda2 = mid - radius;
  
    if(lambda2 < 0.0) return;
    vec2 diagonalVector = normalize(vec2(cov2d[0][1], lambda1 - cov2d[0][0]));
    vec2 majorAxis = min(sqrt(2.0 * lambda1), 1024.0) * diagonalVector;
    vec2 minorAxis = min(sqrt(2.0 * lambda2), 1024.0) * vec2(diagonalVector.y, -diagonalVector.x);
      
    uint rgba = static1.w;
    vColor = 
        clamp(pos.z/pos.w+1.0, 0.0, 1.0) * 
        vec4(1.0, 1.0, 1.0, topacity) *
        vec4(
            (rgba) & 0xffu, 
            (rgba >> 8) & 0xffu, 
            (rgba >> 16) & 0xffu, 
            (rgba >> 24) & 0xffu) / 255.0;

    vec2 vCenter = vec2(pos) / pos.w;
    gl_Position = vec4(
        vCenter 
        + position.x * majorAxis / viewport 
        + position.y * minorAxis / viewport, 0.0, 1.0);

    vPosition = position;
}
`;

const fragmentShaderSource = /* glsl */ `#version 300 es
precision highp float;
  
in vec4 vColor;
in vec2 vPosition;

out vec4 fragColor;

void main () {
    float A = -dot(vPosition, vPosition);
    if (A < -4.0) discard;
    float B = exp(A) * vColor.a;
    fragColor = vec4(B * vColor.rgb, B);
}
`;

class VideoRenderProgram extends ShaderProgram {
    private _renderData: SplatvData | null = null;
    private _depthIndex: Uint32Array = new Uint32Array();
    private _splatTexture: WebGLTexture | null = null;

    protected _initialize: () => void;
    protected _resize: () => void;
    protected _render: () => void;
    protected _dispose: () => void;

    constructor(renderer: WebGLRenderer, passes: ShaderPass[] = []) {
        super(renderer, passes);

        const canvas = renderer.canvas;
        const gl = renderer.gl;

        let worker: Worker;

        let u_projection: WebGLUniformLocation;
        let u_viewport: WebGLUniformLocation;
        let u_focal: WebGLUniformLocation;
        let u_view: WebGLUniformLocation;
        let u_texture: WebGLUniformLocation;
        let u_time: WebGLUniformLocation;

        let positionAttribute: number;
        let indexAttribute: number;

        let vertexBuffer: WebGLBuffer;
        let indexBuffer: WebGLBuffer;

        this._resize = () => {
            if (!this._camera) return;

            this._camera.data.setSize(canvas.width, canvas.height);
            this._camera.update();

            u_projection = gl.getUniformLocation(this.program, "projection") as WebGLUniformLocation;
            gl.uniformMatrix4fv(u_projection, false, this._camera.data.projectionMatrix.buffer);

            u_viewport = gl.getUniformLocation(this.program, "viewport") as WebGLUniformLocation;
            gl.uniform2fv(u_viewport, new Float32Array([canvas.width, canvas.height]));
        };

        const setupWorker = () => {
            if (renderer.renderProgram.worker === null) {
                console.error("Render program is not initialized. Cannot render without worker");
                return;
            }
            worker = renderer.renderProgram.worker;
            worker.onmessage = (e) => {
                if (e.data.depthIndex) {
                    const { depthIndex } = e.data;
                    this._depthIndex = depthIndex;
                    gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, depthIndex, gl.STATIC_DRAW);
                }
            };
        };

        this._initialize = () => {
            if (!this._scene || !this._camera) {
                console.error("Cannot render without scene and camera");
                return;
            }

            this._resize();

            this._scene.addEventListener("objectAdded", handleObjectAdded);
            this._scene.addEventListener("objectRemoved", handleObjectRemoved);
            for (const object of this._scene.objects) {
                if (object instanceof Splatv) {
                    if (this._renderData === null) {
                        this._renderData = object.data;
                        object.addEventListener("objectChanged", handleObjectChanged);
                    } else {
                        console.warn("Multiple Splatv objects are not currently supported");
                    }
                }
            }

            if (this._renderData === null) {
                console.error("Cannot render without Splatv object");
                return;
            }

            u_focal = gl.getUniformLocation(this.program, "focal") as WebGLUniformLocation;
            gl.uniform2fv(u_focal, new Float32Array([this._camera.data.fx, this._camera.data.fy]));

            u_view = gl.getUniformLocation(this.program, "view") as WebGLUniformLocation;
            gl.uniformMatrix4fv(u_view, false, this._camera.data.viewMatrix.buffer);

            this._splatTexture = gl.createTexture() as WebGLTexture;
            u_texture = gl.getUniformLocation(this.program, "u_texture") as WebGLUniformLocation;
            gl.uniform1i(u_texture, 0);

            u_time = gl.getUniformLocation(this.program, "time") as WebGLUniformLocation;
            gl.uniform1f(u_time, Math.sin(Date.now() / 1000) / 2 + 1 / 2);

            vertexBuffer = gl.createBuffer() as WebGLBuffer;
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-2, -2, 2, -2, 2, 2, -2, 2]), gl.STATIC_DRAW);

            positionAttribute = gl.getAttribLocation(this.program, "position");
            gl.enableVertexAttribArray(positionAttribute);
            gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);

            indexBuffer = gl.createBuffer() as WebGLBuffer;
            indexAttribute = gl.getAttribLocation(this.program, "index");
            gl.enableVertexAttribArray(indexAttribute);
            gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);

            setupWorker();

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this._splatTexture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA32UI,
                this._renderData.width,
                this._renderData.height,
                0,
                gl.RGBA_INTEGER,
                gl.UNSIGNED_INT,
                this._renderData.data,
            );

            const positions = this._renderData.positions;
            const dummyTransforms = new Float32Array(new Matrix4().buffer);
            const dummyTransformIndices = new Uint32Array(this._renderData.vertexCount);
            dummyTransformIndices.fill(0);
            worker.postMessage(
                {
                    sortData: {
                        positions: positions,
                        transforms: dummyTransforms,
                        transformIndices: dummyTransformIndices,
                        vertexCount: this._renderData.vertexCount,
                    },
                },
                [positions.buffer, dummyTransforms.buffer, dummyTransformIndices.buffer],
            );
        };

        const handleObjectAdded = (event: Event) => {
            const e = event as ObjectAddedEvent;

            if (e.object instanceof Splatv) {
                if (this._renderData === null) {
                    this._renderData = e.object.data;
                    e.object.addEventListener("objectChanged", handleObjectChanged);
                } else {
                    console.warn("Splatv not supported by default RenderProgram. Use VideoRenderProgram instead.");
                }
            }

            this.dispose();
        };

        const handleObjectRemoved = (event: Event) => {
            const e = event as ObjectRemovedEvent;

            if (e.object instanceof Splatv) {
                if (this._renderData === e.object.data) {
                    this._renderData = null;
                    e.object.removeEventListener("objectChanged", handleObjectChanged);
                }
            }

            this.dispose();
        };

        const handleObjectChanged = (event: Event) => {
            const e = event as ObjectChangedEvent;

            if (e.object instanceof Splatv && this._renderData === e.object.data) {
                this.dispose();
            }
        };

        this._render = () => {
            if (!this._scene || !this._camera) {
                console.error("Cannot render without scene and camera");
                return;
            }

            if (!this._renderData) {
                console.warn("Cannot render without Splatv object");
                return;
            }

            this._camera.update();
            worker.postMessage({ viewProj: this._camera.data.viewProj.buffer });

            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.disable(gl.DEPTH_TEST);
            gl.enable(gl.BLEND);
            gl.blendFuncSeparate(gl.ONE_MINUS_DST_ALPHA, gl.ONE, gl.ONE_MINUS_DST_ALPHA, gl.ONE);
            gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);

            gl.uniformMatrix4fv(u_projection, false, this._camera.data.projectionMatrix.buffer);
            gl.uniformMatrix4fv(u_view, false, this._camera.data.viewMatrix.buffer);
            gl.uniform1f(u_time, Math.sin(Date.now() / 1000) / 2 + 1 / 2);

            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this._depthIndex, gl.STATIC_DRAW);
            gl.vertexAttribIPointer(indexAttribute, 1, gl.INT, 0, 0);
            gl.vertexAttribDivisor(indexAttribute, 1);

            gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, 4, this._renderData.vertexCount);
        };

        this._dispose = () => {
            if (!this._scene || !this._camera) {
                console.error("Cannot dispose without scene and camera");
                return;
            }

            this._scene.removeEventListener("objectAdded", handleObjectAdded);
            this._scene.removeEventListener("objectRemoved", handleObjectRemoved);
            for (const object of this._scene.objects) {
                if (object instanceof Splatv) {
                    if (this._renderData === object.data) {
                        this._renderData = null;
                        object.removeEventListener("objectChanged", handleObjectChanged);
                    }
                }
            }

            worker?.terminate();

            gl.deleteTexture(this._splatTexture);

            gl.deleteBuffer(indexBuffer);
            gl.deleteBuffer(vertexBuffer);
        };
    }

    get renderData(): SplatvData | null {
        return this._renderData;
    }

    protected _getVertexSource(): string {
        return vertexShaderSource;
    }

    protected _getFragmentSource(): string {
        return fragmentShaderSource;
    }
}

export { VideoRenderProgram };
