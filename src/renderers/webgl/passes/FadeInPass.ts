import { WebGLRenderer } from "../../WebGLRenderer";
import { ShaderPass } from "./ShaderPass";

class FadeInPass implements ShaderPass {
    init: (renderer: WebGLRenderer, program: WebGLProgram) => void;
    render: () => void;

    constructor(speed: number = 1.0) {
        let value = 0.0;
        let active = false;

        let activeRenderer: WebGLRenderer;
        let u_useDepthFade: WebGLUniformLocation;
        let u_depthFade: WebGLUniformLocation;

        this.init = (renderer: WebGLRenderer, program: WebGLProgram) => {
            value = 0;
            active = true;
            activeRenderer = renderer;

            u_useDepthFade = renderer.gl.getUniformLocation(program, "u_useDepthFade") as WebGLUniformLocation;
            activeRenderer.gl.uniform1i(u_useDepthFade, 1);

            u_depthFade = renderer.gl.getUniformLocation(program, "u_depthFade") as WebGLUniformLocation;
            activeRenderer.gl.uniform1f(u_depthFade, value);
        };

        this.render = () => {
            if (!active) return;
            value = Math.min(value + speed * 0.01, 1.0);
            if (value >= 1.0) {
                active = false;
                activeRenderer.gl.uniform1i(u_useDepthFade, 0);
            }
            activeRenderer.gl.uniform1f(u_depthFade, value);
        };
    }
}

export { FadeInPass };
