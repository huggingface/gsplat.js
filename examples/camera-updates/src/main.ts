import * as SPLAT from "gsplat";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const progressDialog = document.getElementById("progress-dialog") as HTMLDialogElement;
const progressIndicator = document.getElementById("progress-indicator") as HTMLProgressElement;

const renderer = new SPLAT.WebGLRenderer(canvas);
const scene = new SPLAT.Scene();
const camera = new SPLAT.Camera();
const controls = new SPLAT.OrbitControls(camera, canvas);

async function main() {
    const url = "https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/bonsai/bonsai-7k.splat";
    await SPLAT.Loader.LoadAsync(url, scene, (progress) => (progressIndicator.value = progress * 100));
    progressDialog.close();

    const handleResize = () => {
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };

    const frame = () => {
        controls.update();
        renderer.render(scene, camera);

        requestAnimationFrame(frame);
    };

    const onKeyDown = (event: KeyboardEvent) => {
        let translation = new SPLAT.Vector3();
        if (event.key === "j") {
            translation = translation.add(new SPLAT.Vector3(-1, 0, 0));
        }
        if (event.key === "l") {
            translation = translation.add(new SPLAT.Vector3(1, 0, 0));
        }
        if (event.key === "i") {
            translation = translation.add(new SPLAT.Vector3(0, 0, 1));
        }
        if (event.key === "k") {
            translation = translation.add(new SPLAT.Vector3(0, 0, -1));
        }
        camera.position = camera.position.add(translation);

        if (event.key === " ") {
            camera.position = new SPLAT.Vector3();
            camera.rotation = new SPLAT.Quaternion();
        }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", onKeyDown);

    requestAnimationFrame(frame);
}

main();
