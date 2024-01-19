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

    saveToFile(name: string | null = null, format: string | null = null) {
        if (!document) return;

        if (!format) {
            format = "splat";
        } else if (format !== "splat" && format !== "ply") {
            throw new Error("Invalid format. Must be 'splat' or 'ply'");
        }

        if (!name) {
            const now = new Date();
            name = `scene-${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}.${format}`;
        }

        const buffers: Uint8Array[] = [];
        let vertexCount = 0;

        for (const object of this.objects) {
            object.applyRotation();
            object.applyScale();
            object.applyPosition();
            if (object instanceof Splat) {
                const buffer = object.data.serialize();
                buffers.push(buffer);
                vertexCount += object.data.vertexCount;
            }
        }

        const data = new Uint8Array(vertexCount * SplatData.RowLength);
        let offset = 0;
        for (const buffer of buffers) {
            data.set(buffer, offset);
            offset += buffer.length;
        }

        let blob;
        if (format === "ply") {
            const plyData = Converter.SplatToPLY(data.buffer, vertexCount);
            blob = new Blob([plyData], { type: "application/octet-stream" });
        } else {
            blob = new Blob([data.buffer], { type: "application/octet-stream" });
        }

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
