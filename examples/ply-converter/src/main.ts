import * as SPLAT from "gsplat";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const progressDialog = document.getElementById("progress-dialog") as HTMLDialogElement;
const progressIndicator = document.getElementById("progress-indicator") as HTMLProgressElement;

const renderer = new SPLAT.WebGLRenderer(canvas);
const scene = new SPLAT.Scene();
const camera = new SPLAT.Camera();
const controls = new SPLAT.OrbitControls(camera, canvas);

const format = "";
// const format = "polycam"; // Uncomment to use polycam format

async function main() {
    // Load and convert ply from url
    const url =
        "https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/bonsai/point_cloud/iteration_7000/point_cloud.ply";
    await SPLAT.PLYLoader.LoadAsync(url, scene, (progress) => (progressIndicator.value = progress * 100), format);
    progressDialog.close();
    scene.saveToFile("bonsai.splat");

    // Alternatively, uncomment below to convert from splat to ply
    // NOTE: Data like SH coefficients will be lost when converting ply -> splat -> ply
    /* const url = "https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/bonsai/bonsai-7k-mini.splat";
    await SPLAT.Loader.LoadAsync(url, scene, (progress) => (progressIndicator.value = progress * 100));
    progressDialog.close();
    scene.saveToFile("bonsai-7k-mini.ply", "ply"); */

    // Render loop
    const frame = () => {
        controls.update();
        renderer.render(scene, camera);

        requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);

    // Alternatively, load and convert ply from file
    let loading = false;
    const selectFile = async (file: File) => {
        if (loading) return;
        loading = true;
        if (file.name.endsWith(".splat")) {
            await SPLAT.Loader.LoadFromFileAsync(file, scene, (progress: number) => {
                progressIndicator.value = progress * 100;
            });
        } else if (file.name.endsWith(".ply")) {
            await SPLAT.PLYLoader.LoadFromFileAsync(
                file,
                scene,
                (progress: number) => {
                    progressIndicator.value = progress * 100;
                },
                format,
            );
        }
        scene.saveToFile(file.name.replace(".ply", ".splat"));
        loading = false;
    };

    document.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer != null && e.dataTransfer.files.length > 0) {
            selectFile(e.dataTransfer.files[0]);
        }
    });
}

main();
