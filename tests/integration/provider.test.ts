import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as http from 'http';
import { createGeminiA2AProvider } from '../../src/index';
import type { LanguageModelV1Prompt } from '@ai-sdk/provider';

describe('Integration: Gemini CLI A2A Provider', () => {
    let server: http.Server;
    let port: number; // dynamically assigned port

    beforeAll(async () => {
        server = http.createServer((req, res) => {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                if (req.method !== 'POST' || req.url !== '/') {
                    res.writeHead(404);
                    res.end();
                    return;
                }

                const auth = req.headers['authorization'];
                if (auth !== 'Bearer test-secret-token') {
                    res.writeHead(401);
                    res.end();
                    return;
                }

                const idempotencyKey = req.headers['idempotency-key'];
                if (!idempotencyKey) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: 'Missing Idempotency-Key' }));
                    return;
                }

                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                });

                // Simulating an SSE stream JSON-RPC format
                res.write('data: {"jsonrpc":"2.0","id":"chat-1","result":{"kind":"status-update","taskId":"t1","status":{"state":"working","message":{"parts":[{"kind":"text","text":"Integration "}]}}}}\n\n');

                setTimeout(() => {
                    res.write('data: {"jsonrpc":"2.0","id":"chat-1","result":{"kind":"status-update","taskId":"t1","status":{"state":"working","message":{"parts":[{"kind":"text","text":"success!"}]}}}}\n\n');
                    res.write('data: {"jsonrpc":"2.0","id":"chat-1","result":{"kind":"status-update","taskId":"t1","final":true,"status":{"state":"stop"}}}\n\n');
                    res.end();
                }, 50);
            });
        });

        await new Promise<void>((resolve, reject) => {
            server.once('error', reject);
            server.listen(0, '127.0.0.1', () => {
                server.off('error', reject);
                const address = server.address();
                if (!address || typeof address !== 'object') {
                    reject(new Error('Failed to get server address'));
                    return;
                }
                port = address.port;
                resolve();
            });
        });
    });

    afterAll(async () => {
        await new Promise<void>((resolve) => server.close(() => resolve()));
    });

    it('should complete a full streaming request to the mock server', async () => {
        const a2a = createGeminiA2AProvider({
            host: '127.0.0.1',
            port,
            token: 'test-secret-token',
            protocol: 'http',
        });

        const model = a2a.languageModel('gemini-2.5-pro');

        const prompt: LanguageModelV1Prompt = [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }];

        const { stream } = await model.doStream({
            inputFormat: 'messages',
            mode: { type: 'regular' },
            prompt,
            providerMetadata: {
                opencode: { idempotencyKey: 'test-key-123' }
            }
        });

        const reader = stream.getReader();
        const parts = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            parts.push(value);
        }

        expect(parts.length).toBe(3);
        expect(parts[0]).toEqual({ type: 'text-delta', textDelta: 'Integration ' });
        expect(parts[1]).toEqual({ type: 'text-delta', textDelta: 'success!' });
        expect(parts[2]).toMatchObject({ type: 'finish', finishReason: 'stop' });
    });

    it('should handle generate request seamlessly', async () => {
        const a2a = createGeminiA2AProvider({
            host: '127.0.0.1',
            port,
            token: 'test-secret-token',
            protocol: 'http',
        });

        const model = a2a.languageModel('gemini-2.5-pro');

        const result = await model.doGenerate({
            inputFormat: 'messages',
            mode: { type: 'regular' },
            prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
            providerMetadata: {
                opencode: { idempotencyKey: 'test-key-456' }
            }
        });

        expect(result.text).toBe('Integration success!');
        expect(result.finishReason).toBe('stop');
    });

    it('should fail correctly if token is invalid (401)', async () => {
        const a2a = createGeminiA2AProvider({
            host: '127.0.0.1',
            port,
            token: 'wrong-token',
            protocol: 'http',
        });

        const model = a2a.languageModel('gemini-2.5-pro');

        await expect(model.doGenerate({
            inputFormat: 'messages',
            mode: { type: 'regular' },
            prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
            providerMetadata: { opencode: { idempotencyKey: 'k1' } }
        })).rejects.toThrow(/HTTP error 401/);
    });
});
