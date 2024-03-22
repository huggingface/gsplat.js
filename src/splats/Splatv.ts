import { Object3D } from "../core/Object3D";
import { SplatvData } from "./SplatvData";

class Splatv extends Object3D {
    private _data: SplatvData;

    constructor(splat: SplatvData | undefined = undefined) {
        super();

        this._data = splat || new SplatvData();
    }

    get data() {
        return this._data;
    }
}

export { Splatv };
