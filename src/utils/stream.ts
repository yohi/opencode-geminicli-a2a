import { InvalidResponseDataError } from '@ai-sdk/provider';
import { A2AResponseChunkSchema, type A2AResponseChunk } from '../schemas';

function parseChunkLine(chunkDataSync: string): A2AResponseChunk | null {
    if (!chunkDataSync) return null;

    if (chunkDataSync.startsWith('data: ')) {
        chunkDataSync = chunkDataSync.slice(6).trim();
    } else if (chunkDataSync.startsWith('data:')) {
        chunkDataSync = chunkDataSync.slice(5).trim();
    }

    if (chunkDataSync === '[DONE]') {
        return null;
    }

    if (!chunkDataSync.startsWith('{')) {
        return null;
    }

    let parsedJson: unknown;
    try {
        parsedJson = JSON.parse(chunkDataSync);
    } catch (e) {
        throw new InvalidResponseDataError({
            data: chunkDataSync,
            message: `Failed to parse JSON chunk: ${e instanceof Error ? e.message : String(e)}`,
        });
    }

    const validation = A2AResponseChunkSchema.safeParse(parsedJson);
    if (!validation.success) {
        throw new InvalidResponseDataError({
            data: parsedJson,
            message: `Chunk validation failed: ${validation.error.message}`,
        });
    }

    return validation.data;
}

/**
 * Parses an SSE or NDJSON stream from the fetch Response body and yields valid A2AResponseChunk objects.
 * Throws InvalidResponseDataError if parsing or validation fails.
 */
export async function* parseA2AStream(
    stream: ReadableStream<Uint8Array>
): AsyncGenerator<A2AResponseChunk, void, unknown> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');

            // The last element is either incomplete line or empty string
            buffer = lines.pop() ?? '';

            for (const line of lines) {
                const parsed = parseChunkLine(line.trim());
                if (parsed) yield parsed;
            }
        }

        // Process remaining buffer if it contains data
        if (buffer.trim()) {
            const parsed = parseChunkLine(buffer.trim());
            if (parsed) yield parsed;
        }

    } finally {
        reader.releaseLock();
    }
}
