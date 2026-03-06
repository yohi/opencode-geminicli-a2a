import { describe, it, expect } from 'vitest';
import { ConfigSchema, A2AJsonRpcRequestSchema, A2AJsonRpcResponseSchema } from './schemas';

describe('ConfigSchema', () => {
    it('should parse valid configuration', () => {
        const config = {
            host: 'localhost',
            port: 8080,
            token: 'secret',
            protocol: 'http'
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
            expect(result.data.protocol).toBe('http');
        }
    });

    it('should reject invalid port type', () => {
        const result = ConfigSchema.safeParse({ port: '8080' });
        expect(result.success).toBe(false);
    });
});

describe('A2AJsonRpcRequestSchema', () => {
    it('should parse valid request without tools', () => {
        const request = {
            jsonrpc: '2.0',
            id: '123',
            method: 'message/stream',
            params: {
                message: {
                    messageId: 'msg-1',
                    role: 'user',
                    parts: [{ kind: 'text', text: 'hello' }]
                },
                configuration: { blocking: false }
            }
        };
        const result = A2AJsonRpcRequestSchema.safeParse(request);
        expect(result.success).toBe(true);
    });

    it('should parse valid request with tools', () => {
        const request = {
            jsonrpc: '2.0',
            id: '123',
            method: 'message/stream',
            params: {
                message: {
                    messageId: 'msg-1',
                    role: 'user',
                    parts: [{ kind: 'text', text: 'hello' }]
                },
                configuration: {
                    blocking: false,
                    tools: [{
                        type: 'function',
                        function: {
                            name: 'getWeather'
                        }
                    }]
                }
            }
        };
        const result = A2AJsonRpcRequestSchema.safeParse(request);
        expect(result.success).toBe(true);
    });

    it('should reject invalid role', () => {
        const request = {
            jsonrpc: '2.0',
            id: '123',
            method: 'message/stream',
            params: {
                message: {
                    messageId: 'msg-1',
                    role: 'alien',
                    parts: [{ kind: 'text', text: 'hello' }]
                }
            }
        };
        const result = A2AJsonRpcRequestSchema.safeParse(request);
        expect(result.success).toBe(false);
    });
});

describe('A2AJsonRpcResponseSchema', () => {
    it('should parse valid chunk with text delta', () => {
        const chunk = {
            jsonrpc: '2.0',
            id: '123',
            result: {
                kind: 'status-update',
                taskId: 't1',
                status: {
                    state: 'working',
                    message: {
                        parts: [{ kind: 'text', text: 'hello' }]
                    }
                }
            }
        };
        const result = A2AJsonRpcResponseSchema.safeParse(chunk);
        expect(result.success).toBe(true);
    });

    it('should parse valid chunk with error', () => {
        const chunk = {
            jsonrpc: '2.0',
            id: '123',
            error: {
                code: 500,
                message: 'Internal Error'
            }
        };
        const result = A2AJsonRpcResponseSchema.safeParse(chunk);
        expect(result.success).toBe(true);
    });
});
