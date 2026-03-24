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

        // v2 ストリーム形式: text-start → text-delta(×2) → text-end → finish
        expect(parts.length).toBe(5);
        expect(parts[0]).toMatchObject({ type: 'text-start' });
        expect(parts[1]).toMatchObject({ type: 'text-delta', delta: 'Hello ' });
        expect(parts[2]).toMatchObject({ type: 'text-delta', delta: 'world' });
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
            prompt,
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

    describe('課題修正テスト: ハング・フォールバックループ・思考のみ回答なし', () => {
        /**
         * 課題1: ハング
         * 
         * 内部ツール（activate_skill 等）が繰り返し呼ばれると、プロバイダが
         * auto-confirm ループに入りA2Aサーバーも input-required のまま待ち続ける。
         * 
         * 期待: shouldInterruptLoop 検知後、ユーザー向けテキスト + finish(stop) が emit され、
         *       ストリームが有限時間内に終了すること。
         */
        it('課題1: 内部ツールの無限ループ検知時にハングせずストリームを終了すること', async () => {
            // 3回同じ internal tool を返すA2Aサーバーをシミュレート
            // maxToolCallFrequency=2 なので 3回目でループ検知される
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

            // 各ターンで同じ internal tool を返すストリームを用意
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
            
            // タイムアウト付きで読み取り - ハングしないことを保証
            const timeout = new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('HANG DETECTED: Stream did not finish within 5 seconds')), 5000)
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
                // ハングした場合はテスト失敗
                expect(e.message).not.toContain('HANG DETECTED');
            }
            
            // ストリームが正常に終了したこと
            const finishParts = parts.filter(p => p.type === 'finish');
            expect(finishParts.length).toBeGreaterThanOrEqual(1);
            
            // finish が 'stop' であること（ハング防止の強制中断による）
            const lastFinish = finishParts[finishParts.length - 1];
            expect(lastFinish.finishReason).toBe('stop');
        });

        /**
         * 課題1b: ハング（引数が毎回異なるパターン）
         * 
         * 実環境で最も多い問題のパターン。
         * activate_skill が毎回異なる skill 名で呼ばれるため、
         * 引数ベースの頻度キー（toolName::args）では検知できない。
         * 
         * 期待: ツール名のみの頻度カウンタ（toolNameOnlyFrequency）により、
         *       引数が異なっても同一ツール名の繰り返しを検知し、
         *       shouldInterruptLoop で中断、有限時間でストリーム終了。
         */
        it('課題1b: 引数の異なる内部ツールの反復呼び出しでもループ検知してストリームを終了すること', async () => {
            const providerWithLowFreq = new OpenCodeGeminiA2AProvider(mockModelId, { 
                host: '127.0.0.1', 
                port: 8080,
                maxToolCallFrequency: 2, // 3回呼ばれたらループ
            });

            // 各ターンで引数が異なる activate_skill を返す
            const createDiffArgsResponse = (callId: string, turnIdx: number) => [
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

            const stream1 = createMockStream(createDiffArgsResponse('c1', 1));
            const stream2 = createMockStream(createDiffArgsResponse('c2', 2));
            const stream3 = createMockStream(createDiffArgsResponse('c3', 3));

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
                setTimeout(() => reject(new Error('HANG DETECTED: Stream did not finish within 5 seconds')), 5000)
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
                console.error('課題2 error:', e);
                expect(e.message).not.toContain('HANG DETECTED');
            }

            const finishParts = parts.filter(p => p.type === 'finish');
            expect(finishParts.length).toBeGreaterThanOrEqual(1);
            expect(finishParts[finishParts.length - 1].finishReason).toBe('stop');
        });

        /**
         * 課題2: 同じツールに対してFallbackを繰り返す（無限ループ）
         * 
         * 外部ツールが同じ引数で繰り返し呼ばれると、A2Aサーバーは tool-call-confirmation
         * として（確認待ち状態）で返し、プロバイダは auto-confirm で「Proceed」を送り続ける。
         * これが無限に続くとハングする。
         * 
         * 期待: MAX_TOOL_CONFIRM制限（デフォルト1回）により、
         *       同じ tool-call-confirmation が繰り返された場合、
         *       有限時間内にストリームが finish(stop) で終了すること。
         *       また、有限回のHTTPリクエストで完了すること。
         */
        it('課題2: 外部ツールの tool-call-confirmation ループが制限回数で停止すること', async () => {
            const providerForTest = new OpenCodeGeminiA2AProvider(mockModelId, { 
                host: '127.0.0.1', 
                port: 8080,
            });

            const createToolConfirmResponse = (callId: string, turnIdx: number) => [
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
                                    data: { request: { callId, name: 'read_file', args: JSON.stringify({ filePath: '/tmp/test.txt' }) } }
                                }]
                            }
                        },
                        metadata: { coderAgent: { kind: 'tool-call-confirmation' } }
                    }
                })}\n\n`,
            ];

            // MAX_TOOL_CONFIRM = 1 なので、2回目で停止されるはず。
            // 3つ分のストリームを準備（3番目は到達しないはず）
            const stream1 = createMockStream(createToolConfirmResponse('c1', 1));
            const stream2 = createMockStream(createToolConfirmResponse('c2', 2));
            const stream3 = createMockStream(createToolConfirmResponse('c3', 3));

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

            const { stream } = await providerForTest.doStream({
                inputFormat: 'messages',
                mode: { type: 'regular', tools: [{ type: 'function', name: 'read_file', parameters: {} }] },
                prompt,
            });

            const reader = stream.getReader();
            const parts: any[] = [];

            const timeout = new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('HANG DETECTED: Stream did not finish within 5 seconds')), 5000)
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

            // ストリームが有限時間で完了すること
            const finishParts = parts.filter(p => p.type === 'finish');
            expect(finishParts.length).toBeGreaterThanOrEqual(1);
            expect(finishParts[finishParts.length - 1].finishReason).toBe('stop');

            // 無限にリクエストが送られていないこと（MAX_TOOL_CONFIRM=1 で 3回目には到達しない）
            expect(callIdx).toBeLessThanOrEqual(3);
        });

        /**
         * 課題3: 思考だけで回答がされない
         * 
         * エージェントが内部ツール（activate_skill 等）だけを使い続けて、
         * テキスト応答を一切生成しないまま auto-confirm ループが MAX に達した場合、
         * ユーザーには "Thinking: ..." のみが表示されてテキスト応答がない状態になる。
         * 
         * 期待: auto-confirm ループの上限に達した場合でも、
         *       テキスト（text-delta）が1つも emit されていないならば、
         *       ユーザーに「回答がありませんでした」旨のテキストメッセージを emit してから
         *       finish(stop) で終了すること。
         */
        it('課題3: テキストなしで内部ツールループが上限に達した場合、ユーザーにメッセージを返すこと', async () => {
            // maxAutoConfirm を小さくしてテスト高速化
            const providerForTest = new OpenCodeGeminiA2AProvider(mockModelId, { 
                host: '127.0.0.1', 
                port: 8080,
                maxToolCallFrequency: 100, // ループ検知ではなく MAX_AUTO_CONFIRM に到達させる
                maxAutoConfirm: 5,         // テスト用に小さく
            });

            // 内部ツールだけを含む応答（テキスト応答なし）を作る
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

            // maxAutoConfirm=5 としたので 10 ターン分で十分
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

            const timeout = new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('HANG DETECTED: Stream did not finish within 10 seconds')), 10000)
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

            // テキスト応答が存在すること（ユーザーに何かメッセージが届く）
            const textDeltas = parts.filter(p => p.type === 'text-delta');
            expect(textDeltas.length).toBeGreaterThanOrEqual(1);
            
            // テキスト内容に「回答がありませんでした」等のフォールバックメッセージが含まれること
            const allText = textDeltas.map(p => p.delta).join('');
            expect(allText.length).toBeGreaterThan(0);

            // ストリームが finish で正常に終了すること
            const finishParts = parts.filter(p => p.type === 'finish');
            expect(finishParts.length).toBeGreaterThanOrEqual(1);
            expect(finishParts[finishParts.length - 1].finishReason).toBe('stop');
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
