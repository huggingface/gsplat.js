interface WasmModule {
    _malloc(size: number): number;
    _free(ptr: number): void;
    _sort(
        viewProj: number,
        vertexCount: number,
        fBuffer: number,
        uBuffer: number,
        center: number,
        color: number,
        covA: number,
        covB: number,
        depthBuffer: number,
        depthIndex: number,
        starts: number,
    ): void;
}

declare const loadWasm: () => Promise<WasmModule>;
export default loadWasm;
