import { Object3D } from "../core/Object3D";
import { SplatvData } from "./SplatvData";

class Splatv extends Object3D {
    private _data: SplatvData;

    constructor(splat: SplatvData) {
        super();

        this._data = splat;
    }

    get data() {
        return this._data;
    }
}

export { Splatv };
