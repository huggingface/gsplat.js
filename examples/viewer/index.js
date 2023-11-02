import * as SPLAT from "https://cdn.jsdelivr.net/npm/gsplat@latest";

const canvas = document.getElementById("canvas");
const renderer = new SPLAT.Renderer(canvas);
const scene = new SPLAT.Scene();
const camera = new SPLAT.Camera();
const controls = new SPLAT.Controls(camera, canvas);

const url = "https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/bicycle/bicycle-7k.splat";

await SPLAT.Loader.LoadAsync(url, scene, (progress) => {
    console.log(`Loading: ${progress.loaded}/${progress.total}`);
});

const frame = () => {
    controls.update();
    renderer.render(scene, camera);

    requestAnimationFrame(frame);
};

requestAnimationFrame(frame);
