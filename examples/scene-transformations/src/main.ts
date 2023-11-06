import * as SPLAT from "gsplat";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

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
    const url = "https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/bonsai/bonsai-7k.splat";
    await SPLAT.Loader.LoadAsync(url, scene, () => {});

    // Transform it
    scene.rotate(SPLAT.Quaternion.FromEuler(new SPLAT.Vector3(-0.7, 2.3, 0)));
    scene.translate(new SPLAT.Vector3(0, -2, 0));

    // Save it to file
    saveToFile(scene.data, "bonsai-7k-transformed.splat");

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
