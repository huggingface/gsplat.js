import { Matrix4 } from "./Matrix4";

class Vector4 {
    public readonly x: number;
    public readonly y: number;
    public readonly z: number;
    public readonly w: number;

    constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    equals(v: Vector4): boolean {
        if (this.x !== v.x) {
            return false;
        }
        if (this.y !== v.y) {
            return false;
        }
        if (this.z !== v.z) {
            return false;
        }
        if (this.w !== v.w) {
            return false;
        }

        return true;
    }

    add(v: number): Vector4;
    add(v: Vector4): Vector4;
    add(v: number | Vector4): Vector4 {
        if (typeof v === "number") {
            return new Vector4(this.x + v, this.y + v, this.z + v, this.w + v);
        } else {
            return new Vector4(this.x + v.x, this.y + v.y, this.z + v.z, this.w + v.w);
        }
    }

    subtract(v: number): Vector4;
    subtract(v: Vector4): Vector4;
    subtract(v: number | Vector4): Vector4 {
        if (typeof v === "number") {
            return new Vector4(this.x - v, this.y - v, this.z - v, this.w - v);
        } else {
            return new Vector4(this.x - v.x, this.y - v.y, this.z - v.z, this.w - v.w);
        }
    }

    multiply(v: number): Vector4;
    multiply(v: Vector4): Vector4;
    multiply(v: Matrix4): Vector4;
    multiply(v: number | Vector4 | Matrix4): Vector4 {
        if (typeof v === "number") {
            return new Vector4(this.x * v, this.y * v, this.z * v, this.w * v);
        } else if (v instanceof Vector4) {
            return new Vector4(this.x * v.x, this.y * v.y, this.z * v.z, this.w * v.w);
        } else {
            return new Vector4(
                this.x * v.buffer[0] + this.y * v.buffer[4] + this.z * v.buffer[8] + this.w * v.buffer[12],
                this.x * v.buffer[1] + this.y * v.buffer[5] + this.z * v.buffer[9] + this.w * v.buffer[13],
                this.x * v.buffer[2] + this.y * v.buffer[6] + this.z * v.buffer[10] + this.w * v.buffer[14],
                this.x * v.buffer[3] + this.y * v.buffer[7] + this.z * v.buffer[11] + this.w * v.buffer[15],
            );
        }
    }

    dot(v: Vector4): number {
        return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
    }

    lerp(v: Vector4, t: number): Vector4 {
        return new Vector4(
            this.x + (v.x - this.x) * t,
            this.y + (v.y - this.y) * t,
            this.z + (v.z - this.z) * t,
            this.w + (v.w - this.w) * t,
        );
    }

    magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    }

    distanceTo(v: Vector4): number {
        return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2 + (this.z - v.z) ** 2 + (this.w - v.w) ** 2);
    }

    normalize(): Vector4 {
        const length = this.magnitude();

        return new Vector4(this.x / length, this.y / length, this.z / length, this.w / length);
    }

    flat(): number[] {
        return [this.x, this.y, this.z, this.w];
    }

    clone(): Vector4 {
        return new Vector4(this.x, this.y, this.z, this.w);
    }

    toString(): string {
        return `[${this.flat().join(", ")}]`;
    }
}

export { Vector4 };
