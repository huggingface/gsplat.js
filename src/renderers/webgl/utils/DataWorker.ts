import loadWasm from "../../../wasm/data";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wasmModule: any;

async function initWasm() {
    wasmModule = await loadWasm();
}

class Splat {
    offset: number = 0;
    position: Float32Array = new Float32Array(3);
    rotation: Float32Array = new Float32Array(4);
    scale: Float32Array = new Float32Array(3);
    selected: boolean = false;
    vertexCount: number = 0;
    positions: Float32Array = new Float32Array(0);
    rotations: Float32Array = new Float32Array(0);
    scales: Float32Array = new Float32Array(0);
    colors: Uint8Array = new Uint8Array(0);
    selection: Uint8Array = new Uint8Array(0);
}

let allocatedVertexCount: number = 0;
const updateQueue = new Array<Splat>();
let running = false;
let loading = false;

let positionsPtr: number;
let rotationsPtr: number;
let scalesPtr: number;
let colorsPtr: number;
let selectionPtr: number;
let dataPtr: number;
let worldPositionsPtr: number;
let worldRotationsPtr: number;
let worldScalesPtr: number;

const pack = async (splat: Splat) => {
    while (loading) {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }

    if (!wasmModule) {
        loading = true;
        await initWasm();
        loading = false;
    }

    const targetAllocatedVertexCount = Math.pow(2, Math.ceil(Math.log2(splat.vertexCount)));
    if (targetAllocatedVertexCount > allocatedVertexCount) {
        if (allocatedVertexCount > 0) {
            wasmModule._free(positionsPtr);
            wasmModule._free(rotationsPtr);
            wasmModule._free(scalesPtr);
            wasmModule._free(colorsPtr);
            wasmModule._free(selectionPtr);
            wasmModule._free(dataPtr);
            wasmModule._free(worldPositionsPtr);
            wasmModule._free(worldRotationsPtr);
            wasmModule._free(worldScalesPtr);
        }

        allocatedVertexCount = targetAllocatedVertexCount;

        positionsPtr = wasmModule._malloc(3 * allocatedVertexCount * 4);
        rotationsPtr = wasmModule._malloc(4 * allocatedVertexCount * 4);
        scalesPtr = wasmModule._malloc(3 * allocatedVertexCount * 4);
        colorsPtr = wasmModule._malloc(4 * allocatedVertexCount);
        selectionPtr = wasmModule._malloc(allocatedVertexCount);
        dataPtr = wasmModule._malloc(8 * allocatedVertexCount * 4);
        worldPositionsPtr = wasmModule._malloc(3 * allocatedVertexCount * 4);
        worldRotationsPtr = wasmModule._malloc(4 * allocatedVertexCount * 4);
        worldScalesPtr = wasmModule._malloc(3 * allocatedVertexCount * 4);
    }

    wasmModule.HEAPF32.set(splat.positions, positionsPtr / 4);
    wasmModule.HEAPF32.set(splat.rotations, rotationsPtr / 4);
    wasmModule.HEAPF32.set(splat.scales, scalesPtr / 4);
    wasmModule.HEAPU8.set(splat.colors, colorsPtr);
    wasmModule.HEAPU8.set(splat.selection, selectionPtr);

    wasmModule._pack(
        splat.selected,
        splat.vertexCount,
        positionsPtr,
        rotationsPtr,
        scalesPtr,
        colorsPtr,
        selectionPtr,
        dataPtr,
        worldPositionsPtr,
        worldRotationsPtr,
        worldScalesPtr,
    );

    const outData = new Uint32Array(wasmModule.HEAPU32.buffer, dataPtr, splat.vertexCount * 8);
    const detachedData = new Uint32Array(outData.slice().buffer);

    const worldPositions = new Float32Array(wasmModule.HEAPF32.buffer, worldPositionsPtr, splat.vertexCount * 3);
    const detachedWorldPositions = new Float32Array(worldPositions.slice().buffer);

    const worldRotations = new Float32Array(wasmModule.HEAPF32.buffer, worldRotationsPtr, splat.vertexCount * 4);
    const detachedWorldRotations = new Float32Array(worldRotations.slice().buffer);

    const worldScales = new Float32Array(wasmModule.HEAPF32.buffer, worldScalesPtr, splat.vertexCount * 3);
    const detachedWorldScales = new Float32Array(worldScales.slice().buffer);

    const response = {
        data: detachedData,
        worldPositions: detachedWorldPositions,
        worldRotations: detachedWorldRotations,
        worldScales: detachedWorldScales,
        offset: splat.offset,
        vertexCount: splat.vertexCount,
        positions: splat.positions.buffer,
        rotations: splat.rotations.buffer,
        scales: splat.scales.buffer,
        colors: splat.colors.buffer,
        selection: splat.selection.buffer,
    };

    self.postMessage({ response: response }, [
        response.data.buffer,
        response.worldPositions.buffer,
        response.worldRotations.buffer,
        response.worldScales.buffer,
        response.positions,
        response.rotations,
        response.scales,
        response.colors,
        response.selection,
    ]);

    running = false;
};

const packThrottled = () => {
    if (updateQueue.length === 0) return;
    if (!running) {
        running = true;
        const splat = updateQueue.shift() as Splat;
        pack(splat);
        setTimeout(() => {
            running = false;
            packThrottled();
        }, 0);
    }
};

self.onmessage = (e) => {
    if (e.data.splat) {
        const splat = e.data.splat as Splat;
        for (const [index, existing] of updateQueue.entries()) {
            if (existing.offset === splat.offset) {
                updateQueue[index] = splat;
                return;
            }
        }
        updateQueue.push(splat);
        packThrottled();
    }
};
