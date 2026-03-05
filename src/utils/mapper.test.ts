import { describe, it, expect } from 'vitest';
import { mapPromptToA2AMessages, mapTools, mapA2AChunkToStreamParts } from './mapper';
import type { LanguageModelV1Prompt, LanguageModelV1CallOptions } from '@ai-sdk/provider';
import type { A2AResponseChunk } from '../schemas';

describe('mapper', () => {
    describe('mapPromptToA2AMessages', () => {
        it('should map system and user messages correctly', () => {
            const prompt: LanguageModelV1Prompt = [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: [{ type: 'text', text: 'Hello' }] }
            ];

            const messages = mapPromptToA2AMessages(prompt);
            expect(messages).toEqual([
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: 'Hello' }
            ]);
        });

        it('should map tool results to user messages', () => {
            const prompt: LanguageModelV1Prompt = [
                { role: 'tool', content: [{ type: 'tool-result', toolCallId: 'call1', toolName: 'getWeather', result: { weather: 'sunny' } }] }
            ];

            const messages = mapPromptToA2AMessages(prompt);
            expect(messages[0].role).toBe('user');
            expect(messages[0].content).toContain('Tool Result');
            expect(messages[0].content).toContain('sunny');
        });
    });

    describe('mapTools', () => {
        it('should map tools correctly in regular mode', () => {
            const options: LanguageModelV1CallOptions = {
                inputFormat: 'prompt',
                prompt: [],
                mode: {
                    type: 'regular',
                    tools: [{
                        type: 'function',
                        name: 'getWeather',
                        description: 'Get weather',
                        parameters: { type: 'object', properties: {} }
                    }]
                }
            };

            const tools = mapTools(options);
            expect(tools).toBeDefined();
            expect(tools?.[0].type).toBe('function');
            expect(tools?.[0].function?.name).toBe('getWeather');
        });
    });

    describe('mapA2AChunkToStreamParts', () => {
        it('should map text delta', () => {
            const chunk: A2AResponseChunk = {
                id: '1',
                choices: [{
                    delta: { content: 'hello' },
                    finish_reason: null
                }]
            };

            const parts = mapA2AChunkToStreamParts(chunk);
            expect(parts.length).toBe(1);
            expect(parts[0].type).toBe('text-delta');
            if (parts[0].type === 'text-delta') {
                expect(parts[0].textDelta).toBe('hello');
            }
        });

        it('should map tool call', () => {
            const chunk: A2AResponseChunk = {
                id: 'chunk-1',
                choices: [
                    {
                        delta: {
                            tool_calls: [
                                {
                                    id: 'call-1',
                                    type: 'function',
                                    function: { name: 'getWeather', arguments: '{"location":"Tokyo"}' },
                                },
                            ],
                        },
                        finish_reason: null,
                    },
                ],
            };

            const parts = mapA2AChunkToStreamParts(chunk);
            expect(parts.length).toBe(1);
            expect(parts[0].type).toBe('tool-call');
        });

        it('should map finish reason', () => {
            const chunk: A2AResponseChunk = {
                id: '1',
                choices: [{
                    delta: {},
                    finish_reason: 'stop'
                }]
            };
            const parts = mapA2AChunkToStreamParts(chunk);
            expect(parts.length).toBe(1);
            expect(parts[0].type).toBe('finish');
        });
    });
});
