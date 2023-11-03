import { Scene } from "../../../core/Scene";
import { Matrix4 } from "../../../math/Matrix4";
import loadWasm from "../../../wasm/sort";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wasmModule: any;

async function initWasm() {
    wasmModule = await loadWasm();
}

let scene: Scene;
let viewProj: Matrix4;
let sortRunning = false;

let viewProjPtr: number;
let fBufferPtr: number;
let uBufferPtr: number;
let covAPtr: number;
let covBPtr: number;
let centerPtr: number;
let colorPtr: number;
let depthBufferPtr: number;
let depthIndexPtr: number;
let startsPtr: number;

const initScene = async () => {
    if (!wasmModule) await initWasm();
    const fBuffer = new Float32Array(scene.data.buffer);
    const uBuffer = new Uint8Array(scene.data.buffer);
    fBufferPtr = wasmModule._malloc(fBuffer.length * fBuffer.BYTES_PER_ELEMENT);
    uBufferPtr = wasmModule._malloc(uBuffer.length * uBuffer.BYTES_PER_ELEMENT);
    wasmModule.HEAPF32.set(fBuffer, fBufferPtr / 4);
    wasmModule.HEAPU8.set(uBuffer, uBufferPtr);

    viewProjPtr = wasmModule._malloc(16 * 4);
    centerPtr = wasmModule._malloc(scene.vertexCount * 3 * 4);
    colorPtr = wasmModule._malloc(scene.vertexCount * 4 * 4);
    covAPtr = wasmModule._malloc(scene.vertexCount * 3 * 4);
    covBPtr = wasmModule._malloc(scene.vertexCount * 3 * 4);
    depthBufferPtr = wasmModule._malloc(scene.vertexCount * 4);
    depthIndexPtr = wasmModule._malloc(scene.vertexCount * 4);
    startsPtr = wasmModule._malloc(scene.vertexCount * 4);
};

const runSort = (viewProj: Matrix4) => {
    const viewProjBuffer = new Float32Array(viewProj.buffer);
    wasmModule.HEAPF32.set(viewProjBuffer, viewProjPtr / 4);

    // console.time("sort");
    wasmModule._sort(
        viewProjPtr,
        scene.vertexCount,
        fBufferPtr,
        uBufferPtr,
        centerPtr,
        colorPtr,
        covAPtr,
        covBPtr,
        depthBufferPtr,
        depthIndexPtr,
        startsPtr,
    );
    // console.timeEnd("sort");

    const center = new Float32Array(wasmModule.HEAPF32.buffer, centerPtr, scene.vertexCount * 3);
    const color = new Float32Array(wasmModule.HEAPF32.buffer, colorPtr, scene.vertexCount * 4);
    const covA = new Float32Array(wasmModule.HEAPF32.buffer, covAPtr, scene.vertexCount * 3);
    const covB = new Float32Array(wasmModule.HEAPF32.buffer, covBPtr, scene.vertexCount * 3);

    self.postMessage({
        center,
        color,
        covA,
        covB,
    });
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
    if (e.data.scene) {
        scene = e.data.scene;
        initScene();
    }
    if (!scene || !wasmModule) return;
    if (e.data.viewProj) {
        viewProj = e.data.viewProj;
        throttledSort();
    }
};
