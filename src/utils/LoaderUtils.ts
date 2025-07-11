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

export async function loadDataBuffer(
    res: Response,
    onProgress?: (progress: number) => void,
): Promise<Uint8Array> {
    const reader = res.body!.getReader();

    const chunks = [];
    let receivedLength = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedLength += value.length;
    }

    const buffer = new Uint8Array(receivedLength);
    let position = 0;
    for (const chunk of chunks) {
        buffer.set(chunk, position);
        position += chunk.length;

        onProgress?.(position / receivedLength);
    }

    return buffer;
}
