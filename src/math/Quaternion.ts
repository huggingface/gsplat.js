import { Matrix3 } from "./Matrix3";
import { Vector3 } from "./Vector3";

class Quaternion {
    public readonly x: number;
    public readonly y: number;
    public readonly z: number;
    public readonly w: number;

    constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    equals(q: Quaternion): boolean {
        if (this.x !== q.x) {
            return false;
        }
        if (this.y !== q.y) {
            return false;
        }
        if (this.z !== q.z) {
            return false;
        }
        if (this.w !== q.w) {
            return false;
        }

        return true;
    }

    normalize(): Quaternion {
        const l = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
        return new Quaternion(this.x / l, this.y / l, this.z / l, this.w / l);
    }

    multiply(q: Quaternion): Quaternion {
        const w1 = this.w,
            x1 = this.x,
            y1 = this.y,
            z1 = this.z;
        const w2 = q.w,
            x2 = q.x,
            y2 = q.y,
            z2 = q.z;

        return new Quaternion(
            w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
            w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2,
            w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2,
            w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2,
        );
    }

    inverse(): Quaternion {
        const l = this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
        return new Quaternion(-this.x / l, -this.y / l, -this.z / l, this.w / l);
    }

    apply(v: Vector3): Vector3 {
        const vecQuat = new Quaternion(v.x, v.y, v.z, 0);
        const conjugate = new Quaternion(-this.x, -this.y, -this.z, this.w);
        const rotatedQuat = this.multiply(vecQuat).multiply(conjugate);
        return new Vector3(rotatedQuat.x, rotatedQuat.y, rotatedQuat.z);
    }

    flat(): number[] {
        return [this.x, this.y, this.z, this.w];
    }

    clone(): Quaternion {
        return new Quaternion(this.x, this.y, this.z, this.w);
    }

    static FromEuler(e: Vector3): Quaternion {
        const halfX = e.x / 2;
        const halfY = e.y / 2;
        const halfZ = e.z / 2;
        const cy = Math.cos(halfY);
        const sy = Math.sin(halfY);
        const cp = Math.cos(halfX);
        const sp = Math.sin(halfX);
        const cz = Math.cos(halfZ);
        const sz = Math.sin(halfZ);

        const q = new Quaternion(
            cy * sp * cz + sy * cp * sz,
            sy * cp * cz - cy * sp * sz,
            cy * cp * sz - sy * sp * cz,
            cy * cp * cz + sy * sp * sz,
        );
        return q;
    }

    toEuler(): Vector3 {
        const sinr_cosp = 2 * (this.w * this.x + this.y * this.z);
        const cosr_cosp = 1 - 2 * (this.x * this.x + this.y * this.y);
        const x = Math.atan2(sinr_cosp, cosr_cosp);

        let y;
        const sinp = 2 * (this.w * this.y - this.z * this.x);
        if (Math.abs(sinp) >= 1) {
            y = (Math.sign(sinp) * Math.PI) / 2;
        } else {
            y = Math.asin(sinp);
        }

        const siny_cosp = 2 * (this.w * this.z + this.x * this.y);
        const cosy_cosp = 1 - 2 * (this.y * this.y + this.z * this.z);
        const z = Math.atan2(siny_cosp, cosy_cosp);

        return new Vector3(x, y, z);
    }

    static FromMatrix3(matrix: Matrix3): Quaternion {
        const m = matrix.buffer;
        const trace = m[0] + m[4] + m[8];
        let x, y, z, w;
        if (trace > 0) {
            const s = 0.5 / Math.sqrt(trace + 1.0);
            w = 0.25 / s;
            x = (m[7] - m[5]) * s;
            y = (m[2] - m[6]) * s;
            z = (m[3] - m[1]) * s;
        } else if (m[0] > m[4] && m[0] > m[8]) {
            const s = 2.0 * Math.sqrt(1.0 + m[0] - m[4] - m[8]);
            w = (m[7] - m[5]) / s;
            x = 0.25 * s;
            y = (m[1] + m[3]) / s;
            z = (m[2] + m[6]) / s;
        } else if (m[4] > m[8]) {
            const s = 2.0 * Math.sqrt(1.0 + m[4] - m[0] - m[8]);
            w = (m[2] - m[6]) / s;
            x = (m[1] + m[3]) / s;
            y = 0.25 * s;
            z = (m[5] + m[7]) / s;
        } else {
            const s = 2.0 * Math.sqrt(1.0 + m[8] - m[0] - m[4]);
            w = (m[3] - m[1]) / s;
            x = (m[2] + m[6]) / s;
            y = (m[5] + m[7]) / s;
            z = 0.25 * s;
        }
        return new Quaternion(x, y, z, w);
    }

    static FromAxisAngle(axis: Vector3, angle: number): Quaternion {
        const halfAngle = angle / 2;
        const sin = Math.sin(halfAngle);
        const cos = Math.cos(halfAngle);
        return new Quaternion(axis.x * sin, axis.y * sin, axis.z * sin, cos);
    }

    static LookRotation(direction: Vector3): Quaternion {
        const forward = new Vector3(0, 0, 1);
        const dot = forward.dot(direction);

        if (Math.abs(dot - -1.0) < 0.000001) {
            return new Quaternion(0, 1, 0, Math.PI);
        }
        if (Math.abs(dot - 1.0) < 0.000001) {
            return new Quaternion();
        }

        const rotAngle = Math.acos(dot);
        const rotAxis = forward.cross(direction).normalize();
        return Quaternion.FromAxisAngle(rotAxis, rotAngle);
    }

    toString(): string {
        return `[${this.flat().join(", ")}]`;
    }
}

export { Quaternion };
