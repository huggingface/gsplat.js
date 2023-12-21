import { Scene } from "../../../core/Scene";
import { Splat } from "../../../splats/Splat";
import DataWorker from "web-worker:./DataWorker.ts";
import loadWasm from "../../../wasm/data";

class RenderData {
    public dataChanged = false;
    public transformsChanged = false;

    private _splatIndices: Map<Splat, number>;
    private _offsets: Map<Splat, number>;
    private _data: Uint32Array;
    private _width: number;
    private _height: number;
    private _transforms: Float32Array;
    private _transformsWidth: number;
    private _transformsHeight: number;
    private _transformIndices: Uint32Array;
    private _transformIndicesWidth: number;
    private _transformIndicesHeight: number;
    private _positions: Float32Array;
    private _rotations: Float32Array;
    private _scales: Float32Array;
    private _vertexCount: number;
    private _updating: Set<Splat> = new Set<Splat>();
    private _dirty: Set<Splat> = new Set<Splat>();
    private _worker: Worker;

    getSplat: (index: number) => Splat | null;
    getLocalIndex: (splat: Splat, index: number) => number;
    markDirty: (splat: Splat) => void;
    rebuild: () => void;
    dispose: () => void;

    constructor(scene: Scene) {
        let vertexCount = 0;
        let splatIndex = 0;
        this._splatIndices = new Map<Splat, number>();
        this._offsets = new Map<Splat, number>();
        const lookup = new Map<number, Splat>();
        for (const object of scene.objects) {
            if (object instanceof Splat) {
                this._splatIndices.set(object, splatIndex);
                this._offsets.set(object, vertexCount);
                lookup.set(vertexCount, object);
                vertexCount += object.data.vertexCount;
                splatIndex++;
            }
        }

        this._vertexCount = vertexCount;
        this._width = 2048;
        this._height = Math.ceil((2 * this.vertexCount) / this.width);
        this._data = new Uint32Array(this.width * this.height * 4);

        this._transformsWidth = 5;
        this._transformsHeight = lookup.size;
        this._transforms = new Float32Array(this._transformsWidth * this._transformsHeight * 4);

        this._transformIndicesWidth = 1024;
        this._transformIndicesHeight = Math.ceil(this.vertexCount / this._transformIndicesWidth);
        this._transformIndices = new Uint32Array(this._transformIndicesWidth * this._transformIndicesHeight);

        this._positions = new Float32Array(this.vertexCount * 3);
        this._rotations = new Float32Array(this.vertexCount * 4);
        this._scales = new Float32Array(this.vertexCount * 3);

        this._worker = new DataWorker();

        const updateTransform = (splat: Splat) => {
            const splatIndex = this._splatIndices.get(splat) as number;
            this._transforms.set(splat.transform.buffer, splatIndex * 20);
            this._transforms[splatIndex * 20 + 16] = splat.selected ? 1 : 0;
            splat.positionChanged = false;
            splat.rotationChanged = false;
            splat.scaleChanged = false;
            splat.selectedChanged = false;
            this.transformsChanged = true;
        };

        this._worker.onmessage = (e) => {
            if (e.data.response) {
                const response = e.data.response;
                const splat = lookup.get(response.offset) as Splat;
                updateTransform(splat);

                const splatIndex = this._splatIndices.get(splat) as number;
                for (let i = 0; i < splat.data.vertexCount; i++) {
                    this._transformIndices[response.offset + i] = splatIndex;
                }

                this._data.set(response.data, response.offset * 8);
                splat.data.reattach(
                    response.positions,
                    response.rotations,
                    response.scales,
                    response.colors,
                    response.selection,
                );

                this._positions.set(response.worldPositions, response.offset * 3);
                this._rotations.set(response.worldRotations, response.offset * 4);
                this._scales.set(response.worldScales, response.offset * 3);

                this._updating.delete(splat);

                splat.selectedChanged = false;

                this.dataChanged = true;
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let wasmModule: any;

        async function initWasm() {
            wasmModule = await loadWasm();
        }

        initWasm();

        async function waitForWasm() {
            while (!wasmModule) {
                await new Promise((resolve) => setTimeout(resolve, 0));
            }
        }

        const buildImmediate = (splat: Splat) => {
            if (!wasmModule) {
                waitForWasm().then(() => {
                    buildImmediate(splat);
                });
                return;
            }

            updateTransform(splat);

            const positionsPtr = wasmModule._malloc(3 * splat.data.vertexCount * 4);
            const rotationsPtr = wasmModule._malloc(4 * splat.data.vertexCount * 4);
            const scalesPtr = wasmModule._malloc(3 * splat.data.vertexCount * 4);
            const colorsPtr = wasmModule._malloc(4 * splat.data.vertexCount);
            const selectionPtr = wasmModule._malloc(splat.data.vertexCount);
            const dataPtr = wasmModule._malloc(8 * splat.data.vertexCount * 4);
            const worldPositionsPtr = wasmModule._malloc(3 * splat.data.vertexCount * 4);
            const worldRotationsPtr = wasmModule._malloc(4 * splat.data.vertexCount * 4);
            const worldScalesPtr = wasmModule._malloc(3 * splat.data.vertexCount * 4);

            wasmModule.HEAPF32.set(splat.data.positions, positionsPtr / 4);
            wasmModule.HEAPF32.set(splat.data.rotations, rotationsPtr / 4);
            wasmModule.HEAPF32.set(splat.data.scales, scalesPtr / 4);
            wasmModule.HEAPU8.set(splat.data.colors, colorsPtr);
            wasmModule.HEAPU8.set(splat.data.selection, selectionPtr);

            wasmModule._pack(
                splat.selected,
                splat.data.vertexCount,
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

            const outData = new Uint32Array(wasmModule.HEAPU32.buffer, dataPtr, splat.data.vertexCount * 8);
            const worldPositions = new Float32Array(
                wasmModule.HEAPF32.buffer,
                worldPositionsPtr,
                splat.data.vertexCount * 3,
            );
            const worldRotations = new Float32Array(
                wasmModule.HEAPF32.buffer,
                worldRotationsPtr,
                splat.data.vertexCount * 4,
            );
            const worldScales = new Float32Array(wasmModule.HEAPF32.buffer, worldScalesPtr, splat.data.vertexCount * 3);

            const splatIndex = this._splatIndices.get(splat) as number;
            const offset = this._offsets.get(splat) as number;
            for (let i = 0; i < splat.data.vertexCount; i++) {
                this._transformIndices[offset + i] = splatIndex;
            }
            this._data.set(outData, offset * 8);
            this._positions.set(worldPositions, offset * 3);
            this._rotations.set(worldRotations, offset * 4);
            this._scales.set(worldScales, offset * 3);

            wasmModule._free(positionsPtr);
            wasmModule._free(rotationsPtr);
            wasmModule._free(scalesPtr);
            wasmModule._free(colorsPtr);
            wasmModule._free(selectionPtr);
            wasmModule._free(dataPtr);
            wasmModule._free(worldPositionsPtr);
            wasmModule._free(worldRotationsPtr);
            wasmModule._free(worldScalesPtr);

            this.dataChanged = true;
        };

        const build = (splat: Splat) => {
            if (splat.positionChanged || splat.rotationChanged || splat.scaleChanged || splat.selectedChanged) {
                updateTransform(splat);
            }

            if (!splat.data.changed || splat.data.detached) return;

            const serializedSplat = {
                position: new Float32Array(splat.position.flat()),
                rotation: new Float32Array(splat.rotation.flat()),
                scale: new Float32Array(splat.scale.flat()),
                selected: splat.selected,
                vertexCount: splat.data.vertexCount,
                positions: splat.data.positions,
                rotations: splat.data.rotations,
                scales: splat.data.scales,
                colors: splat.data.colors,
                selection: splat.data.selection,
                offset: this._offsets.get(splat) as number,
            };

            this._worker.postMessage(
                {
                    splat: serializedSplat,
                },
                [
                    serializedSplat.position.buffer,
                    serializedSplat.rotation.buffer,
                    serializedSplat.scale.buffer,
                    serializedSplat.positions.buffer,
                    serializedSplat.rotations.buffer,
                    serializedSplat.scales.buffer,
                    serializedSplat.colors.buffer,
                    serializedSplat.selection.buffer,
                ],
            );

            this._updating.add(splat);

            splat.data.detached = true;
        };

        this.getSplat = (index: number) => {
            let splat = null;
            for (const [key, value] of this._offsets) {
                if (index >= value) {
                    splat = key;
                } else {
                    break;
                }
            }
            return splat;
        };

        this.getLocalIndex = (splat: Splat, index: number) => {
            const offset = this._offsets.get(splat) as number;
            return index - offset;
        };

        this.markDirty = (splat: Splat) => {
            this._dirty.add(splat);
        };

        this.rebuild = () => {
            for (const splat of this._dirty) {
                build(splat);
            }

            this._dirty.clear();
        };

        this.dispose = () => {
            this._worker.terminate();
        };

        for (const splat of this._splatIndices.keys()) {
            buildImmediate(splat);
        }
    }

    get offsets() {
        return this._offsets;
    }

    get data() {
        return this._data;
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    get transforms() {
        return this._transforms;
    }

    get transformsWidth() {
        return this._transformsWidth;
    }

    get transformsHeight() {
        return this._transformsHeight;
    }

    get transformIndices() {
        return this._transformIndices;
    }

    get transformIndicesWidth() {
        return this._transformIndicesWidth;
    }

    get transformIndicesHeight() {
        return this._transformIndicesHeight;
    }

    get positions() {
        return this._positions;
    }

    get rotations() {
        return this._rotations;
    }

    get scales() {
        return this._scales;
    }

    get vertexCount() {
        return this._vertexCount;
    }

    get needsRebuild() {
        return this._dirty.size > 0;
    }

    get updating() {
        return this._updating.size > 0;
    }
}

export { RenderData };
