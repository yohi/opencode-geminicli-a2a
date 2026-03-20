import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mapPromptToA2AJsonRpcRequest, mapA2AResponseToStreamParts, A2AStreamMapper } from './mapper';
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
                expect(parts[0].delta).toBe('hello');
            }
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
                if (parts1[0].type === 'text-delta') expect(parts1[0].delta).toBe('A');

                const parts2 = mapper.mapResult(makeUpdate('AB'));
                if (parts2[0].type === 'text-delta') expect(parts2[0].delta).toBe('B');
            });
        });

        describe('loop detection and bash fallback', () => {
            it('should redirect looping internal tools to bash fallback', () => {
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
                
                const toolCall = parts.find(p => p.type === 'tool-call');
                expect(toolCall).toBeDefined();
                if (toolCall && toolCall.type === 'tool-call') {
                    expect(toolCall.toolName).toBe('bash');
                    const args = JSON.parse(toolCall.args);
                    expect(args.command).toContain('SYSTEM: You have already called "activate_skill"');
                }
            });
        });
    });
});
