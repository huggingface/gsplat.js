import loadWasm from "./wasm/hello";

async function main() {
    const wasmModule = await loadWasm();
    wasmModule._hello();
}

main();
