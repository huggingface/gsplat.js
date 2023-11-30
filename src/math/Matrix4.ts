import { Quaternion } from "./Quaternion";
import { Vector3 } from "./Vector3";

class Matrix4 {
    public readonly buffer: number[];

    // prettier-ignore
    constructor(n11: number = 1, n12: number = 0, n13: number = 0, n14: number = 0, 
                n21: number = 0, n22: number = 1, n23: number = 0, n24: number = 0, 
                n31: number = 0, n32: number = 0, n33: number = 1, n34: number = 0, 
                n41: number = 0, n42: number = 0, n43: number = 0, n44: number = 1) {
        this.buffer = [
            n11, n12, n13, n14, 
            n21, n22, n23, n24, 
            n31, n32, n33, n34, 
            n41, n42, n43, n44
        ];
    }

    equals(m: Matrix4): boolean {
        if (this.buffer.length !== m.buffer.length) {
            return false;
        }
        if (this.buffer === m.buffer) {
            return true;
        }
        for (let i = 0; i < this.buffer.length; i++) {
            if (this.buffer[i] !== m.buffer[i]) {
                return false;
            }
        }
        return true;
    }

    multiply(m: Matrix4): Matrix4 {
        const a = this.buffer;
        const b = m.buffer;
        return new Matrix4(
            b[0] * a[0] + b[1] * a[4] + b[2] * a[8] + b[3] * a[12],
            b[0] * a[1] + b[1] * a[5] + b[2] * a[9] + b[3] * a[13],
            b[0] * a[2] + b[1] * a[6] + b[2] * a[10] + b[3] * a[14],
            b[0] * a[3] + b[1] * a[7] + b[2] * a[11] + b[3] * a[15],
            b[4] * a[0] + b[5] * a[4] + b[6] * a[8] + b[7] * a[12],
            b[4] * a[1] + b[5] * a[5] + b[6] * a[9] + b[7] * a[13],
            b[4] * a[2] + b[5] * a[6] + b[6] * a[10] + b[7] * a[14],
            b[4] * a[3] + b[5] * a[7] + b[6] * a[11] + b[7] * a[15],
            b[8] * a[0] + b[9] * a[4] + b[10] * a[8] + b[11] * a[12],
            b[8] * a[1] + b[9] * a[5] + b[10] * a[9] + b[11] * a[13],
            b[8] * a[2] + b[9] * a[6] + b[10] * a[10] + b[11] * a[14],
            b[8] * a[3] + b[9] * a[7] + b[10] * a[11] + b[11] * a[15],
            b[12] * a[0] + b[13] * a[4] + b[14] * a[8] + b[15] * a[12],
            b[12] * a[1] + b[13] * a[5] + b[14] * a[9] + b[15] * a[13],
            b[12] * a[2] + b[13] * a[6] + b[14] * a[10] + b[15] * a[14],
            b[12] * a[3] + b[13] * a[7] + b[14] * a[11] + b[15] * a[15],
        );
    }

    clone(): Matrix4 {
        const e = this.buffer;
        // prettier-ignore
        return new Matrix4(
            e[0], e[1], e[2], e[3], 
            e[4], e[5], e[6], e[7], 
            e[8], e[9], e[10], e[11], 
            e[12], e[13], e[14], e[15]
        );
    }

    determinant(): number {
        const e = this.buffer;
        // prettier-ignore
        return (
            e[12] * e[9] * e[6] * e[3] - e[8] * e[13] * e[6] * e[3] - e[12] * e[5] * e[10] * e[3] + e[4] * e[13] * e[10] * e[3] +
            e[8] * e[5] * e[14] * e[3] - e[4] * e[9] * e[14] * e[3] - e[12] * e[9] * e[2] * e[7] + e[8] * e[13] * e[2] * e[7] +
            e[12] * e[1] * e[10] * e[7] - e[0] * e[13] * e[10] * e[7] - e[8] * e[1] * e[14] * e[7] + e[0] * e[9] * e[14] * e[7] +
            e[12] * e[5] * e[2] * e[11] - e[4] * e[13] * e[2] * e[11] - e[12] * e[1] * e[6] * e[11] + e[0] * e[13] * e[6] * e[11] +
            e[4] * e[1] * e[14] * e[11] - e[0] * e[5] * e[14] * e[11] - e[8] * e[5] * e[2] * e[15] + e[4] * e[9] * e[2] * e[15] +
            e[8] * e[1] * e[6] * e[15] - e[0] * e[9] * e[6] * e[15] - e[4] * e[1] * e[10] * e[15] + e[0] * e[5] * e[10] * e[15]
        );
    }

