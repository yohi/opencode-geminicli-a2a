import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenCodeGeminiA2AProvider } from './provider';
import { ofetch } from 'ofetch';
import type { LanguageModelV1Prompt } from '@ai-sdk/provider';

// Mock ofetch
vi.mock('ofetch', () => {
    return {
        ofetch: {
            raw: vi.fn(),
        },
        FetchError: class FetchError extends Error {
            response?: any;
            constructor(message: string, response?: any) {
                super(message);
                this.response = response;
            }
        },
    };
});

describe('OpenCodeGeminiA2AProvider', () => {
    const mockModelId = 'test-model';
    let provider: OpenCodeGeminiA2AProvider;

    beforeEach(() => {
        provider = new OpenCodeGeminiA2AProvider(mockModelId, { host: '127.0.0.1', port: 8080 });
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    function createMockStream(chunks: string[]): ReadableStream<Uint8Array> {
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

    const prompt: LanguageModelV1Prompt = [
        { role: 'user', content: [{ type: 'text', text: 'Hello' }] },
    ];

    it('should initialize with correct metadata', () => {
        expect(provider.specificationVersion).toBe('v2');
        expect(provider.provider).toBe('opencode-geminicli-a2a');
        expect(provider.modelId).toBe(mockModelId);
    });

    it('should implement doStream streaming chat correctly', async () => {
        const sseChunks = [
            'data: {"jsonrpc":"2.0", "id":"1", "result": {"kind":"status-update", "taskId":"t1", "status":{"state":"working", "message":{"parts":[{"kind":"text", "text":"Hello "}]}}}}\n\n',
            'data: {"jsonrpc":"2.0", "id":"1", "result": {"kind":"status-update", "taskId":"t1", "status":{"state":"working", "message":{"parts":[{"kind":"text", "text":"world"}]}}}}\n\n',
            'data: {"jsonrpc":"2.0", "id":"1", "result": {"kind":"status-update", "taskId":"t1", "final":true, "status":{"state":"stop"}}}\n\n',
        ];

        const mockResponse = {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'text/event-stream' }),
            _data: createMockStream(sseChunks),
        };
        vi.mocked(ofetch.raw).mockResolvedValue(mockResponse as any);

        const { stream } = await provider.doStream({
            inputFormat: 'messages',
            mode: { type: 'regular' },
            prompt,
        });

        const reader = stream.getReader();
        const parts = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            parts.push(value);
        }

        // v2 ストリーム形式: stream-start → text-start → text-delta(×2) → text-end → finish
        expect(parts.length).toBe(6);
        expect(parts[0]).toEqual({ type: 'stream-start' });
        expect(parts[1]).toMatchObject({ type: 'text-start' });
        expect(parts[2]).toMatchObject({ type: 'text-delta', delta: 'Hello ' });
        expect(parts[3]).toMatchObject({ type: 'text-delta', delta: 'world' });
        expect(parts[4]).toMatchObject({ type: 'text-end' });
        expect(parts[5]).toMatchObject({ type: 'finish', finishReason: 'stop' });
    });

    it('should implement doGenerate with reasoning support', async () => {
        const sseChunks = [
            'data: {"jsonrpc":"2.0", "id":"3", "result": {"kind":"status-update", "taskId":"t3", "status":{"state":"working", "message":{"parts":[{"kind":"data", "data":{"subject":"Thinking", "description":"Step 1"}}]}}, "metadata":{"coderAgent":{"kind":"thought"}}}}\n\n',
            'data: {"jsonrpc":"2.0", "id":"3", "result": {"kind":"status-update", "taskId":"t3", "status":{"state":"working", "message":{"parts":[{"kind":"text", "text":"Final answer"}]}}}}\n\n',
            'data: {"jsonrpc":"2.0", "id":"3", "result": {"kind":"status-update", "taskId":"t3", "final":true, "status":{"state":"stop"}}}\n\n',
        ];

        const mockResponse = {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'text/event-stream' }),
            _data: createMockStream(sseChunks),
        };
        vi.mocked(ofetch.raw).mockResolvedValue(mockResponse as any);

        const result = await provider.doGenerate({
            inputFormat: 'messages',
            mode: { type: 'regular' },
            prompt,
        });

        // v2 では reasoning-start/reasoning-delta/reasoning-end で正しく分離される
        expect(result.reasoning).toBe('[Thinking] Step 1\n');
        expect(result.text).toBe('Final answer');
        expect(result.finishReason).toBe('stop');
    });

    it('should reset context when resetContext flag is set in providerMetadata', async () => {
        const sseChunks = [
            'data: {"jsonrpc":"2.0", "id":"1", "result": {"kind":"status-update", "taskId":"t-new", "contextId":"ctx-new", "status":{"state":"working", "message":{"parts":[{"kind":"text", "text":"New context response"}]}}}}\n\n',
            'data: {"jsonrpc":"2.0", "id":"1", "result": {"kind":"status-update", "taskId":"t-new", "final":true, "status":{"state":"stop"}}}\n\n',
        ];

        const mockResponse = {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'text/event-stream' }),
            _data: createMockStream(sseChunks),
        };
        vi.mocked(ofetch.raw).mockResolvedValue(mockResponse as any);

        await provider.doStream({
            inputFormat: 'messages',
            mode: { type: 'regular' },
            prompt,
            providerMetadata: {
                opencode: { sessionId: 'test-session-reset', resetContext: true }
            }
        });

        // Verify the A2A request was sent WITHOUT contextId/taskId (reset cleared them)
        const requestBody = vi.mocked(ofetch.raw).mock.calls[0][1]?.body as any;
        expect(requestBody.params.contextId).toBeUndefined();
        expect(requestBody.params.taskId).toBeUndefined();
    });

    it('should not reset context when resetContext flag is absent', async () => {
        const sseChunks = [
            'data: {"jsonrpc":"2.0", "id":"1", "result": {"kind":"status-update", "taskId":"t1", "status":{"state":"working", "message":{"parts":[{"kind":"text", "text":"Response"}]}}}}\n\n',
            'data: {"jsonrpc":"2.0", "id":"1", "result": {"kind":"status-update", "taskId":"t1", "final":true, "status":{"state":"stop"}}}\n\n',
        ];

        const mockResponse = {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'text/event-stream' }),
            _data: createMockStream(sseChunks),
        };
        vi.mocked(ofetch.raw).mockResolvedValue(mockResponse as any);

        await provider.doStream({
            inputFormat: 'messages',
            mode: { type: 'regular' },
            prompt,
            providerMetadata: {
                opencode: { sessionId: 'test-session-no-reset' }
            }
        });

        // No error, normal operation
        expect(vi.mocked(ofetch.raw)).toHaveBeenCalled();
    });
});
