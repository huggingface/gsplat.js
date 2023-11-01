import type { Scene } from "../core/Scene";

class Loader {
    static async LoadAsync(url: string, scene: Scene, onProgress?: (progress: number) => void): Promise<void> {
        const req = await fetch(url, {
            mode: "cors",
            credentials: "omit",
        });

        if (req.status != 200) {
            throw new Error(req.status + " Unable to load " + req.url);
        }

        const reader = req.body!.getReader();
        const contentLength = parseInt(req.headers.get("content-length") as string);
        const data = new Uint8Array(contentLength);

        let bytesRead = 0;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            data.set(value, bytesRead);
            bytesRead += value.length;

            onProgress?.(bytesRead / contentLength);
        }

        scene.setData(data);
    }

    static async LoadFromFileAsync(file: File, scene: Scene, onProgress?: (progress: number) => void): Promise<void> {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target!.result as ArrayBuffer);
            scene.setData(data);
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
    }
}

export { Loader };
