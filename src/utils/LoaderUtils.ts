export async function initiateFetchRequest(url: string, useCache: boolean): Promise<Response> {
    const req = await fetch(url, {
        mode: "cors",
        credentials: "omit",
        cache: useCache ? "force-cache" : "default",
    });

    if (req.status != 200) {
        throw new Error(req.status + " Unable to load " + req.url);
    }

    return req;
}

export async function loadDataIntoBuffer(res: Response, onProgress?: (progress: number) => void): Promise<Uint8Array> {
    const reader = res.body!.getReader();
    const contentLength = res.headers.get("content-length");
    const estimatedBytes = contentLength && !isNaN(parseInt(contentLength)) ? parseInt(contentLength) : undefined;

    const chunks = [];
    let receivedLength = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        if (onProgress && estimatedBytes) {
            // Cap progress at 95% to account for inaccurate content-length (compression, etc.)
            const rawProgress = receivedLength / estimatedBytes;
            const cappedProgress = Math.min(rawProgress * 0.95, 0.95);
            onProgress(cappedProgress);
        }
    }

    const buffer = new Uint8Array(receivedLength);
    let position = 0;
    for (const chunk of chunks) {
        buffer.set(chunk, position);
        position += chunk.length;
    }

    // Always send final 100% progress when complete
    if (onProgress) {
        onProgress(1.0);
    }

    return buffer;
}
