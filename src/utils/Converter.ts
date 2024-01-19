import { Quaternion } from "../math/Quaternion";

class Converter {
    public static SH_C0 = 0.28209479177387814;

    public static SplatToPLY(buffer: ArrayBuffer, vertexCount: number): ArrayBuffer {
        let header = "ply\nformat binary_little_endian 1.0\n";
        header += `element vertex ${vertexCount}\n`;

        const properties = ["x", "y", "z", "nx", "ny", "nz", "f_dc_0", "f_dc_1", "f_dc_2"];
        for (let i = 0; i < 45; i++) {
            properties.push(`f_rest_${i}`);
        }
        properties.push("opacity");
        properties.push("scale_0");
        properties.push("scale_1");
        properties.push("scale_2");
        properties.push("rot_0");
        properties.push("rot_1");
        properties.push("rot_2");
        properties.push("rot_3");

        for (const property of properties) {
            header += `property float ${property}\n`;
        }
        header += "end_header\n";

        const headerBuffer = new TextEncoder().encode(header);

        const plyRowLength = 4 * 3 + 4 * 3 + 4 * 3 + 4 * 45 + 4 + 4 * 3 + 4 * 4;
        const plyLength = vertexCount * plyRowLength;
        const output = new DataView(new ArrayBuffer(headerBuffer.length + plyLength));
        new Uint8Array(output.buffer).set(headerBuffer, 0);

        const f_buffer = new Float32Array(buffer);
        const u_buffer = new Uint8Array(buffer);

        const offset = headerBuffer.length;
        const f_dc_offset = 4 * 3 + 4 * 3;
        const opacity_offset = f_dc_offset + 4 * 3 + 4 * 45;
        const scale_offset = opacity_offset + 4;
        const rot_offset = scale_offset + 4 * 3;
        for (let i = 0; i < vertexCount; i++) {
            const pos0 = f_buffer[8 * i + 0];
            const pos1 = f_buffer[8 * i + 1];
            const pos2 = f_buffer[8 * i + 2];

            const f_dc_0 = (u_buffer[32 * i + 24 + 0] / 255 - 0.5) / this.SH_C0;
            const f_dc_1 = (u_buffer[32 * i + 24 + 1] / 255 - 0.5) / this.SH_C0;
            const f_dc_2 = (u_buffer[32 * i + 24 + 2] / 255 - 0.5) / this.SH_C0;

            const alpha = u_buffer[32 * i + 24 + 3] / 255;
            const opacity = Math.log(alpha / (1 - alpha));

            const scale0 = Math.log(f_buffer[8 * i + 3 + 0]);
            const scale1 = Math.log(f_buffer[8 * i + 3 + 1]);
            const scale2 = Math.log(f_buffer[8 * i + 3 + 2]);

            let q = new Quaternion(
                (u_buffer[32 * i + 28 + 1] - 128) / 128,
                (u_buffer[32 * i + 28 + 2] - 128) / 128,
                (u_buffer[32 * i + 28 + 3] - 128) / 128,
                (u_buffer[32 * i + 28 + 0] - 128) / 128,
            );
            q = q.normalize();

            const rot0 = q.w;
            const rot1 = q.x;
            const rot2 = q.y;
            const rot3 = q.z;

            output.setFloat32(offset + plyRowLength * i + 0, pos0, true);
            output.setFloat32(offset + plyRowLength * i + 4, pos1, true);
            output.setFloat32(offset + plyRowLength * i + 8, pos2, true);

            output.setFloat32(offset + plyRowLength * i + f_dc_offset + 0, f_dc_0, true);
            output.setFloat32(offset + plyRowLength * i + f_dc_offset + 4, f_dc_1, true);
            output.setFloat32(offset + plyRowLength * i + f_dc_offset + 8, f_dc_2, true);

            output.setFloat32(offset + plyRowLength * i + opacity_offset, opacity, true);

            output.setFloat32(offset + plyRowLength * i + scale_offset + 0, scale0, true);
            output.setFloat32(offset + plyRowLength * i + scale_offset + 4, scale1, true);
            output.setFloat32(offset + plyRowLength * i + scale_offset + 8, scale2, true);

            output.setFloat32(offset + plyRowLength * i + rot_offset + 0, rot0, true);
            output.setFloat32(offset + plyRowLength * i + rot_offset + 4, rot1, true);
            output.setFloat32(offset + plyRowLength * i + rot_offset + 8, rot2, true);
            output.setFloat32(offset + plyRowLength * i + rot_offset + 12, rot3, true);
        }

        return output.buffer;
    }
}

export { Converter };
