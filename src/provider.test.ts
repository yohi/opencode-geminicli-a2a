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
        expect(provider.specificationVersion).toBe('v1');
        expect(provider.provider).toBe('opencode-geminicli-a2a');
        expect(provider.modelId).toBe(mockModelId);
    });

    it('should implement doStream streaming chat correctly', async () => {
        const sseChunks = [
            'data: {"id": "1", "choices": [{"delta": {"content": "Hello "}, "finish_reason": null}]}\n\n',
            'data: {"id": "1", "choices": [{"delta": {"content": "world"}, "finish_reason": "stop"}]}\n\n',
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

        expect(parts.length).toBe(3);
        expect(parts[0]).toEqual({ type: 'text-delta', textDelta: 'Hello ' });
        expect(parts[1]).toEqual({ type: 'text-delta', textDelta: 'world' });
        expect(parts[2]).toMatchObject({ type: 'finish', finishReason: 'stop' });
    });

    it('should implement doGenerate by consuming the stream', async () => {
        const sseChunks = [
            'data: {"id": "2", "choices": [{"delta": {"content": "Test "}, "finish_reason": null}]}\n\n',
            'data: {"id": "2", "choices": [{"delta": {"content": "generation"}, "finish_reason": "stop"}]}\n\n',
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

        expect(result.text).toBe('Test generation');
        expect(result.finishReason).toBe('stop');
        expect(result.toolCalls).toBeUndefined();
    });

    it('should implement doGenerate and collect tool calls correctly', async () => {
        const sseChunks = [
            'data: {"id": "3", "choices": [{"delta": {"tool_calls": [{"id": "call-1", "type": "function", "function": {"name": "getWeather", "arguments": "{\\"city\\" :"}}]}, "finish_reason": null}]}\n\n',
            'data: {"id": "3", "choices": [{"delta": {"tool_calls": [{"id": "call-1", "function": {"arguments": "\\"Tokyo\\""}}]}, "finish_reason": null}]}\n\n',
            'data: {"id": "3", "choices": [{"delta": {"tool_calls": [{"id": "call-1", "function": {"arguments": "}"}}]}, "finish_reason": "tool_calls"}]}\n\n',
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

        expect(result.finishReason).toBe('tool-calls');
        expect(result.text).toBeUndefined();
        expect(result.toolCalls).toBeDefined();
        expect(result.toolCalls?.length).toBe(1);
        expect(result.toolCalls?.[0]).toEqual({
            toolCallType: 'function',
            toolCallId: 'call-1',
            toolName: 'getWeather',
            args: '{"city" :"Tokyo"}',
        });
    });
});
