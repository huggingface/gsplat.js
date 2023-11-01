"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.frag = void 0;
exports.frag = `
precision mediump float;

varying vec4 vColor;
varying vec2 vPosition;

void main () {    
    float A = -dot(vPosition, vPosition);
    if (A < -4.0) discard;
    float B = exp(A) * vColor.a;
    gl_FragColor = vec4(B * vColor.rgb, B);
}
`;
