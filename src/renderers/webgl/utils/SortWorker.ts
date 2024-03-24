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
let depthBufferPtr: number;
let depthIndexPtr: number;
let startsPtr: number;
let countsPtr: number;

let allocatedVertexCount: number = 0;
let allocatedTransformCount: number = 0;
let viewProj: Float32Array = new Float32Array(16);

let lock = false;
let allocationPending = false;
let sorting = false;

const allocateBuffers = async () => {
    if (lock) {
        allocationPending = true;
        return;
    }
    lock = true;
    allocationPending = false;

    if (!wasmModule) await initWasm();

    const targetAllocatedVertexCount = Math.pow(2, Math.ceil(Math.log2(sortData.vertexCount)));
    if (allocatedVertexCount < targetAllocatedVertexCount) {
        if (allocatedVertexCount > 0) {
            wasmModule._free(viewProjPtr);
            wasmModule._free(transformIndicesPtr);
            wasmModule._free(positionsPtr);
            wasmModule._free(depthBufferPtr);
            wasmModule._free(depthIndexPtr);
            wasmModule._free(startsPtr);
            wasmModule._free(countsPtr);
        }

        allocatedVertexCount = targetAllocatedVertexCount;

        viewProjPtr = wasmModule._malloc(16 * 4);
        transformIndicesPtr = wasmModule._malloc(allocatedVertexCount * 4);
        positionsPtr = wasmModule._malloc(3 * allocatedVertexCount * 4);
        depthBufferPtr = wasmModule._malloc(allocatedVertexCount * 4);
        depthIndexPtr = wasmModule._malloc(allocatedVertexCount * 4);
        startsPtr = wasmModule._malloc(allocatedVertexCount * 4);
        countsPtr = wasmModule._malloc(allocatedVertexCount * 4);
    }

    if (allocatedTransformCount < sortData.transforms.length) {
        if (allocatedTransformCount > 0) {
            wasmModule._free(transformsPtr);
        }

        allocatedTransformCount = sortData.transforms.length;

        transformsPtr = wasmModule._malloc(allocatedTransformCount * 4);
    }

    lock = false;
    if (allocationPending) {
        allocationPending = false;
        await allocateBuffers();
    }
};

const runSort = () => {
    if (lock || allocationPending || !wasmModule) return;
    lock = true;

    wasmModule.HEAPF32.set(sortData.positions, positionsPtr / 4);
    wasmModule.HEAPF32.set(sortData.transforms, transformsPtr / 4);
    wasmModule.HEAPU32.set(sortData.transformIndices, transformIndicesPtr / 4);
    wasmModule.HEAPF32.set(viewProj, viewProjPtr / 4);

    wasmModule._sort(
        viewProjPtr,
        transformsPtr,
        transformIndicesPtr,
        sortData.vertexCount,
        positionsPtr,
        depthBufferPtr,
        depthIndexPtr,
        startsPtr,
        countsPtr,
    );

    const depthIndex = new Uint32Array(wasmModule.HEAPU32.buffer, depthIndexPtr, sortData.vertexCount);
    const detachedDepthIndex = new Uint32Array(depthIndex.slice().buffer);

    self.postMessage({ depthIndex: detachedDepthIndex }, [detachedDepthIndex.buffer]);

    lock = false;
};

const throttledSort = () => {
    if (!sorting) {
        sorting = true;
        runSort();
        setTimeout(() => {
            sorting = false;
            throttledSort();
        });
    }
};

self.onmessage = (e) => {
    if (e.data.sortData) {
        //Recreating the typed arrays every time, will cause firefox to leak memory
        if (!sortData) {
            sortData = {
                positions: new Float32Array(e.data.sortData.positions),
                transforms: new Float32Array(e.data.sortData.transforms),
                transformIndices: new Uint32Array(e.data.sortData.transformIndices),
                vertexCount: e.data.sortData.vertexCount,
            };
        } else {
            sortData.positions.set(e.data.sortData.positions);
            sortData.transforms.set(e.data.sortData.transforms);
            sortData.transformIndices.set(e.data.sortData.transformIndices);
            sortData.vertexCount = e.data.sortData.vertexCount;
        }
        allocateBuffers();
    }
    if (e.data.viewProj) {
        viewProj = Float32Array.from(e.data.viewProj);
        throttledSort();
    }
};
