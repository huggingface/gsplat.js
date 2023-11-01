import type { Scene } from "../core/Scene";
import { processPlyBuffer } from "./processPlyBuffer";

class PLYLoader {
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
        const plyData = new Uint8Array(contentLength);

        let bytesRead = 0;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            plyData.set(value, bytesRead);
            bytesRead += value.length;

            onProgress?.((0.5 * bytesRead) / contentLength);
        }

        if (plyData[0] !== 112 || plyData[1] !== 108 || plyData[2] !== 121 || plyData[3] !== 10) {
            throw new Error("Invalid PLY file");
        }

        const data = new Uint8Array(
            processPlyBuffer(plyData.buffer, (progress) => {
                onProgress?.(0.5 + 0.5 * progress);
            }),
        );
        scene.setData(data);
    }

    static async LoadFromFileAsync(file: File, scene: Scene, onProgress?: (progress: number) => void): Promise<void> {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(
                processPlyBuffer(e.target!.result as ArrayBuffer, (progress) => {
                    onProgress?.(0.5 + 0.5 * progress);
                }),
            );
            scene.setData(data);
        };
        reader.onprogress = (e) => {
            onProgress?.((0.5 * e.loaded) / e.total);
        };
        reader.readAsArrayBuffer(file);
        await new Promise<void>((resolve) => {
            reader.onloadend = () => {
                resolve();
            };
        });
    }
}

export { PLYLoader };
