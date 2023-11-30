import { Vector3 } from "./Vector3";

class Plane {
    public readonly normal: Vector3;
    public readonly point: Vector3;

    constructor(normal: Vector3, point: Vector3) {
        this.normal = normal;
        this.point = point;
    }

    intersect(origin: Vector3, direction: Vector3): Vector3 | null {
        const denominator = this.normal.dot(direction);

        if (Math.abs(denominator) < 0.0001) {
            return null;
        }

        const t = this.normal.dot(this.point.subtract(origin)) / denominator;

        if (t < 0) {
            return null;
        }

        return origin.add(direction.multiply(t));
    }
}

export { Plane };
