import { RenderProgram } from "../programs/RenderProgram";
import { ShaderProgram } from "../programs/ShaderProgram";
import { ShaderPass } from "./ShaderPass";

class FadeInPass implements ShaderPass {
    initialize: (program: ShaderProgram) => void;
    render: () => void;

    constructor(speed: number = 1.0) {
        let value = 0.0;
        let active = false;

        let renderProgram: RenderProgram;
        let gl: WebGL2RenderingContext;
        let u_useDepthFade: WebGLUniformLocation;
        let u_depthFade: WebGLUniformLocation;

        this.initialize = (program: ShaderProgram) => {
            if (!(program instanceof RenderProgram)) {
                throw new Error("FadeInPass requires a RenderProgram");
            }

            value = program.started ? 1.0 : 0.0;
            active = true;
            renderProgram = program;
            gl = program.renderer.gl;

            u_useDepthFade = gl.getUniformLocation(renderProgram.program, "useDepthFade") as WebGLUniformLocation;
            gl.uniform1i(u_useDepthFade, 1);

            u_depthFade = gl.getUniformLocation(renderProgram.program, "depthFade") as WebGLUniformLocation;
            gl.uniform1f(u_depthFade, value);
        };

        this.render = () => {
            if (!active || renderProgram.renderData?.updating) return;
            gl.useProgram(renderProgram.program);
            value = Math.min(value + speed * 0.01, 1.0);
            if (value >= 1.0) {
                active = false;
                gl.uniform1i(u_useDepthFade, 0);
            }
            gl.uniform1f(u_depthFade, value);
        };
    }

    dispose() {}
}

export { FadeInPass };
