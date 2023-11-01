import { Object3D } from "../core/Object3D";
import { Matrix3 } from "../math/Matrix3";
import { Matrix4 } from "../math/Matrix4";
import { Vector3 } from "../math/Vector3";

class Camera extends Object3D {
    fx: number;
    fy: number;

    near: number;
    far: number;

    projectionMatrix: Matrix4;

    constructor(
        position: Vector3 = new Vector3(0, 0, -5),
        rotation: Matrix3 = new Matrix3(),
        fx: number = 1132,
        fy: number = 1132,
        near: number = 0.1,
        far: number = 100,
    ) {
        super();

        this.position = position;
        this.rotation = rotation;
        this.fx = fx;
        this.fy = fy;
        this.near = near;
        this.far = far;
        this.projectionMatrix = new Matrix4();
    }

    updateProjectionMatrix(width: number, height: number): void {
        // prettier-ignore
        this.projectionMatrix.set(
            2 * this.fx / width, 0, 0, 0,
            0, -2 * this.fy / height, 0, 0,
            0, 0, this.far / (this.far - this.near), 1,
            0, 0, -(this.far * this.near) / (this.far - this.near), 0
        );
    }
}

export { Camera };
