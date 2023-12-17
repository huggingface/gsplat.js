import type { Scene } from "../core/Scene";
import { Splat } from "../splats/Splat";
import { SplatData } from "../splats/SplatData";

class Loader {
    static async LoadAsync(
        url: string,
        scene: Scene,
        onProgress?: (progress: number) => void,
        useCache: boolean = false,
    ): Promise<Splat> {
        const req = await fetch(url, {
            mode: "cors",
            credentials: "omit",
            cache: useCache ? "force-cache" : "default",
        });

        if (req.status != 200) {
            throw new Error(req.status + " Unable to load " + req.url);
        }

        const reader = req.body!.getReader();
        const contentLength = parseInt(req.headers.get("content-length") as string);
        const buffer = new Uint8Array(contentLength);

        let bytesRead = 0;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer.set(value, bytesRead);
            bytesRead += value.length;

            onProgress?.(bytesRead / contentLength);
        }

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
