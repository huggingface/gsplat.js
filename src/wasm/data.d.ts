interface WasmModule {
    _malloc(size: number): number;
    _free(ptr: number): void;
    _pack(
        selected: boolean,
        vertexCount: number,
        positions: number,
        rotations: number,
        scales: number,
        colors: number,
        selection: number,
        data: number,
        worldPositions: number,
        worldRotations: number,
        worldScales: number,
    ): void;
}

declare const loadWasm: () => Promise<WasmModule>;
export default loadWasm;
