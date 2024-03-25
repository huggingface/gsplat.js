#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

extern "C" {
void sort(float *viewProj, float *transforms, uint32_t *transformIndices, uint32_t vertexCount, float *positions,
          uint32_t *depthBuffer, uint32_t *depthIndex, uint32_t *starts, uint32_t *counts) {
    int32_t minDepth = 0x7fffffff;
    int32_t maxDepth = 0x80000000;
    int32_t previousTransformIndex = -1;
    float viewTransform[16];
    for (uint32_t i = 0; i < vertexCount; i++) {
        float x = positions[3 * i + 0];
        float y = positions[3 * i + 1];
        float z = positions[3 * i + 2];

        uint32_t transformIndex = transformIndices[i];
        if (transformIndex != previousTransformIndex) {
            previousTransformIndex = transformIndex;
            float *transform = &transforms[20 * transformIndex];
            viewTransform[2] = transform[0] * viewProj[2] + transform[1] * viewProj[6] + transform[2] * viewProj[10] +
                               transform[3] * viewProj[14];
            viewTransform[6] = transform[4] * viewProj[2] + transform[5] * viewProj[6] + transform[6] * viewProj[10] +
                               transform[7] * viewProj[14];
            viewTransform[10] = transform[8] * viewProj[2] + transform[9] * viewProj[6] + transform[10] * viewProj[10] +
                                transform[11] * viewProj[14];
            viewTransform[14] = transform[12] * viewProj[2] + transform[13] * viewProj[6] + transform[14] * viewProj[10] +
                                transform[15] * viewProj[14];
        }

        float projectedZ = viewTransform[2] * x + viewTransform[6] * y + viewTransform[10] * z + viewTransform[14];
        int32_t depth = projectedZ * 4096;
        depthBuffer[i] = depth;
        if (depth > maxDepth) {
            maxDepth = depth;
        }
        if (depth < minDepth) {
            minDepth = depth;
        }
    }

    const uint32_t depthRange = 256 * 256;
    const float depthInv = (float)(depthRange - 1) / (maxDepth - minDepth);
    memset(counts, 0, depthRange * sizeof(uint32_t));
    for (uint32_t i = 0; i < vertexCount; i++) {
        depthBuffer[i] = (depthBuffer[i] - minDepth) * depthInv;
        counts[depthBuffer[i]]++;
    }

    starts[0] = 0;
    for (uint32_t i = 1; i < depthRange; i++) {
        starts[i] = starts[i - 1] + counts[i - 1];
    }

    for (uint32_t i = 0; i < vertexCount; i++) {
        depthIndex[starts[depthBuffer[i]]++] = i;
    }
}
}
