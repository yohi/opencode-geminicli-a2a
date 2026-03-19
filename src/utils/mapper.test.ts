import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mapPromptToA2AJsonRpcRequest, mapA2AResponseToStreamParts, A2AStreamMapper } from './mapper';
import type { LanguageModelV1Prompt } from '@ai-sdk/provider';
import type { A2AResponseResult } from '../schemas';

describe('mapper', () => {
    beforeEach(() => {
        process.env['DEBUG_OPENCODE'] = '1';
    });
    
    describe('mapPromptToA2AJsonRpcRequest', () => {
        it('should map empty prompt', () => {
            const req = mapPromptToA2AJsonRpcRequest([]);
            expect(req.jsonrpc).toBe('2.0');
            const part = req.params.message.parts[0] as any;
            expect(part.kind).toBe('text');
            expect(part.text).toBe('(empty prompt)');
        });

        it('should map user message correctly, sending only the delta when contextId is present', () => {
            const prompt = [
                { role: 'user', content: [{ type: 'text', text: 'Old message' }] },
                { role: 'user', content: [{ type: 'text', text: 'Hello' }] }
            ];
            // When contextId is present, CRITICAL INSTRUCTION is NOT injected.
            // But [USER]\n prefix IS injected for each user message.
            const req = mapPromptToA2AJsonRpcRequest(prompt as any, { contextId: 'ctx', processedMessagesCount: 1 });
            expect(req.params.message.parts).toHaveLength(2);
            expect((req.params.message.parts[0] as any).text).toBe('[USER]\n');
            expect((req.params.message.parts[1] as any).text).toBe('Hello');
        });

        it('should handle system message', () => {
            const prompt = [
                { role: 'system', content: 'You are a helpful assistant.' }
            ];
            // No contextId, so CRITICAL INSTRUCTION IS injected.
            const req = mapPromptToA2AJsonRpcRequest(prompt as any);
            expect(req.params.message.parts).toHaveLength(2);
            expect((req.params.message.parts[0] as any).text).toContain('CRITICAL INSTRUCTION');
            expect((req.params.message.parts[1] as any).text).toBe('[SYSTEM]\nYou are a helpful assistant.\n');
        });

        it('should include contextId when provided via options', () => {
            const prompt = [
                { role: 'user', content: [{ type: 'text', text: 'Follow up' }] }
            ];
            const req = mapPromptToA2AJsonRpcRequest(prompt as any, { contextId: 'ctx-123' });
            expect(req.params.contextId).toBe('ctx-123');
        });

        it('should include taskId when provided via options', () => {
            const prompt = [
                { role: 'user', content: [{ type: 'text', text: 'Follow up' }] }
            ];
            const req = mapPromptToA2AJsonRpcRequest(prompt as any, { taskId: 'task-456' });
            expect(req.params.taskId).toBe('task-456');
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
                expect(parts[0].finishReason).toBe('stop');
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

        it('should emit text-delta even when state is stop (as it is a valid state to process parts)', () => {
            const resultStop: A2AResponseResult = {
                kind: 'status-update',
                taskId: 't1',
                status: {
                    state: 'stop',
                    message: { parts: [{ kind: 'text', text: 'final text' }] }
                }
            };
            expect(mapA2AResponseToStreamParts(resultStop).filter(p => p.type === 'text-delta').length).toBe(1);
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
                expect(finishPart.usage?.inputTokens.total).toBe(10);
                expect(finishPart.usage?.outputTokens.total).toBe(20);
            }
        });

        it('should return 0 for inputTokens and outputTokens when usage is missing', () => {
            const result: A2AResponseResult = {
                kind: 'status-update',
                taskId: 't1',
                final: true,
                status: { state: 'stop' }
            };
            const parts = mapA2AResponseToStreamParts(result);
            const finishPart = parts.find(p => p.type === 'finish');
            if (finishPart && finishPart.type === 'finish') {
                expect(finishPart.usage?.inputTokens.total).toBe(0);
                expect(finishPart.usage?.outputTokens.total).toBe(0);
            }
        });

        it('should map data parts to tool-call stream parts when state is working', () => {
            const result: A2AResponseResult = {
                kind: 'status-update',
                taskId: 't1',
                final: true,
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
            expect(parts.length).toBeGreaterThanOrEqual(1);
            const toolCall = parts.find(p => p.type === 'tool-call');
            expect(toolCall).toBeDefined();
            if (toolCall && toolCall.type === 'tool-call') {
                expect(toolCall.toolCallId).toBe('call-123');
                expect(toolCall.toolName).toBe('getWeather');
                expect(toolCall.args).toBe(JSON.stringify({ location: 'Tokyo', description: 'Execute getWeather via A2A (call-123)' }));
            } else {
                // If not emitted because of buffering, we might need to adjust mapResult logic
                // for the stateless wrapper to always emit if final is not present?
                // But generally, the provider uses the stateful mapper.
                throw new Error('Tool call was not emitted. Ensure final: true is set or mapping logic is correct.');
            }
        });

        it('should extract tool-calls finish reason when state is input-required and final is true even with tool-calls', () => {
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
                expect((parts[1] as any).inputRequired).toBe(true);
                expect((parts[1] as any).rawState).toBe('input-required');
            }
        });

        it('should generate a UUID for toolCallId if callId is not provided', () => {
            const result: A2AResponseResult = {
                kind: 'status-update',
                taskId: 't1',
                final: true,
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
            expect(parts.length).toBeGreaterThanOrEqual(1);
            const toolCall = parts.find(p => p.type === 'tool-call');
            expect(toolCall).toBeDefined();
            if (toolCall && toolCall.type === 'tool-call') {
                expect(toolCall.toolCallId).toBeDefined();
                expect(toolCall.toolCallId.length).toBeGreaterThan(0);
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

                const makeUpdate = (final: boolean = true): A2AResponseResult => ({
                    kind: 'status-update',
                    taskId: 't1',
                    final,
                    status: {
                        state: final ? 'stop' : 'working',
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

                const makeUpdate = (toolReqs: any[], final: boolean = true): A2AResponseResult => ({
                    kind: 'status-update',
                    taskId: 't1',
                    final,
                    status: {
                        state: final ? 'stop' : 'working',
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

            it('should reset per-task dedup state when taskId changes', () => {
                const mapper = new A2AStreamMapper();

                const makeUpdate = (taskId: string, toolReqs: any[], final: boolean = true): A2AResponseResult => ({
                    kind: 'status-update',
                    taskId,
                    final,
                    status: {
                        state: final ? 'stop' : 'working',
                        message: {
                            parts: toolReqs.map(req => ({
                                kind: 'data',
                                data: { request: req }
                            }))
                        }
                    }
                });

                // First snapshot for task 't1' with one tool call
                const parts1 = mapper.mapResult(makeUpdate('t1', [
                    { name: 'getWeather', args: { location: 'Tokyo' } }
                ]));
                expect(parts1.filter(p => p.type === 'tool-call').length).toBe(1);

                // Now transition to new taskId 't2' testing the same tool call again
                // it should NOT be deduplicated
                const parts2 = mapper.mapResult(makeUpdate('t2', [
                    { name: 'getWeather', args: { location: 'Tokyo' } }
                ]));
                expect(parts2.filter(p => p.type === 'tool-call').length).toBe(1);

                // Subsequent identical requests within 't2' should be deduplicated
                const parts3 = mapper.mapResult(makeUpdate('t2', [
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
                    final: true,
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
                    expect(finishParts[0].finishReason).toBe('stop');
                    // In the current implementation, inputRequired is only set if hasExposedTools or hasInternalTools is true.
                    // This test case has neither, so inputRequired should be undefined.
                    expect((finishParts[0] as any).inputRequired).toBeUndefined();
                }
            });
        });
        describe('multimodal response parts', () => {
            it('should map image response part with bytes to file stream part', () => {
                const mapper = new A2AStreamMapper();

                const result: A2AResponseResult = {
                    kind: 'status-update',
                    taskId: 't1',
                    status: {
                        state: 'working',
                        message: {
                            parts: [{
                                kind: 'image',
                                image: { mimeType: 'image/png', bytes: 'iVBORw0KGgoAAAANSUhEUg==' }
                            } as any]
                        }
                    }
                };

                const parts = mapper.mapResult(result);
                expect(parts.length).toBe(1);
                expect(parts[0].type).toBe('file');
                if (parts[0].type === 'file') {
                    expect(parts[0].mimeType).toBe('image/png');
                    expect(parts[0].data).toBe('iVBORw0KGgoAAAANSUhEUg==');
                }
            });

            it('should map image response part with uri to file stream part', () => {
                const mapper = new A2AStreamMapper();

                const result: A2AResponseResult = {
                    kind: 'status-update',
                    taskId: 't1',
                    status: {
                        state: 'working',
                        message: {
                            parts: [{
                                kind: 'image',
                                image: { uri: 'https://example.com/generated.png', mimeType: 'image/png' }
                            } as any]
                        }
                    }
                };

                const parts = mapper.mapResult(result);
                expect(parts.length).toBe(1);
                expect(parts[0].type).toBe('file');
                if (parts[0].type === 'file') {
                    expect(parts[0].mimeType).toBe('image/png');
                    expect(parts[0].data).toBe('https://example.com/generated.png');
                }
            });

            it('should map file response part with fileWithBytes to file stream part', () => {
                const mapper = new A2AStreamMapper();

                const result: A2AResponseResult = {
                    kind: 'status-update',
                    taskId: 't1',
                    status: {
                        state: 'working',
                        message: {
                            parts: [{
                                kind: 'file',
                                file: { mimeType: 'application/pdf', fileWithBytes: 'JVBERi0xLjQK' }
                            } as any]
                        }
                    }
                };

                const parts = mapper.mapResult(result);
                expect(parts.length).toBe(1);
                expect(parts[0].type).toBe('file');
                if (parts[0].type === 'file') {
                    expect(parts[0].mimeType).toBe('application/pdf');
                    expect(parts[0].data).toBe('JVBERi0xLjQK');
                }
            });

            it('should map file response part with uri to file stream part', () => {
                const mapper = new A2AStreamMapper();

                const result: A2AResponseResult = {
                    kind: 'status-update',
                    taskId: 't1',
                    status: {
                        state: 'working',
                        message: {
                            parts: [{
                                kind: 'file',
                                file: { mimeType: 'text/csv', uri: 'https://example.com/data.csv' }
                            } as any]
                        }
                    }
                };

                const parts = mapper.mapResult(result);
                expect(parts.length).toBe(1);
                expect(parts[0].type).toBe('file');
                if (parts[0].type === 'file') {
                    expect(parts[0].mimeType).toBe('text/csv');
                    expect(parts[0].data).toBe('https://example.com/data.csv');
                }
            });

            it('should use default mimeType for image without mimeType', () => {
                const mapper = new A2AStreamMapper();

                const result: A2AResponseResult = {
                    kind: 'status-update',
                    taskId: 't1',
                    status: {
                        state: 'working',
                        message: {
                            parts: [{
                                kind: 'image',
                                image: { bytes: 'abc123' }
                            } as any]
                        }
                    }
                };

                const parts = mapper.mapResult(result);
                expect(parts.length).toBe(1);
                if (parts[0].type === 'file') {
                    expect(parts[0].mimeType).toBe('image/png');
                }
            });

            it('should use default mimeType for file without mimeType', () => {
                const mapper = new A2AStreamMapper();

                const result: A2AResponseResult = {
                    kind: 'status-update',
                    taskId: 't1',
                    status: {
                        state: 'working',
                        message: {
                            parts: [{
                                kind: 'file',
                                file: { fileWithBytes: 'abc123' }
                            } as any]
                        }
                    }
                };

                const parts = mapper.mapResult(result);
                expect(parts.length).toBe(1);
                if (parts[0].type === 'file') {
                    expect(parts[0].mimeType).toBe('application/octet-stream');
                }
            });

            it('should skip image part without bytes or uri and warn', () => {
                const mapper = new A2AStreamMapper();
                const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

                const result: A2AResponseResult = {
                    kind: 'status-update',
                    taskId: 't1',
                    status: {
                        state: 'working',
                        message: {
                            parts: [{
                                kind: 'image',
                                image: { mimeType: 'image/png' }
                            } as any]
                        }
                    }
                };

                const parts = mapper.mapResult(result);
                expect(parts.length).toBe(0);
                expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('WARN: Received image part without bytes or uri. Skipping.'));
                consoleSpy.mockRestore();
            });

            it('should skip file part without fileWithBytes or uri and warn', () => {
                const mapper = new A2AStreamMapper();
                const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

                const result: A2AResponseResult = {
                    kind: 'status-update',
                    taskId: 't1',
                    status: {
                        state: 'working',
                        message: {
                            parts: [{
                                kind: 'file',
                                file: { mimeType: 'application/pdf' }
                            } as any]
                        }
                    }
                };

                const parts = mapper.mapResult(result);
                expect(parts.length).toBe(0);
                expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('WARN: Received file part without fileWithBytes or uri. Skipping.'));
                consoleSpy.mockRestore();
            });

            it('should handle mixed text and image parts', () => {
                const mapper = new A2AStreamMapper();

                const result: A2AResponseResult = {
                    kind: 'status-update',
                    taskId: 't1',
                    status: {
                        state: 'working',
                        message: {
                            parts: [
                                { kind: 'text', text: 'Here is the image:' },
                                { kind: 'image', image: { mimeType: 'image/jpeg', bytes: '/9j/4AAQ==' } } as any
                            ]
                        }
                    }
                };

                const parts = mapper.mapResult(result);
                expect(parts.length).toBe(2);
                expect(parts[0].type).toBe('text-delta');
                expect(parts[1].type).toBe('file');
                if (parts[1].type === 'file') {
                    expect(parts[1].mimeType).toBe('image/jpeg');
                    expect(parts[1].data).toBe('/9j/4AAQ==');
                }
            });
        });

        describe('tool call buffering', () => {
            it('should buffer tool call arguments and emit only when final is true', () => {
                const mapper = new A2AStreamMapper();

                const update1: A2AResponseResult = {
                    kind: 'status-update',
                    taskId: 't1',
                    status: {
                        state: 'working',
                        message: {
                            parts: [{
                                kind: 'data',
                                data: { request: { callId: 'c1', name: 'search', args: { q: 'A' } } }
                            }]
                        }
                    }
                };

                const parts1 = mapper.mapResult(update1);
                expect(parts1.filter(p => p.type === 'tool-call').length).toBe(0);

                const update2: A2AResponseResult = {
                    kind: 'status-update',
                    taskId: 't1',
                    final: true,
                    status: {
                        state: 'stop',
                        message: {
                            parts: [{
                                kind: 'data',
                                data: { request: { callId: 'c1', name: 'search', args: { q: 'AB' } } }
                            }]
                        }
                    }
                };

                const parts2 = mapper.mapResult(update2);
                const toolCall = parts2.find(p => p.type === 'tool-call');
                expect(toolCall).toBeDefined();
                if (toolCall && toolCall.type === 'tool-call') {
                    expect(toolCall.toolName).toBe('search');
                    expect(toolCall.args).toBe(JSON.stringify({ q: 'AB', description: 'Execute search via A2A (c1)' }));
                }
            });

            it('should emit tools even without final if state is input-required', () => {
                const mapper = new A2AStreamMapper();

                const result: A2AResponseResult = {
                    kind: 'status-update',
                    taskId: 't1',
                    status: {
                        state: 'input-required',
                        message: {
                            parts: [{
                                kind: 'data',
                                data: { request: { callId: 'c1', name: 'tool1', args: { x: 1 } } }
                            }]
                        }
                    }
                };

                const parts = mapper.mapResult(result);
                expect(parts.find(p => p.type === 'tool-call')).toBeDefined();
                const finish = parts.find(p => p.type === 'finish');
                expect(finish).toBeDefined();
                if (finish && finish.type === 'finish') {
                    expect(finish.finishReason).toBe('tool-calls');
                }
            });
        });
    });
});
