#include <stdint.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <cstdint>

uint16_t floatToHalf(float value)
{
    uint32_t f = *reinterpret_cast<uint32_t *>(&value);

    uint32_t sign = (f >> 31) & 0x0001;
    uint32_t exp = (f >> 23) & 0x00ff;
    uint32_t frac = f & 0x007fffff;

    uint32_t newExp;
    if (exp == 0)
    {
        newExp = 0;
    }
    else if (exp < 113)
    {
        newExp = 0;
        frac |= 0x00800000;
        frac >>= (113 - exp);
        if (frac & 0x01000000)
        {
            newExp = 1;
            frac = 0;
        }
    }
    else if (exp < 142)
    {
        newExp = exp - 112;
    }
    else
    {
        newExp = 31;
        frac = 0;
    }

    return (sign << 15) | (newExp << 10) | (frac >> 13);
}

uint32_t packHalf2x16(float x, float y)
{
    uint16_t hx = floatToHalf(x);
    uint16_t hy = floatToHalf(y);
    return (uint32_t)hx | ((uint32_t)hy << 16);
}

void multiplyQuaternion(float *a, float *b, float *result)
{
    result[0] = a[3] * b[1] + a[0] * b[0] + a[1] * b[3] - a[2] * b[2];
    result[1] = a[3] * b[2] - a[0] * b[3] + a[1] * b[0] + a[2] * b[1];
    result[2] = a[3] * b[3] + a[0] * b[2] - a[1] * b[1] + a[2] * b[0];
    result[3] = a[3] * b[0] - a[0] * b[1] - a[1] * b[2] - a[2] * b[3];
}

void quaternionToMatrix3(float *q, float *result)
{
    result[0] = 1 - 2 * q[1] * q[1] - 2 * q[2] * q[2];
    result[1] = 2 * q[0] * q[1] - 2 * q[2] * q[3];
    result[2] = 2 * q[0] * q[2] + 2 * q[1] * q[3];
    result[3] = 2 * q[0] * q[1] + 2 * q[2] * q[3];
    result[4] = 1 - 2 * q[0] * q[0] - 2 * q[2] * q[2];
    result[5] = 2 * q[1] * q[2] - 2 * q[0] * q[3];
    result[6] = 2 * q[0] * q[2] - 2 * q[1] * q[3];
    result[7] = 2 * q[1] * q[2] + 2 * q[0] * q[3];
    result[8] = 1 - 2 * q[0] * q[0] - 2 * q[1] * q[1];
}

void multiplyMatrix3(float *a, float *b, float *result)
{
    result[0] = b[0] * a[0] + b[3] * a[1] + b[6] * a[2];
    result[1] = b[1] * a[0] + b[4] * a[1] + b[7] * a[2];
    result[2] = b[2] * a[0] + b[5] * a[1] + b[8] * a[2];
    result[3] = b[0] * a[3] + b[3] * a[4] + b[6] * a[5];
    result[4] = b[1] * a[3] + b[4] * a[4] + b[7] * a[5];
    result[5] = b[2] * a[3] + b[5] * a[4] + b[8] * a[5];
    result[6] = b[0] * a[6] + b[3] * a[7] + b[6] * a[8];
    result[7] = b[1] * a[6] + b[4] * a[7] + b[7] * a[8];
    result[8] = b[2] * a[6] + b[5] * a[7] + b[8] * a[8];
}

extern "C"
{
    void pack(
        bool selected,
        uint32_t vertexCount, float *positions, float *rotations, float *scales,
        uint8_t *colors, uint8_t *selection, uint32_t *data, float *worldPositions,
        float *worldRotations, float *worldScales)
    {
        float rot[4];
        float rotMat[9];
        float scaleMat[9] = {0};
        float M[9];
        float sigma[6];

        for (uint32_t i = 0; i < vertexCount; i++)
        {
            float x = positions[i * 3 + 0];
            float y = positions[i * 3 + 1];
            float z = positions[i * 3 + 2];

            worldPositions[i * 3 + 0] = x;
            worldPositions[i * 3 + 1] = y;
            worldPositions[i * 3 + 2] = z;

            data[8 * i + 0] = *(uint32_t *)&x;
            data[8 * i + 1] = *(uint32_t *)&y;
            data[8 * i + 2] = *(uint32_t *)&z;

            data[8 * i + 3] = 0;
            if (selected || selection[i] > 0)
            {
                data[8 * i + 3] |= 0x01000000;
            }

            uint32_t color = 0;
            color |= (uint32_t)colors[i * 4 + 0] << 0;
            color |= (uint32_t)colors[i * 4 + 1] << 8;
            color |= (uint32_t)colors[i * 4 + 2] << 16;
            color |= (uint32_t)colors[i * 4 + 3] << 24;
            data[8 * i + 7] = color;

            rot[0] = rotations[i * 4 + 1];
            rot[1] = rotations[i * 4 + 2];
            rot[2] = rotations[i * 4 + 3];
            rot[3] = -rotations[i * 4 + 0];

            quaternionToMatrix3(rot, rotMat);

            worldRotations[i * 4 + 0] = rot[0];
            worldRotations[i * 4 + 1] = rot[1];
            worldRotations[i * 4 + 2] = rot[2];
            worldRotations[i * 4 + 3] = rot[3];

            scaleMat[0] = scales[i * 3 + 0];
            scaleMat[4] = scales[i * 3 + 1];
            scaleMat[8] = scales[i * 3 + 2];

            worldScales[i * 3 + 0] = scaleMat[0];
            worldScales[i * 3 + 1] = scaleMat[4];
            worldScales[i * 3 + 2] = scaleMat[8];

            multiplyMatrix3(scaleMat, rotMat, M);

            sigma[0] = M[0] * M[0] + M[3] * M[3] + M[6] * M[6];
            sigma[1] = M[0] * M[1] + M[3] * M[4] + M[6] * M[7];
            sigma[2] = M[0] * M[2] + M[3] * M[5] + M[6] * M[8];
            sigma[3] = M[1] * M[1] + M[4] * M[4] + M[7] * M[7];
            sigma[4] = M[1] * M[2] + M[4] * M[5] + M[7] * M[8];
            sigma[5] = M[2] * M[2] + M[5] * M[5] + M[8] * M[8];

            data[8 * i + 4] = packHalf2x16(4 * sigma[0], 4 * sigma[1]);
            data[8 * i + 5] = packHalf2x16(4 * sigma[2], 4 * sigma[3]);
            data[8 * i + 6] = packHalf2x16(4 * sigma[4], 4 * sigma[5]);
        }
    }
}