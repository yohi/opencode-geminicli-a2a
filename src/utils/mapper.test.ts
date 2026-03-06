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

        it('should throw on unsupported role', () => {
            const prompt: LanguageModelV1Prompt = [
                { role: 'tool', content: [{ type: 'tool-result', toolCallId: 'call1', toolName: 'getWeather', result: { weather: 'sunny' } }] }
            ];
            expect(() => mapPromptToA2AJsonRpcRequest(prompt)).toThrowError(/Unsupported last message role for A2A mapping/);
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
    });
});

