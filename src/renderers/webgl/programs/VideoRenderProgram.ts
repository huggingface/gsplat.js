import SortWorker from "web-worker:../utils/SortWorker.ts";

import { SplatvData } from "../../../index";
import { WebGLRenderer } from "../../WebGLRenderer";
import { ShaderPass } from "../passes/ShaderPass";
import { ShaderProgram } from "./ShaderProgram";

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

    constructor(renderer: WebGLRenderer, passes: ShaderPass[]) {
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

        const createWorker = () => {
            worker = new SortWorker();
            worker.onmessage = (e) => {
                if (e.data.depthIndex) {
                    const { depthIndex } = e.data;
                    this._depthIndex = depthIndex;
                    gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, depthIndex, gl.STATIC_DRAW);
                }
            };
        };
    }

    protected _getVertexSource(): string {
        return vertexShaderSource;
    }

    protected _getFragmentSource(): string {
        return fragmentShaderSource;
    }
}

export { VideoRenderProgram };
