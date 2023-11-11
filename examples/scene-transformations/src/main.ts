import * as SPLAT from "gsplat";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const progressDialog = document.getElementById("progress-dialog") as HTMLDialogElement;
const progressIndicator = document.getElementById("progress-indicator") as HTMLProgressElement;

const renderer = new SPLAT.WebGLRenderer(canvas);
const scene = new SPLAT.Scene();
const camera = new SPLAT.Camera();
const controls = new SPLAT.OrbitControls(camera, canvas, 0.5, 0.5, 5);

async function main() {
    // Load the scene
    const name = "bonsai";
    const url = `https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/${name}/${name}-7k-raw.splat`;
    await SPLAT.Loader.LoadAsync(url, scene, (progress) => (progressIndicator.value = progress * 100));
    progressDialog.close();

    // Transform it
    const rotation = new SPLAT.Vector3(-0.5, 0, 0);
    const translation = new SPLAT.Vector3(0, -1.5, 0);
    scene.rotate(SPLAT.Quaternion.FromEuler(rotation));
    scene.translate(translation);

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
