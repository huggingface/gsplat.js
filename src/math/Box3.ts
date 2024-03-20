import { Vector3 } from "./Vector3";

class Box3 {
    constructor(
        public min: Vector3,
        public max: Vector3,
    ) {}

    public contains(point: Vector3) {
        return (
            point.x >= this.min.x &&
            point.x <= this.max.x &&
            point.y >= this.min.y &&
            point.y <= this.max.y &&
            point.z >= this.min.z &&
            point.z <= this.max.z
        );
    }

    public intersects(box: Box3) {
        return (
            this.max.x >= box.min.x &&
            this.min.x <= box.max.x &&
            this.max.y >= box.min.y &&
            this.min.y <= box.max.y &&
            this.max.z >= box.min.z &&
            this.min.z <= box.max.z
        );
    }

    public size() {
        return this.max.subtract(this.min);
    }

    public center() {
        return this.min.add(this.max).divide(2);
    }

    public expand(point: Vector3) {
        this.min = this.min.min(point);
        this.max = this.max.max(point);
    }

    public permute() {
        const min = this.min;
        const max = this.max;
        this.min = new Vector3(Math.min(min.x, max.x), Math.min(min.y, max.y), Math.min(min.z, max.z));
        this.max = new Vector3(Math.max(min.x, max.x), Math.max(min.y, max.y), Math.max(min.z, max.z));
    }
}

export { Box3 };
