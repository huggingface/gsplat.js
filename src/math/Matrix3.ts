import { Quaternion } from "./Quaternion";
import type { Vector3 } from "./Vector3";

class Matrix3 {
    public readonly buffer: number[];

    // prettier-ignore
    constructor(n11: number = 1, n12: number = 0, n13: number = 0,
                n21: number = 0, n22: number = 1, n23: number = 0,
                n31: number = 0, n32: number = 0, n33: number = 1) {
        this.buffer = [
            n11, n12, n13,
            n21, n22, n23,
            n31, n32, n33
        ];
    }

    equals(m: Matrix3): boolean {
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

    multiply(v: Matrix3): Matrix3 {
        const a = this.buffer;
        const b = v.buffer;
        return new Matrix3(
            b[0] * a[0] + b[3] * a[1] + b[6] * a[2],
            b[1] * a[0] + b[4] * a[1] + b[7] * a[2],
            b[2] * a[0] + b[5] * a[1] + b[8] * a[2],
            b[0] * a[3] + b[3] * a[4] + b[6] * a[5],
            b[1] * a[3] + b[4] * a[4] + b[7] * a[5],
            b[2] * a[3] + b[5] * a[4] + b[8] * a[5],
            b[0] * a[6] + b[3] * a[7] + b[6] * a[8],
            b[1] * a[6] + b[4] * a[7] + b[7] * a[8],
            b[2] * a[6] + b[5] * a[7] + b[8] * a[8],
        );
    }

    clone(): Matrix3 {
        const e = this.buffer;
        // prettier-ignore
        return new Matrix3(
            e[0], e[1], e[2],
            e[3], e[4], e[5],
            e[6], e[7], e[8]
        );
    }

    static Eye(v: number = 1): Matrix3 {
        return new Matrix3(v, 0, 0, 0, v, 0, 0, 0, v);
    }

    static Diagonal(v: Vector3): Matrix3 {
        return new Matrix3(v.x, 0, 0, 0, v.y, 0, 0, 0, v.z);
    }

    static RotationFromQuaternion(q: Quaternion): Matrix3 {
        const matrix = new Matrix3(
            1 - 2 * q.y * q.y - 2 * q.z * q.z,
            2 * q.x * q.y - 2 * q.z * q.w,
            2 * q.x * q.z + 2 * q.y * q.w,
            2 * q.x * q.y + 2 * q.z * q.w,
            1 - 2 * q.x * q.x - 2 * q.z * q.z,
            2 * q.y * q.z - 2 * q.x * q.w,
            2 * q.x * q.z - 2 * q.y * q.w,
            2 * q.y * q.z + 2 * q.x * q.w,
            1 - 2 * q.x * q.x - 2 * q.y * q.y,
        );
        return matrix;
    }

    static RotationFromEuler(m: Vector3): Matrix3 {
        const cx = Math.cos(m.x);
        const sx = Math.sin(m.x);
        const cy = Math.cos(m.y);
        const sy = Math.sin(m.y);
        const cz = Math.cos(m.z);
        const sz = Math.sin(m.z);

        const rotationMatrix = [
            cy * cz + sy * sx * sz,
            -cy * sz + sy * sx * cz,
            sy * cx,
            cx * sz,
            cx * cz,
            -sx,
            -sy * cz + cy * sx * sz,
            sy * sz + cy * sx * cz,
            cy * cx,
        ];

        return new Matrix3(...rotationMatrix);
    }

    toString(): string {
        return `[${this.buffer.join(", ")}]`;
    }
}

export { Matrix3 };
