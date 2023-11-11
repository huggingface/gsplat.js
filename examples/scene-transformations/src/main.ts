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
    const url = `https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/${name}/${name}-7k.splat`;
    await SPLAT.Loader.LoadAsync(url, scene, (progress) => (progressIndicator.value = progress * 100));
    progressDialog.close();

    // Transform it
    const rotation = new SPLAT.Vector3(0, 0, 0);
    const translation = new SPLAT.Vector3(-0.2, 0.2, 0);
    const scaling = new SPLAT.Vector3(1.5, 1.5, 1.5);
    const limitSize = 3.0;
    scene.rotate(SPLAT.Quaternion.FromEuler(rotation));
    scene.translate(translation);
    scene.scale(scaling);
    scene.limitBox(-limitSize, limitSize, -limitSize, limitSize, -limitSize, limitSize);

    const handleResize = () => {
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };

    const frame = () => {
        controls.update();
        renderer.render(scene, camera);

        requestAnimationFrame(frame);
    };

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "PageUp") {
            scene.scale(new SPLAT.Vector3(1.1, 1.1, 1.1));
        } else if (e.key === "PageDown") {
            scene.scale(new SPLAT.Vector3(0.9, 0.9, 0.9));
        }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", onKeyDown);

    requestAnimationFrame(frame);
}

main();
