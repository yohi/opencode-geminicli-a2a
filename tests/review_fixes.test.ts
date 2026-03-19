import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as http from 'http';
import { createGeminiA2AProvider } from '../src/index';
import { InMemorySessionStore } from '../src/session';

describe('Review Fixes Verification', () => {
    let server: http.Server;
    let port: number;
    let lastReceivedRequest: any;

    beforeAll(async () => {
        server = http.createServer((req, res) => {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                lastReceivedRequest = JSON.parse(body);
                res.writeHead(200, { 'Content-Type': 'text/event-stream' });
                
                const allText = lastReceivedRequest.params?.message?.parts?.map((p: any) => p.text || '').join(' ') || '';

                if (allText.includes('trigger-tool')) {
                    res.write('data: {"jsonrpc":"2.0","id":"1","result":{"kind":"status-update","taskId":"task-123","status":{"state":"working","message":{"parts":[{"kind":"data","data":{"request":{"name":"test_tool","args":{"foo":"bar"}}}}]}}}}\n\n');
                    res.write('data: {"jsonrpc":"2.0","id":"1","result":{"kind":"status-update","taskId":"task-123","final":true,"status":{"state":"tool_calls"}}}\n\n');
                } else if (allText.includes('trigger-input-required')) {
                    // Simulate an ask_user tool call which requires input
                    res.write('data: {"jsonrpc":"2.0","id":"1","result":{"kind":"status-update","taskId":"task-456","status":{"state":"working","message":{"parts":[{"kind":"data","data":{"request":{"name":"ask_user","args":{"question":"Continue?"}}}}]}}}}\n\n');
                    res.write('data: {"jsonrpc":"2.0","id":"1","result":{"kind":"status-update","taskId":"task-456","final":true,"status":{"state":"input-required"}}}\n\n');
                } else {
                    res.write('data: {"jsonrpc":"2.0","id":"1","result":{"kind":"status-update","taskId":"task-789","final":true,"status":{"state":"stop"}}}\n\n');
                }
                res.end();
            });
        });

        await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => {
            port = (server.address() as any).port;
            resolve();
        }));
    });

    afterAll(async () => {
        await new Promise<void>(resolve => server.close(() => resolve()));
    });

    it('should NOT double JSON-encode tool-call arguments in doGenerate', async () => {
        const provider = createGeminiA2AProvider({
            host: '127.0.0.1',
            port,
            token: 'test',
            protocol: 'http',
        });
        const model = provider.languageModel('test-model');

        const result = await model.doGenerate({
            inputFormat: 'messages',
            mode: { 
                type: 'regular',
                tools: [{ type: 'function', name: 'test_tool', parameters: {} }]
            },
            prompt: [{ role: 'user', content: [{ type: 'text', text: 'trigger-tool' }] }],
        });

        expect(result.toolCalls).toBeDefined();
        expect(result.toolCalls![0].toolName).toBe('test_tool');
        // args should be a single JSON string, containing the expected fields
        expect(result.toolCalls![0].args).toContain('"foo":"bar"');
        expect(result.toolCalls![0].args).toContain('"description":"Execute test_tool via A2A');
        
        // Verify it's not double-encoded by checking if parsing it once gives the object
        const parsed = JSON.parse(result.toolCalls![0].args);
        expect(parsed.foo).toBe('bar');
    });

    it('should populate taskId when session has inputRequired=true or rawState=input-required', async () => {
        const sessionStore = new InMemorySessionStore();
        const provider = createGeminiA2AProvider({
            host: '127.0.0.1',
            port,
            token: 'test',
            protocol: 'http',
            sessionStore,
        });
        const model = provider.languageModel('test-model');

        const sessionId = 'test-session-1';

        // 1. Trigger input-required
        const result = await model.doGenerate({
            inputFormat: 'messages',
            mode: { 
                type: 'regular',
                tools: [{ type: 'function', name: 'ask_user', parameters: {} }]
            },
            prompt: [{ role: 'user', content: [{ type: 'text', text: 'trigger-input-required' }] }],
            providerMetadata: { opencode: { sessionId } }
        });

        // Verify session state
        const session = await sessionStore.get(sessionId);
        expect(session?.taskId).toBe('task-456');
        expect(session?.inputRequired).toBe(true);
        expect(session?.rawState).toBe('input-required');

        // 2. Next request should include taskId
        await model.doGenerate({
            inputFormat: 'messages',
            mode: { type: 'regular' },
            prompt: [{ role: 'user', content: [{ type: 'text', text: 'follow-up' }] }],
            providerMetadata: { opencode: { sessionId } }
        });

        expect(lastReceivedRequest.params.taskId).toBe('task-456');
    });
});
