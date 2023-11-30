import { Camera } from "../../../cameras/Camera";
import { Scene } from "../../../core/Scene";
import { WebGLRenderer } from "../../WebGLRenderer";
import { ShaderPass } from "../passes/ShaderPass";

abstract class ShaderProgram {
    private _renderer: WebGLRenderer;
    private _program: WebGLProgram;
    private _passes: ShaderPass[];

    protected _scene: Scene | null = null;
    protected _camera: Camera | null = null;
    protected _started: boolean = false;
    protected _initialized: boolean = false;

    protected abstract _initialize: () => void;
    protected abstract _resize: () => void;
    protected abstract _render: () => void;
    protected abstract _dispose: () => void;

    initialize: () => void;
    resize: () => void;
    render: (scene: Scene, camera: Camera) => void;
    dispose: () => void;

    constructor(renderer: WebGLRenderer, passes: ShaderPass[]) {
        this._renderer = renderer;
        const gl = renderer.gl;

        this._program = gl.createProgram() as WebGLProgram;
        this._passes = passes || [];

        const vertexShader = gl.createShader(gl.VERTEX_SHADER) as WebGLShader;
        gl.shaderSource(vertexShader, this._getVertexSource());
        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(vertexShader));
        }

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER) as WebGLShader;
        gl.shaderSource(fragmentShader, this._getFragmentSource());
        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(fragmentShader));
        }

        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(this.program));
        }

        this.resize = () => {
            gl.useProgram(this._program);

            this._resize();
        };

        this.initialize = () => {
            console.assert(!this._initialized, "ShaderProgram already initialized");

            gl.useProgram(this._program);

            this._initialize();
            for (const pass of this.passes) {
                pass.initialize(this);
            }

            this._initialized = true;
            this._started = true;
        };

        this.render = (scene: Scene, camera: Camera) => {
            gl.useProgram(this._program);

            if (this._scene !== scene || this._camera !== camera) {
                this.dispose();
                this._scene = scene;
                this._camera = camera;
                this.initialize();
            }

            for (const pass of this.passes) {
                pass.render();
            }

            this._render();
        };

        this.dispose = () => {
            if (!this._initialized) return;

            gl.useProgram(this._program);

            for (const pass of this.passes) {
                pass.dispose();
            }

            this._dispose();

            this._scene = null;
            this._camera = null;
            this._initialized = false;
        };
    }

    get renderer() {
        return this._renderer;
    }

    get scene() {
        return this._scene;
    }

    get camera() {
        return this._camera;
    }

    get program() {
        return this._program;
    }

    get passes() {
        return this._passes;
    }

    get started() {
        return this._started;
    }

    protected abstract _getVertexSource(): string;
    protected abstract _getFragmentSource(): string;
}

export { ShaderProgram };
