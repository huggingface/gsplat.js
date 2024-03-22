import { Camera } from "../cameras/Camera";
import type { Scene } from "../core/Scene";
import { Matrix3 } from "../math/Matrix3";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { Splatv } from "../splats/Splatv";
import { SplatvData } from "../splats/SplatvData";
import { initiateFetchRequest, loadRequestDataIntoBuffer } from "../utils/LoaderUtils";

class SplatvLoader {
    static async LoadAsync(
        url: string,
        scene: Scene,
        camera: Camera | null,
        onProgress?: (progress: number) => void,
        useCache: boolean = false,
    ): Promise<Splatv> {
        const res: Response = await initiateFetchRequest(url, useCache);

        const buffer = await loadRequestDataIntoBuffer(res, onProgress);
        return this._ParseSplatvBuffer(buffer.buffer, scene, camera);
    }

    static async LoadFromFileAsync(
        file: File,
        scene: Scene,
        camera: Camera | null,
        onProgress?: (progress: number) => void,
    ): Promise<Splatv> {
        const reader = new FileReader();
        let splatv: Splatv | null = null;
        reader.onload = (e) => {
            splatv = this._ParseSplatvBuffer(e.target!.result as ArrayBuffer, scene, camera);
        };
        reader.onprogress = (e) => {
            onProgress?.(e.loaded / e.total);
        };
        reader.readAsArrayBuffer(file);
        await new Promise<void>((resolve) => {
            reader.onloadend = () => {
                resolve();
            };
        });
        if (!splatv) {
            throw new Error("Failed to load splatv file");
        }
        return splatv;
    }

    private static _ParseSplatvBuffer(inputBuffer: ArrayBuffer, scene: Scene, camera: Camera | null): Splatv {
        let result: Splatv | null = null;

        const handleChunk = (
            chunk: { size: number; type: string; texwidth: number; texheight: number },
            buffer: Uint8Array,
            chunks: { size: number; type: string }[],
        ) => {
            if (chunk.type === "magic") {
                const intView = new Int32Array(buffer.buffer);
                if (intView[0] !== 0x674b) {
                    throw new Error("Invalid splatv file");
                }
                chunks.push({ size: intView[1], type: "chunks" });
            } else if (chunk.type === "chunks") {
                const splatChunks = JSON.parse(new TextDecoder("utf-8").decode(buffer));
                if (splatChunks.length == 0) {
                    throw new Error("Invalid splatv file");
                } else if (splatChunks.length > 1) {
                    console.warn("Splatv file contains more than one chunk, only the first one will be loaded");
                }
                const chunk = splatChunks[0];
                const cameras = chunk.cameras as { position: number[]; rotation: number[][] }[];
                if (camera && cameras && cameras.length) {
                    const cameraData = cameras[0];
                    const position = new Vector3(
                        cameraData.position[0],
                        cameraData.position[1],
                        cameraData.position[2],
                    );
                    const rotation = Quaternion.FromMatrix3(
                        new Matrix3(
                            cameraData.rotation[0][0],
                            cameraData.rotation[0][1],
                            cameraData.rotation[0][2],
                            cameraData.rotation[1][0],
                            cameraData.rotation[1][1],
                            cameraData.rotation[1][2],
                            cameraData.rotation[2][0],
                            cameraData.rotation[2][1],
                            cameraData.rotation[2][2],
                        ),
                    );
                    camera.position = position;
                    camera.rotation = rotation;
                }
                chunks.push(chunk);
            } else if (chunk.type === "splat") {
                const data = SplatvData.Deserialize(buffer, chunk.texwidth, chunk.texheight);
                const splatv = new Splatv(data);
                scene.addObject(splatv);
                result = splatv;
            }
        };

        const ubuf = new Uint8Array(inputBuffer);
        const chunks: { size: number; type: string; texwidth: number; texheight: number }[] = [
            { size: 8, type: "magic", texwidth: 0, texheight: 0 },
        ];
        let chunk: { size: number; type: string; texwidth: number; texheight: number } | undefined = chunks.shift();
        let buffer = new Uint8Array(chunk!.size);
        let offset = 0;
        let inputOffset = 0;
        while (chunk) {
            while (offset < chunk.size) {
                const sizeToRead = Math.min(chunk.size - offset, ubuf.length - inputOffset);
                buffer.set(ubuf.subarray(inputOffset, inputOffset + sizeToRead), offset);
                offset += sizeToRead;
                inputOffset += sizeToRead;
            }
            handleChunk(chunk, buffer, chunks);
            if (result) {
                return result;
            }
            chunk = chunks.shift();
            if (chunk) {
                buffer = new Uint8Array(chunk.size);
                offset = 0;
            }
        }

        throw new Error("Invalid splatv file");
    }
}

export { SplatvLoader };
