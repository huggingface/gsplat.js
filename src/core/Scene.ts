import { SplatTexture } from "../renderers/webgl/utils/SplatTexture";
import { Object3D } from "./Object3D";

class Scene extends Object3D {
    data: Uint8Array;

    vertexCount: number;

    f_buffer: Float32Array;
    u_buffer: Uint8Array;

    tex: SplatTexture;

    dirty: boolean;

    constructor() {
        super();

        this.data = new Uint8Array(0);
        this.vertexCount = 0;

        this.f_buffer = new Float32Array(0);
        this.u_buffer = new Uint8Array(0);

        this.tex = new SplatTexture(new Uint32Array(0), 0, 0);

        this.dirty = true;
    }

    setData(data: Uint8Array): void {
        this.data = data;

        const rowLength = 3 * 4 + 3 * 4 + 4 + 4;
        this.vertexCount = data.length / rowLength;

        this.f_buffer = new Float32Array(this.data.buffer);
        this.u_buffer = new Uint8Array(this.data.buffer);

        this.tex = SplatTexture.FromScene(this);

        this.dirty = true;
    }
}

export { Scene };
