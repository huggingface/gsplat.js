import { Matrix3 } from "../math/Matrix3";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { EventDispatcher } from "./EventDispatcher";

class Scene extends EventDispatcher {
    static RowLength = 3 * 4 + 3 * 4 + 4 + 4;

    private _data: Uint32Array;
    private _width: number;
    private _height: number;
    private _vertexCount: number;
    private _positions: Float32Array;
    private _rotations: Float32Array;
    private _scales: Float32Array;

    setData: (data: Uint8Array) => void;
    translate: (translation: Vector3) => void;
    rotate: (rotation: Quaternion) => void;
    scale: (scale: Vector3) => void;
    limitBox: (xMin: number, xMax: number, yMin: number, yMax: number, zMin: number, zMax: number) => void;
    saveToFile: (name: string) => void;

    constructor() {
        super();

        const _floatView: Float32Array = new Float32Array(1);
        const _int32View: Int32Array = new Int32Array(_floatView.buffer);

        const floatToHalf = (float: number) => {
            _floatView[0] = float;
            const f = _int32View[0];

            const sign = (f >> 31) & 0x0001;
            const exp = (f >> 23) & 0x00ff;
            let frac = f & 0x007fffff;

            let newExp;
            if (exp == 0) {
                newExp = 0;
            } else if (exp < 113) {
                newExp = 0;
                frac |= 0x00800000;
                frac = frac >> (113 - exp);
                if (frac & 0x01000000) {
                    newExp = 1;
                    frac = 0;
                }
            } else if (exp < 142) {
                newExp = exp - 112;
            } else {
                newExp = 31;
                frac = 0;
            }

            return (sign << 15) | (newExp << 10) | (frac >> 13);
        };

        const packHalf2x16 = (x: number, y: number) => {
            return (floatToHalf(x) | (floatToHalf(y) << 16)) >>> 0;
        };

        const changeEvent = { type: "change" } as Event;

        this._data = new Uint32Array(0);
        this._vertexCount = 0;
        this._width = 2048;
        this._height = 0;
        this._positions = new Float32Array(0);
        this._rotations = new Float32Array(0);
        this._scales = new Float32Array(0);

        this.setData = (data: Uint8Array) => {
            this._vertexCount = data.length / Scene.RowLength;
            this._height = Math.ceil((2 * this._vertexCount) / this._width);
            this._data = new Uint32Array(this._width * this._height * 4);
            this._positions = new Float32Array(3 * this._vertexCount);
            this._rotations = new Float32Array(4 * this._vertexCount);
            this._scales = new Float32Array(3 * this._vertexCount);

            const f_buffer = new Float32Array(data.buffer);
            const u_buffer = new Uint8Array(data.buffer);

            const data_c = new Uint8Array(this._data.buffer);
            const data_f = new Float32Array(this._data.buffer);

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

                data_f[8 * i + 0] = this._positions[3 * i + 0];
                data_f[8 * i + 1] = this._positions[3 * i + 1];
                data_f[8 * i + 2] = this._positions[3 * i + 2];

                data_c[4 * (8 * i + 7) + 0] = u_buffer[32 * i + 24 + 0];
                data_c[4 * (8 * i + 7) + 1] = u_buffer[32 * i + 24 + 1];
                data_c[4 * (8 * i + 7) + 2] = u_buffer[32 * i + 24 + 2];
                data_c[4 * (8 * i + 7) + 3] = u_buffer[32 * i + 24 + 3];

                const rot = Matrix3.RotationFromQuaternion(
                    new Quaternion(
                        this._rotations[4 * i + 1],
                        this._rotations[4 * i + 2],
                        this._rotations[4 * i + 3],
                        -this._rotations[4 * i + 0],
                    ),
                );

                const scale = Matrix3.Diagonal(
                    new Vector3(this._scales[3 * i + 0], this._scales[3 * i + 1], this._scales[3 * i + 2]),
                );

                const M = scale.multiply(rot).buffer;

                const sigma = [
                    M[0] * M[0] + M[3] * M[3] + M[6] * M[6],
                    M[0] * M[1] + M[3] * M[4] + M[6] * M[7],
                    M[0] * M[2] + M[3] * M[5] + M[6] * M[8],
                    M[1] * M[1] + M[4] * M[4] + M[7] * M[7],
                    M[1] * M[2] + M[4] * M[5] + M[7] * M[8],
                    M[2] * M[2] + M[5] * M[5] + M[8] * M[8],
                ];

                this._data[8 * i + 4] = packHalf2x16(4 * sigma[0], 4 * sigma[1]);
                this._data[8 * i + 5] = packHalf2x16(4 * sigma[2], 4 * sigma[3]);
                this._data[8 * i + 6] = packHalf2x16(4 * sigma[4], 4 * sigma[5]);
            }

            this.dispatchEvent(changeEvent);
        };

