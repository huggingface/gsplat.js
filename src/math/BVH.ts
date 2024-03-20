import { Box3 } from "./Box3";

class BVHNode {
    public left: BVHNode | null = null;
    public right: BVHNode | null = null;
    public pointIndices: number[] = [];

    constructor(
        public bounds: Box3,
        public boxes: Box3[],
        pointIndices: number[],
    ) {
        if (pointIndices.length > 1) {
            this.split(bounds, boxes, pointIndices);
        } else if (pointIndices.length > 0) {
            this.pointIndices = pointIndices;
        }
    }

    private split(bounds: Box3, boxes: Box3[], pointIndices: number[]) {
        const axis = bounds.size().maxComponent();
        pointIndices.sort((a, b) => boxes[a].center().getComponent(axis) - boxes[b].center().getComponent(axis));

        const mid = Math.floor(pointIndices.length / 2);
        const leftIndices = pointIndices.slice(0, mid);
        const rightIndices = pointIndices.slice(mid);

        this.left = new BVHNode(bounds, boxes, leftIndices);
        this.right = new BVHNode(bounds, boxes, rightIndices);
    }

    public queryRange(range: Box3): number[] {
        if (!this.bounds.intersects(range)) {
            return [];
        } else if (this.left !== null && this.right !== null) {
            return this.left.queryRange(range).concat(this.right.queryRange(range));
        } else {
            return this.pointIndices.filter((index) => range.intersects(this.boxes[index]));
        }
    }
}

class BVH {
    public root: BVHNode;

    constructor(bounds: Box3, boxes: Box3[]) {
        const pointIndices = boxes.map((_, index) => index);
        this.root = new BVHNode(bounds, boxes, pointIndices);
    }

    public queryRange(range: Box3) {
        return this.root.queryRange(range);
    }
}

export { BVH };
