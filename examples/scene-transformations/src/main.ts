import * as SPLAT from "gsplat";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

const renderer = new SPLAT.WebGLRenderer(canvas);
const scene = new SPLAT.Scene();
const camera = new SPLAT.Camera();
const controls = new SPLAT.OrbitControls(camera, canvas);

async function main() {
    const url = "https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/bonsai/bonsai-7k.splat";
    await SPLAT.Loader.LoadAsync(url, scene, () => {});

    scene.rotate(SPLAT.Quaternion.FromEuler(new SPLAT.Vector3(-3.5, 0, -0.8)));
    scene.translate(new SPLAT.Vector3(0.2, -1.5, 0));

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
