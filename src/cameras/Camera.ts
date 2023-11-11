import { Object3D } from "../core/Object3D";
import { Quaternion } from "../math/Quaternion";
import { Matrix3 } from "../math/Matrix3";
import { Matrix4 } from "../math/Matrix4";
import { Vector3 } from "../math/Vector3";

class Camera extends Object3D {
    fx: number;
    fy: number;

    near: number;
    far: number;

    projectionMatrix: Matrix4;
    viewMatrix: Matrix4;
    viewProj: Matrix4;

    update: (width: number, height: number) => void;

    constructor(
        position = new Vector3(0, 0, -5),
        rotation = new Quaternion(),
        fx = 1132,
        fy = 1132,
        near = 0.1,
        far = 100,
    ) {
        super();

        const getViewMatrix = (): Matrix4 => {
            const R = Matrix3.RotationFromQuaternion(this.rotation).buffer;
            const t = this.position.flat();
            const camToWorld = [
                [R[0], R[1], R[2], 0],
                [R[3], R[4], R[5], 0],
                [R[6], R[7], R[8], 0],
                [
                    -t[0] * R[0] - t[1] * R[3] - t[2] * R[6],
                    -t[0] * R[1] - t[1] * R[4] - t[2] * R[7],
                    -t[0] * R[2] - t[1] * R[5] - t[2] * R[8],
                    1,
                ],
            ].flat();
            return new Matrix4(...camToWorld);
        };

        this.position = position;
        this.rotation = rotation;
        this.fx = fx;
        this.fy = fy;
        this.near = near;
        this.far = far;
        this.projectionMatrix = new Matrix4();
        this.viewMatrix = new Matrix4();
        this.viewProj = new Matrix4();

        this.update = (width: number, height: number) => {
            // prettier-ignore
            this.projectionMatrix = new Matrix4(
                2 * this.fx / width, 0, 0, 0,
                0, -2 * this.fy / height, 0, 0,
                0, 0, this.far / (this.far - this.near), 1,
                0, 0, -(this.far * this.near) / (this.far - this.near), 0
            );
            this.viewMatrix = getViewMatrix();
            this.viewProj = this.projectionMatrix.multiply(this.viewMatrix);
        };
    }
}

export { Camera };
