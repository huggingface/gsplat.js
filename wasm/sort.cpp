#include <stdint.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>

extern "C"
{
    void sort(
        float *viewProj, float *transforms,
        uint32_t *transformIndices, uint32_t vertexCount,
        float *positions, uint8_t *chunks,
        uint32_t *depthBuffer, uint32_t *depthIndex,
        uint32_t *starts, uint32_t *counts)
    {
        int32_t minDepth = 0x7fffffff;
        int32_t maxDepth = 0x80000000;
        int32_t previousTransformIndex = -1;
        float viewTransform[16];
        for (uint32_t i = 0; i < vertexCount; i++)
        {
            float x = positions[3 * i + 0];
            float y = positions[3 * i + 1];
            float z = positions[3 * i + 2];

            uint32_t transformIndex = transformIndices[i];
            if (transformIndex != previousTransformIndex)
            {
                previousTransformIndex = transformIndex;
                float *transform = &transforms[20 * transformIndex];
                viewTransform[0] = transform[0] * viewProj[0] + transform[1] * viewProj[4] + transform[2] * viewProj[8] + transform[3] * viewProj[12];
                viewTransform[1] = transform[0] * viewProj[1] + transform[1] * viewProj[5] + transform[2] * viewProj[9] + transform[3] * viewProj[13];
                viewTransform[2] = transform[0] * viewProj[2] + transform[1] * viewProj[6] + transform[2] * viewProj[10] + transform[3] * viewProj[14];
                viewTransform[3] = transform[0] * viewProj[3] + transform[1] * viewProj[7] + transform[2] * viewProj[11] + transform[3] * viewProj[15];
                viewTransform[4] = transform[4] * viewProj[0] + transform[5] * viewProj[4] + transform[6] * viewProj[8] + transform[7] * viewProj[12];
                viewTransform[5] = transform[4] * viewProj[1] + transform[5] * viewProj[5] + transform[6] * viewProj[9] + transform[7] * viewProj[13];
                viewTransform[6] = transform[4] * viewProj[2] + transform[5] * viewProj[6] + transform[6] * viewProj[10] + transform[7] * viewProj[14];
                viewTransform[7] = transform[4] * viewProj[3] + transform[5] * viewProj[7] + transform[6] * viewProj[11] + transform[7] * viewProj[15];
                viewTransform[8] = transform[8] * viewProj[0] + transform[9] * viewProj[4] + transform[10] * viewProj[8] + transform[11] * viewProj[12];
                viewTransform[9] = transform[8] * viewProj[1] + transform[9] * viewProj[5] + transform[10] * viewProj[9] + transform[11] * viewProj[13];
                viewTransform[10] = transform[8] * viewProj[2] + transform[9] * viewProj[6] + transform[10] * viewProj[10] + transform[11] * viewProj[14];
                viewTransform[11] = transform[8] * viewProj[3] + transform[9] * viewProj[7] + transform[10] * viewProj[11] + transform[11] * viewProj[15];
                viewTransform[12] = transform[12] * viewProj[0] + transform[13] * viewProj[4] + transform[14] * viewProj[8] + transform[15] * viewProj[12];
                viewTransform[13] = transform[12] * viewProj[1] + transform[13] * viewProj[5] + transform[14] * viewProj[9] + transform[15] * viewProj[13];
                viewTransform[14] = transform[12] * viewProj[2] + transform[13] * viewProj[6] + transform[14] * viewProj[10] + transform[15] * viewProj[14];
                viewTransform[15] = transform[12] * viewProj[3] + transform[13] * viewProj[7] + transform[14] * viewProj[11] + transform[15] * viewProj[15];
            }

            float projectedZ = viewTransform[2] * x + viewTransform[6] * y + viewTransform[10] * z + viewTransform[14];
            int32_t depth = projectedZ * 4096;
            depthBuffer[i] = depth;
            if (depth > maxDepth)
            {
                maxDepth = depth;
            }
            if (depth < minDepth)
            {
                minDepth = depth;
            }

            float projectedX = viewTransform[0] * x + viewTransform[4] * y + viewTransform[8] * z + viewTransform[12];
            float projectedY = viewTransform[1] * x + viewTransform[5] * y + viewTransform[9] * z + viewTransform[13];
            float projectedW = viewTransform[3] * x + viewTransform[7] * y + viewTransform[11] * z + viewTransform[15];
            uint8_t chunk = 0xff;
            if (projectedW != 0)
            {
                float normalizedX = (projectedX / projectedW + 1) / 2;
                float normalizedY = (projectedY / projectedW + 1) / 2;
                if (normalizedX >= 0 && normalizedX < 1 && normalizedY >= 0 && normalizedY < 1)
                {
                    uint8_t screenSpaceX = (uint8_t)(normalizedX * 15);
                    uint8_t screenSpaceY = (uint8_t)(normalizedY * 15);
                    chunk = screenSpaceX + screenSpaceY * 15;
                }
            }
            chunks[i] = chunk;
        }

        const uint32_t depthRange = 256 * 256;
        const float depthInv = (float)depthRange / (maxDepth - minDepth);
        memset(counts, 0, depthRange * sizeof(uint32_t));
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
    }
}
