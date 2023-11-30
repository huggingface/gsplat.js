import { Scene } from "../../../core/Scene";

class RenderData {
    private _data: Uint32Array;
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
        this._data = new Uint32Array(this._width * this._height * 4);

        const data_f = new Float32Array(this._data.buffer);
        const data_c = new Uint8Array(this._data.buffer);

        for (let i = 0; i < scene.vertexCount; i++) {
            data_f[8 * i + 0] = scene.positions[3 * i + 0];
            data_f[8 * i + 1] = scene.positions[3 * i + 1];
            data_f[8 * i + 2] = scene.positions[3 * i + 2];
        }
    }

    get data() {
        return this._data;
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }
}

export { RenderData };
