import { Object3D } from "./Object3D";

class Scene extends Object3D {
    data: Uint8Array;
    vertexCount: number;

    constructor() {
        super();

        this.data = new Uint8Array(0);
        this.vertexCount = 0;
    }

    setData(data: Uint8Array): void {
        this.data = data;

        const rowLength = 3 * 4 + 3 * 4 + 4 + 4;
        this.vertexCount = data.length / rowLength;
    }
}

export { Scene };
