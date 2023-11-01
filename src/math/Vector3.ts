class Vector3 {
    x: number;
    y: number;
    z: number;

    constructor(x: number = 0, y: number = 0, z: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    set(x: number, y: number, z: number): Vector3 {
        this.x = x;
        this.y = y;
        this.z = z;

        return this;
    }

    add(v: Vector3): Vector3;
    add(v: number): Vector3;
    add(v: Vector3 | number): Vector3 {
        if (typeof v === "number") {
            this.x += v;
            this.y += v;
            this.z += v;
        } else {
            this.x += v.x;
            this.y += v.y;
            this.z += v.z;
        }

        return this;
    }

    subtract(v: Vector3): Vector3;
    subtract(v: number): Vector3;
    subtract(v: Vector3 | number): Vector3 {
        if (typeof v === "number") {
            this.x -= v;
            this.y -= v;
            this.z -= v;
        } else {
            this.x -= v.x;
            this.y -= v.y;
            this.z -= v.z;
        }

        return this;
    }

    multiply(v: Vector3): Vector3;
    multiply(v: number): Vector3;
    multiply(v: Vector3 | number): Vector3 {
        if (typeof v === "number") {
            this.x *= v;
            this.y *= v;
            this.z *= v;
        } else {
            this.x *= v.x;
            this.y *= v.y;
            this.z *= v.z;
        }

        return this;
    }

    lerp(v: Vector3, t: number): Vector3 {
        this.x += (v.x - this.x) * t;
        this.y += (v.y - this.y) * t;
        this.z += (v.z - this.z) * t;

        return this;
    }

    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    normalize(): Vector3 {
        const length = this.length();
        this.x /= length;
        this.y /= length;
        this.z /= length;

        return this;
    }

    flat(): number[] {
        return [this.x, this.y, this.z];
    }

    clone(): Vector3 {
        return new Vector3(this.x, this.y, this.z);
    }
}

export { Vector3 };
