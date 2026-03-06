import { describe, it, expect } from 'vitest';
import { parseA2AStream } from './stream';

describe('parseA2AStream', () => {

    function createStream(chunks: string[]): ReadableStream<Uint8Array> {
        return new ReadableStream({
            start(controller) {
                const encoder = new TextEncoder();
                for (const chunk of chunks) {
                    controller.enqueue(encoder.encode(chunk));
                }
                controller.close();
            },
        });
    }

    it('parses JSON-RPC SSE format streams correctly', async () => {
        const sseData = [
            'data: {"jsonrpc":"2.0", "id":"1", "result": {"kind":"status-update", "taskId":"t1", "status":{"state":"working", "message":{"parts":[{"kind":"text", "text":"hello "}]}}}}\n\n',
            'data: {"jsonrpc":"2.0", "id":"1", "result": {"kind":"status-update", "taskId":"t1", "status":{"state":"working", "message":{"parts":[{"kind":"text", "text":"world"}]}}}}\n\n',
            'data: [DONE]\n\n',
        ];

        const stream = createStream(sseData);
        const results = [];

        for await (const chunk of parseA2AStream(stream)) {
            results.push(chunk);
        }

        expect(results.length).toBe(2);
        expect((results[0] as any).result.status.message.parts[0].text).toBe('hello ');
        expect((results[1] as any).result.status.message.parts[0].text).toBe('world');
    });

    it('handles fragmented chunks', async () => {
        const fragmentedData = [
            'data: {"jsonrpc":"2.0", "id":"3", "r',
            'esult": {"kind":"status-update", "taskId":"t2", "status":{"state":"working", "message":{"parts":[{"kind":"text", "text":"frag"}]}}}}\n\n',
        ];

        const stream = createStream(fragmentedData);
        const results = [];

        for await (const chunk of parseA2AStream(stream)) {
            results.push(chunk);
        }

        expect(results.length).toBe(1);
        expect((results[0] as any).result.status.message.parts[0].text).toBe('frag');
    });

    it('throws error on malformed JSON chunk', async () => {
        const stream = createStream(['data: {invalid json}\n\n']);
        await expect(async () => {
            for await (const _ of parseA2AStream(stream)) { }
        }).rejects.toThrowError(/Failed to parse JSON chunk/);
    });

    it('throws error on validation failure', async () => {
        const stream = createStream(['data: {"id": "1", "result": {"missing_kind": true}}\n\n']);
        await expect(async () => {
            for await (const _ of parseA2AStream(stream)) { }
        }).rejects.toThrowError(/Chunk validation failed/);
    });

    it('produces no outputs for empty lines/newlines', async () => {
        const stream = createStream(['\n', '\n\n', '   \n']);
        const results = [];
        for await (const chunk of parseA2AStream(stream)) {
            results.push(chunk);
        }
        expect(results.length).toBe(0);
    });
});