    invert(): Matrix4 {
        const e = this.buffer;
        const det = this.determinant();
        if (det === 0) {
            throw new Error("Matrix is not invertible.");
        }
        const invDet = 1 / det;
        // prettier-ignore
        return new Matrix4(
            invDet * (
                e[5] * e[10] * e[15] - e[5] * e[11] * e[14] - e[9] * e[6] * e[15] + e[9] * e[7] * e[14] + e[13] * e[6] * e[11] - e[13] * e[7] * e[10]
            ),
            invDet * (
                -e[1] * e[10] * e[15] + e[1] * e[11] * e[14] + e[9] * e[2] * e[15] - e[9] * e[3] * e[14] - e[13] * e[2] * e[11] + e[13] * e[3] * e[10]
            ),
            invDet * (
                e[1] * e[6] * e[15] - e[1] * e[7] * e[14] - e[5] * e[2] * e[15] + e[5] * e[3] * e[14] + e[13] * e[2] * e[7] - e[13] * e[3] * e[6]
            ),
            invDet * (
                -e[1] * e[6] * e[11] + e[1] * e[7] * e[10] + e[5] * e[2] * e[11] - e[5] * e[3] * e[10] - e[9] * e[2] * e[7] + e[9] * e[3] * e[6]
            ),
            invDet * (
                -e[4] * e[10] * e[15] + e[4] * e[11] * e[14] + e[8] * e[6] * e[15] - e[8] * e[7] * e[14] - e[12] * e[6] * e[11] + e[12] * e[7] * e[10]
            ),
            invDet * (
                e[0] * e[10] * e[15] - e[0] * e[11] * e[14] - e[8] * e[2] * e[15] + e[8] * e[3] * e[14] + e[12] * e[2] * e[11] - e[12] * e[3] * e[10]
            ),
            invDet * (
                -e[0] * e[6] * e[15] + e[0] * e[7] * e[14] + e[4] * e[2] * e[15] - e[4] * e[3] * e[14] - e[12] * e[2] * e[7] + e[12] * e[3] * e[6]
            ),
            invDet * (
                e[0] * e[6] * e[11] - e[0] * e[7] * e[10] - e[4] * e[2] * e[11] + e[4] * e[3] * e[10] + e[8] * e[2] * e[7] - e[8] * e[3] * e[6]
            ),
            invDet * (
                e[4] * e[9] * e[15] - e[4] * e[11] * e[13] - e[8] * e[5] * e[15] + e[8] * e[7] * e[13] + e[12] * e[5] * e[11] - e[12] * e[7] * e[9]
            ),
            invDet * (
                -e[0] * e[9] * e[15] + e[0] * e[11] * e[13] + e[8] * e[1] * e[15] - e[8] * e[3] * e[13] - e[12] * e[1] * e[11] + e[12] * e[3] * e[9]
            ),
            invDet * (
                e[0] * e[5] * e[15] - e[0] * e[7] * e[13] - e[4] * e[1] * e[15] + e[4] * e[3] * e[13] + e[12] * e[1] * e[7] - e[12] * e[3] * e[5]
            ),
            invDet * (
                -e[0] * e[5] * e[11] + e[0] * e[7] * e[9] + e[4] * e[1] * e[11] - e[4] * e[3] * e[9] - e[8] * e[1] * e[7] + e[8] * e[3] * e[5]
            ),
            invDet * (
                -e[4] * e[9] * e[14] + e[4] * e[10] * e[13] + e[8] * e[5] * e[14] - e[8] * e[6] * e[13] - e[12] * e[5] * e[10] + e[12] * e[6] * e[9]
            ),
            invDet * (
                e[0] * e[9] * e[14] - e[0] * e[10] * e[13] - e[8] * e[1] * e[14] + e[8] * e[2] * e[13] + e[12] * e[1] * e[10] - e[12] * e[2] * e[9]
            ),
            invDet * (
                -e[0] * e[5] * e[14] + e[0] * e[6] * e[13] + e[4] * e[1] * e[14] - e[4] * e[2] * e[13] - e[12] * e[1] * e[6] + e[12] * e[2] * e[5]
            ),
            invDet * (
                e[0] * e[5] * e[10] - e[0] * e[6] * e[9] - e[4] * e[1] * e[10] + e[4] * e[2] * e[9] + e[8] * e[1] * e[6] - e[8] * e[2] * e[5]
            ),
        );
    }

    static Compose(position: Vector3, rotation: Quaternion, scale: Vector3): Matrix4 {
        const x = rotation.x,
            y = rotation.y,
            z = rotation.z,
            w = rotation.w;
        const x2 = x + x,
            y2 = y + y,
            z2 = z + z;
        const xx = x * x2,
            xy = x * y2,
            xz = x * z2;
        const yy = y * y2,
            yz = y * z2,
            zz = z * z2;
        const wx = w * x2,
            wy = w * y2,
            wz = w * z2;
        const sx = scale.x,
            sy = scale.y,
            sz = scale.z;
        // prettier-ignore
        return new Matrix4(
            (1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
            (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
            (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
            position.x, position.y, position.z, 1
        );
    }

    toString(): string {
        return `[${this.buffer.join(", ")}]`;
    }
}

export { Matrix4 };
