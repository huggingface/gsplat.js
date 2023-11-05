import * as SPLAT from "gsplat";

const renderer = new SPLAT.WebGLRenderer();
const scene = new SPLAT.Scene();
const camera = new SPLAT.Camera();
const controls = new SPLAT.OrbitControls(camera, renderer.domElement);

function saveToFile(data: Uint8Array, name: string) {
    const blob = new Blob([data.buffer], { type: "application/octet-stream" });
    const link = document.createElement("a");
    link.download = name;
    link.href = URL.createObjectURL(blob);
    link.click();
}

async function convertPLYToSPLAT(url: string) {
    // Load PLY file into scene
    await SPLAT.PLYLoader.LoadAsync(url, scene, (progress) => {
        console.log("Loading ply file: " + progress);
    });

    // Scene.data is in SPLAT format
    return scene.data;
}

async function main() {
    // Load and convert ply from url
    const url =
        "https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/bicycle/point_cloud/iteration_7000/point_cloud.ply";
    const data = await convertPLYToSPLAT(url);
    saveToFile(data, "bicycle.splat");

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
        await SPLAT.PLYLoader.LoadFromFileAsync(file, scene, (progress: number) => {
            console.log("Loading PLY file: " + progress);
        });
        saveToFile(scene.data, file.name.replace(".ply", ".splat"));
        loading = false;
    };

    document.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (
            e.dataTransfer != null &&
            e.dataTransfer.files.length > 0 &&
            e.dataTransfer.files[0].name.endsWith(".ply")
        ) {
            selectFile(e.dataTransfer.files[0]);
        }
    });
}

main();