        this.translate = (translation: Vector3) => {
            const data_f = new Float32Array(this._data.buffer);
            for (let i = 0; i < this._vertexCount; i++) {
                this._positions[3 * i + 0] += translation.x;
                this._positions[3 * i + 1] += translation.y;
                this._positions[3 * i + 2] += translation.z;

                data_f[8 * i + 0] = this._positions[3 * i + 0];
                data_f[8 * i + 1] = this._positions[3 * i + 1];
                data_f[8 * i + 2] = this._positions[3 * i + 2];
            }

            this.dispatchEvent(changeEvent);
        };

        this.rotate = (rotation: Quaternion) => {
            const R = Matrix3.RotationFromQuaternion(rotation).buffer;
            const data_f = new Float32Array(this._data.buffer);

            for (let i = 0; i < this._vertexCount; i++) {
                const x = this._positions[3 * i + 0];
                const y = this._positions[3 * i + 1];
                const z = this._positions[3 * i + 2];

                this._positions[3 * i + 0] = R[0] * x + R[1] * y + R[2] * z;
                this._positions[3 * i + 1] = R[3] * x + R[4] * y + R[5] * z;
                this._positions[3 * i + 2] = R[6] * x + R[7] * y + R[8] * z;

                data_f[8 * i + 0] = this._positions[3 * i + 0];
                data_f[8 * i + 1] = this._positions[3 * i + 1];
                data_f[8 * i + 2] = this._positions[3 * i + 2];

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

                const rot = Matrix3.RotationFromQuaternion(
                    new Quaternion(
                        this._rotations[4 * i + 1],
                        this._rotations[4 * i + 2],
                        this._rotations[4 * i + 3],
                        -this._rotations[4 * i + 0],
                    ),
                );

                const scale = Matrix3.Diagonal(
                    new Vector3(this._scales[3 * i + 0], this._scales[3 * i + 1], this._scales[3 * i + 2]),
                );

                const M = scale.multiply(rot).buffer;

                const sigma = [
                    M[0] * M[0] + M[3] * M[3] + M[6] * M[6],
                    M[0] * M[1] + M[3] * M[4] + M[6] * M[7],
                    M[0] * M[2] + M[3] * M[5] + M[6] * M[8],
                    M[1] * M[1] + M[4] * M[4] + M[7] * M[7],
                    M[1] * M[2] + M[4] * M[5] + M[7] * M[8],
                    M[2] * M[2] + M[5] * M[5] + M[8] * M[8],
                ];

                this._data[8 * i + 4] = packHalf2x16(4 * sigma[0], 4 * sigma[1]);
                this._data[8 * i + 5] = packHalf2x16(4 * sigma[2], 4 * sigma[3]);
                this._data[8 * i + 6] = packHalf2x16(4 * sigma[4], 4 * sigma[5]);
            }

            this.dispatchEvent(changeEvent);
        };

