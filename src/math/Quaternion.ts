import { Matrix3 } from "./Matrix3";
import type { Vector3 } from "./Vector3";

class Quaternion {
    x: number;
    y: number;
    z: number;
    w: number;

    constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    set(x: number, y: number, z: number, w: number): Quaternion {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;

        return this;
    }

    flat(): number[] {
        return [this.x, this.y, this.z, this.w];
    }

    clone(): Quaternion {
        return new Quaternion(this.x, this.y, this.z, this.w);
    }

    toRotationMatrix(): Matrix3 {
        const xx = this.x * this.x;
        const xy = this.x * this.y;
        const xz = this.x * this.z;
        const xw = this.x * this.w;
        const yy = this.y * this.y;
        const yz = this.y * this.z;
        const yw = this.y * this.w;
        const zz = this.z * this.z;
        const zw = this.z * this.w;

        const m = new Matrix3();
        // prettier-ignore
        m.set(
            1 - 2 * (yy + zz), 2 * (xy - zw), 2 * (xz + yw),
            2 * (xy + zw), 1 - 2 * (xx + zz), 2 * (yz - xw),
            2 * (xz - yw), 2 * (yz + xw), 1 - 2 * (xx + yy)
        )

        return m;
    }

    static FromEuler(m: Vector3) {
        const cy = Math.cos(m.y / 2);
        const sy = Math.sin(m.y / 2);
        const cp = Math.cos(m.x / 2);
        const sp = Math.sin(m.x / 2);
        const cr = Math.cos(m.z / 2);
        const sr = Math.sin(m.z / 2);

        const w = cy * cp * cr + sy * sp * sr;
        const x = cy * cp * sr - sy * sp * cr;
        const y = sy * cp * sr + cy * sp * cr;
        const z = sy * cp * cr - cy * sp * sr;

        return new Quaternion(x, y, z, w);
    }
}

export { Quaternion };
