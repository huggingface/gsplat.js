import { Matrix3 } from "../math/Matrix3";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { SplatTexture } from "../renderers/webgl/utils/SplatTexture";

class Scene {
    data: Uint8Array;

    vertexCount: number;

    f_buffer: Float32Array;
    u_buffer: Uint8Array;

    tex: SplatTexture;

    dirty: boolean;

    constructor() {
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
        this.vertexCount = this.data.length / rowLength;

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
        const R = Matrix3.RotationFromQuaternion(rotation).buffer;

        for (let i = 0; i < this.vertexCount; i++) {
            const x = this.f_buffer[8 * i + 0];
            const y = this.f_buffer[8 * i + 1];
            const z = this.f_buffer[8 * i + 2];

            this.f_buffer[8 * i + 0] = R[0] * x + R[1] * y + R[2] * z;
            this.f_buffer[8 * i + 1] = R[3] * x + R[4] * y + R[5] * z;
            this.f_buffer[8 * i + 2] = R[6] * x + R[7] * y + R[8] * z;

            const currentRotation = new Quaternion(
                (this.u_buffer[32 * i + 28 + 1] - 128) / 128,
                (this.u_buffer[32 * i + 28 + 2] - 128) / 128,
                (this.u_buffer[32 * i + 28 + 3] - 128) / 128,
                (this.u_buffer[32 * i + 28 + 0] - 128) / 128,
            );

            const newRot = rotation.multiply(currentRotation);
            this.u_buffer[32 * i + 28 + 1] = Math.round((newRot.x * 128 + 128) % 256);
            this.u_buffer[32 * i + 28 + 2] = Math.round((newRot.y * 128 + 128) % 256);
            this.u_buffer[32 * i + 28 + 3] = Math.round((newRot.z * 128 + 128) % 256);
            this.u_buffer[32 * i + 28 + 0] = Math.round((newRot.w * 128 + 128) % 256);
        }

        this.dirty = true;
    }
}

export { Scene };
