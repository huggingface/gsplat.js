import { Quaternion } from "../math/Quaternion";
import { Matrix3 } from "../math/Matrix3";
import { Matrix4 } from "../math/Matrix4";
import { Vector3 } from "../math/Vector3";

class CameraData {
    private _fx: number = 1132;
    private _fy: number = 1132;
    private _near: number = 0.1;
    private _far: number = 100;

    private _width: number = 512;
    private _height: number = 512;

    private _projectionMatrix: Matrix4 = new Matrix4();
    private _viewMatrix: Matrix4 = new Matrix4();
    private _viewProj: Matrix4 = new Matrix4();

    update: (position: Vector3, rotation: Quaternion) => void;
    setSize: (width: number, height: number) => void;

    private _updateProjectionMatrix: () => void;

    constructor() {
        this._updateProjectionMatrix = () => {
            // prettier-ignore
            this._projectionMatrix = new Matrix4(
                2 * this.fx / this.width, 0, 0, 0,
                0, -2 * this.fy / this.height, 0, 0,
                0, 0, this.far / (this.far - this.near), 1,
                0, 0, -(this.far * this.near) / (this.far - this.near), 0
            );

            this._viewProj = this.projectionMatrix.multiply(this.viewMatrix);
        };

        this.update = (position: Vector3, rotation: Quaternion) => {
            const R = Matrix3.RotationFromQuaternion(rotation).buffer;
            const t = position.flat();

            // prettier-ignore
            this._viewMatrix = new Matrix4(
                R[0], R[1], R[2], 0,
                R[3], R[4], R[5], 0,
                R[6], R[7], R[8], 0,
                -t[0] * R[0] - t[1] * R[3] - t[2] * R[6],
                -t[0] * R[1] - t[1] * R[4] - t[2] * R[7],
                -t[0] * R[2] - t[1] * R[5] - t[2] * R[8],
                1,
            );

            this._viewProj = this.projectionMatrix.multiply(this.viewMatrix);
        };

        this.setSize = (width: number, height: number) => {
            this._width = width;
            this._height = height;
            this._updateProjectionMatrix();
        };
    }

    get fx() {
        return this._fx;
    }

    set fx(fx: number) {
        if (this._fx !== fx) {
            this._fx = fx;
            this._updateProjectionMatrix();
        }
    }

    get fy() {
        return this._fy;
    }

    set fy(fy: number) {
        if (this._fy !== fy) {
            this._fy = fy;
            this._updateProjectionMatrix();
        }
    }

    get near() {
        return this._near;
    }

    set near(near: number) {
        if (this._near !== near) {
            this._near = near;
            this._updateProjectionMatrix();
        }
    }

    get far() {
        return this._far;
    }

    set far(far: number) {
        if (this._far !== far) {
            this._far = far;
            this._updateProjectionMatrix();
        }
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    get projectionMatrix() {
        return this._projectionMatrix;
    }

    get viewMatrix() {
        return this._viewMatrix;
    }

    get viewProj() {
        return this._viewProj;
    }
}

export { CameraData };
