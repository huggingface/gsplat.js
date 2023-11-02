import * as SPLAT from "gsplat";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const renderer = new SPLAT.WebGLRenderer(canvas);
const scene = new SPLAT.Scene();
const camera = new SPLAT.Camera();
const controls = new SPLAT.OrbitControls(camera, canvas);

const url = "https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/bicycle/bicycle-7k.splat";

await SPLAT.Loader.LoadAsync(url, scene, (progress: number) => {
    console.log(`Loading: ${progress}`);
});

const frame = () => {
    controls.update();
    renderer.render(scene, camera);

    requestAnimationFrame(frame);
};

requestAnimationFrame(frame);
