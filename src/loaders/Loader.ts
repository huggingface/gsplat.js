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

        const data = SplatData.Deserialize(buffer);
        const splat = new Splat(data);
        scene.addObject(splat);
        return splat;
    }

    static async LoadFromFileAsync(file: File, scene: Scene, onProgress?: (progress: number) => void): Promise<Splat> {
        const reader = new FileReader();
        let splat = new Splat();
        reader.onload = (e) => {
            const buffer = new Uint8Array(e.target!.result as ArrayBuffer);
            const data = SplatData.Deserialize(buffer);
            splat = new Splat(data);
            scene.addObject(splat);
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
}

export { Loader };
