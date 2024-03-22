class SplatvData {
    static RowLength = 64;

    private _vertexCount: number;
    private _positions: Float32Array;
    private _data: Uint32Array;

    serialize: () => Uint8Array;

    constructor(vertexCount: number = 0, positions: Float32Array | null = null, data: Uint32Array | null = null) {
        this._vertexCount = vertexCount;
        this._positions = positions || new Float32Array(0);
        this._data = data || new Uint32Array(0);

        this.serialize = () => {
            return new Uint8Array(this._data.buffer);
        };
    }

    static Deserialize(data: Uint8Array): SplatvData {
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
        return new SplatvData(vertexCount, positions, buffer);
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
}

export { SplatvData };
