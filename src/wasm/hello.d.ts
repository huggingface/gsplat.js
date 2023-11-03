interface WasmModule {
    _hello(): void;
}

declare const loadWasm: () => Promise<WasmModule>;
export default loadWasm;
