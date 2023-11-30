import { Scene } from "../../../core/Scene";
import { Matrix3 } from "../../../math/Matrix3";
import { Quaternion } from "../../../math/Quaternion";
import { Vector3 } from "../../../math/Vector3";

class RenderData {
    private _buffer: Uint32Array;
    private _width: number;
    private _height: number;

    constructor(scene: Scene) {
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

        this._width = 2048;
        this._height = Math.ceil((2 * scene.vertexCount) / this._width);
        this._buffer = new Uint32Array(this._width * this._height * 4);

        const data_f = new Float32Array(this._buffer.buffer);
        const data_c = new Uint8Array(this._buffer.buffer);

        for (let i = 0; i < scene.vertexCount; i++) {
            data_f[8 * i + 0] = scene.positions[3 * i + 0];
            data_f[8 * i + 1] = scene.positions[3 * i + 1];
            data_f[8 * i + 2] = scene.positions[3 * i + 2];

            data_c[4 * (8 * i + 7) + 0] = scene.colors[4 * i + 0];
            data_c[4 * (8 * i + 7) + 1] = scene.colors[4 * i + 1];
            data_c[4 * (8 * i + 7) + 2] = scene.colors[4 * i + 2];
            data_c[4 * (8 * i + 7) + 3] = scene.colors[4 * i + 3];

            const rot = Matrix3.RotationFromQuaternion(
                new Quaternion(
                    scene.rotations[4 * i + 1],
                    scene.rotations[4 * i + 2],
                    scene.rotations[4 * i + 3],
                    -scene.rotations[4 * i + 0],
                ),
            );

            const scale = Matrix3.Diagonal(
                new Vector3(scene.scales[3 * i + 0], scene.scales[3 * i + 1], scene.scales[3 * i + 2]),
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

            this._buffer[8 * i + 4] = packHalf2x16(4 * sigma[0], 4 * sigma[1]);
            this._buffer[8 * i + 5] = packHalf2x16(4 * sigma[2], 4 * sigma[3]);
            this._buffer[8 * i + 6] = packHalf2x16(4 * sigma[4], 4 * sigma[5]);
        }
    }

    get buffer() {
        return this._buffer;
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }
}

export { RenderData };
