import { Matrix4 } from "../../../math/Matrix4";
import loadWasm from "../../../wasm/sort";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wasmModule: any;

async function initWasm() {
    wasmModule = await loadWasm();
}

let sortData: {
    positions: Float32Array;
    transforms: Float32Array;
    transformIndices: Uint32Array;
    vertexCount: number;
};

let viewProjPtr: number;
let transformsPtr: number;
let transformIndicesPtr: number;
let positionsPtr: number;
let chunksPtr: number;
let depthBufferPtr: number;
let depthIndexPtr: number;
let startsPtr: number;
let countsPtr: number;

let allocatedVertexCount: number = 0;
let allocatedTransformCount: number = 0;
let viewProj: Matrix4;

let running = false;
let allocating = false;

const allocateBuffers = async () => {
    allocating = true;

    if (!wasmModule) await initWasm();

    const targetAllocatedVertexCount = Math.pow(2, Math.ceil(Math.log2(sortData.vertexCount)));
    if (allocatedVertexCount < targetAllocatedVertexCount) {
        while (running) {
            await new Promise((resolve) => setTimeout(resolve, 0));
        }

        if (allocatedVertexCount > 0) {
            wasmModule._free(viewProjPtr);
            wasmModule._free(transformIndicesPtr);
            wasmModule._free(positionsPtr);
            wasmModule._free(chunksPtr);
            wasmModule._free(depthBufferPtr);
            wasmModule._free(depthIndexPtr);
            wasmModule._free(startsPtr);
            wasmModule._free(countsPtr);
        }

        allocatedVertexCount = targetAllocatedVertexCount;

        viewProjPtr = wasmModule._malloc(16 * 4);
        transformIndicesPtr = wasmModule._malloc(allocatedVertexCount * 4);
        positionsPtr = wasmModule._malloc(3 * allocatedVertexCount * 4);
        chunksPtr = wasmModule._malloc(allocatedVertexCount);
        depthBufferPtr = wasmModule._malloc(allocatedVertexCount * 4);
        depthIndexPtr = wasmModule._malloc(allocatedVertexCount * 4);
        startsPtr = wasmModule._malloc(allocatedVertexCount * 4);
        countsPtr = wasmModule._malloc(allocatedVertexCount * 4);
    }

    const targetAllocatedTransformCount = Math.pow(2, Math.ceil(Math.log2(sortData.transforms.length / 20)));
    if (allocatedTransformCount < targetAllocatedTransformCount) {
        while (running) {
            await new Promise((resolve) => setTimeout(resolve, 0));
        }

        if (allocatedTransformCount > 0) {
            wasmModule._free(transformsPtr);
        }

        allocatedTransformCount = targetAllocatedTransformCount;

        transformsPtr = wasmModule._malloc(20 * 4 * allocatedTransformCount);
    }

    wasmModule.HEAPF32.set(sortData.positions, positionsPtr / 4);
    wasmModule.HEAPF32.set(sortData.transforms, transformsPtr / 4);
    wasmModule.HEAPU32.set(sortData.transformIndices, transformIndicesPtr / 4);

    allocating = false;
};

const runSort = (viewProj: Matrix4) => {
    wasmModule.HEAPF32.set(viewProj.buffer, viewProjPtr / 4);
    wasmModule._sort(
        viewProjPtr,
        transformsPtr,
        transformIndicesPtr,
        sortData.vertexCount,
        positionsPtr,
        chunksPtr,
        depthBufferPtr,
        depthIndexPtr,
        startsPtr,
        countsPtr,
    );

    const depthIndex = new Uint32Array(wasmModule.HEAPU32.buffer, depthIndexPtr, sortData.vertexCount);
    const detachedDepthIndex = new Uint32Array(depthIndex.slice().buffer);

    const chunks = new Uint8Array(wasmModule.HEAPU8.buffer, chunksPtr, sortData.vertexCount);
    const detachedChunks = new Uint8Array(chunks.slice().buffer);

    self.postMessage({ depthIndex: detachedDepthIndex, chunks: detachedChunks }, [
        detachedDepthIndex.buffer,
        detachedChunks.buffer,
    ]);
};

const throttledSort = () => {
    if (!running) {
        running = true;
        const lastView = viewProj;
        runSort(lastView);
        setTimeout(() => {
            running = false;
            if (lastView !== viewProj) {
                throttledSort();
            }
        }, 0);
    }
};

self.onmessage = (e) => {
    if (e.data.sortData) {
        sortData = e.data.sortData;
        allocateBuffers();
    }
    if (allocating || !sortData) return;
    if (e.data.viewProj) {
        viewProj = e.data.viewProj;
        throttledSort();
    }
};
