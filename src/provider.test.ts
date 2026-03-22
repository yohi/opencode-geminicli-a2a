import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenCodeGeminiA2AProvider } from './provider';
import { ofetch, FetchError } from 'ofetch';
import type { LanguageModelV2Prompt } from '@ai-sdk/provider';

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

    const prompt: LanguageModelV2Prompt = [
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

        // v2 ストリーム形式: text-start → text-delta(×2) → text-end → finish
        expect(parts.length).toBe(5);
        expect(parts[0]).toMatchObject({ type: 'text-start' });
        expect(parts[1]).toMatchObject({ type: 'text-delta', textDelta: 'Hello ' });
        expect(parts[2]).toMatchObject({ type: 'text-delta', textDelta: 'world' });
        expect(parts[3]).toMatchObject({ type: 'text-end' });
        expect(parts[4]).toMatchObject({ type: 'finish', finishReason: 'stop' });
    });

    it('should implement doGenerate with reasoning support', async () => {
        const sseChunks = [
            'data: {"jsonrpc":"2.0", "id":"3", "result": {"kind":"status-update", "taskId":"t3", "status":{"state":"working", "message":{"parts":[{"kind":"text", "text":"[Thinking] Step 1\\n"}]}}, "metadata":{"coderAgent":{"kind":"thought"}}}}\n\n',
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

        // Verify it now uses stateful mode (contextId/taskId are sent)
        expect(vi.mocked(ofetch.raw)).toHaveBeenCalledTimes(1);
        const requestBody2 = vi.mocked(ofetch.raw).mock.calls[0][1]?.body as any;
        const parsedBody2 = typeof requestBody2 === 'string' ? JSON.parse(requestBody2) : requestBody2;
        // STATEFUL DELTAS: Provider should send contextId and taskId
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
            maxTokens: 1024,
            stopSequences: ['\n']
        });
    });

    describe('課題修正テスト: ハング・フォールバックループ・思考のみ回答なし', () => {
        it('課題1: 内部ツールの無限ループ検知時にハングせずストリームを終了すること', async () => {
            const providerWithLowFreq = new OpenCodeGeminiA2AProvider(mockModelId, { 
                host: '127.0.0.1', 
                port: 8080,
                maxToolCallFrequency: 2,
            });

            const createInternalToolResponse = (callId: string, turnIdx: number) => [
                `data: ${JSON.stringify({
                    jsonrpc: '2.0', id: `${turnIdx}`,
                    result: {
                        kind: 'status-update',
                        taskId: 't1',
                        contextId: 'ctx1',
                        final: true,
                        status: {
                            state: 'input-required',
                            message: {
                                parts: [{
                                    kind: 'data',
                                    data: { request: { callId, name: 'activate_skill', args: JSON.stringify({ skill: 'using-superpowers' }) } }
                                }]
                            }
                        }
                    }
                })}\n\n`,
            ];

            const stream1 = createMockStream(createInternalToolResponse('c1', 1));
            const stream2 = createMockStream(createInternalToolResponse('c2', 2));
            const stream3 = createMockStream(createInternalToolResponse('c3', 3));

            let callIdx = 0;
            vi.mocked(ofetch.raw).mockImplementation(async () => {
                callIdx++;
                const streams = [stream1, stream2, stream3];
                return {
                    ok: true,
                    status: 200,
                    headers: new Headers({ 'content-type': 'text/event-stream' }),
                    _data: streams[Math.min(callIdx - 1, streams.length - 1)],
                } as any;
            });

            const { stream } = await providerWithLowFreq.doStream({
                inputFormat: 'messages',
                mode: { type: 'regular' },
                prompt,
            });

            const reader = stream.getReader();
            const parts: any[] = [];
            
            const timeout = new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('HANG DETECTED')), 5000)
            );
            
            try {
                await Promise.race([
                    (async () => {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            parts.push(value);
                        }
                    })(),
                    timeout,
                ]);
            } catch (e: any) {
                expect(e.message).not.toContain('HANG DETECTED');
            }
            
            const finishParts = parts.filter(p => p.type === 'finish');
            expect(finishParts.length).toBeGreaterThanOrEqual(1);
            expect(finishParts[finishParts.length - 1].finishReason).toBe('stop');
        });

        it('課題3: テキストなしで内部ツールループが上限に達した場合、ユーザーにメッセージを返すこと', async () => {
            const providerForTest = new OpenCodeGeminiA2AProvider(mockModelId, { 
                host: '127.0.0.1', 
                port: 8080,
                maxToolCallFrequency: 100,
                maxAutoConfirm: 5,
            });

            const createThinkingOnlyResponse = (callId: string, turnIdx: number) => [
                `data: ${JSON.stringify({
                    jsonrpc: '2.0', id: `${turnIdx}`,
                    result: {
                        kind: 'status-update',
                        taskId: 't1',
                        contextId: 'ctx1',
                        status: {
                            state: 'working',
                            message: {
                                parts: [{
                                    kind: 'data',
                                    data: { subject: 'Thinking', description: `Step ${turnIdx}` }
                                }]
                            }
                        },
                        metadata: { coderAgent: { kind: 'thought' } }
                    }
                })}\n\n`,
                `data: ${JSON.stringify({
                    jsonrpc: '2.0', id: `${turnIdx}`,
                    result: {
                        kind: 'status-update',
                        taskId: 't1',
                        contextId: 'ctx1',
                        final: true,
                        status: {
                            state: 'input-required',
                            message: {
                                parts: [{
                                    kind: 'data',
                                    data: { request: { callId, name: 'activate_skill', args: JSON.stringify({ skill: `skill-${turnIdx}` }) } }
                                }]
                            }
                        }
                    }
                })}\n\n`,
            ];

            const streams: ReadableStream<Uint8Array>[] = [];
            for (let i = 0; i < 10; i++) {
                streams.push(createMockStream(createThinkingOnlyResponse(`c${i}`, i + 1)));
            }

            let callIdx = 0;
            vi.mocked(ofetch.raw).mockImplementation(async () => {
                callIdx++;
                return {
                    ok: true,
                    status: 200,
                    headers: new Headers({ 'content-type': 'text/event-stream' }),
                    _data: streams[Math.min(callIdx - 1, streams.length - 1)],
                } as any;
            });

            const { stream } = await providerForTest.doStream({
                inputFormat: 'messages',
                mode: { type: 'regular' },
                prompt,
            });

            const reader = stream.getReader();
            const parts: any[] = [];

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    parts.push(value);
                }
            } catch (e: any) {
                // ignore
            }

            const textDeltas = parts.filter(p => p.type === 'text-delta');
            expect(textDeltas.length).toBeGreaterThanOrEqual(1);
            
            const allText = textDeltas.map(p => p.textDelta).join('');
            expect(allText.length).toBeGreaterThan(0);

            const finishParts = parts.filter(p => p.type === 'finish');
            expect(finishParts.length).toBeGreaterThanOrEqual(1);
            expect(finishParts[finishParts.length - 1].finishReason).toBe('stop');
        });
    });
});
