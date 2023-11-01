import { Vector3 } from "../math/Vector3";
import { Matrix3 } from "../math/Matrix3";

class Object3D {
    position: Vector3;
    rotation: Matrix3;

    constructor() {
        this.position = new Vector3();
        this.rotation = new Matrix3();
    }
}

export { Object3D };
