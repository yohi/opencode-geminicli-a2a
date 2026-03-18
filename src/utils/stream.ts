import { InvalidResponseDataError } from '@ai-sdk/provider';
import { A2AJsonRpcResponseSchema, type A2AJsonRpcResponse } from '../schemas';
import { Logger } from './logger';

function parseChunkLine(chunkDataSync: string): A2AJsonRpcResponse | null {
    if (!chunkDataSync) return null;

    // SSE data: prefix handling
    if (chunkDataSync.startsWith('data: ')) {
        chunkDataSync = chunkDataSync.slice(6).trim();
    } else if (chunkDataSync.startsWith('data:')) {
        chunkDataSync = chunkDataSync.slice(5).trim();
    } else {
        // SSE のコメント行や空行は無視
        return null;
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

    const validation = A2AJsonRpcResponseSchema.safeParse(parsedJson);
    if (!validation.success) {
        // Gemini CLI が 'invalid' kind など、スキーマ外のレスポンスを返す場合がある。
        // エラーとして扱うと、ツール呼び出し失敗ごとにストリームがクラッシュするため、
        // 警告ログを出して当該チャンクをスキップする。
        const parsed = parsedJson as Record<string, any>;
        if (parsed?.result && typeof parsed?.result === 'object' && 'kind' in parsed.result) {
            Logger.warn(`Skipping A2A chunk with unknown result kind: '${(parsed.result as any).kind}'`);
            return null;
        }
        throw new InvalidResponseDataError({
            data: parsedJson,
            message: `Chunk validation failed: ${validation.error.message}`,
        });
    }

    return validation.data;
}

/**
 * Parses an SSE stream from the fetch Response body and yields valid A2AJsonRpcResponse objects.
 * Throws InvalidResponseDataError if parsing or validation fails.
 */
export async function* parseA2AStream(
    stream: ReadableStream<Uint8Array>
): AsyncGenerator<A2AJsonRpcResponse, void, unknown> {
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
                const trimmed = line.trim();
                if (trimmed) {
                    const parsed = parseChunkLine(trimmed);
                    if (parsed) yield parsed;
                }
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
