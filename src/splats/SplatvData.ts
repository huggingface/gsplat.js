class SplatvData {
    static RowLength = 64;

    private _vertexCount: number;
    private _positions: Float32Array;
    private _data: Uint32Array;
    private _width: number;
    private _height: number;

    serialize: () => Uint8Array;

    constructor(vertexCount: number, positions: Float32Array, data: Uint32Array, width: number, height: number) {
        this._vertexCount = vertexCount;
        this._positions = positions;
        this._data = data;
        this._width = width;
        this._height = height;

        this.serialize = () => {
            return new Uint8Array(this._data.buffer);
        };
    }

    static Deserialize(data: Uint8Array, width: number, height: number): SplatvData {
        const buffer = new Uint32Array(data.buffer);
        const f_buffer = new Float32Array(data.buffer);
        const vertexCount = Math.floor(f_buffer.byteLength / this.RowLength);
        const positions = new Float32Array(vertexCount * 3);
        for (let i = 0; i < vertexCount; i++) {
            positions[3 * i + 0] = f_buffer[16 * i + 0];
            positions[3 * i + 1] = f_buffer[16 * i + 1];
            positions[3 * i + 2] = f_buffer[16 * i + 2];
            positions[3 * i + 0] = f_buffer[16 * i + 3];
        }
        return new SplatvData(vertexCount, positions, buffer, width, height);
    }

    get vertexCount() {
        return this._vertexCount;
    }

    get positions() {
        return this._positions;
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

export { SplatvData };
