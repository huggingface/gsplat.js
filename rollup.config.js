import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import workerLoader from "rollup-plugin-web-worker-loader";
import replace from "@rollup/plugin-replace";

export default {
    input: "src/index.ts",
    output: {
        dir: "dist",
        format: "esm",
        name: "gsplat",
        sourcemap: true,
        plugins: [terser()],
    },
    plugins: [
        replace({
            "import.meta.url": "''",
            preventAssignment: true,
        }),
        workerLoader({ targetPlatform: "browser" }),
        resolve({ browser: true, preferBuiltins: false }),
        commonjs(),
        typescript(),
    ],
};
