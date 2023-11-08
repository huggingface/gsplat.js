# gsplat.js

#### JavaScript Gaussian Splatting library

gsplat.js is an easy-to-use, general-purpose, open-source 3D Gaussian Splatting library, providing functionality similar to [three.js](https://github.com/mrdoob/three.js) but for Gaussian Splatting.

### Quick Start

-   **Live Viewer Demo:** Explore this library in action in the 🤗 [Hugging Face demo](https://huggingface.co/spaces/dylanebert/igf). Note: May not work on all devices; use `Bonsai` for the lowest memory requirements.
-   **Code Example:** Start coding immediately with this [jsfiddle example](https://jsfiddle.net/wkex8huc/2/) example.

### Installation

**Prerequisites**: Ensure your development environment supports ES6 modules.

1. **Set Up a Project:** (If not already set up)

    Install [Node.js](https://nodejs.org/en/download/) and [NPM](https://www.npmjs.com/get-npm), then initialize a new project using a module bundler like [Vite](https://vitejs.dev/):

    ```bash
    npm create vite@latest gsplat -- --template vanilla-ts
    ```

2. **Test Your Environment:**

    ```bash
    cd gsplat
    npm install
    npm run dev
    ```

3. **Install gsplat.js:**

    ```bash
    npm install --save gsplat
    ```

### Usage

#### Creating a Scene

-   Import **gsplat.js** components and set up a basic scene.
-   Load Gaussian Splatting data and start a rendering loop.

(in `src/main.ts` if you followed the Vite setup)

```js
import * as SPLAT from "gsplat";

const scene = new SPLAT.Scene();
const camera = new SPLAT.Camera();
const renderer = new SPLAT.WebGLRenderer();
const controls = new SPLAT.OrbitControls(camera, renderer.domElement);

async function main() {
    const url = "https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/bonsai/bonsai-7k.splat";

    await SPLAT.Loader.LoadAsync(url, scene, () => {});

    const frame = () => {
        controls.update();
        renderer.render(scene, camera);

        requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
}

main();
```

This script sets up a basic scene with Gaussian Splatting data loaded from URL and starts a rendering loop.

### FAQ

**Q: Can I use .ply files?**

A: Yes, gsplat.js supports `.ply` files. See the [ply-converter example](https://github.com/dylanebert/gsplat.js/blob/main/examples/ply-converter/src/main.ts) for details on how to convert `.ply` to `.splat`. Alternatively, convert PLY files from URL in this [jsfiddle example](https://jsfiddle.net/d8ebst19/5/).

**Q: What are .splat files?**

A: `.splat` files are a compact form of the splat data, offering quicker loading times than `.ply` files. They consist of a raw Uint8Array buffer.

### License

This project is released under the MIT license. It is built upon several other open-source projects:

-   [three.js](https://github.com/mrdoob/three.js), MIT License (c) 2010-2023 three.js authors
-   [antimatter15/splat](https://github.com/antimatter15/splat), MIT License (c) 2023 Kevin Kwok
-   [UnityGaussianSplatting](https://github.com/aras-p/UnityGaussianSplatting), MIT License (c) 2023 Aras Pranckevičius

Please note that the license of the original [3D Gaussian Splatting](https://github.com/graphdeco-inria/gaussian-splatting) research project is non-commercial. While this library provides an open-source rendering implementation, users should consider the source of the splat data separately.

### Contact

Feel free to open issues, join the [Hugging Face Discord](https://hf.co/join/discord), or email me directly at [dylan@huggingface.co](mailto:dylan@huggingface.co).
