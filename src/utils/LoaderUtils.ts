export async function initiateFetchRequest(url: string, useCache: boolean, abortController?: AbortController): Promise<Response> {
    const req = await fetch(url, {
        mode: "cors",
        credentials: "omit",
        cache: useCache ? "force-cache" : "default",
        signal: abortController?.signal,
    });

    if (req.status != 200) {
        throw new Error(req.status + " Unable to load " + req.url);
    }

    return req;
}

export async function loadDataIntoBuffer(res: Response, onProgress?: (progress: number) => void, abortController?: AbortController): Promise<Uint8Array> {
    const reader = res.body!.getReader();

    const contentLength = parseInt(res.headers.get("content-length") as string);
    const buffer = new Uint8Array(contentLength);

    let bytesRead = 0;

    try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            if (abortController?.signal.aborted) {
                throw new Error("Request aborted");
            }
            const { done, value } = await reader.read();
            if (done) break;

            buffer.set(value, bytesRead);
            bytesRead += value.length;
            onProgress?.(bytesRead / contentLength);
        }
    } catch (error) {
        reader.cancel();
        throw error;
    }

    return buffer;
}

export async function loadChunkedDataIntoBuffer(
    res: Response,
    onProgress?: (progress: number) => void,
    abortController?: AbortController
): Promise<Uint8Array> {
    const reader = res.body!.getReader();

    const chunks = [];
    let receivedLength = 0;
    try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            if (abortController?.signal.aborted) {
                throw new Error("Request aborted");
            }
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
    } catch (error) {
        reader.cancel();
        throw error;
    }
}

export async function loadRequestDataIntoBuffer(
    res: Response,
    onProgress?: (progress: number) => void,
    abortController?: AbortController
): Promise<Uint8Array> {
    if (res.headers.has("content-length")) {
        return loadDataIntoBuffer(res, onProgress, abortController);
    } else {
        return loadChunkedDataIntoBuffer(res, onProgress, abortController);
    }
}
