import { Object3D } from "./Object3D";
import { SplatData } from "../splats/SplatData";
import { Splat } from "../splats/Splat";
import { EventDispatcher } from "../events/EventDispatcher";
import { ObjectAddedEvent, ObjectRemovedEvent } from "../events/Events";
import { Converter } from "../utils/Converter";

class Scene extends EventDispatcher {
    private _objects: Object3D[] = [];

    addObject: (object: Object3D) => void;
    removeObject: (object: Object3D) => void;
    findObject: (predicate: (object: Object3D) => boolean) => Object3D | undefined;
    findObjectOfType: <T extends Object3D>(type: { new (): T }) => T | undefined;
    reset: () => void;

    constructor() {
        super();

        this.addObject = (object: Object3D) => {
            this.objects.push(object);
            this.dispatchEvent(new ObjectAddedEvent(object));
        };

        this.removeObject = (object: Object3D) => {
            const index = this.objects.indexOf(object);
            if (index < 0) {
                throw new Error("Object not found in scene");
            }
            this.objects.splice(index, 1);
            this.dispatchEvent(new ObjectRemovedEvent(object));
        };

        this.findObject = (predicate: (object: Object3D) => boolean) => {
            for (const object of this.objects) {
                if (predicate(object)) {
                    return object;
                }
            }
            return undefined;
        };

        this.findObjectOfType = <T extends Object3D>(type: { new (): T }) => {
            for (const object of this.objects) {
                if (object instanceof type) {
                    return object;
                }
            }
            return undefined;
        };

        this.reset = () => {
            const objectsToRemove = this.objects.slice();
            for (const object of objectsToRemove) {
                this.removeObject(object);
            }
        };

        this.reset();
    }

    getMergedSceneDataBuffer(format: "splat" | "ply" = "splat"): ArrayBuffer {
        const buffers: Uint8Array[] = [];
        let vertexCount = 0;

        for (const object of this.objects) {
            if (object instanceof Splat) {
                const splatClone = object.clone() as Splat;

                splatClone.applyRotation();
                splatClone.applyScale();
                splatClone.applyPosition();
                const buffer = splatClone.data.serialize();

                buffers.push(buffer);
                vertexCount += splatClone.data.vertexCount;
            }
        }

        const mergedSplatData = new Uint8Array(vertexCount * SplatData.RowLength);
        let offset = 0;
        for (const buffer of buffers) {
            mergedSplatData.set(buffer, offset);
            offset += buffer.length;
        }

        if (format === "ply") {
            return Converter.SplatToPLY(mergedSplatData.buffer, vertexCount);
        }

        return mergedSplatData.buffer;
    }

    saveToFile(name: string | null = null, format: "splat" | "ply" = "splat") {
        if (!document) return;

        if (!name) {
            const now = new Date();
            name = `scene-${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}.${format}`;
        }

        const mergedData = this.getMergedSceneDataBuffer(format);

        const blob = new Blob([mergedData], { type: "application/octet-stream" });

        const link = document.createElement("a");
        link.download = name;
        link.href = URL.createObjectURL(blob);
        link.click();
    }

    get objects() {
        return this._objects;
    }
}

export { Scene };
