import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { A2AClient } from './a2a-client';
import { ofetch } from 'ofetch';
import { APICallError } from '@ai-sdk/provider';
import type { A2AJsonRpcRequest } from './schemas';

// Mock ofetch
vi.mock('ofetch', () => {
    return {
        ofetch: {
            raw: vi.fn(),
        },
        FetchError: class FetchError extends Error {
            response?: any;
            constructor(message: string, response?: any) {
                super(message);
                this.response = response;
            }
        },
    };
});

describe('A2AClient', () => {
    const mockConfig: any = { host: '127.0.0.1', port: 8080, protocol: 'http' };
    let client: A2AClient;
    const mockRequest: A2AJsonRpcRequest = {
        jsonrpc: '2.0',
        id: '123',
        method: 'message/stream',
        params: {
            message: {
                messageId: 'msg-1',
                role: 'user',
                parts: [{ kind: 'text', text: 'hello' }]
            }
        }
    };

    beforeEach(() => {
        client = new A2AClient(mockConfig);
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const createMockResponse = (ok: boolean, status: number, statusText: string = '') => {
        const headers = new Headers();
        headers.set('content-type', 'application/json');
        return {
            ok,
            status,
            statusText,
            headers,
            _data: new ReadableStream(),
        };
    };

    it('should send request with idempotency key and retry=3', async () => {
        const mockResponse = createMockResponse(true, 200);
        vi.mocked(ofetch.raw).mockResolvedValue(mockResponse as any);

        await client.chatStream({ request: mockRequest, idempotencyKey: 'test-key' });

        expect(ofetch.raw).toHaveBeenCalledWith(
            'http://127.0.0.1:8080/',
            expect.objectContaining({
                headers: {
                    'Content-Type': 'application/json',
                    'Idempotency-Key': 'test-key',
                },
                retry: 3,
                retryDelay: 1000,
                retryStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504],
            })
        );
    });

    it('should send request without idempotency key and retry=0', async () => {
        const mockResponse = createMockResponse(true, 200);
        vi.mocked(ofetch.raw).mockResolvedValue(mockResponse as any);

        await client.chatStream({ request: mockRequest });

        expect(ofetch.raw).toHaveBeenCalledWith(
            'http://127.0.0.1:8080/',
            expect.objectContaining({
                headers: {
                    'Content-Type': 'application/json',
                },
                retry: 0,
                retryDelay: 1000,
                retryStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504],
            })
        );
    });

    it('should use token in Authorization header if provided', async () => {
        client = new A2AClient({ ...mockConfig, token: 'secret-token' });
        const mockResponse = createMockResponse(true, 200);
        vi.mocked(ofetch.raw).mockResolvedValue(mockResponse as any);

        await client.chatStream({ request: mockRequest });

        expect(ofetch.raw).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Authorization': 'Bearer secret-token',
                }),
            })
        );
    });

    it('should throw APICallError on non-ok response', async () => {
        const mockResponse = createMockResponse(false, 400, 'Bad Request');
        vi.mocked(ofetch.raw).mockResolvedValue(mockResponse as any);

        await expect(client.chatStream({ request: mockRequest })).rejects.toThrow(APICallError);
    });

    it('should wrap network errors in APICallError', async () => {
        vi.mocked(ofetch.raw).mockRejectedValue(new Error('Network Error'));

        await expect(client.chatStream({ request: mockRequest })).rejects.toThrow(APICallError);
    });
});
