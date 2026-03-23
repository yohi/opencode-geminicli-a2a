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

    it('should reject port below valid range', () => {
        const result = ConfigSchema.safeParse({ port: 0 });
        expect(result.success).toBe(false);
    });

    it('should reject port above valid range', () => {
        const result = ConfigSchema.safeParse({ port: 65536 });
        expect(result.success).toBe(false);
    });

    it('should accept port at minimum boundary', () => {
        const result = ConfigSchema.safeParse({ port: 1 });
        expect(result.success).toBe(true);
    });

    it('should accept port at maximum boundary', () => {
        const result = ConfigSchema.safeParse({ port: 65535 });
        expect(result.success).toBe(true);
    });
});

describe('A2AJsonRpcRequestSchema', () => {
    const baseRequest = {
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

    it('should parse valid request without tools', () => {
        const result = A2AJsonRpcRequestSchema.safeParse(baseRequest);
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
            ...baseRequest,
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

    it('should accept id: null (JSON-RPC 2.0 compliance for parse errors)', () => {
        // JSON-RPC 2.0 specifies that error responses to invalid requests may use null id.
        // The request schema allows null to be consistent with the response schema.
        const request = { ...baseRequest, id: null };
        const result = A2AJsonRpcRequestSchema.safeParse(request);
        expect(result.success).toBe(true);
    });

    it('should reject omitted id for message/stream', () => {
        // JSON-RPC 2.0 notifications omit the id field entirely, but message/stream expects a response.
        const { id: _id, ...notificationRequest } = baseRequest;
        const result = A2AJsonRpcRequestSchema.safeParse(notificationRequest);
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

    it('should parse valid chunk with extra fields without failing (passthrough)', () => {
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
            },
            unknownExtraField: 'should be permitted'
        };
        const result = A2AJsonRpcResponseSchema.safeParse(chunk);
        expect(result.success).toBe(true);
    });

    it('should reject chunk containing both result and error (mutual exclusivity)', () => {
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
            },
            error: {
                code: 500,
                message: 'Internal error'
            },
            unknownExtraField: 'should be permitted but reject due to mutual exclusivity'
        };
        const result = A2AJsonRpcResponseSchema.safeParse(chunk);
        expect(result.success).toBe(false);
    });

    it('should parse valid chunk with input-required state', () => {
        const chunk = {
            jsonrpc: '2.0',
            id: '123',
            result: {
                kind: 'status-update',
                taskId: 't1',
                status: {
                    state: 'input-required',
                    message: {
                        parts: [{ kind: 'text', text: 'Please provide input' }]
                    }
                }
            }
        };
        const result = A2AJsonRpcResponseSchema.safeParse(chunk);
        expect(result.success).toBe(true);
    });

    it('should parse valid chunk with completed state', () => {
        const chunk = {
            jsonrpc: '2.0',
            id: '123',
            result: {
                kind: 'status-update',
                taskId: 't1',
                status: {
                    state: 'completed'
                }
            }
        };
        const result = A2AJsonRpcResponseSchema.safeParse(chunk);
        expect(result.success).toBe(true);
    });

    it('should parse valid chunk with tool_calls state', () => {
        const chunk = {
            jsonrpc: '2.0',
            id: '123',
            result: {
                kind: 'status-update',
                taskId: 't1',
                status: {
                    state: 'tool_calls'
                }
            }
        };
        const result = A2AJsonRpcResponseSchema.safeParse(chunk);
        expect(result.success).toBe(true);
    });

    it('should parse response with image part in status.message.parts', () => {
        const chunk = {
            jsonrpc: '2.0',
            id: '123',
            result: {
                kind: 'status-update',
                taskId: 't1',
                status: {
                    state: 'working',
                    message: {
                        parts: [{
                            kind: 'image',
                            image: { mimeType: 'image/png', bytes: 'iVBORw0KGgoAAAANSUhEUg==' }
                        }]
                    }
                }
            }
        };
        const result = A2AJsonRpcResponseSchema.safeParse(chunk);
        expect(result.success).toBe(true);
        if (result.success) {
            const statusUpdate = result.data.result as any;
            expect(statusUpdate.status.message.parts[0].image.bytes).toBe('iVBORw0KGgoAAAANSUhEUg==');
        }
    });

    it('should parse response with file part in status.message.parts', () => {
        const chunk = {
            jsonrpc: '2.0',
            id: '123',
            result: {
                kind: 'status-update',
                taskId: 't1',
                status: {
                    state: 'working',
                    message: {
                        parts: [{
                            kind: 'file',
                            file: { mimeType: 'application/pdf', fileWithBytes: 'JVBERi0xLjQK', name: 'report.pdf' }
                        }]
                    }
                }
            }
        };
        const result = A2AJsonRpcResponseSchema.safeParse(chunk);
        expect(result.success).toBe(true);
        if (result.success) {
            const statusUpdate = result.data.result as any;
            expect(statusUpdate.status.message.parts[0].file.fileWithBytes).toBe('JVBERi0xLjQK');
            expect(statusUpdate.status.message.parts[0].file.name).toBe('report.pdf');
        }
    });
});
