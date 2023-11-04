# gsplat.js

#### JavaScript Gaussian Splatting library

gsplat.js is an easy-to-use, general-purpose, open-source 3D Gaussian Splatting library, providing functionality similar to [three.js](https://github.com/mrdoob/three.js) but for Gaussian Splatting.

### Installation

#### Configure Development Environment

> ⚠️ Skip this step if you already have a development environment capable of importing ES6 modules.

1. Install [Node.js](https://nodejs.org/en/download/) and [NPM](https://www.npmjs.com/get-npm).
2. Create a new [Vite](https://vitejs.dev/) project, or your preferred ES6 module bundler.

```
npm create vite@latest
```

When asked, select `vanilla` as the framework and `typescript` as the language.

3. Validate that your development environment is working by running the following commands:

```
cd <your-project-name>
npm install
npm run dev
```

If everything is working, you should see a "Hello, Vite!" message at `http://localhost:5173` or the printed address in your terminal.

#### Install with NPM

1. Install gsplat.js using NPM.

```
npm install --save-dev gsplat
```

### Usage

#### Creating a Scene

This code creates a scene, camera, and renderer, and loads splatting data from a URL.

main.ts --
```

```

### Examples

### Contributing

🚧 Under Construction

### License

This project is released under the MIT license. It is built upon several other open-source projects:

-   [three.js](https://github.com/mrdoob/three.js), MIT License (c) 2010-2023 three.js authors
-   [antimatter15/splat](https://github.com/antimatter15/splat), MIT License (c) 2023 Kevin Kwok
-   [UnityGaussianSplatting](https://github.com/aras-p/UnityGaussianSplatting), MIT License (c) 2023 Aras Pranckevičius

Please note that the license of the original [3D Gaussian Splatting](https://github.com/graphdeco-inria/gaussian-splatting) research project is non-commercial. While this library provides an open-source rendering implementation, users should separately consider where the Splat data comes from.

### Contact

Feel free to open issues, join the [Hugging Face Discord](https://hf.co/join/discord), or email me directly at [dylan@huggingface.co](mailto:dylan@huggingface.co).
