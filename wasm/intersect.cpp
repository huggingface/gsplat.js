#include <stdint.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>

static float localCorners[12] = {
    -0.5,
    -0.5,
    0,
    0.5,
    -0.5,
    0,
    0.5,
    0.5,
    0,
    -0.5,
    0.5,
    0,
};

static float EPSILON = 0.000001;

float projectedCorners[12];
float vecQuat[4];
float conjugate[4];
float tempQuat[4];
float rotatedQuat[4];

void multiplyQuaternion(float *a, float *b, float *result)
{
    result[0] = a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1];
    result[1] = a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0];
    result[2] = a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3];
    result[3] = a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2];
}

void applyRotation(float *rotation, float *vector, float *result)
{
    vecQuat[0] = vector[0];
    vecQuat[1] = vector[1];
    vecQuat[2] = vector[2];
    vecQuat[3] = 0;

    conjugate[0] = -rotation[0];
    conjugate[1] = -rotation[1];
    conjugate[2] = -rotation[2];
    conjugate[3] = rotation[3];

    multiplyQuaternion(rotation, vecQuat, tempQuat);
    multiplyQuaternion(tempQuat, conjugate, rotatedQuat);

    result[0] = rotatedQuat[0];
    result[1] = rotatedQuat[1];
    result[2] = rotatedQuat[2];
}

void getSplatCorners(float *view, float *transform, float *position, float *rotation, float *scale, float *result)
{
    projectedCorners[0] = view[0] * localCorners[0] + view[4] * localCorners[1] + view[8] * localCorners[2];
    projectedCorners[1] = view[1] * localCorners[0] + view[5] * localCorners[1] + view[9] * localCorners[2];
    projectedCorners[2] = view[2] * localCorners[0] + view[6] * localCorners[1] + view[10] * localCorners[2];
    projectedCorners[3] = view[0] * localCorners[3] + view[4] * localCorners[4] + view[8] * localCorners[5];
    projectedCorners[4] = view[1] * localCorners[3] + view[5] * localCorners[4] + view[9] * localCorners[5];
    projectedCorners[5] = view[2] * localCorners[3] + view[6] * localCorners[4] + view[10] * localCorners[5];
    projectedCorners[6] = view[0] * localCorners[6] + view[4] * localCorners[7] + view[8] * localCorners[8];
    projectedCorners[7] = view[1] * localCorners[6] + view[5] * localCorners[7] + view[9] * localCorners[8];
    projectedCorners[8] = view[2] * localCorners[6] + view[6] * localCorners[7] + view[10] * localCorners[8];
    projectedCorners[9] = view[0] * localCorners[9] + view[4] * localCorners[10] + view[8] * localCorners[11];
    projectedCorners[10] = view[1] * localCorners[9] + view[5] * localCorners[10] + view[9] * localCorners[11];
    projectedCorners[11] = view[2] * localCorners[9] + view[6] * localCorners[10] + view[10] * localCorners[11];

    for (uint8_t i = 0; i < 4; i++)
    {
        float x = projectedCorners[i * 3 + 0] * scale[0] * 4.0;
        float y = projectedCorners[i * 3 + 1] * scale[1] * 4.0;
        float z = projectedCorners[i * 3 + 2] * scale[2] * 4.0;

        float rotated[3];
        applyRotation(rotation, (float[]){x, y, z}, rotated);

        x = position[0] + rotated[0];
        y = position[1] + rotated[1];
        z = position[2] + rotated[2];

        result[i * 3 + 0] = transform[0] * x + transform[4] * y + transform[8] * z + transform[12];
        result[i * 3 + 1] = transform[1] * x + transform[5] * y + transform[9] * z + transform[13];
        result[i * 3 + 2] = transform[2] * x + transform[6] * y + transform[10] * z + transform[14];
    }
}

float edge1[3];
float edge2[3];
float h[3];
float s[3];
float q[3];