        this.scale = (scale: Vector3) => {
            const data_f = new Float32Array(this._data.buffer);

            for (let i = 0; i < this.vertexCount; i++) {
                this._positions[3 * i + 0] *= scale.x;
                this._positions[3 * i + 1] *= scale.y;
                this._positions[3 * i + 2] *= scale.z;

                data_f[8 * i + 0] = this._positions[3 * i + 0];
                data_f[8 * i + 1] = this._positions[3 * i + 1];
                data_f[8 * i + 2] = this._positions[3 * i + 2];

                this._scales[3 * i + 0] *= scale.x;
                this._scales[3 * i + 1] *= scale.y;
                this._scales[3 * i + 2] *= scale.z;

                const rot = Matrix3.RotationFromQuaternion(
                    new Quaternion(
                        this._rotations[4 * i + 1],
                        this._rotations[4 * i + 2],
                        this._rotations[4 * i + 3],
                        -this._rotations[4 * i + 0],
                    ),
                );

                const newScale = Matrix3.Diagonal(
                    new Vector3(this._scales[3 * i + 0], this._scales[3 * i + 1], this._scales[3 * i + 2]),
                );

                const M = newScale.multiply(rot).buffer;

                const sigma = [
                    M[0] * M[0] + M[3] * M[3] + M[6] * M[6],
                    M[0] * M[1] + M[3] * M[4] + M[6] * M[7],
                    M[0] * M[2] + M[3] * M[5] + M[6] * M[8],
                    M[1] * M[1] + M[4] * M[4] + M[7] * M[7],
                    M[1] * M[2] + M[4] * M[5] + M[7] * M[8],
                    M[2] * M[2] + M[5] * M[5] + M[8] * M[8],
                ];

                this._data[8 * i + 4] = packHalf2x16(4 * sigma[0], 4 * sigma[1]);
                this._data[8 * i + 5] = packHalf2x16(4 * sigma[2], 4 * sigma[3]);
                this._data[8 * i + 6] = packHalf2x16(4 * sigma[4], 4 * sigma[5]);
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

                this._data[8 * newIndex + 0] = this._data[8 * i + 0];
                this._data[8 * newIndex + 1] = this._data[8 * i + 1];
                this._data[8 * newIndex + 2] = this._data[8 * i + 2];
                this._data[8 * newIndex + 3] = this._data[8 * i + 3];
                this._data[8 * newIndex + 4] = this._data[8 * i + 4];
                this._data[8 * newIndex + 5] = this._data[8 * i + 5];
                this._data[8 * newIndex + 6] = this._data[8 * i + 6];
                this._data[8 * newIndex + 7] = this._data[8 * i + 7];

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

                newIndex += 1;
            }

            this._height = Math.ceil((2 * newIndex) / this._width);
            this._vertexCount = newIndex;
            this._data = new Uint32Array(this._data.buffer, 0, this._width * this._height * 4);
            this._positions = new Float32Array(this._positions.buffer, 0, 3 * newIndex);
            this._rotations = new Float32Array(this._rotations.buffer, 0, 4 * newIndex);
            this._scales = new Float32Array(this._scales.buffer, 0, 3 * newIndex);

            this.dispatchEvent(changeEvent);
        };

        this.saveToFile = (name: string) => {
            if (!document) return;

            const outputData = new Uint8Array(this._vertexCount * Scene.RowLength);

            const f_buffer = new Float32Array(outputData.buffer);
            const u_buffer = new Uint8Array(outputData.buffer);

            const data_c = new Uint8Array(this._data.buffer);

            for (let i = 0; i < this._vertexCount; i++) {
                f_buffer[8 * i + 0] = this._positions[3 * i + 0];
                f_buffer[8 * i + 1] = this._positions[3 * i + 1];
                f_buffer[8 * i + 2] = this._positions[3 * i + 2];

                u_buffer[32 * i + 24 + 0] = data_c[4 * (8 * i + 7) + 0];
                u_buffer[32 * i + 24 + 1] = data_c[4 * (8 * i + 7) + 1];
                u_buffer[32 * i + 24 + 2] = data_c[4 * (8 * i + 7) + 2];
                u_buffer[32 * i + 24 + 3] = data_c[4 * (8 * i + 7) + 3];

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

    get data() {
        return this._data;
    }

    get vertexCount() {
        return this._vertexCount;
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
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
}

export { Scene };
