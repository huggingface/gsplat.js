import * as SPLAT from "gsplat";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const progressDialog = document.getElementById("progress-dialog") as HTMLDialogElement;
const progressIndicator = document.getElementById("progress-indicator") as HTMLProgressElement;

const renderer = new SPLAT.WebGLRenderer(canvas);
const scene = new SPLAT.Scene();
const camera = new SPLAT.Camera();
const controls = new SPLAT.OrbitControls(camera, canvas, 0.5, 0.5, 5);

function saveToFile(data: Uint8Array, name: string) {
    const blob = new Blob([data.buffer], { type: "application/octet-stream" });
    const link = document.createElement("a");
    link.download = name;
    link.href = URL.createObjectURL(blob);
    link.click();
}

async function main() {
    // Load the scene
    const name = "bonsai";
    const url = `https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/${name}/${name}-7k-raw.splat`;
    await SPLAT.Loader.LoadAsync(url, scene, (progress) => progressIndicator.value = progress * 100);
    progressDialog.close();

    // Transform it
    const rotation = new SPLAT.Vector3(-0.5, 0, 0);
    const translation = new SPLAT.Vector3(0, -1.5, 0);
    scene.rotate(SPLAT.Quaternion.FromEuler(rotation));
    scene.translate(translation);

    // Save it to file
    saveToFile(scene.data, `${name}-7k.splat`);

    // Append white disc to help with orientation
    const buffer = new ArrayBuffer(32);
    const position = new Float32Array(buffer, 0, 3);
    const scales = new Float32Array(buffer, 12, 3);
    const rgba = new Uint8ClampedArray(buffer, 24, 4);
    const rot = new Uint8ClampedArray(buffer, 28, 4);
    position[0] = 0;
    position[1] = 0;
    position[2] = 0;
    scales[0] = 1;
    scales[1] = 0.01;
    scales[2] = 1;
    rgba[0] = 255;
    rgba[1] = 255;
    rgba[2] = 255;
    rgba[3] = 255;
    rot[0] = 255;
    rot[1] = 128;
    rot[2] = 128;
    rot[3] = 128;
    const newData = new Uint8Array(scene.data.length + buffer.byteLength);
    newData.set(scene.data);
    newData.set(new Uint8Array(buffer), scene.data.length);
    scene.setData(newData);

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
