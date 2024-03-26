import { Scene } from "../core/Scene";
import { Vector3 } from "../math/Vector3";
import { Quaternion } from "../math/Quaternion";
import { SplatData } from "../splats/SplatData";
import { Splat } from "../splats/Splat";
import { Converter } from "../utils/Converter";
import { initiateFetchRequest, loadRequestDataIntoBuffer } from "../utils/LoaderUtils";

class PLYLoader {
    static async LoadAsync(
        url: string,
        scene: Scene,
        onProgress?: (progress: number) => void,
        format: string = "",
        useCache: boolean = false,
    ): Promise<Splat> {
        const res: Response = await initiateFetchRequest(url, useCache);

        const plyData = await loadRequestDataIntoBuffer(res, onProgress);

        if (plyData[0] !== 112 || plyData[1] !== 108 || plyData[2] !== 121 || plyData[3] !== 10) {
            throw new Error("Invalid PLY file");
        }

        return this.LoadFromArrayBuffer(plyData.buffer, scene, format);
    }

    static async LoadFromFileAsync(
        file: File,
        scene: Scene,
        onProgress?: (progress: number) => void,
        format: string = "",
    ): Promise<Splat> {
        const reader = new FileReader();
        let splat = new Splat();
        reader.onload = (e) => {
            splat = this.LoadFromArrayBuffer(e.target!.result as ArrayBuffer, scene, format);
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

    static LoadFromArrayBuffer(arrayBuffer: ArrayBufferLike, scene: Scene, format: string = ""): Splat {
        const buffer = new Uint8Array(this._ParsePLYBuffer(arrayBuffer, format));
        const data = SplatData.Deserialize(buffer);
        const splat = new Splat(data);
        scene.addObject(splat);
        return splat;
    }

    private static _ParsePLYBuffer(inputBuffer: ArrayBuffer, format: string): ArrayBuffer {
        type PlyProperty = {
            name: string;
            type: string;
            offset: number;
        };

        const ubuf = new Uint8Array(inputBuffer);
        const headerText = new TextDecoder().decode(ubuf.slice(0, 1024 * 10));
        const header_end = "end_header\n";
        const header_end_index = headerText.indexOf(header_end);
        if (header_end_index < 0) throw new Error("Unable to read .ply file header");

        const vertexCount = parseInt(/element vertex (\d+)\n/.exec(headerText)![1]);

        let rowOffset = 0;
        const offsets: Record<string, number> = {
            double: 8,
            int: 4,
            uint: 4,
            float: 4,
            short: 2,
            ushort: 2,
            uchar: 1,
        };

        const properties: PlyProperty[] = [];
        for (const prop of headerText
            .slice(0, header_end_index)
            .split("\n")
            .filter((k) => k.startsWith("property "))) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [_p, type, name] = prop.split(" ");
            properties.push({ name, type, offset: rowOffset });
            
            if (!offsets[type]) throw new Error(`Unsupported property type: ${type}`);
            rowOffset += offsets[type];
        }

        const dataView = new DataView(inputBuffer, header_end_index + header_end.length);
        const buffer = new ArrayBuffer(SplatData.RowLength * vertexCount);

        const q_polycam = Quaternion.FromEuler(new Vector3(Math.PI / 2, 0, 0));

        for (let i = 0; i < vertexCount; i++) {
            const position = new Float32Array(buffer, i * SplatData.RowLength, 3);
            const scale = new Float32Array(buffer, i * SplatData.RowLength + 12, 3);
            const rgba = new Uint8ClampedArray(buffer, i * SplatData.RowLength + 24, 4);
            const rot = new Uint8ClampedArray(buffer, i * SplatData.RowLength + 28, 4);

            let r0: number = 255;
            let r1: number = 0;
            let r2: number = 0;
            let r3: number = 0;

            properties.forEach((property) => {
                let value;
                switch (property.type) {
                    case "float":
                        value = dataView.getFloat32(property.offset + i * rowOffset, true);
                        break;
                    case "int":
                        value = dataView.getInt32(property.offset + i * rowOffset, true);
                        break;
                    default:
                        throw new Error(`Unsupported property type: ${property.type}`);
                }

                switch (property.name) {
                    case "x":
                        position[0] = value;
                        break;
                    case "y":
                        position[1] = value;
                        break;
                    case "z":
                        position[2] = value;
                        break;
                    case "scale_0":
                    case "scaling_0":
                        scale[0] = Math.exp(value);
                        break;
                    case "scale_1":
                    case "scaling_1":
                        scale[1] = Math.exp(value);
                        break;
                    case "scale_2":
                    case "scaling_2":
                        scale[2] = Math.exp(value);
                        break;
                    case "red":
                        rgba[0] = value;
                        break;
                    case "green":
                        rgba[1] = value;
                        break;
                    case "blue":
                        rgba[2] = value;
                        break;
                    case "f_dc_0":
                    case "features_0":
                        rgba[0] = (0.5 + Converter.SH_C0 * value) * 255;
                        break;
                    case "f_dc_1":
                    case "features_1":
                        rgba[1] = (0.5 + Converter.SH_C0 * value) * 255;
                        break;
                    case "f_dc_2":
                    case "features_2":
                        rgba[2] = (0.5 + Converter.SH_C0 * value) * 255;
                        break;
                    case "f_dc_3":
                        rgba[3] = (0.5 + Converter.SH_C0 * value) * 255;
                        break;
                    case "opacity":
                    case "opacity_0":
                        rgba[3] = (1 / (1 + Math.exp(-value))) * 255;
                        break;
                    case "rot_0":
                    case "rotation_0":
                        r0 = value;
                        break;
                    case "rot_1":
                    case "rotation_1":
                        r1 = value;
                        break;
                    case "rot_2":
                    case "rotation_2":
                        r2 = value;
                        break;
                    case "rot_3":
                    case "rotation_3":
                        r3 = value;
                        break;
                }
            });

            let q = new Quaternion(r1, r2, r3, r0);

            switch (format) {
                case "polycam": {
                    const temp = position[1];
                    position[1] = -position[2];
                    position[2] = temp;
                    q = q_polycam.multiply(q);
                    break;
                }
                case "":
                    break;
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }

            q = q.normalize();
            rot[0] = q.w * 128 + 128;
            rot[1] = q.x * 128 + 128;
            rot[2] = q.y * 128 + 128;
            rot[3] = q.z * 128 + 128;
        }

        return buffer;
    }
}

export { PLYLoader };
