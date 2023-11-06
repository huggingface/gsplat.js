import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
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

    updateTex() {
        this.tex = SplatTexture.FromScene(this);
    }

    setData(data: Uint8Array): void {
        this.data = data;

        const rowLength = 3 * 4 + 3 * 4 + 4 + 4;
        this.vertexCount = data.length / rowLength;

        this.f_buffer = new Float32Array(this.data.buffer);
        this.u_buffer = new Uint8Array(this.data.buffer);

        this.dirty = true;
    }

    translate(translation: Vector3) {
        for (let i = 0; i < this.vertexCount; i++) {
            const x = this.f_buffer[8 * i + 0];
            const y = this.f_buffer[8 * i + 1];
            const z = this.f_buffer[8 * i + 2];

            this.f_buffer[8 * i + 0] = x + translation.x;
            this.f_buffer[8 * i + 1] = y + translation.y;
            this.f_buffer[8 * i + 2] = z + translation.z;
        }

        this.dirty = true;
    }

    rotate(rotation: Quaternion) {
        for (let i = 0; i < this.vertexCount; i++) {
            const x = this.f_buffer[8 * i + 0];
            const y = this.f_buffer[8 * i + 1];
            const z = this.f_buffer[8 * i + 2];

            const qx = rotation.x;
            const qy = rotation.y;
            const qz = rotation.z;
            const qw = rotation.w;

            // calculate quat * vector
            const ix = qw * x + qy * z - qz * y;
            const iy = qw * y + qz * x - qx * z;
            const iz = qw * z + qx * y - qy * x;
            const iw = -qx * x - qy * y - qz * z;

            // calculate result * inverse quat
            this.f_buffer[8 * i + 0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
            this.f_buffer[8 * i + 1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
            this.f_buffer[8 * i + 2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
        }

        this.dirty = true;
    }
}

export { Scene };
