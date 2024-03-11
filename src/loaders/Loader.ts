import type { Scene } from "../core/Scene";
import { Splat } from "../splats/Splat";
import { SplatData } from "../splats/SplatData";
import { initiateFetchRequest, loadRequestDataIntoBuffer } from "../utils/LoaderUtils";

class Loader {
    static async LoadAsync(
        url: string,
        scene: Scene,
        onProgress?: (progress: number) => void,
        useCache: boolean = false,
    ): Promise<Splat> {
        const res: Response = await initiateFetchRequest(url, useCache);

        const buffer = await loadRequestDataIntoBuffer(res, onProgress);
        return this.LoadFromArrayBuffer(buffer, scene);
    }

    static async LoadFromFileAsync(file: File, scene: Scene, onProgress?: (progress: number) => void): Promise<Splat> {
        const reader = new FileReader();
        let splat = new Splat();
        reader.onload = (e) => {
            splat = this.LoadFromArrayBuffer(e.target!.result as ArrayBuffer, scene);
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
        return splat;
    }

    static LoadFromArrayBuffer(arrayBuffer: ArrayBufferLike, scene: Scene): Splat {
        const buffer = new Uint8Array(arrayBuffer);
        const data = SplatData.Deserialize(buffer);
        const splat = new Splat(data);
        scene.addObject(splat);
        return splat;
    }
}

export { Loader };
