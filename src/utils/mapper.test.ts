import { describe, it, expect, vi } from 'vitest';
import { mapPromptToA2AJsonRpcRequest, mapA2AResponseToStreamParts, A2AStreamMapper } from './mapper';
import type { LanguageModelV1Prompt } from '@ai-sdk/provider';
import type { A2AResponseResult } from '../schemas';

describe('mapper', () => {
    describe('mapPromptToA2AJsonRpcRequest', () => {
        it('should map empty prompt', () => {
            const req = mapPromptToA2AJsonRpcRequest([]);
            expect(req.jsonrpc).toBe('2.0');
            const part = req.params.message.parts[0] as any;
            expect(part.kind).toBe('text');
            expect(part.text).toBe('(empty prompt)');
        });

        it('should map user message correctly', () => {
            const prompt: LanguageModelV1Prompt = [
                { role: 'user', content: [{ type: 'text', text: 'Hello' }] }
            ];
            const req = mapPromptToA2AJsonRpcRequest(prompt);
            const part = req.params.message.parts[0] as any;
            expect(part.kind).toBe('text');
            expect(part.text).toBe('Hello');
            expect(req.params.message.role).toBe('user');
        });

        it('should concatenate multiple text parts for a user message', () => {
            const prompt: LanguageModelV1Prompt = [
                { role: 'user', content: [{ type: 'text', text: 'Hello ' }, { type: 'text', text: 'World' }] }
            ];
            const req = mapPromptToA2AJsonRpcRequest(prompt);
            expect(req.params.message.parts.length).toBe(2);
            expect((req.params.message.parts[0] as any).kind).toBe('text');
            expect((req.params.message.parts[0] as any).text).toBe('Hello ');
            expect((req.params.message.parts[1] as any).kind).toBe('text');
            expect((req.params.message.parts[1] as any).text).toBe('World');
            expect(req.params.message.role).toBe('user');
        });

        it('should handle system message', () => {
            const prompt: LanguageModelV1Prompt = [
                { role: 'system', content: 'You are a helpful assistant.' }
            ];
            const req = mapPromptToA2AJsonRpcRequest(prompt);
            const part = req.params.message.parts[0] as any;
            expect(part.kind).toBe('text');
            expect(part.text).toBe('You are a helpful assistant.');
        });

        it('should format tool results when prompt ends with tool role', () => {
            const prompt: LanguageModelV1Prompt = [
                { role: 'tool', content: [{ type: 'tool-result', toolCallId: 'call1', toolName: 'getWeather', result: { weather: 'sunny' } }] }
            ];
            const req = mapPromptToA2AJsonRpcRequest(prompt);
            const part = req.params.message.parts[0] as any;
            expect(part.kind).toBe('text');
            expect(part.text).toContain('[Tool Result: getWeather (call1)]');
            expect(part.text).toContain('"weather":"sunny"');
        });

        it('should include user text with tool results when prompt ends with tool', () => {
            const prompt: LanguageModelV1Prompt = [
                { role: 'user', content: [{ type: 'text', text: 'Where is Tokyo?' }] },
                { role: 'assistant', content: [{ type: 'text', text: 'Tokyo is in Japan.' }] },
                { role: 'tool', content: [{ type: 'tool-result', toolCallId: 'call1', toolName: 'getWeather', result: { weather: 'sunny' } }] }
            ];
            const req = mapPromptToA2AJsonRpcRequest(prompt);
            expect(req.params.message.parts.length).toBe(2);
            expect((req.params.message.parts[0] as any).kind).toBe('text');
            expect((req.params.message.parts[0] as any).text).toContain('Where is Tokyo?');
            expect((req.params.message.parts[1] as any).kind).toBe('text');
            expect((req.params.message.parts[1] as any).text).toContain('[Tool Result: getWeather (call1)]');
            expect(req.params.message.role).toBe('user');
        });

        it('should format tool error results with [Tool Error prefix', () => {
            const prompt: LanguageModelV1Prompt = [
                { role: 'tool', content: [{ type: 'tool-result', toolCallId: 'call2', toolName: 'failTool', result: 'something went wrong', isError: true }] }
            ];
            const req = mapPromptToA2AJsonRpcRequest(prompt);
            const part = req.params.message.parts[0] as any;
            expect(part.kind).toBe('text');
            expect(part.text).toContain('[Tool Error: failTool (call2)]');
        });

        it('should correctly map multimodal image parts (Buffer)', () => {
            const buffer = Buffer.from('hello');
            const prompt: LanguageModelV1Prompt = [{
                role: 'user', content: [{ type: 'image', image: buffer, mimeType: 'image/jpeg' }]
            }];
            const req = mapPromptToA2AJsonRpcRequest(prompt);
            const part = req.params.message.parts[0] as any;
            expect(part.kind).toBe('image');
            expect(part.image.bytes).toBe(buffer.toString('base64'));
            expect(part.image.uri).toBeUndefined();
            expect(part.image.mimeType).toBe('image/jpeg');
        });

        it('should correctly map multimodal image parts (HTTP URL)', () => {
            const prompt: LanguageModelV1Prompt = [{
                role: 'user', content: [{ type: 'image', image: 'https://example.com/image.png' as any }]
            }];
            const req = mapPromptToA2AJsonRpcRequest(prompt);
            const part = req.params.message.parts[0] as any;
            expect(part.kind).toBe('image');
            expect(part.image.bytes).toBeUndefined();
            expect(part.image.uri).toBe('https://example.com/image.png');
            expect(part.image.mimeType).toBeUndefined();
        });

        it('should correctly map multimodal file parts (data URI)', () => {
            const prompt: LanguageModelV1Prompt = [{
                role: 'user', content: [{ type: 'file', data: 'data:application/pdf;base64,JVBERi0xLjQKJ...' as any, mimeType: 'application/pdf' }]
            }];
            const req = mapPromptToA2AJsonRpcRequest(prompt);
            const part = req.params.message.parts[0] as any;
            expect(part.kind).toBe('file');
            expect(part.file.fileWithBytes).toBe('JVBERi0xLjQKJ...');
            expect(part.file.uri).toBeUndefined();
            expect(part.file.mimeType).toBe('application/pdf');
        });

        it('should correctly map multimodal file parts (raw base64 string)', () => {
            const prompt: LanguageModelV1Prompt = [{
                role: 'user', content: [{ type: 'file', data: 'JVBERi0xLjQKJ...' as any, mimeType: 'application/pdf' }]
            }];
            const req = mapPromptToA2AJsonRpcRequest(prompt);
            const part = req.params.message.parts[0] as any;
            expect(part.kind).toBe('file');
            expect(part.file.fileWithBytes).toBe('JVBERi0xLjQKJ...');
            expect(part.file.uri).toBeUndefined();
            expect(part.file.mimeType).toBe('application/pdf');
        });

        it('should correctly map multimodal image parts (Uint8Array)', () => {
            const arr = new Uint8Array([104, 101, 108, 108, 111]); // 'hello'
            const prompt: LanguageModelV1Prompt = [{
                role: 'user', content: [{ type: 'image', image: arr, mimeType: 'image/png' }]
            }];
            const req = mapPromptToA2AJsonRpcRequest(prompt);
            const part = req.params.message.parts[0] as any;
            expect(part.kind).toBe('image');
            expect(part.image.bytes).toBe(typeof Buffer !== 'undefined' ? Buffer.from(arr).toString('base64') : btoa('hello'));
            expect(part.image.mimeType).toBe('image/png');
        });

        it('should correctly map multimodal file parts (ArrayBuffer)', () => {
            const arr = new Uint8Array([104, 101, 108, 108, 111]); // 'hello'
            const prompt: LanguageModelV1Prompt = [{
                role: 'user', content: [{ type: 'file', data: arr.buffer as any, mimeType: 'text/plain' }]
            }];
            const req = mapPromptToA2AJsonRpcRequest(prompt);
            const part = req.params.message.parts[0] as any;
            expect(part.kind).toBe('file');
            expect(part.file.fileWithBytes).toBe(typeof Buffer !== 'undefined' ? Buffer.from(arr).toString('base64') : btoa('hello'));
            expect(part.file.mimeType).toBe('text/plain');
        });

        it('should correctly map multimodal image parts (URL object)', () => {
            const prompt: LanguageModelV1Prompt = [{
                role: 'user', content: [{ type: 'image', image: new URL('https://example.com/test.jpg') }]
            }];
            const req = mapPromptToA2AJsonRpcRequest(prompt);
            const part = req.params.message.parts[0] as any;
            expect(part.kind).toBe('image');
            expect(part.image.uri).toBe('https://example.com/test.jpg');
            expect(part.image.bytes).toBeUndefined();
        });

        it('should correctly map multimodal file parts (data URI with parameters)', () => {
            const prompt: LanguageModelV1Prompt = [{
                role: 'user', content: [{ type: 'file', data: 'data:text/plain;charset=utf-8;base64,aGVsbG8=' as any, mimeType: 'text/plain;charset=utf-8' }]
            }];
            const req = mapPromptToA2AJsonRpcRequest(prompt);
            const part = req.params.message.parts[0] as any;
            expect(part.kind).toBe('file');
            expect(part.file.fileWithBytes).toBe('aGVsbG8=');
            expect(part.file.mimeType).toBe('text/plain;charset=utf-8');
        });

        it('should correctly map multimodal file parts (percent-encoded non-base64 data URI)', () => {
            const prompt: LanguageModelV1Prompt = [{
                role: 'user', content: [{ type: 'file', data: 'data:text/plain,%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A' as any, mimeType: 'text/plain' }] // URL-encoded "あいうえお"
            }];
            const req = mapPromptToA2AJsonRpcRequest(prompt);
            const part = req.params.message.parts[0] as any;
            expect(part.kind).toBe('file');
            expect(part.file.fileWithBytes).toBe(typeof Buffer !== 'undefined' ? Buffer.from('あいうえお').toString('base64') : btoa(Array.from(new TextEncoder().encode('あいうえお'), b => String.fromCharCode(b)).join('')));
            expect(part.file.mimeType).toBe('text/plain');
        });

        it('should drop malformed or unsupported parts and warn', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            const prompt: LanguageModelV1Prompt = [{
                role: 'user', content: [
                    { type: 'image', image: { unsupported: true } as any },
                    { type: 'file', data: 'data:text/plain,%FF' as any, mimeType: 'text/plain' },
                    { type: 'file', data: 'data:malformed-no-comma' as any, mimeType: 'text/plain' },
                    { type: 'text', text: 'valid text' }
                ]
            }];
            const req = mapPromptToA2AJsonRpcRequest(prompt);
            expect(req.params.message.parts.length).toBe(1);
            expect((req.params.message.parts[0] as any).kind).toBe('text');
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unsupported image format'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Malformed percent-encoding in data URI payload.'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Malformed data URI format.'));
            consoleSpy.mockRestore();
        });

        it('should select the latest user message when multiple user messages exist', () => {
            const prompt: LanguageModelV1Prompt = [
                { role: 'user', content: [{ type: 'text', text: 'First question' }] },
                { role: 'user', content: [{ type: 'text', text: 'Second question' }] }
            ];
            const req = mapPromptToA2AJsonRpcRequest(prompt);
            const part = req.params.message.parts[0] as any;
            expect(part.kind).toBe('text');
            expect(part.text).toBe('Second question');
            expect(req.params.message.role).toBe('user');
        });

        it('should include contextId when provided via options', () => {
            const prompt: LanguageModelV1Prompt = [
                { role: 'user', content: [{ type: 'text', text: 'Follow up' }] }
            ];
            const req = mapPromptToA2AJsonRpcRequest(prompt, { contextId: 'ctx-123' });
            expect(req.params.contextId).toBe('ctx-123');
        });

        it('should include taskId when provided via options', () => {
            const prompt: LanguageModelV1Prompt = [
                { role: 'user', content: [{ type: 'text', text: 'Tool result follow up' }] }
            ];
            const req = mapPromptToA2AJsonRpcRequest(prompt, { taskId: 'task-456' });
            expect(req.params.taskId).toBe('task-456');
        });

        it('should not include contextId/taskId when not provided', () => {
            const prompt: LanguageModelV1Prompt = [
                { role: 'user', content: [{ type: 'text', text: 'Hello' }] }
            ];
            const req = mapPromptToA2AJsonRpcRequest(prompt);
            expect(req.params.contextId).toBeUndefined();
            expect(req.params.taskId).toBeUndefined();
        });

        it('should maintain backward compatibility with tools array as second argument', () => {
            const prompt: LanguageModelV1Prompt = [
                { role: 'user', content: [{ type: 'text', text: 'Hello' }] }
            ];
            const tools = [{ name: 'myTool' }];
            const req = mapPromptToA2AJsonRpcRequest(prompt, tools);
            expect(req.params.configuration?.tools).toEqual(tools);
        });
    });

    // 後方互換 mapA2AResponseToStreamParts (ステートレスラッパー) のテスト
    describe('mapA2AResponseToStreamParts', () => {
        it('should map text delta', () => {
            const result: A2AResponseResult = {
                kind: 'status-update',
                taskId: 't1',
                status: {
                    state: 'working',
                    message: {
                        parts: [{ kind: 'text', text: 'hello' }]
                    }
                }
            };
            const parts = mapA2AResponseToStreamParts(result);
            expect(parts.length).toBe(1);
            expect(parts[0].type).toBe('text-delta');
            if (parts[0].type === 'text-delta') {
                expect(parts[0].textDelta).toBe('hello');
            }
        });

        it('should ignore task kind', () => {
            const result: A2AResponseResult = {
                kind: 'task',
                id: '1',
                contextId: 'c1',
                status: { state: 'working' }
            };
            const parts = mapA2AResponseToStreamParts(result);
            expect(parts.length).toBe(0);
        });

        it('should map finish reason', () => {
            const result: A2AResponseResult = {
                kind: 'status-update',
                taskId: 't1',
                final: true,
                status: { state: 'stop' }
            };
            const parts = mapA2AResponseToStreamParts(result);
            expect(parts.length).toBe(1);
            expect(parts[0].type).toBe('finish');
            if (parts[0].type === 'finish') {
                expect(parts[0].finishReason).toBe('stop');
            }
        });

        it('should map unknown status.state to finishReason "other"', () => {
            const result: A2AResponseResult = {
                kind: 'status-update',
                taskId: 't1',
                final: true,
                status: { state: 'foo' as any }
            };
            const parts = mapA2AResponseToStreamParts(result);
            expect(parts[0].type).toBe('finish');
            if (parts[0].type === 'finish') {
                expect(parts[0].finishReason).toBe('other');
            }
        });

        it('should map finish reason as error when state is error', () => {
            const result: A2AResponseResult = {
                kind: 'status-update',
                taskId: 't1',
                final: true,
                status: { state: 'error' }
            };
            const parts = mapA2AResponseToStreamParts(result);
            if (parts[0].type === 'finish') {
                expect(parts[0].finishReason).toBe('error');
            }
        });

        it('should NOT emit text-delta when state is not working', () => {
            const resultStop: A2AResponseResult = {
                kind: 'status-update',
                taskId: 't1',
                status: {
                    state: 'stop',
                    message: { parts: [{ kind: 'text', text: 'ignored text' }] }
                }
            };
            expect(mapA2AResponseToStreamParts(resultStop).filter(p => p.type === 'text-delta').length).toBe(0);
        });

        it('should map token usage correctly', () => {
            const result: A2AResponseResult = {
                kind: 'status-update',
                taskId: 't1',
                final: true,
                status: { state: 'stop' },
                usage: { promptTokens: 10, completionTokens: 20 }
            };
            const parts = mapA2AResponseToStreamParts(result);
            const finishPart = parts.find(p => p.type === 'finish');
            if (finishPart && finishPart.type === 'finish') {
                expect(finishPart.usage?.promptTokens).toBe(10);
                expect(finishPart.usage?.completionTokens).toBe(20);
            }
        });

        it('should return Number.NaN for promptTokens and completionTokens when usage is missing', () => {
            const result: A2AResponseResult = {
                kind: 'status-update',
                taskId: 't1',
                final: true,
                status: { state: 'stop' }
            };
            const parts = mapA2AResponseToStreamParts(result);
            const finishPart = parts.find(p => p.type === 'finish');
            if (finishPart && finishPart.type === 'finish') {
                expect(Number.isNaN(finishPart.usage?.promptTokens)).toBe(true);
                expect(Number.isNaN(finishPart.usage?.completionTokens)).toBe(true);
            }
        });

        it('should map data parts to tool-call stream parts when state is working', () => {
            const result: A2AResponseResult = {
                kind: 'status-update',
                taskId: 't1',
                status: {
                    state: 'working',
                    message: {
                        parts: [{
                            kind: 'data',
                            data: {
                                request: { callId: 'call-123', name: 'getWeather', args: { location: 'Tokyo' } }
                            }
                        }]
                    }
                }
            };
            const parts = mapA2AResponseToStreamParts(result);
            expect(parts.length).toBe(1);
            expect(parts[0].type).toBe('tool-call');
            if (parts[0].type === 'tool-call') {
                expect(parts[0].toolCallId).toBe('call-123');
                expect(parts[0].toolName).toBe('getWeather');
                expect(parts[0].args).toBe(JSON.stringify({ location: 'Tokyo' }));
            }
        });

        it('should extract tool-calls and finish reason when state is input-required and final is true', () => {
            const result: A2AResponseResult = {
                kind: 'status-update',
                taskId: 't1',
                final: true,
                status: {
                    state: 'input-required',
                    message: {
                        parts: [{
                            kind: 'data',
                            data: {
                                request: { callId: 'call-456', name: 'getWeather', args: { location: 'Osaka' } }
                            }
                        }]
                    }
                }
            };
            const parts = mapA2AResponseToStreamParts(result);
            expect(parts.length).toBe(2);
            expect(parts[0].type).toBe('tool-call');
            expect(parts[1].type).toBe('finish');
            if (parts[1].type === 'finish') {
                expect(parts[1].finishReason).toBe('tool-calls');
            }
        });

        it('should generate a UUID for toolCallId if callId is not provided', () => {
            const result: A2AResponseResult = {
                kind: 'status-update',
                taskId: 't1',
                status: {
                    state: 'working',
                    message: {
                        parts: [{
                            kind: 'data',
                            data: { request: { name: 'getWeather', args: {} } }
                        }]
                    }
                }
            };
            const parts = mapA2AResponseToStreamParts(result);
            expect(parts.length).toBe(1);
            if (parts[0].type === 'tool-call') {
                expect(parts[0].toolCallId).toBeDefined();
                expect(parts[0].toolCallId.length).toBeGreaterThan(0);
            }
        });

        it('should ignore data part if toolName is undefined', () => {
            const result: A2AResponseResult = {
                kind: 'status-update',
                taskId: 't1',
                status: {
                    state: 'working',
                    message: {
                        parts: [{
                            kind: 'data',
                            data: { request: { callId: 'call-789', args: {} } }
                        }]
                    }
                }
            };
            const parts = mapA2AResponseToStreamParts(result);
            expect(parts.length).toBe(0);
        });
    });

    // A2AStreamMapper（ステートフル）のテスト
    describe('A2AStreamMapper', () => {
        describe('snapshot deduplication', () => {
            it('should deduplicate snapshot text: A -> AB -> ABC emits A, B, C', () => {
                const mapper = new A2AStreamMapper();

                const makeUpdate = (text: string): A2AResponseResult => ({
                    kind: 'status-update',
                    taskId: 't1',
                    status: {
                        state: 'working',
                        message: { parts: [{ kind: 'text', text }] }
                    }
                });

                const parts1 = mapper.mapResult(makeUpdate('A'));
                expect(parts1.length).toBe(1);
                expect(parts1[0].type).toBe('text-delta');
                if (parts1[0].type === 'text-delta') expect(parts1[0].textDelta).toBe('A');

                const parts2 = mapper.mapResult(makeUpdate('AB'));
                expect(parts2.length).toBe(1);
                if (parts2[0].type === 'text-delta') expect(parts2[0].textDelta).toBe('B');

                const parts3 = mapper.mapResult(makeUpdate('ABC'));
                expect(parts3.length).toBe(1);
                if (parts3[0].type === 'text-delta') expect(parts3[0].textDelta).toBe('C');
            });

            it('should emit full text when new text does not start with previous', () => {
                const mapper = new A2AStreamMapper();

                const makeUpdate = (text: string): A2AResponseResult => ({
                    kind: 'status-update',
                    taskId: 't1',
                    status: {
                        state: 'working',
                        message: { parts: [{ kind: 'text', text }] }
                    }
                });

                mapper.mapResult(makeUpdate('Hello'));
                const parts = mapper.mapResult(makeUpdate('World'));
                expect(parts.length).toBe(1);
                if (parts[0].type === 'text-delta') expect(parts[0].textDelta).toBe('World');
            });

            it('should not emit empty delta when snapshot is identical', () => {
                const mapper = new A2AStreamMapper();

                const makeUpdate = (text: string): A2AResponseResult => ({
                    kind: 'status-update',
                    taskId: 't1',
                    status: {
                        state: 'working',
                        message: { parts: [{ kind: 'text', text }] }
                    }
                });

                mapper.mapResult(makeUpdate('Hello'));
                const parts = mapper.mapResult(makeUpdate('Hello'));
                expect(parts.length).toBe(0);
            });

            it('should handle delta-style text correctly (no prefix overlap)', () => {
                const mapper = new A2AStreamMapper();

                const makeUpdate = (text: string): A2AResponseResult => ({
                    kind: 'status-update',
                    taskId: 't1',
                    status: {
                        state: 'working',
                        message: { parts: [{ kind: 'text', text }] }
                    }
                });

                const parts1 = mapper.mapResult(makeUpdate('chunk1'));
                expect(parts1.length).toBe(1);
                if (parts1[0].type === 'text-delta') expect(parts1[0].textDelta).toBe('chunk1');

                const parts2 = mapper.mapResult(makeUpdate('chunk2'));
                expect(parts2.length).toBe(1);
                if (parts2[0].type === 'text-delta') expect(parts2[0].textDelta).toBe('chunk2');
            });

            it('should handle snapshot deduplication for multiple text parts independently', () => {
                const mapper = new A2AStreamMapper();

                const makeUpdate = (text1: string, text2: string): A2AResponseResult => ({
                    kind: 'status-update',
                    taskId: 't1',
                    status: {
                        state: 'working',
                        message: { parts: [{ kind: 'text', text: text1 }, { kind: 'text', text: text2 }] }
                    }
                });

                const parts1 = mapper.mapResult(makeUpdate('A', 'X'));
                expect(parts1.length).toBe(2);
                expect(parts1[0].type).toBe('text-delta');
                if (parts1[0].type === 'text-delta') expect(parts1[0].textDelta).toBe('A');
                if (parts1[1].type === 'text-delta') expect(parts1[1].textDelta).toBe('X');

                const parts2 = mapper.mapResult(makeUpdate('AB', 'XY'));
                expect(parts2.length).toBe(2);
                if (parts2[0].type === 'text-delta') expect(parts2[0].textDelta).toBe('B');
                if (parts2[1].type === 'text-delta') expect(parts2[1].textDelta).toBe('Y');
            });
        });

        describe('tool call deduplication', () => {
            it('should deduplicate tool calls with same callId', () => {
                const mapper = new A2AStreamMapper();

                const makeUpdate = (): A2AResponseResult => ({
                    kind: 'status-update',
                    taskId: 't1',
                    status: {
                        state: 'working',
                        message: {
                            parts: [{
                                kind: 'data',
                                data: {
                                    request: { callId: 'call-dup', name: 'getTime', args: {} }
                                }
                            }]
                        }
                    }
                });

                const parts1 = mapper.mapResult(makeUpdate());
                expect(parts1.filter(p => p.type === 'tool-call').length).toBe(1);

                const parts2 = mapper.mapResult(makeUpdate());
                expect(parts2.filter(p => p.type === 'tool-call').length).toBe(0);
            });

            it('should deduplicate tool calls over snapshots but preserve multiple same-arg calls in the same snapshot', () => {
                const mapper = new A2AStreamMapper();

                const makeUpdate = (toolReqs: any[]): A2AResponseResult => ({
                    kind: 'status-update',
                    taskId: 't1',
                    status: {
                        state: 'working',
                        message: {
                            parts: toolReqs.map(req => ({
                                kind: 'data',
                                data: { request: req }
                            }))
                        }
                    }
                });

                // First snapshot has one tool call
                const parts1 = mapper.mapResult(makeUpdate([
                    { name: 'getWeather', args: { location: 'Tokyo' } }
                ]));
                expect(parts1.filter(p => p.type === 'tool-call').length).toBe(1);

                // Second snapshot has TWO identical tool calls (the first is identical and should be deduplicated, the second is NEW)
                const parts2 = mapper.mapResult(makeUpdate([
                    { name: 'getWeather', args: { location: 'Tokyo' } },
                    { name: 'getWeather', args: { location: 'Tokyo' } }
                ]));
                expect(parts2.filter(p => p.type === 'tool-call').length).toBe(1);

                // Third snapshot is identical to the second snapshot (so 0 new emitted parts)
                const parts3 = mapper.mapResult(makeUpdate([
                    { name: 'getWeather', args: { location: 'Tokyo' } },
                    { name: 'getWeather', args: { location: 'Tokyo' } }
                ]));
                expect(parts3.filter(p => p.type === 'tool-call').length).toBe(0);
            });
        });

        describe('thoughts (reasoning)', () => {
            it('should map thought data to reasoning stream part', () => {
                const mapper = new A2AStreamMapper();

                const result: A2AResponseResult = {
                    kind: 'status-update',
                    taskId: 't1',
                    status: {
                        state: 'working',
                        message: {
                            parts: [{
                                kind: 'data',
                                data: {
                                    subject: 'Analyzing the code',
                                    description: 'I\'m reviewing the function implementation.'
                                }
                            }]
                        }
                    },
                    metadata: { coderAgent: { kind: 'thought' } }
                };

                const parts = mapper.mapResult(result);
                expect(parts.length).toBe(1);
                expect(parts[0].type).toBe('reasoning');
                if (parts[0].type === 'reasoning') {
                    expect(parts[0].textDelta).toBe('[Analyzing the code] I\'m reviewing the function implementation.\n');
                }
            });

            it('should map thought with subject only', () => {
                const mapper = new A2AStreamMapper();

                const result: A2AResponseResult = {
                    kind: 'status-update',
                    taskId: 't1',
                    status: {
                        state: 'working',
                        message: {
                            parts: [{
                                kind: 'data',
                                data: { subject: 'Processing' }
                            }]
                        }
                    },
                    metadata: { coderAgent: { kind: 'thought' } }
                };

                const parts = mapper.mapResult(result);
                expect(parts.length).toBe(1);
                expect(parts[0].type).toBe('reasoning');
                if (parts[0].type === 'reasoning') {
                    expect(parts[0].textDelta).toBe('[Processing]\n');
                }
            });

            it('should not confuse thoughts with tool calls', () => {
                const mapper = new A2AStreamMapper();

                const result: A2AResponseResult = {
                    kind: 'status-update',
                    taskId: 't1',
                    status: {
                        state: 'working',
                        message: {
                            parts: [
                                {
                                    kind: 'data',
                                    data: { subject: 'Thinking', description: 'Planning next steps' }
                                },
                                {
                                    kind: 'data',
                                    data: {
                                        request: { callId: 'call-mixed', name: 'runCommand', args: { cmd: 'ls' } }
                                    }
                                }
                            ]
                        }
                    },
                    metadata: { coderAgent: { kind: 'thought' } }
                };

                const parts = mapper.mapResult(result);
                const reasoningParts = parts.filter(p => p.type === 'reasoning');
                const toolCallParts = parts.filter(p => p.type === 'tool-call');
                expect(reasoningParts.length).toBe(1);
                expect(toolCallParts.length).toBe(1);
                if (reasoningParts[0].type === 'reasoning') {
                    expect(reasoningParts[0].textDelta).toContain('Thinking');
                }
                if (toolCallParts[0].type === 'tool-call') {
                    expect(toolCallParts[0].toolName).toBe('runCommand');
                }
            });

            it('should detect thoughts via metadata.coderAgent.kind fallback', () => {
                const mapper = new A2AStreamMapper();

                const result: A2AResponseResult = {
                    kind: 'status-update',
                    taskId: 't1',
                    status: {
                        state: 'working',
                        message: {
                            parts: [{
                                kind: 'data',
                                data: {
                                    description: 'No subject, just description via metadata'
                                }
                            }]
                        }
                    },
                    metadata: { coderAgent: { kind: 'thought' } }
                };

                const parts = mapper.mapResult(result);
                expect(parts.length).toBe(1);
                expect(parts[0].type).toBe('reasoning');
                if (parts[0].type === 'reasoning') {
                    expect(parts[0].textDelta).toBe('No subject, just description via metadata\n');
                }
            });
        });

        describe('combined scenarios', () => {
            it('should handle snapshot text followed by finish', () => {
                const mapper = new A2AStreamMapper();

                const textUpdate: A2AResponseResult = {
                    kind: 'status-update',
                    taskId: 't1',
                    status: {
                        state: 'working',
                        message: { parts: [{ kind: 'text', text: 'Hello World' }] }
                    }
                };
                const finishUpdate: A2AResponseResult = {
                    kind: 'status-update',
                    taskId: 't1',
                    final: true,
                    status: { state: 'input-required' }
                };

                const textParts = mapper.mapResult(textUpdate);
                expect(textParts.length).toBe(1);
                if (textParts[0].type === 'text-delta') expect(textParts[0].textDelta).toBe('Hello World');

                const finishParts = mapper.mapResult(finishUpdate);
                expect(finishParts.length).toBe(1);
                expect(finishParts[0].type).toBe('finish');
                if (finishParts[0].type === 'finish') {
                    expect(finishParts[0].finishReason).toBe('tool-calls');
                }
            });
        });
    });
});
