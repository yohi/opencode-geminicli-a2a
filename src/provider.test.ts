import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenCodeGeminiA2AProvider } from './provider';
import { ofetch, FetchError } from 'ofetch';
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

        // Seed a session with context
        await provider['sessionStore'].update('test-session-reset', { contextId: 'old-ctx', taskId: 'old-task' });

        const { stream } = await provider.doStream({
            inputFormat: 'messages',
            mode: { type: 'regular' },
            prompt,
            providerMetadata: {
                opencode: { sessionId: 'test-session-reset', resetContext: true }
            }
        });

        const reader = stream.getReader();
        while (true) {
            const { done } = await reader.read();
            if (done) break;
        }

        // Verify the A2A request was sent WITHOUT contextId/taskId (reset cleared them)
        expect(vi.mocked(ofetch.raw)).toHaveBeenCalledTimes(1);
        const requestBody = vi.mocked(ofetch.raw).mock.calls[0][1]?.body as any;
        const parsedBody = typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody;
        expect(parsedBody.params.contextId).toBeUndefined();
        expect(parsedBody.params.taskId).toBeUndefined();
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

        // Seed a session with context
        await provider['sessionStore'].update('test-session-no-reset', { contextId: 'existing-ctx', taskId: 'existing-task', lastFinishReason: 'tool-calls' });

        const { stream } = await provider.doStream({
            inputFormat: 'messages',
            mode: { type: 'regular' },
            prompt,
            providerMetadata: {
                opencode: { sessionId: 'test-session-no-reset' }
            }
        });

        const reader = stream.getReader();
        while (true) {
            const { done } = await reader.read();
            if (done) break;
        }

        // Verify it retained context
        expect(vi.mocked(ofetch.raw)).toHaveBeenCalledTimes(1);
        const requestBody2 = vi.mocked(ofetch.raw).mock.calls[0][1]?.body as any;
        const parsedBody2 = typeof requestBody2 === 'string' ? JSON.parse(requestBody2) : requestBody2;
        expect(parsedBody2.params.contextId).toBe('existing-ctx');
        expect(parsedBody2.params.taskId).toBe('existing-task');
    });

    it('should pass generationConfig to the A2A request', async () => {
        const sseChunks = [
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
            temperature: 0.1,
            topP: 0.95,
            maxTokens: 1024,
            stopSequences: ['\n'],
        });

        expect(vi.mocked(ofetch.raw)).toHaveBeenCalledTimes(1);
        const requestBody = vi.mocked(ofetch.raw).mock.calls[0][1]?.body as any;
        const parsedBody = typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody;
        
        expect(parsedBody.params.generationConfig).toEqual({
            temperature: 0.1,
            topP: 0.95,
            maxOutputTokens: 1024,
            stopSequences: ['\n'],
        });
    });

    it('should use default generationConfig from provider options', async () => {
        const providerWithConfig = new OpenCodeGeminiA2AProvider(mockModelId, {
            host: '127.0.0.1',
            port: 8080,
            generationConfig: {
                temperature: 0.7,
                topK: 40,
            }
        });

        const sseChunks = [
            'data: {"jsonrpc":"2.0", "id":"1", "result": {"kind":"status-update", "taskId":"t1", "final":true, "status":{"state":"stop"}}}\n\n',
        ];

        const mockResponse = {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'text/event-stream' }),
            _data: createMockStream(sseChunks),
        };
        vi.mocked(ofetch.raw).mockResolvedValue(mockResponse as any);

        await providerWithConfig.doStream({
            inputFormat: 'messages',
            mode: { type: 'regular' },
            prompt,
        });

        const requestBody = vi.mocked(ofetch.raw).mock.calls[0][1]?.body as any;
        const parsedBody = typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody;
        
        expect(parsedBody.params.generationConfig).toEqual({
            temperature: 0.7,
            topK: 40,
        });
    });

    it('should use model-specific generationConfig from agents option', async () => {
        const routedProvider = new OpenCodeGeminiA2AProvider('model-x', {
            host: '127.0.0.1',
            port: 41242,
            agents: [
                {
                    key: 'special-server',
                    host: '10.0.0.1',
                    port: 9999,
                    models: {
                        'model-x': {
                            options: {
                                generationConfig: { temperature: 0.1 }
                            }
                        }
                    }
                }
            ]
        });

        const sseChunks = [
            'data: {"jsonrpc":"2.0", "id":"1", "result": {"kind":"status-update", "taskId":"t1", "final":true, "status":{"state":"stop"}}}\n\n',
        ];

        const mockResponse = {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'text/event-stream' }),
            _data: createMockStream(sseChunks),
        };
        vi.mocked(ofetch.raw).mockResolvedValue(mockResponse as any);

        await routedProvider.doStream({
            inputFormat: 'messages',
            mode: { type: 'regular' },
            prompt,
        });

        const requestBody = vi.mocked(ofetch.raw).mock.calls[0][1]?.body as any;
        const parsedBody = typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody;
        
        expect(parsedBody.params.generationConfig).toEqual({
            temperature: 0.1,
        });
        // Check if routed to correct host
        expect(vi.mocked(ofetch.raw).mock.calls[0][0]).toContain('10.0.0.1:9999');
    });

    it('should prioritize model-specific generationConfig over provider-level defaults', async () => {
        const routedProvider = new OpenCodeGeminiA2AProvider('model-y', {
            host: '127.0.0.1',
            port: 41242,
            generationConfig: { temperature: 0.5, topP: 0.9 }, // Provider defaults
            agents: [
                {
                    key: 'special-server',
                    host: '10.0.0.1',
                    port: 9999,
                    models: {
                        'model-y': {
                            options: {
                                generationConfig: { temperature: 0.1, topK: 40 } // Model-specific overrides
                            }
                        }
                    }
                }
            ]
        });

        const sseChunks = [
            'data: {"jsonrpc":"2.0", "id":"1", "result": {"kind":"status-update", "taskId":"t1", "final":true, "status":{"state":"stop"}}}\n\n',
        ];

        const mockResponse = {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'text/event-stream' }),
            _data: createMockStream(sseChunks),
        };
        vi.mocked(ofetch.raw).mockResolvedValue(mockResponse as any);

        await routedProvider.doStream({
            inputFormat: 'messages',
            mode: { type: 'regular' },
            prompt: 'test prompt',
        });

        const requestBody = vi.mocked(ofetch.raw).mock.calls[0][1]?.body as any;
        const parsedBody = typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody;
        
        // Should prioritize model-specific (0.1) and merge with provider defaults (topP: 0.9)
        expect(parsedBody.params.generationConfig).toEqual({
            temperature: 0.1,
            topP: 0.9,
            topK: 40,
        });
    });

    describe('自動フォールバックとマルチエージェントルーティング (5-C & 5-D)', () => {
        it('クォータエラー時に代替モデルと別エンドポイントにフォールバックすること', async () => {
            // agents と fallback 設定を持たせたプロバイダーを初期化
            const routedProvider = new OpenCodeGeminiA2AProvider('gemini-3.1-pro-preview', {
                host: '127.0.0.1',
                port: 41242,
                fallback: {
                    enabled: true,
                    fallbackChain: ['gemini-3.1-pro-preview', 'gemini-2.5-pro'],
                },
                agents: [
                    {
                        key: 'stable-server',
                        host: '192.168.1.10',
                        port: 8888,
                        protocol: 'http',
                        models: ['gemini-2.5-pro'],
                    }
                ]
            });

            // 1回目のリクエスト（元のモデル）は 429 エラーを返すようモック
            const mockErrorResponse = {
                ok: false,
                status: 429,
                statusText: 'Too Many Requests',
                headers: new Headers(),
                _data: '{"error": "Too Many Requests"}',
                text: async () => '{"error": "Too Many Requests"}',
            };

            const sseChunks = [
                'data: {"jsonrpc":"2.0", "id":"1", "result": {"kind":"status-update", "taskId":"t1", "final":true, "status":{"state":"stop", "message":{"parts":[{"kind":"text", "text":"Fallback succeded!"}]}}}}\n\n',
            ];

            // 2回目のリクエスト（フォールバック）は成功するようモック
            const mockSuccessResponse = {
                ok: true,
                status: 200,
                headers: new Headers({ 'content-type': 'text/event-stream' }),
                _data: createMockStream(sseChunks),
            };

            vi.mocked(ofetch.raw)
                .mockResolvedValueOnce(mockErrorResponse as any)
                .mockResolvedValueOnce(mockSuccessResponse as any);

            const { stream } = await routedProvider.doStream({
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

            // ofetch() が 2回 呼ばれたことを確認 (1回目: エラー, 2回目: フォールバック)
            expect(vi.mocked(ofetch.raw)).toHaveBeenCalledTimes(2);

            // 1回目のリクエスト先（デフォルトURL）
            const call1Url = vi.mocked(ofetch.raw).mock.calls[0][0];
            expect(call1Url).toContain('http://127.0.0.1:41242');
            
            // 2回目のリクエスト先（フォールバックした別サーバーのURL）
            const call2Url = vi.mocked(ofetch.raw).mock.calls[1][0];
            expect(call2Url).toContain('http://192.168.1.10:8888');

            // 最終的に成功レスポンスがストリームに流れていること
            expect(parts[parts.length - 1]).toMatchObject({ type: 'finish', finishReason: 'stop' });
        });
    });
});
