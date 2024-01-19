import { Quaternion } from "../math/Quaternion";

class Converter {
    public static SH_C0 = 0.28209479177387814;

    public static SplatToPLY(buffer: ArrayBuffer, vertexCount: number): ArrayBuffer {
        let header = "ply\nformat binary_little_endian 1.0\n";
        header += `element vertex ${vertexCount}\n`;
        header += "property float x\nproperty float y\nproperty float z\n";
        header += "property float scale_0\nproperty float scale_1\nproperty float scale_2\n";
        header += "property float f_dc_0\nproperty float f_dc_1\nproperty float f_dc_2\n";
        header += "property float opacity\n";
        header += "property float rot_0\nproperty float rot_1\nproperty float rot_2\nproperty float rot_3\n";
        header += "end_header\n";

        const headerBuffer = new TextEncoder().encode(header);

        const plyRowLength = 3 * 4 + 3 * 4 + 3 * 4 + 1 * 4 + 4 * 4;
        const plyLength = vertexCount * plyRowLength;
        const output = new DataView(new ArrayBuffer(headerBuffer.length + plyLength));
        new Uint8Array(output.buffer).set(headerBuffer, 0);

        const f_buffer = new Float32Array(buffer);
        const u_buffer = new Uint8Array(buffer);

        const offset = headerBuffer.length;
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

            output.setFloat32(offset + plyRowLength * i + 12, scale0, true);
            output.setFloat32(offset + plyRowLength * i + 16, scale1, true);
            output.setFloat32(offset + plyRowLength * i + 20, scale2, true);

            output.setFloat32(offset + plyRowLength * i + 24, f_dc_0, true);
            output.setFloat32(offset + plyRowLength * i + 28, f_dc_1, true);
            output.setFloat32(offset + plyRowLength * i + 32, f_dc_2, true);

            output.setFloat32(offset + plyRowLength * i + 36, opacity, true);

            output.setFloat32(offset + plyRowLength * i + 40, rot0, true);
            output.setFloat32(offset + plyRowLength * i + 44, rot1, true);
            output.setFloat32(offset + plyRowLength * i + 48, rot2, true);
            output.setFloat32(offset + plyRowLength * i + 52, rot3, true);
        }

        return output.buffer;
    }
}

export { Converter };
