import { Object3D } from "../../src/core/Object3D";
import { Scene } from "../../src/core/Scene";
import { Vector3 } from "../../src/math/Vector3";
import { Quaternion } from "../../src/math/Quaternion";

function createScene(objects: Object3D[]): Scene {
    const scene = new Scene();

    const buffer = new ArrayBuffer(objects.length * Scene.rowLength);

    for (let i = 0; i < objects.length; i++) {
        const object = objects[i];

        const position = new Float32Array(buffer, i * Scene.rowLength, 3);
        const scales = new Float32Array(buffer, i * Scene.rowLength + 12, 3);
        const rgba = new Uint8ClampedArray(buffer, i * Scene.rowLength + 24, 4);
        const rot = new Uint8ClampedArray(buffer, i * Scene.rowLength + 28, 4);

        position.set(object.position.flat());
        rot.set(object.rotation.flat());

        scales[0] = 0;
        scales[1] = 0;
        scales[2] = 0;

        rgba[0] = 0;
        rgba[1] = 0;
        rgba[2] = 0;
        rgba[3] = 0;
    }

    const newData = new Uint8Array(buffer.byteLength);
    newData.set(new Uint8Array(buffer));
    scene.setData(newData);

    return scene;
}

function splat(x: number, y: number, z: number): Object3D {
    return { position: new Vector3(x, y, z), rotation: new Quaternion(0, 0, 0, 0) };
}

describe("Scene object", () => {
    describe("translate", () => {
        const scene = createScene([splat(3, 3, 3), splat(1, 1, 1)]);

        const orig_f_buffer = new Float32Array(scene.f_buffer);
        scene.translate(new Vector3(2, 3, 4));

        it("should translate every vertex", () => {
            const expected = new Float32Array((2 * Scene.rowLength) / 4);
            expected.set([5, 6, 7], 0);
            expected.set([3, 4, 5], 8);

            expect(scene.f_buffer).toStrictEqual(expected);
        });

        it("should not change the other properties", () => {
            const removePositionalOffsets = (f_buffer: Float32Array) =>
                f_buffer.filter((_, index) => index % (Scene.rowLength / 4) < 3);

            expect(removePositionalOffsets(scene.f_buffer)).not.toStrictEqual(removePositionalOffsets(orig_f_buffer));
        });
    });

    describe("limit", () => {
        it("should keep inside splat", () => {
            const scene = createScene([splat(1, 1, 1)]);

            scene.limitBox(0, 2, 0, 2, 0, 2);

            expect(scene.f_buffer).toStrictEqual(scene.clean_f_buffer);
        });

        it("should keep splats on the edge", () => {
            const scene = createScene([splat(2, 0, 0)]);

            scene.limitBox(0, 2, 0, 2, 0, 2);

            expect(scene.f_buffer).toStrictEqual(scene.clean_f_buffer);
        });

        it("should remove outside splat", () => {
            const scene = createScene([splat(3, 3, 3)]);

            scene.limitBox(0, 2, 0, 2, 0, 2);

            expect(scene.f_buffer).toStrictEqual(new Float32Array(Scene.rowLength / 4));
        });

        describe("in buffer movement", () => {
            const scene = createScene([splat(3, 3, 3), splat(1, 1, 1)]);

            scene.limitBox(0, 2, 0, 2, 0, 2);

            it("should move splats to right position in new buffer", () => {
                const expected = new Float32Array((2 * Scene.rowLength) / 4);
                expected.set([1, 1, 1]); // rest is initialized with 0

                expect(scene.f_buffer).toStrictEqual(expected);
            });

            it("should retain buffer size", () => {
                expect(scene.f_buffer.length).toStrictEqual(scene.clean_f_buffer.length);
            });

            it("should add splats back in when changing the limits", () => {
                scene.limitBox(0, 4, 0, 4, 0, 4);

                expect(scene.f_buffer).toStrictEqual(scene.clean_f_buffer);
            });
        });

        it("should check for invalid input", () => {
            const scene = createScene([]);

            expect(() => scene.limitBox(2, 0, 0, 1, 0, 1)).toThrow();
            expect(() => scene.limitBox(0, 1, -2, -4, 0, 1)).toThrow();
            expect(() => scene.limitBox(0, 1, 0, 1, 1, 0)).toThrow();
        });
    });
});
