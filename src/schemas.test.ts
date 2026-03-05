import { describe, it, expect } from 'vitest';
import { ConfigSchema, A2ARequestSchema, A2AResponseChunkSchema } from './schemas';

describe('ConfigSchema', () => {
    it('should parse valid configuration', () => {
        const config = {
            host: 'localhost',
            port: 8080,
            token: 'secret',
        };
        const result = ConfigSchema.safeParse(config);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toEqual(config);
        }
    });

    it('should apply default values', () => {
        const result = ConfigSchema.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.host).toBe('127.0.0.1');
            expect(result.data.port).toBe(41242);
            expect(result.data.token).toBeUndefined();
        }
    });

    it('should reject invalid port type', () => {
        const result = ConfigSchema.safeParse({ port: '8080' });
        expect(result.success).toBe(false);
    });
});

describe('A2ARequestSchema', () => {
    it('should parse valid request without tools', () => {
        const request = {
            model: 'gemini-2.5-pro',
            messages: [{ role: 'user', content: 'hello' }],
            stream: true,
        };
        const result = A2ARequestSchema.safeParse(request);
        expect(result.success).toBe(true);
    });

    it('should parse valid request with tools', () => {
        const request = {
            model: 'gemini-2.5-pro',
            messages: [{ role: 'user', content: 'hello' }],
            tools: [
                {
                    type: 'function',
                    function: {
                        name: 'getWeather',
                        description: 'Get the weather',
                        parameters: { type: 'object', properties: { location: { type: 'string' } } },
                    },
                },
            ],
            stream: true,
        };
        const result = A2ARequestSchema.safeParse(request);
        expect(result.success).toBe(true);
    });

    it('should reject invalid role', () => {
        const request = {
            model: 'gemini-2.5-pro',
            messages: [{ role: 'alien', content: 'hello' }],
            stream: true,
        };
        const result = A2ARequestSchema.safeParse(request);
        expect(result.success).toBe(false);
    });
});

describe('A2AResponseChunkSchema', () => {
    it('should parse valid chunk with text delta', () => {
        const chunk = {
            id: 'chunk-123',
            choices: [
                {
                    delta: { content: 'hello ' },
                    finish_reason: null,
                },
            ],
        };
        const result = A2AResponseChunkSchema.safeParse(chunk);
        expect(result.success).toBe(true);
    });

    it('should parse valid chunk with tool call delta', () => {
        const chunk = {
            id: 'chunk-124',
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
                    finish_reason: 'tool_calls',
                },
            ],
        };
        const result = A2AResponseChunkSchema.safeParse(chunk);
        expect(result.success).toBe(true);
    });
});
