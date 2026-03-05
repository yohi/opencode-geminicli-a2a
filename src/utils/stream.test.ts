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

    it('parses SSE format streams correctly', async () => {
        const sseData = [
            'data: {"id": "1", "choices": [{"delta": {"content": "hello "}, "finish_reason": null}]}\n\n',
            'data: {"id": "1", "choices": [{"delta": {"content": "world"}, "finish_reason": null}]}\n\n',
            'data: [DONE]\n\n',
        ];

        const stream = createStream(sseData);
        const results = [];

        for await (const chunk of parseA2AStream(stream)) {
            results.push(chunk);
        }

        expect(results.length).toBe(2);
        expect(results[0].choices[0].delta.content).toBe('hello ');
        expect(results[1].choices[0].delta.content).toBe('world');
    });

    it('parses NDJSON format streams correctly', async () => {
        const ndjsonData = [
            '{"id": "2", "choices": [{"delta": {"content": "foo "}, "finish_reason": null}]}\n',
            '{"id": "2", "choices": [{"delta": {"content": "bar"}, "finish_reason": "stop"}]}\n',
        ];

        const stream = createStream(ndjsonData);
        const results = [];

        for await (const chunk of parseA2AStream(stream)) {
            results.push(chunk);
        }

        expect(results.length).toBe(2);
        expect(results[0].choices[0].delta.content).toBe('foo ');
        expect(results[1].choices[0].finish_reason).toBe('stop');
    });

    it('handles fragmented chunks', async () => {
        const fragmentedData = [
            'data: {"id": "3", "cho',
            'ices": [{"delta": {"content": "frag"}, "finish_reason": null}]}\n\n',
        ];

        const stream = createStream(fragmentedData);
        const results = [];

        for await (const chunk of parseA2AStream(stream)) {
            results.push(chunk);
        }

        expect(results.length).toBe(1);
        expect(results[0].choices[0].delta.content).toBe('frag');
    });
});
