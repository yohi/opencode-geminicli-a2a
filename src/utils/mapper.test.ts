import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mapPromptToA2AJsonRpcRequest, mapA2AResponseToStreamParts, A2AStreamMapper } from './mapper';
import type { LanguageModelV2Prompt } from '@ai-sdk/provider';
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
            const req = mapPromptToA2AJsonRpcRequest(prompt as any, { contextId: 'ctx', processedMessagesCount: 1 });
            expect(req.params.message.parts).toHaveLength(2);
            expect((req.params.message.parts[0] as any).text).toBe('[USER]\n');
            expect((req.params.message.parts[1] as any).text).toBe('Hello');
        });

        it('should handle system message', () => {
            const prompt = [
                { role: 'system', content: 'You are a helpful assistant.' }
            ];
            const req = mapPromptToA2AJsonRpcRequest(prompt as any);
            expect(req.params.message.parts).toHaveLength(2);
            expect((req.params.message.parts[0] as any).text).toContain('CRITICAL INSTRUCTION');
            expect((req.params.message.parts[1] as any).text).toBe('[SYSTEM]\nYou are a helpful assistant.\n');
        });
    });

    describe('mapA2AResponseToStreamParts', () => {
        it('should map text delta', () => {
            const result: A2AResponseResult = {
                kind: 'status-update',
                taskId: 't1',
                status: {
                    state: 'working',
                    message: { parts: [{ kind: 'text', text: 'hello' }] }
                }
            };
            const parts = mapA2AResponseToStreamParts(result);
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
            expect(parts[0].type).toBe('finish');
            if (parts[0].type === 'finish') {
                expect(parts[0].finishReason).toBe('stop');
            }
        });

        it('should map unknown status.state to finishReason "stop"', () => {
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
                expect(finishPart.usage?.promptTokens).toBe(10);
                expect(finishPart.usage?.completionTokens).toBe(20);
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
                expect(finishPart.usage?.promptTokens).toBe(0);
                expect(finishPart.usage?.completionTokens).toBe(0);
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
                                request: { callId: 'call-123', name: 'getWeather', args: JSON.stringify({ location: 'Tokyo' }) }
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
                                request: { callId: 'call-456', name: 'getWeather', args: JSON.stringify({ location: 'Osaka' }) }
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

        it('should generate a UUID-like stable ID for toolCallId if callId is not provided', () => {
            const result: A2AResponseResult = {
                kind: 'status-update',
                taskId: 't1',
                final: true,
                status: {
                    state: 'working',
                    message: {
                        parts: [{
                            kind: 'data',
                            data: { request: { name: 'getWeather', args: JSON.stringify({}) } }
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
                expect(toolCall.toolCallId.startsWith('call_')).toBe(true);
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
                            data: { request: { callId: 'call-789', args: JSON.stringify({}) } }
                        }]
                    }
                }
            };
            const parts = mapA2AResponseToStreamParts(result);
            expect(parts.length).toBe(0);
        });
    });

    describe('A2AStreamMapper', () => {
        describe('snapshot deduplication', () => {
            it('should deduplicate snapshot text', () => {
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
                                    request: { callId: 'call-dup', name: 'getTime', args: JSON.stringify({}) }
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
                    { name: 'getWeather', args: JSON.stringify({ location: 'Tokyo' }) }
                ]));
                expect(parts1.filter(p => p.type === 'tool-call').length).toBe(1);

                // Second snapshot has TWO identical tool calls (the first is identical and should be deduplicated, the second is NEW)
                const parts2 = mapper.mapResult(makeUpdate([
                    { name: 'getWeather', args: JSON.stringify({ location: 'Tokyo' }) },
                    { name: 'getWeather', args: JSON.stringify({ location: 'Tokyo' }) }
                ]));
                expect(parts2.filter(p => p.type === 'tool-call').length).toBe(1);

                // Third snapshot is identical to the second snapshot (so 0 new emitted parts)
                const parts3 = mapper.mapResult(makeUpdate([
                    { name: 'getWeather', args: JSON.stringify({ location: 'Tokyo' }) },
                    { name: 'getWeather', args: JSON.stringify({ location: 'Tokyo' }) }
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
                    { name: 'getWeather', args: JSON.stringify({ location: 'Tokyo' }) }
                ]));
                expect(parts1.filter(p => p.type === 'tool-call').length).toBe(1);

                // Now transition to new taskId 't2' testing the same tool call again
                // it should NOT be deduplicated
                const parts2 = mapper.mapResult(makeUpdate('t2', [
                    { name: 'getWeather', args: JSON.stringify({ location: 'Tokyo' }) }
                ]));
                expect(parts2.filter(p => p.type === 'tool-call').length).toBe(1);

                // Subsequent identical requests within 't2' should be deduplicated
                const parts3 = mapper.mapResult(makeUpdate('t2', [
                    { name: 'getWeather', args: JSON.stringify({ location: 'Tokyo' }) }
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
                expect(parts[0].type).toBe('reasoning-delta');
                if (parts[0].type === 'reasoning-delta') {
                    expect(parts[0].reasoningDelta).toBe('[Analyzing the code] I\'m reviewing the function implementation.\n');
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
                expect(parts[0].type).toBe('reasoning-delta');
                if (parts[0].type === 'reasoning-delta') {
                    expect(parts[0].reasoningDelta).toBe('[Processing]\n');
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
                                        request: { callId: 'call-mixed', name: 'runCommand', args: JSON.stringify({ cmd: 'ls' }) }
                                    }
                                }
                            ]
                        }
                    },
                    final: true,
                    metadata: { coderAgent: { kind: 'thought' } }
                };

                const parts = mapper.mapResult(result);
                const reasoningParts = parts.filter(p => p.type === 'reasoning-delta');
                const toolCallParts = parts.filter(p => p.type === 'tool-call');
                expect(reasoningParts.length).toBe(1);
                expect(toolCallParts.length).toBe(1);
                if (reasoningParts[0].type === 'reasoning-delta') {
                    expect(reasoningParts[0].reasoningDelta).toContain('Thinking');
                }
                if (toolCallParts[0].type === 'tool-call') {
                    expect(toolCallParts[0].toolName).toBe('runCommand');
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
                    expect((finishParts[0] as any).inputRequired).toBe(true);
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
        });

        describe('loop detection', () => {
            it('should set shouldInterruptLoop when internal tool loops', () => {
                const mapper = new A2AStreamMapper({ maxToolCallFrequency: 2 });
                
                const createToolCallResult = (callId: string): A2AResponseResult => ({
                    kind: 'status-update',
                    taskId: 't1',
                    status: {
                        state: 'input-required',
                        message: {
                            parts: [{
                                kind: 'data',
                                data: { request: { callId, name: 'activate_skill', args: { skill: 'test' } } }
                            }]
                        }
                    }
                });

                // Call 1 & 2
                mapper.mapResult(createToolCallResult('c1'));
                mapper.mapResult(createToolCallResult('c2'));
                
                // Call 3 (Loop!)
                const parts = mapper.mapResult(createToolCallResult('c3'));
                
                const finishPart = parts.find(p => p.type === 'finish') as any;
                expect(finishPart).toBeDefined();
                expect(finishPart.shouldInterruptLoop).toBe(true);
            });
        });
    });
});
