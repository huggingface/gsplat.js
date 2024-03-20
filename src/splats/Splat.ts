import { SplatData } from "./SplatData";
import { Object3D } from "../core/Object3D";
import { Vector3 } from "../math/Vector3";
import { Quaternion } from "../math/Quaternion";
import { Converter } from "../utils/Converter";
import { Matrix4 } from "../math/Matrix4";
import { Box3 } from "../math/Box3";

class Splat extends Object3D {
    public selectedChanged: boolean = false;
    public colorTransformChanged: boolean = false;

    private _data: SplatData;
    private _selected: boolean = false;
    private _colorTransforms: Array<Matrix4> = [];
    private _colorTransformsMap: Map<number, number> = new Map();
    private _bounds: Box3;

    recalculateBounds: () => void;

    constructor(splat: SplatData | undefined = undefined) {
        super();

        this._data = splat || new SplatData();
        this._bounds = new Box3(
            new Vector3(Infinity, Infinity, Infinity),
            new Vector3(-Infinity, -Infinity, -Infinity),
        );

        this.recalculateBounds = () => {
            this._bounds = new Box3(
                new Vector3(Infinity, Infinity, Infinity),
                new Vector3(-Infinity, -Infinity, -Infinity),
            );
            for (let i = 0; i < this._data.vertexCount; i++) {
                this._bounds.expand(
                    new Vector3(
                        this._data.positions[3 * i],
                        this._data.positions[3 * i + 1],
                        this._data.positions[3 * i + 2],
                    ),
                );
            }
        };

        this.applyPosition = () => {
            this.data.translate(this.position);
            this.position = new Vector3();
        };

        this.applyRotation = () => {
            this.data.rotate(this.rotation);
            this.rotation = new Quaternion();
        };

        this.applyScale = () => {
            this.data.scale(this.scale);
            this.scale = new Vector3(1, 1, 1);
        };

        this.recalculateBounds();
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
            name = `splat-${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}.${format}`;
        }

        this.applyRotation();
        this.applyScale();
        this.applyPosition();

        const data = this.data.serialize();
        let blob;
        if (format === "ply") {
            const plyData = Converter.SplatToPLY(data.buffer, this.data.vertexCount);
            blob = new Blob([plyData], { type: "application/octet-stream" });
        } else {
            blob = new Blob([data.buffer], { type: "application/octet-stream" });
        }

        const link = document.createElement("a");
        link.download = name;
        link.href = URL.createObjectURL(blob);
        link.click();
    }

    get data() {
        return this._data;
    }

    get selected() {
        return this._selected;
    }

    set selected(selected: boolean) {
        if (this._selected !== selected) {
            this._selected = selected;
            this.selectedChanged = true;
            this.dispatchEvent(this._changeEvent);
        }
    }

    get colorTransforms() {
        return this._colorTransforms;
    }

    get colorTransformsMap() {
        return this._colorTransformsMap;
    }

    get bounds() {
        let center = this._bounds.center();
        center = center.add(this.position);

        let size = this._bounds.size();
        size = size.multiply(this.scale);

        return new Box3(center.subtract(size.divide(2)), center.add(size.divide(2)));
    }
}

export { Splat };
