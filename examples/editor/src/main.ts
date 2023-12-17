import * as SPLAT from "gsplat";
import { Engine } from "./Engine";
import { SelectionManager } from "./SelectionManager";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const progressDialog = document.getElementById("progress-dialog") as HTMLDialogElement;
const progressIndicator = document.getElementById("progress-indicator") as HTMLProgressElement;
const downloadButton = document.getElementById("download-button") as HTMLButtonElement;

const engine = new Engine(canvas);

let loading = false;
async function selectFile(file: File) {
    if (loading) return;
    SelectionManager.selectedSplat = null;
    loading = true;
    // Check if .splat file
    if (file.name.endsWith(".splat")) {
        await SPLAT.Loader.LoadFromFileAsync(file, engine.scene, (progress: number) => {
            console.log("Loading SPLAT file: " + progress);
        });
    } else if (file.name.endsWith(".ply")) {
        const format = "";
        // const format = "polycam"; // Uncomment to load a Polycam PLY file
        await SPLAT.PLYLoader.LoadFromFileAsync(
            file,
            engine.scene,
            (progress: number) => {
                console.log("Loading PLY file: " + progress);
            },
            format,
        );
    }
    loading = false;
}

async function main() {
    const url = "https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/bonsai/bonsai-7k-mini.splat";
    await SPLAT.Loader.LoadAsync(url, engine.scene, (progress) => (progressIndicator.value = progress * 100));
    progressDialog.close();
    engine.renderer.backgroundColor = new SPLAT.Color32(64, 64, 64, 255);

    const handleResize = () => {
        engine.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };

    const frame = () => {
        engine.update();

        requestAnimationFrame(frame);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    requestAnimationFrame(frame);

    document.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer != null) {
            selectFile(e.dataTransfer.files[0]);
        }
    });

    downloadButton.addEventListener("click", () => {
        if (SelectionManager.selectedSplat !== null) {
            SelectionManager.selectedSplat.saveToFile();
        } else {
            engine.scene.saveToFile();
        }
    });
}

main();
