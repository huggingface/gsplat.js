import * as SPLAT from "gsplat";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const progressDialog = document.getElementById("progress-dialog") as HTMLDialogElement;
const progressIndicator = document.getElementById("progress-indicator") as HTMLProgressElement;

const renderer = new SPLAT.WebGLRenderer(canvas);
const scene = new SPLAT.Scene();
const camera = new SPLAT.Camera();
const controls = new SPLAT.OrbitControls(camera, canvas);

async function loadSplatV(url: string) {
    const req = await fetch(url, {
        mode: "cors",
        credentials: "omit",
    });

    if (req.status != 200) {
        throw new Error(req.status + " Unable to load " + req.url);
    }

    const halfToFloat = (half: number): number => {
        const sign = (half & 0x8000) >> 15;
        const exp = (half & 0x7c00) >> 10;
        const frac = half & 0x03ff;

        if (exp === 0) {
            return (sign ? -1 : 1) * Math.pow(2, -14) * (frac / 1024);
        } else if (exp === 0x1f) {
            return frac ? NaN : (sign ? -1 : 1) * Infinity;
        }

        return (sign ? -1 : 1) * Math.pow(2, exp - 15) * (1 + frac / 1024);
    };

    const unpackHalf2x16 = (value: number) => {
        const h1 = value & 0xffff;
        const h2 = (value >> 16) & 0xffff;
        return [halfToFloat(h1), halfToFloat(h2)];
    };

    const processSplatBuffer = (buffer: Uint32Array) => {
        const rowLength = 64;
        const vertexCount = buffer.byteLength / rowLength;
        const positions = new Float32Array(vertexCount * 3);
        const rotations = new Float32Array(vertexCount * 4);
        const scales = new Float32Array(vertexCount * 3);
        const colors = new Uint8Array(vertexCount * 4);

        const f_buffer = new Float32Array(buffer.buffer);
        const u_buffer = new Uint8Array(buffer.buffer);

        for (let i = 0; i < vertexCount; i++) {
            positions[3 * i + 0] = f_buffer[16 * i + 0];
            positions[3 * i + 1] = f_buffer[16 * i + 1];
            positions[3 * i + 2] = f_buffer[16 * i + 2];

            const rotXY = buffer[16 * i + 3]; // Half packed 2x16
            const rotZW = buffer[16 * i + 4]; // Half packed 2x16
            const scaleXY = buffer[16 * i + 5]; // Half packed 2x16
            const scaleZ_ = buffer[16 * i + 6]; // Half packed 2x16

            const [rotX, rotY] = unpackHalf2x16(rotXY);
            const [rotZ, rotW] = unpackHalf2x16(rotZW);
            const [scaleX, scaleY] = unpackHalf2x16(scaleXY);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [scaleZ, _] = unpackHalf2x16(scaleZ_);

            rotations[4 * i + 0] = rotX;
            rotations[4 * i + 1] = rotY;
            rotations[4 * i + 2] = rotZ;
            rotations[4 * i + 3] = rotW;

            scales[3 * i + 0] = scaleX;
            scales[3 * i + 1] = scaleY;
            scales[3 * i + 2] = scaleZ;

            colors[4 * i + 0] = u_buffer[64 * i + 28 + 0];
            colors[4 * i + 1] = u_buffer[64 * i + 28 + 1];
            colors[4 * i + 2] = u_buffer[64 * i + 28 + 2];
            colors[4 * i + 3] = u_buffer[64 * i + 28 + 3];
        }

        const data = new SPLAT.SplatData(vertexCount, positions, rotations, scales, colors);
        const splat = new SPLAT.Splat(data);
        scene.addObject(splat);
    };

    const handleChunk = (
        chunk: { size: number; type: string },
        buffer: Uint8Array,
        chunks: { size: number; type: string }[],
        remaining: number,
    ) => {
        if (remaining) return;

        if (chunk.type === "magic") {
            const intView = new Int32Array(buffer.buffer);
            if (intView[0] !== 0x674b) {
                throw new Error("Invalid splatv file");
            }
            chunks.push({ size: intView[1], type: "chunks" });
        } else if (chunk.type === "chunks") {
            for (const chunk of JSON.parse(new TextDecoder("utf-8").decode(buffer))) {
                chunks.push(chunk);
            }
        } else if (chunk.type === "splat") {
            processSplatBuffer(new Uint32Array(buffer.buffer));
        }
    };

    const reader = req.body!.getReader();

    const chunks: { size: number; type: string }[] = [{ size: 8, type: "magic" }];
    let chunk: { size: number; type: string } | undefined = chunks.shift();
    let buffer = new Uint8Array(chunk!.size);
    let offset = 0;
    while (chunk) {
        const { done, value: read } = await reader.read();
        if (done) break;
        let value = read as Uint8Array;
        while (value.length + offset >= chunk!.size) {
            buffer.set(value.subarray(0, chunk!.size - offset), offset);
            value = value.subarray(chunk!.size - offset);
            handleChunk(chunk!, buffer, chunks, 0);
            chunk = chunks.shift();
            if (!chunk) break;
            buffer = new Uint8Array(chunk.size);
            offset = 0;
        }
        if (!chunk) break;
        buffer.set(value, offset);
        offset += value.length;
        handleChunk(chunk, buffer, chunks, chunk.size - offset);
    }
    if (chunk) {
        handleChunk(chunk, buffer, chunks, 0);
    }
}

async function main() {
    const url = "https://huggingface.co/cakewalk/splat-data/resolve/main/flame.splatv";
    loadSplatV(url);
    // await SPLAT.Loader.LoadAsync(url, scene, (progress) => (progressIndicator.value = progress * 100));
    progressDialog.close();

    const handleResize = () => {
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };

    const frame = () => {
        controls.update();
        renderer.render(scene, camera);

        requestAnimationFrame(frame);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    requestAnimationFrame(frame);
}

main();
