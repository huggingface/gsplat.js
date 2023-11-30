import { Matrix4 } from "../../../math/Matrix4";
import loadWasm from "../../../wasm/wasm";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wasmModule: any;

async function initWasm() {
    wasmModule = await loadWasm();
}

let sortData: { positions: Float32Array; vertexCount: number };
let viewProj: Matrix4;
let sortRunning = false;

let viewProjPtr: number;
let fBufferPtr: number;
let depthBufferPtr: number;
let depthIndexPtr: number;
let startsPtr: number;
let countsPtr: number;

const initScene = async () => {
    if (!wasmModule) await initWasm();

    fBufferPtr = wasmModule._malloc(sortData.positions.length * sortData.positions.BYTES_PER_ELEMENT);
    wasmModule.HEAPF32.set(sortData.positions, fBufferPtr / 4);

    viewProjPtr = wasmModule._malloc(16 * 4);
    depthBufferPtr = wasmModule._malloc(sortData.vertexCount * 4);
    depthIndexPtr = wasmModule._malloc(sortData.vertexCount * 4);
    startsPtr = wasmModule._malloc(sortData.vertexCount * 4);
    countsPtr = wasmModule._malloc(sortData.vertexCount * 4);
};

const runSort = (viewProj: Matrix4) => {
    const viewProjBuffer = new Float32Array(viewProj.buffer);
    wasmModule.HEAPF32.set(viewProjBuffer, viewProjPtr / 4);
    wasmModule._sort(
        viewProjPtr,
        sortData.vertexCount,
        fBufferPtr,
        depthBufferPtr,
        depthIndexPtr,
        startsPtr,
        countsPtr,
    );
    const depthIndex = new Uint32Array(wasmModule.HEAPU32.buffer, depthIndexPtr, sortData.vertexCount);
    const transferableDepthIndex = new Uint32Array(depthIndex.slice());
    self.postMessage({ depthIndex: transferableDepthIndex }, [transferableDepthIndex.buffer]);
};

const throttledSort = () => {
    if (!sortRunning) {
        sortRunning = true;
        const lastView = viewProj;
        runSort(lastView);
        setTimeout(() => {
            sortRunning = false;
            if (lastView !== viewProj) {
                throttledSort();
            }
        }, 0);
    }
};

self.onmessage = (e) => {
    if (e.data.sortData) {
        sortData = e.data.sortData;
        initScene();
    }
    if (!sortData || !wasmModule) return;
    if (e.data.viewProj) {
        viewProj = e.data.viewProj;
        throttledSort();
    }
};
