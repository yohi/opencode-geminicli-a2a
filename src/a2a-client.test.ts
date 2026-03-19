import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ofetch } from 'ofetch';
import { A2AClient } from './a2a-client';
import { APICallError } from '@ai-sdk/provider';
import type { A2AJsonRpcRequest, A2AConfig } from './schemas';

vi.mock('ofetch', () => ({
    ofetch: {
        raw: vi.fn(),
    },
    FetchError: class extends Error {
        response: any;
        constructor(message: string, response?: any) {
            super(message);
            this.response = response;
        }
    },
}));

describe('A2AClient', () => {
    let client: A2AClient;
    const mockConfig: A2AConfig = {
        host: '127.0.0.1',
        port: 8080,
        protocol: 'http',
    };

    const mockRequest: A2AJsonRpcRequest = {
        jsonrpc: '2.0',
        id: '123',
        method: 'message/stream',
        params: {
            message: {
                messageId: 'msg-1',
                role: 'user',
                parts: [{ kind: 'text', text: 'hello' }],
            },
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        client = new A2AClient(mockConfig);
    });

    const createMockResponse = (ok: boolean, status: number, body?: any) => ({
        ok,
        status,
        statusText: ok ? 'OK' : 'Error',
        headers: new Map(),
        _data: body,
    });

    it('should send request with idempotency key and retry=3', async () => {
        const mockResponse = createMockResponse(true, 200);
        vi.mocked(ofetch.raw).mockResolvedValue(mockResponse as any);

        await client.chatStream({ request: mockRequest, idempotencyKey: 'test-key' });

        expect(ofetch.raw).toHaveBeenCalledWith(
            'http://127.0.0.1:8080/',
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                    'Idempotency-Key': 'test-key',
                    'x-a2a-trace-id': expect.any(String),
                }),
                retry: 3,
                retryDelay: 1000,
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
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                    'x-a2a-trace-id': expect.any(String),
                }),
                retry: 0,
            })
        );
    });

    it('should use token in Authorization header if provided', async () => {
        const tokenClient = new A2AClient({ ...mockConfig, token: 'secret-token' });
        const mockResponse = createMockResponse(true, 200);
        vi.mocked(ofetch.raw).mockResolvedValue(mockResponse as any);

        await tokenClient.chatStream({ request: mockRequest });

        expect(ofetch.raw).toHaveBeenCalledWith(
            'http://127.0.0.1:8080/',
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Authorization': 'Bearer secret-token',
                }),
            })
        );
    });

    it('should send request with custom traceId if provided', async () => {
        const mockResponse = createMockResponse(true, 200);
        vi.mocked(ofetch.raw).mockResolvedValue(mockResponse as any);

        await client.chatStream({ request: mockRequest, traceId: 'trace-123' });

        expect(ofetch.raw).toHaveBeenCalledWith(
            'http://127.0.0.1:8080/',
            expect.objectContaining({
                headers: expect.objectContaining({
                    'x-a2a-trace-id': 'trace-123',
                }),
            })
        );
    });

    it('should throw APICallError on non-ok response', async () => {
        const mockResponse = createMockResponse(false, 500);
        vi.mocked(ofetch.raw).mockResolvedValue(mockResponse as any);

        const promise = client.chatStream({ request: mockRequest });
        await expect(promise).rejects.toThrow(APICallError);
        await expect(promise).rejects.toThrow('HTTP error 500: Error');
    });

    it('should wrap network errors in APICallError', async () => {
        vi.mocked(ofetch.raw).mockRejectedValue(new Error('Network failure'));

        const promise = client.chatStream({ request: mockRequest });
        await expect(promise).rejects.toThrow(APICallError);
        await expect(promise).rejects.toThrow('Network failure');
    });
});
