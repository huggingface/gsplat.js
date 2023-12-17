interface WasmModule {
    _malloc(size: number): number;
    _free(ptr: number): void;
    _evaluate(
        transforms: number,
        transformIndices: number,
        positions: number,
        rotations: number,
        scales: number,
        depthIndex: number,
        chunks: number,
        count: number,
        chunk: number,
        origin: number,
        direction: number,
        result: number,
    ): void;
}

declare const loadWasm: () => Promise<WasmModule>;
export default loadWasm;
