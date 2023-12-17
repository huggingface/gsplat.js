interface WasmModule {
    _malloc(size: number): number;
    _free(ptr: number): void;
    _sort(
        viewProj: number,
        transforms: number,
        transformIndices: number,
        vertexCount: number,
        positions: number,
        chunks: number,
        depthBuffer: number,
        depthIndex: number,
        starts: number,
        counts: number,
    ): void;
}

declare const loadWasm: () => Promise<WasmModule>;
export default loadWasm;
