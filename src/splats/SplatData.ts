import { Vector3 } from "../math/Vector3";
import { Quaternion } from "../math/Quaternion";
import { Matrix3 } from "../math/Matrix3";

class SplatData {
    static RowLength = 3 * 4 + 3 * 4 + 4 + 4;

    public changed = false;
    public detached = false;

    private _vertexCount: number;
    private _positions: Float32Array;
    private _rotations: Float32Array;
    private _scales: Float32Array;
    private _colors: Uint8Array;
    private _selection: Uint8Array;

    translate: (translation: Vector3) => void;
    rotate: (rotation: Quaternion) => void;
    scale: (scale: Vector3) => void;
    serialize: () => Uint8Array;
    reattach: (
        positions: ArrayBufferLike,
        rotations: ArrayBufferLike,
        scales: ArrayBufferLike,
        colors: ArrayBufferLike,
        selection: ArrayBufferLike,
    ) => void;

    constructor(
        vertexCount: number = 0,
        positions: Float32Array | null = null,
        rotations: Float32Array | null = null,
        scales: Float32Array | null = null,
        colors: Uint8Array | null = null,
    ) {
        this._vertexCount = vertexCount;
        this._positions = positions || new Float32Array(0);
        this._rotations = rotations || new Float32Array(0);
        this._scales = scales || new Float32Array(0);
        this._colors = colors || new Uint8Array(0);
        this._selection = new Uint8Array(this.vertexCount);

        this.translate = (translation: Vector3) => {
            for (let i = 0; i < this.vertexCount; i++) {
                this.positions[3 * i + 0] += translation.x;
                this.positions[3 * i + 1] += translation.y;
                this.positions[3 * i + 2] += translation.z;
            }

            this.changed = true;
        };

        this.rotate = (rotation: Quaternion) => {
            const R = Matrix3.RotationFromQuaternion(rotation).buffer;
            for (let i = 0; i < this.vertexCount; i++) {
                const x = this.positions[3 * i + 0];
                const y = this.positions[3 * i + 1];
                const z = this.positions[3 * i + 2];

                this.positions[3 * i + 0] = R[0] * x + R[1] * y + R[2] * z;
                this.positions[3 * i + 1] = R[3] * x + R[4] * y + R[5] * z;
                this.positions[3 * i + 2] = R[6] * x + R[7] * y + R[8] * z;

                const currentRotation = new Quaternion(
                    this.rotations[4 * i + 1],
                    this.rotations[4 * i + 2],
                    this.rotations[4 * i + 3],
                    this.rotations[4 * i + 0],
                );

                const newRot = rotation.multiply(currentRotation);
                this.rotations[4 * i + 1] = newRot.x;
                this.rotations[4 * i + 2] = newRot.y;
                this.rotations[4 * i + 3] = newRot.z;
                this.rotations[4 * i + 0] = newRot.w;
            }

            this.changed = true;
        };

        this.scale = (scale: Vector3) => {
            for (let i = 0; i < this.vertexCount; i++) {
                this.positions[3 * i + 0] *= scale.x;
                this.positions[3 * i + 1] *= scale.y;
                this.positions[3 * i + 2] *= scale.z;

                this.scales[3 * i + 0] *= scale.x;
                this.scales[3 * i + 1] *= scale.y;
                this.scales[3 * i + 2] *= scale.z;
            }

            this.changed = true;
        };

        this.serialize = () => {
            const data = new Uint8Array(this.vertexCount * SplatData.RowLength);

            const f_buffer = new Float32Array(data.buffer);
            const u_buffer = new Uint8Array(data.buffer);

            for (let i = 0; i < this.vertexCount; i++) {
                f_buffer[8 * i + 0] = this.positions[3 * i + 0];
                f_buffer[8 * i + 1] = this.positions[3 * i + 1];
                f_buffer[8 * i + 2] = this.positions[3 * i + 2];

                u_buffer[32 * i + 24 + 0] = this.colors[4 * i + 0];
                u_buffer[32 * i + 24 + 1] = this.colors[4 * i + 1];
                u_buffer[32 * i + 24 + 2] = this.colors[4 * i + 2];
                u_buffer[32 * i + 24 + 3] = this.colors[4 * i + 3];

                f_buffer[8 * i + 3 + 0] = this.scales[3 * i + 0];
                f_buffer[8 * i + 3 + 1] = this.scales[3 * i + 1];
                f_buffer[8 * i + 3 + 2] = this.scales[3 * i + 2];

                u_buffer[32 * i + 28 + 0] = (this.rotations[4 * i + 0] * 128 + 128) & 0xff;
                u_buffer[32 * i + 28 + 1] = (this.rotations[4 * i + 1] * 128 + 128) & 0xff;
                u_buffer[32 * i + 28 + 2] = (this.rotations[4 * i + 2] * 128 + 128) & 0xff;
                u_buffer[32 * i + 28 + 3] = (this.rotations[4 * i + 3] * 128 + 128) & 0xff;
            }

            return data;
        };

        this.reattach = (
            positions: ArrayBufferLike,
            rotations: ArrayBufferLike,
            scales: ArrayBufferLike,
            colors: ArrayBufferLike,
            selection: ArrayBufferLike,
        ) => {
            console.assert(
                positions.byteLength === this.vertexCount * 3 * 4,
                `Expected ${this.vertexCount * 3 * 4} bytes, got ${positions.byteLength} bytes`,
            );
            this._positions = new Float32Array(positions);
            this._rotations = new Float32Array(rotations);
            this._scales = new Float32Array(scales);
            this._colors = new Uint8Array(colors);
            this._selection = new Uint8Array(selection);
            this.detached = false;
        };
    }