void rayIntersectsTriangle(float *origin, float *direction, float *triangle, uint32_t *result)
{
    float *vertex0 = &triangle[0];
    float *vertex1 = &triangle[3];
    float *vertex2 = &triangle[6];

    edge1[0] = vertex1[0] - vertex0[0];
    edge1[1] = vertex1[1] - vertex0[1];
    edge1[2] = vertex1[2] - vertex0[2];

    edge2[0] = vertex2[0] - vertex0[0];
    edge2[1] = vertex2[1] - vertex0[1];
    edge2[2] = vertex2[2] - vertex0[2];

    h[0] = direction[1] * edge2[2] - direction[2] * edge2[1];
    h[1] = direction[2] * edge2[0] - direction[0] * edge2[2];
    h[2] = direction[0] * edge2[1] - direction[1] * edge2[0];

    float a = edge1[0] * h[0] + edge1[1] * h[1] + edge1[2] * h[2];

    if (a > -EPSILON && a < EPSILON)
    {
        return;
    }

    float f = 1.0 / a;

    s[0] = origin[0] - vertex0[0];
    s[1] = origin[1] - vertex0[1];
    s[2] = origin[2] - vertex0[2];

    float u = f * (s[0] * h[0] + s[1] * h[1] + s[2] * h[2]);

    if (u < 0.0 || u > 1.0)
    {
        return;
    }

    q[0] = s[1] * edge1[2] - s[2] * edge1[1];
    q[1] = s[2] * edge1[0] - s[0] * edge1[2];
    q[2] = s[0] * edge1[1] - s[1] * edge1[0];

    float v = f * (direction[0] * q[0] + direction[1] * q[1] + direction[2] * q[2]);

    if (v < 0.0 || u + v > 1.0)
    {
        return;
    }

    float t = f * (edge2[0] * q[0] + edge2[1] * q[1] + edge2[2] * q[2]);

    if (t > EPSILON)
    {
        *result = 1;
    }
}

bool isAdjacentChunk(uint8_t a, uint8_t b)
{
    uint8_t ax = a % 15;
    uint8_t ay = a / 15;
    uint8_t bx = b % 15;
    uint8_t by = b / 15;
    return abs(ax - bx) <= 1 && abs(ay - by) <= 1;
}

extern "C"
{
    void evaluate(
        float *view, float *transforms, uint32_t *transformIndices,
        float *positions, float *rotations, float *scales,
        uint32_t *depthIndex, uint8_t *chunks, uint32_t count,
        uint32_t chunk, float *origin, float *direction, uint32_t *result)
    {
        float corners[12];
        float triangle[9];

        *result = 0xffffffff;

        for (uint32_t i = 0; i < count; i++)
        {
            uint32_t index = depthIndex[i];

            if (!isAdjacentChunk(chunks[index], chunk))
            {
                continue;
            }

            uint32_t transformIndex = transformIndices[index];
            float *transform = &transforms[transformIndex * 20];

            getSplatCorners(view, &transforms[transformIndex * 20], &positions[index * 3], &rotations[index * 4], &scales[index * 3], corners);

            triangle[0] = corners[0];
            triangle[1] = corners[1];
            triangle[2] = corners[2];
            triangle[3] = corners[3];
            triangle[4] = corners[4];
            triangle[5] = corners[5];
            triangle[6] = corners[6];
            triangle[7] = corners[7];
            triangle[8] = corners[8];

            rayIntersectsTriangle(origin, direction, triangle, result);

            if (*result == 1)
            {
                *result = index;
                break;
            }

            triangle[0] = corners[0];
            triangle[1] = corners[1];
            triangle[2] = corners[2];
            triangle[3] = corners[6];
            triangle[4] = corners[7];
            triangle[5] = corners[8];
            triangle[6] = corners[9];
            triangle[7] = corners[10];
            triangle[8] = corners[11];

            rayIntersectsTriangle(origin, direction, triangle, result);

            if (*result == 1)
            {
                *result = index;
                break;
            }
        }
    }
}
