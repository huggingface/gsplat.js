#include <stdint.h>
#include <stdlib.h>
#include <stdio.h>

extern "C"
{
    void sort(
        float *viewProj, uint32_t vertexCount,
        float *fBuffer, uint8_t *uBuffer,
        float *center, float *color,
        float *covA, float *covB,
        uint32_t *depthBuffer, uint32_t *depthIndex,
        uint32_t *starts)
    {
        uint32_t minDepth = 0xFFFFFFFF;
        uint32_t maxDepth = 0;
        for (uint32_t i = 0; i < vertexCount; i++)
        {
            float f0 = viewProj[2] * fBuffer[8 * i + 0];
            float f1 = viewProj[6] * fBuffer[8 * i + 1];
            float f2 = viewProj[10] * fBuffer[8 * i + 2];
            float depthValue = f0 + f1 + f2;
            uint32_t depth = static_cast<uint32_t>(depthValue * 4096);
            depthBuffer[i] = depth;
            if (depth > maxDepth)
            {
                maxDepth = depth;
            }
            if (depth < minDepth)
            {
                minDepth = depth;
            }
        }

        const uint32_t depthRange = 256 * 256;
        const float depthInv = (float)depthRange / (maxDepth - minDepth);
        uint32_t *counts = (uint32_t *)calloc(depthRange, sizeof(uint32_t));
        for (uint32_t i = 0; i < vertexCount; i++)
        {
            depthBuffer[i] = (depthBuffer[i] - minDepth) * depthInv;
            counts[depthBuffer[i]]++;
        }

        starts[0] = 0;
        for (uint32_t i = 1; i < depthRange; i++)
        {
            starts[i] = starts[i - 1] + counts[i - 1];
        }

        for (uint32_t i = 0; i < vertexCount; i++)
        {
            depthIndex[starts[depthBuffer[i]]++] = i;
        }

        free(counts);

        const float inv255 = 1 / 255.0f;
        const float inv128 = 1 / 128.0f;
        for (int j = 0; j < vertexCount; j++)
        {
            const int i = depthIndex[j];
            const float *f_ptr = &fBuffer[8 * i];
            const uint8_t *u_ptr = &uBuffer[32 * i];

            float f0 = f_ptr[0], f1 = f_ptr[1], f2 = f_ptr[2];
            float s0 = f_ptr[3], s1 = f_ptr[4], s2 = f_ptr[5];
            float u24 = u_ptr[24], u25 = u_ptr[25], u26 = u_ptr[26], u27 = u_ptr[27];
            float u28 = u_ptr[28], u29 = u_ptr[29], u30 = u_ptr[30], u31 = u_ptr[31];

            center[3 * j + 0] = f0;
            center[3 * j + 1] = f1;
            center[3 * j + 2] = f2;

            color[4 * j + 0] = u24 * inv255;
            color[4 * j + 1] = u25 * inv255;
            color[4 * j + 2] = u26 * inv255;
            color[4 * j + 3] = u27 * inv255;

            float r0 = (u28 - 128.0f) * inv128;
            float r1 = (u29 - 128.0f) * inv128;
            float r2 = (u30 - 128.0f) * inv128;
            float r3 = (u31 - 128.0f) * inv128;

            float R0 = 1.0f - 2.0f * (r2 * r2 + r3 * r3);
            float R1 = 2.0f * (r1 * r2 + r0 * r3);
            float R2 = 2.0f * (r1 * r3 - r0 * r2);
            float R3 = 2.0f * (r1 * r2 - r0 * r3);
            float R4 = 1.0f - 2.0f * (r1 * r1 + r3 * r3);
            float R5 = 2.0f * (r2 * r3 + r0 * r1);
            float R6 = 2.0f * (r1 * r3 + r0 * r2);
            float R7 = 2.0f * (r2 * r3 - r0 * r1);
            float R8 = 1.0f - 2.0f * (r1 * r1 + r2 * r2);

            float M0 = s0 * R0;
            float M1 = s0 * R1;
            float M2 = s0 * R2;
            float M3 = s1 * R3;
            float M4 = s1 * R4;
            float M5 = s1 * R5;
            float M6 = s2 * R6;
            float M7 = s2 * R7;
            float M8 = s2 * R8;

            covA[3 * j + 0] = M0 * M0 + M3 * M3 + M6 * M6;
            covA[3 * j + 1] = M0 * M1 + M3 * M4 + M6 * M7;
            covA[3 * j + 2] = M0 * M2 + M3 * M5 + M6 * M8;
            covB[3 * j + 0] = M1 * M1 + M4 * M4 + M7 * M7;
            covB[3 * j + 1] = M1 * M2 + M4 * M5 + M7 * M8;
            covB[3 * j + 2] = M2 * M2 + M5 * M5 + M8 * M8;
        }
    }
}
