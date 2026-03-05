import { InvalidResponseDataError } from '@ai-sdk/provider';
import { A2AResponseChunkSchema, type A2AResponseChunk, type A2ARequest } from '../schemas';

/**
 * Parses an SSE or NDJSON stream from the fetch Response body and yields valid A2AResponseChunk objects.
 * Throws InvalidResponseDataError if parsing or validation fails.
 */
export async function* parseA2AStream(
    stream: ReadableStream<Uint8Array>,
    request: A2ARequest
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
                let chunkDataSync = line.trim();
                if (!chunkDataSync) continue;

                // Handle SSE "data: " prefix
                if (chunkDataSync.startsWith('data: ')) {
                    chunkDataSync = chunkDataSync.slice(6).trim();
                } else if (chunkDataSync.startsWith('data:')) {
                    chunkDataSync = chunkDataSync.slice(5).trim();
                }

                // SSE "data: [DONE]" indicator
                if (chunkDataSync === '[DONE]') {
                    continue;
                }

                // Only process objects
                if (!chunkDataSync.startsWith('{')) {
                    continue;
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

                yield validation.data;
            }
        }

        // Process remaining buffer if it contains data
        if (buffer.trim()) {
            let chunkDataSync = buffer.trim();
            if (chunkDataSync.startsWith('data: ')) {
                chunkDataSync = chunkDataSync.slice(6).trim();
            } else if (chunkDataSync.startsWith('data:')) {
                chunkDataSync = chunkDataSync.slice(5).trim();
            }
            if (chunkDataSync && chunkDataSync !== '[DONE]' && chunkDataSync.startsWith('{')) {
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
                yield validation.data;
            }
        }

    } finally {
        reader.releaseLock();
    }
}
