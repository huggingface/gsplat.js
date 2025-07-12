import createSortModule from "../../../wasm/sort.js";

let wasmModule: any;
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
let viewProj: number[] = [];

let dirty = true;
let lock = false;
let allocationPending = false;
let sorting = false;

async function initWasm() {
    if (!wasmModule) {
        wasmModule = await createSortModule();

        if (!wasmModule || !wasmModule.HEAPF32 || !wasmModule._sort) {
            throw new Error("WASM module failed to initialize properly");
        }
    }
}

const allocateBuffers = async () => {
    if (lock) {
        allocationPending = true;
        return;
    }
    lock = true;
    allocationPending = false;

    if (!wasmModule) {
        await initWasm();
    }

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
    if (lock || allocationPending || !wasmModule || !sortData) {
        return;
    }
    lock = true;

    try {
        // Validate buffer sizes before setting
        const heapF32 = wasmModule.HEAPF32;
        const heapU32 = wasmModule.HEAPU32;

        if (positionsPtr / 4 + sortData.positions.length > heapF32.length) {
            throw new Error("Positions buffer overflow");
        }
        if (transformsPtr / 4 + sortData.transforms.length > heapF32.length) {
            throw new Error("Transforms buffer overflow");
        }
        if (transformIndicesPtr / 4 + sortData.transformIndices.length > heapU32.length) {
            throw new Error("Transform indices buffer overflow");
        }

        heapF32.set(sortData.positions, positionsPtr / 4);
        heapF32.set(sortData.transforms, transformsPtr / 4);
        heapU32.set(sortData.transformIndices, transformIndicesPtr / 4);
        heapF32.set(new Float32Array(viewProj), viewProjPtr / 4);

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

        // Validate depth index buffer size
        if (depthIndexPtr + sortData.vertexCount * 4 > heapU32.buffer.byteLength) {
            throw new Error("Depth index buffer overflow");
        }

        const depthIndex = new Uint32Array(heapU32.buffer, depthIndexPtr, sortData.vertexCount);
        const detachedDepthIndex = new Uint32Array(depthIndex.slice().buffer);

        self.postMessage({ depthIndex: detachedDepthIndex }, [detachedDepthIndex.buffer]);
    } catch {
        self.postMessage({ depthIndex: new Uint32Array(0) }, []);
    }

    lock = false;
    dirty = false;
};

const throttledSort = () => {
    if (!sorting) {
        sorting = true;
        if (dirty) runSort();

        setTimeout(() => {
            sorting = false;
            throttledSort();
        });
    }
};

self.onmessage = (e) => {
    if (e.data.sortData) {
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

        dirty = true;
        allocateBuffers();
    }
    if (e.data.viewProj) {
        if ((e.data.viewProj as number[]).every((item) => viewProj.includes(item)) === false) {
            viewProj = e.data.viewProj;
            dirty = true;
        }

        throttledSort();
    }
};