    static Deserialize(data: Uint8Array): SplatData {
        const vertexCount = data.length / SplatData.RowLength;
        const positions = new Float32Array(3 * vertexCount);
        const rotations = new Float32Array(4 * vertexCount);
        const scales = new Float32Array(3 * vertexCount);
        const colors = new Uint8Array(4 * vertexCount);

        const f_buffer = new Float32Array(data.buffer);
        const u_buffer = new Uint8Array(data.buffer);

        for (let i = 0; i < vertexCount; i++) {
            positions[3 * i + 0] = f_buffer[8 * i + 0];
            positions[3 * i + 1] = f_buffer[8 * i + 1];
            positions[3 * i + 2] = f_buffer[8 * i + 2];

            rotations[4 * i + 0] = (u_buffer[32 * i + 28 + 0] - 128) / 128;
            rotations[4 * i + 1] = (u_buffer[32 * i + 28 + 1] - 128) / 128;
            rotations[4 * i + 2] = (u_buffer[32 * i + 28 + 2] - 128) / 128;
            rotations[4 * i + 3] = (u_buffer[32 * i + 28 + 3] - 128) / 128;

            scales[3 * i + 0] = f_buffer[8 * i + 3 + 0];
            scales[3 * i + 1] = f_buffer[8 * i + 3 + 1];
            scales[3 * i + 2] = f_buffer[8 * i + 3 + 2];

            colors[4 * i + 0] = u_buffer[32 * i + 24 + 0];
            colors[4 * i + 1] = u_buffer[32 * i + 24 + 1];
            colors[4 * i + 2] = u_buffer[32 * i + 24 + 2];
            colors[4 * i + 3] = u_buffer[32 * i + 24 + 3];
        }

        return new SplatData(vertexCount, positions, rotations, scales, colors);
    }

    get vertexCount() {
        return this._vertexCount;
    }

    get positions() {
        return this._positions;
    }

    get rotations() {
        return this._rotations;
    }

    get scales() {
        return this._scales;
    }

    get colors() {
        return this._colors;
    }

    get selection() {
        return this._selection;
    }
}

export { SplatData };
