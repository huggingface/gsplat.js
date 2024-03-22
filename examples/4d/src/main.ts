import * as SPLAT from "gsplat";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const progressDialog = document.getElementById("progress-dialog") as HTMLDialogElement;
const progressIndicator = document.getElementById("progress-indicator") as HTMLProgressElement;

const renderer = new SPLAT.WebGLRenderer(canvas);
renderer.addProgram(new SPLAT.VideoRenderProgram(renderer));

const scene = new SPLAT.Scene();
const camera = new SPLAT.Camera();
const controls = new SPLAT.OrbitControls(camera, canvas);

async function loadSplatv(url: string) {
    const req = await fetch(url, {
        mode: "cors",
        credentials: "omit",
    });

    if (req.status != 200) {
        throw new Error(req.status + " Unable to load " + req.url);
    }

    const handleChunk = (
        chunk: { size: number; type: string; texwidth: number; texheight: number },
        buffer: Uint8Array,
        chunks: { size: number; type: string }[],
        remaining: number,
    ) => {
        if (!remaining && chunk.type === "magic") {
            const intView = new Int32Array(buffer.buffer);
            if (intView[0] !== 0x674b) {
                throw new Error("Invalid splatv file");
            }
            chunks.push({ size: intView[1], type: "chunks" });
        } else if (!remaining && chunk.type === "chunks") {
            for (const chunk of JSON.parse(new TextDecoder("utf-8").decode(buffer))) {
                const cameras = chunk.cameras as { position: number[]; rotation: number[][] }[];
                if (cameras && cameras.length) {
                    const cameraData = cameras[0];
                    const position = new SPLAT.Vector3(
                        cameraData.position[0],
                        cameraData.position[1],
                        cameraData.position[2],
                    );
                    const rotation = SPLAT.Quaternion.FromMatrix3(
                        new SPLAT.Matrix3(
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
                    controls.setCameraTarget(camera.position.add(camera.forward.multiply(camera.position.magnitude())));
                }
                chunks.push(chunk);
            }
        } else if (chunk.type === "splat") {
            if (remaining) {
                progressIndicator.value = 100 - (100 * remaining) / chunk.size;
            } else {
                const data = SPLAT.SplatvData.Deserialize(buffer, chunk.texwidth, chunk.texheight);
                const splatv = new SPLAT.Splatv(data);
                scene.addObject(splatv);
            }
        }
    };

    const reader = req.body!.getReader();

    const chunks: { size: number; type: string; texwidth: number; texheight: number }[] = [
        { size: 8, type: "magic", texwidth: 0, texheight: 0 },
    ];
    let chunk: { size: number; type: string; texwidth: number; texheight: number } | undefined = chunks.shift();
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
    await loadSplatv(url);
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
