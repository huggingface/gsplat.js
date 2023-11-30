import { Matrix3 } from "../math/Matrix3";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { EventDispatcher } from "./EventDispatcher";

class Scene extends EventDispatcher {
    static RowLength = 3 * 4 + 3 * 4 + 4 + 4;

    private _vertexCount: number;
    private _positions: Float32Array;
    private _rotations: Float32Array;
    private _scales: Float32Array;
    private _colors: Uint8Array;

    setData: (data: Uint8Array) => void;
    translate: (translation: Vector3) => void;
    rotate: (rotation: Quaternion) => void;
    scale: (scale: Vector3) => void;
    limitBox: (xMin: number, xMax: number, yMin: number, yMax: number, zMin: number, zMax: number) => void;
    saveToFile: (name: string) => void;

    constructor() {
        super();

        const changeEvent = { type: "change" } as Event;

        this._vertexCount = 0;
        this._positions = new Float32Array(0);
        this._rotations = new Float32Array(0);
        this._scales = new Float32Array(0);
        this._colors = new Uint8Array(0);

        this.setData = (data: Uint8Array) => {
            this._vertexCount = data.length / Scene.RowLength;
            this._positions = new Float32Array(3 * this._vertexCount);
            this._rotations = new Float32Array(4 * this._vertexCount);
            this._scales = new Float32Array(3 * this._vertexCount);
            this._colors = new Uint8Array(4 * this._vertexCount);

            const f_buffer = new Float32Array(data.buffer);
            const u_buffer = new Uint8Array(data.buffer);

            for (let i = 0; i < this._vertexCount; i++) {
                this._positions[3 * i + 0] = f_buffer[8 * i + 0];
                this._positions[3 * i + 1] = f_buffer[8 * i + 1];
                this._positions[3 * i + 2] = f_buffer[8 * i + 2];

                this._rotations[4 * i + 0] = (u_buffer[32 * i + 28 + 0] - 128) / 128;
                this._rotations[4 * i + 1] = (u_buffer[32 * i + 28 + 1] - 128) / 128;
                this._rotations[4 * i + 2] = (u_buffer[32 * i + 28 + 2] - 128) / 128;
                this._rotations[4 * i + 3] = (u_buffer[32 * i + 28 + 3] - 128) / 128;

                this._scales[3 * i + 0] = f_buffer[8 * i + 3 + 0];
                this._scales[3 * i + 1] = f_buffer[8 * i + 3 + 1];
                this._scales[3 * i + 2] = f_buffer[8 * i + 3 + 2];

                this._colors[4 * i + 0] = u_buffer[32 * i + 24 + 0];
                this._colors[4 * i + 1] = u_buffer[32 * i + 24 + 1];
                this._colors[4 * i + 2] = u_buffer[32 * i + 24 + 2];
                this._colors[4 * i + 3] = u_buffer[32 * i + 24 + 3];
            }

            this.dispatchEvent(changeEvent);
        };

        this.translate = (translation: Vector3) => {
            for (let i = 0; i < this._vertexCount; i++) {
                this._positions[3 * i + 0] += translation.x;
                this._positions[3 * i + 1] += translation.y;
                this._positions[3 * i + 2] += translation.z;
            }

            this.dispatchEvent(changeEvent);
        };

        this.rotate = (rotation: Quaternion) => {
            const R = Matrix3.RotationFromQuaternion(rotation).buffer;
            for (let i = 0; i < this._vertexCount; i++) {
                const x = this._positions[3 * i + 0];
                const y = this._positions[3 * i + 1];
                const z = this._positions[3 * i + 2];

                this._positions[3 * i + 0] = R[0] * x + R[1] * y + R[2] * z;
                this._positions[3 * i + 1] = R[3] * x + R[4] * y + R[5] * z;
                this._positions[3 * i + 2] = R[6] * x + R[7] * y + R[8] * z;

                const currentRotation = new Quaternion(
                    this._rotations[4 * i + 1],
                    this._rotations[4 * i + 2],
                    this._rotations[4 * i + 3],
                    this._rotations[4 * i + 0],
                );

                const newRot = rotation.multiply(currentRotation);
                this._rotations[4 * i + 1] = newRot.x;
                this._rotations[4 * i + 2] = newRot.y;
                this._rotations[4 * i + 3] = newRot.z;
                this._rotations[4 * i + 0] = newRot.w;
            }

            this.dispatchEvent(changeEvent);
        };

        this.scale = (scale: Vector3) => {
            for (let i = 0; i < this.vertexCount; i++) {
                this._positions[3 * i + 0] *= scale.x;
                this._positions[3 * i + 1] *= scale.y;
                this._positions[3 * i + 2] *= scale.z;

                this._scales[3 * i + 0] *= scale.x;
                this._scales[3 * i + 1] *= scale.y;
                this._scales[3 * i + 2] *= scale.z;
            }

            this.dispatchEvent(changeEvent);
        };

        this.limitBox = (xMin: number, xMax: number, yMin: number, yMax: number, zMin: number, zMax: number) => {
            if (xMin >= xMax) {
                throw new Error(`xMin (${xMin}) must be smaller than xMax (${xMax})`);
            }
            if (yMin >= yMax) {
                throw new Error(`yMin (${yMin}) must be smaller than yMax (${yMax})`);
            }
            if (zMin >= zMax) {
                throw new Error(`zMin (${zMin}) must be smaller than zMax (${zMax})`);
            }

            const mask = new Uint8Array(this._vertexCount);
            for (let i = 0; i < this._vertexCount; i++) {
                const x = this._positions[3 * i + 0];
                const y = this._positions[3 * i + 1];
                const z = this._positions[3 * i + 2];

                if (x >= xMin && x <= xMax && y >= yMin && y <= yMax && z >= zMin && z <= zMax) {
                    mask[i] = 1;
                }
            }

            let newIndex = 0;
            for (let i = 0; i < this._vertexCount; i++) {
                if (mask[i] === 0) continue;

                this._positions[3 * newIndex + 0] = this._positions[3 * i + 0];
                this._positions[3 * newIndex + 1] = this._positions[3 * i + 1];
                this._positions[3 * newIndex + 2] = this._positions[3 * i + 2];

                this._rotations[4 * newIndex + 0] = this._rotations[4 * i + 0];
                this._rotations[4 * newIndex + 1] = this._rotations[4 * i + 1];
                this._rotations[4 * newIndex + 2] = this._rotations[4 * i + 2];
                this._rotations[4 * newIndex + 3] = this._rotations[4 * i + 3];

                this._scales[3 * newIndex + 0] = this._scales[3 * i + 0];
                this._scales[3 * newIndex + 1] = this._scales[3 * i + 1];
                this._scales[3 * newIndex + 2] = this._scales[3 * i + 2];

                this._colors[4 * newIndex + 0] = this._colors[4 * i + 0];
                this._colors[4 * newIndex + 1] = this._colors[4 * i + 1];
                this._colors[4 * newIndex + 2] = this._colors[4 * i + 2];
                this._colors[4 * newIndex + 3] = this._colors[4 * i + 3];

                newIndex += 1;
            }

            this._vertexCount = newIndex;
            this._positions = new Float32Array(this._positions.buffer, 0, 3 * newIndex);
            this._rotations = new Float32Array(this._rotations.buffer, 0, 4 * newIndex);
            this._scales = new Float32Array(this._scales.buffer, 0, 3 * newIndex);
            this._colors = new Uint8Array(this._colors.buffer, 0, 4 * newIndex);

            this.dispatchEvent(changeEvent);
        };

        this.saveToFile = (name: string) => {
            if (!document) return;

            const outputData = new Uint8Array(this._vertexCount * Scene.RowLength);

            const f_buffer = new Float32Array(outputData.buffer);
            const u_buffer = new Uint8Array(outputData.buffer);

            for (let i = 0; i < this._vertexCount; i++) {
                f_buffer[8 * i + 0] = this._positions[3 * i + 0];
                f_buffer[8 * i + 1] = this._positions[3 * i + 1];
                f_buffer[8 * i + 2] = this._positions[3 * i + 2];

                u_buffer[32 * i + 24 + 0] = this._colors[4 * i + 0];
                u_buffer[32 * i + 24 + 1] = this._colors[4 * i + 1];
                u_buffer[32 * i + 24 + 2] = this._colors[4 * i + 2];
                u_buffer[32 * i + 24 + 3] = this._colors[4 * i + 3];

                f_buffer[8 * i + 3 + 0] = this._scales[3 * i + 0];
                f_buffer[8 * i + 3 + 1] = this._scales[3 * i + 1];
                f_buffer[8 * i + 3 + 2] = this._scales[3 * i + 2];

                u_buffer[32 * i + 28 + 0] = (this._rotations[4 * i + 0] * 128 + 128) & 0xff;
                u_buffer[32 * i + 28 + 1] = (this._rotations[4 * i + 1] * 128 + 128) & 0xff;
                u_buffer[32 * i + 28 + 2] = (this._rotations[4 * i + 2] * 128 + 128) & 0xff;
                u_buffer[32 * i + 28 + 3] = (this._rotations[4 * i + 3] * 128 + 128) & 0xff;
            }

            const blob = new Blob([outputData.buffer], { type: "application/octet-stream" });
            const link = document.createElement("a");
            link.download = name;
            link.href = URL.createObjectURL(blob);
            link.click();
        };
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
}

export { Scene };
