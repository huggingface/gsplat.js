import { Camera } from "../../../cameras/Camera";
import { Vector3 } from "../../../math/Vector3";
import { Splat } from "../../../splats/Splat";
import { RenderProgram } from "../programs/RenderProgram";
import { Box3 } from "../../../math/Box3";
import { BVH } from "../../../math/BVH";
import { RenderData } from "./RenderData";

class IntersectionTester {
    testPoint: (x: number, y: number) => Splat | null;

    constructor(renderProgram: RenderProgram, maxDistance: number = 100, resolution: number = 1.0) {
        let vertexCount = 0;
        let bvh: BVH | null = null;
        let lookup: Splat[] = [];

        const build = () => {
            if (renderProgram.renderData === null) {
                console.error("IntersectionTester cannot be called before renderProgram has been initialized");
                return;
            }
            lookup = [];
            const renderData = renderProgram.renderData as RenderData;
            const boxes = new Array<Box3>(renderData.offsets.size);
            let i = 0;
            const bounds = new Box3(
                new Vector3(Infinity, Infinity, Infinity),
                new Vector3(-Infinity, -Infinity, -Infinity),
            );
            for (const splat of renderData.offsets.keys()) {
                const splatBounds = splat.bounds;
                boxes[i++] = splatBounds;
                bounds.expand(splatBounds.min);
                bounds.expand(splatBounds.max);
                lookup.push(splat);
            }
            bounds.permute();
            bvh = new BVH(bounds, boxes);
            vertexCount = renderData.vertexCount;
        };

        this.testPoint = (x: number, y: number) => {
            if (renderProgram.renderData === null || renderProgram.camera === null) {
                console.error("IntersectionTester cannot be called before renderProgram has been initialized");
                return null;
            }

            build();

            if (bvh === null) {
                console.error("Failed to build octree for IntersectionTester");
                return null;
            }

            const renderData = renderProgram.renderData as RenderData;
            const camera = renderProgram.camera as Camera;

            if (vertexCount !== renderData.vertexCount) {
                console.warn("IntersectionTester has not been rebuilt since the last render");
            }

            const ray = camera.screenPointToRay(x, y);
            for (let x = 0; x < maxDistance; x += resolution) {
                const point = camera.position.add(ray.multiply(x));
                const minPoint = new Vector3(
                    point.x - resolution / 2,
                    point.y - resolution / 2,
                    point.z - resolution / 2,
                );
                const maxPoint = new Vector3(
                    point.x + resolution / 2,
                    point.y + resolution / 2,
                    point.z + resolution / 2,
                );
                const queryBox = new Box3(minPoint, maxPoint);
                const points = bvh.queryRange(queryBox);
                if (points.length > 0) {
                    return lookup[points[0]];
                }
            }

            return null;
        };
    }
}

export { IntersectionTester };
