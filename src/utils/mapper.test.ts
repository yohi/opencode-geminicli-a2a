import { describe, it, expect } from 'vitest';
import { mapPromptToA2AJsonRpcRequest, mapA2AResponseToStreamParts } from './mapper';
import type { LanguageModelV1Prompt } from '@ai-sdk/provider';
import type { A2AResponseResult } from '../schemas';

describe('mapper', () => {
    describe('mapPromptToA2AJsonRpcRequest', () => {
        it('should map empty prompt', () => {
            const req = mapPromptToA2AJsonRpcRequest([]);
            expect(req.jsonrpc).toBe('2.0');
            expect(req.params.message.parts[0].text).toBe('(empty prompt)');
        });

        it('should map user message correctly', () => {
            const prompt: LanguageModelV1Prompt = [
                { role: 'user', content: [{ type: 'text', text: 'Hello' }] }
            ];
            const req = mapPromptToA2AJsonRpcRequest(prompt);
            expect(req.params.message.parts[0].text).toBe('Hello');
            expect(req.params.message.role).toBe('user');
        });

        it('should handle system message', () => {
            const prompt: LanguageModelV1Prompt = [
                { role: 'system', content: 'You are a helpful assistant.' }
            ];
            const req = mapPromptToA2AJsonRpcRequest(prompt);
            expect(req.params.message.parts[0].text).toBe('You are a helpful assistant.');
        });

        it('should fallback to empty prompt if no user or system message is found', () => {
            const prompt: LanguageModelV1Prompt = [
                { role: 'tool', content: [{ type: 'tool-result', toolCallId: 'call1', toolName: 'getWeather', result: { weather: 'sunny' } }] }
            ];
            const req = mapPromptToA2AJsonRpcRequest(prompt);
            expect(req.params.message.parts[0].text).toBe('(empty prompt)');
        });

        it('should select nearest user/system when prompt ends with assistant/tool', () => {
            const prompt: LanguageModelV1Prompt = [
                { role: 'user', content: [{ type: 'text', text: 'Where is Tokyo?' }] },
                { role: 'assistant', content: [{ type: 'text', text: 'Tokyo is in Japan.' }] },
                { role: 'tool', content: [{ type: 'tool-result', toolCallId: 'call1', toolName: 'getWeather', result: { weather: 'sunny' } }] }
            ];
            const req = mapPromptToA2AJsonRpcRequest(prompt);
            expect(req.params.message.parts[0].text).toBe('Where is Tokyo?');
            expect(req.params.message.role).toBe('user');
        });

        it('should select the latest user message when multiple user messages exist', () => {
            const prompt: LanguageModelV1Prompt = [
                { role: 'user', content: [{ type: 'text', text: 'First question' }] },
                { role: 'user', content: [{ type: 'text', text: 'Second question' }] }
            ];
            const req = mapPromptToA2AJsonRpcRequest(prompt);
            expect(req.params.message.parts[0].text).toBe('Second question');
            expect(req.params.message.role).toBe('user');
        });
    });

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
                status: {
                    state: 'stop',
                }
            };
            const parts = mapA2AResponseToStreamParts(result);
            expect(parts.length).toBe(1);
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
                status: {
                    state: 'error',
                }
            };
            const parts = mapA2AResponseToStreamParts(result);
            expect(parts.length).toBe(1);
            expect(parts[0].type).toBe('finish');
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
                    message: {
                        parts: [{ kind: 'text', text: 'ignored text' }]
                    }
                }
            };
            const partsStop = mapA2AResponseToStreamParts(resultStop);
            expect(partsStop.filter(p => p.type === 'text-delta').length).toBe(0);

            const resultError: A2AResponseResult = {
                kind: 'status-update',
                taskId: 't1',
                status: {
                    state: 'error',
                    message: {
                        parts: [{ kind: 'text', text: 'ignored error text' }]
                    }
                }
            };
            const partsError = mapA2AResponseToStreamParts(resultError);
            expect(partsError.filter(p => p.type === 'text-delta').length).toBe(0);
        });

        it('should map token usage correctly', () => {
            const result: any = {
                kind: 'status-update',
                taskId: 't1',
                final: true,
                status: {
                    state: 'stop',
                },
                usage: {
                    promptTokens: 10,
                    completionTokens: 20
                }
            };
            const parts = mapA2AResponseToStreamParts(result);
            const finishPart = parts.find(p => p.type === 'finish');
            expect(finishPart).toBeDefined();
            if (finishPart && finishPart.type === 'finish') {
                expect(finishPart.usage?.promptTokens).toBe(10);
                expect(finishPart.usage?.completionTokens).toBe(20);
            }
        });
    });
});
