import { describe, it, expect } from 'vitest';
import { mapPromptToA2AJsonRpcRequest, mapA2AResponseToStreamParts, A2AStreamMapper } from './mapper';
import type { LanguageModelV1Prompt } from '@ai-sdk/provider';
import type { A2AResponseResult } from '../schemas';

describe('mapper tool name mapping', () => {
    const toolMapping = {
        'read_file': 'read',
        'write_file': 'write',
        'run_shell_command': 'bash',
    };

    describe('outbound mapping (request)', () => {
        it('should map read_file to read', () => {
            const prompt: LanguageModelV1Prompt = [{ role: 'user', content: [{ type: 'text', text: 'read' }] }];
            const tools = [{ type: 'function', name: 'read_file', parameters: {} }];
            const req = mapPromptToA2AJsonRpcRequest(prompt, { tools, toolMapping });
            
            const tool = req.params.configuration?.tools?.[0] as any;
            expect(tool.name).toBe('read');
        });

        it('should map write_file to write', () => {
            const prompt: LanguageModelV1Prompt = [{ role: 'user', content: [{ type: 'text', text: 'write' }] }];
            const tools = [{ type: 'function', name: 'write_file', parameters: {} }];
            const req = mapPromptToA2AJsonRpcRequest(prompt, { tools, toolMapping });
            
            const tool = req.params.configuration?.tools?.[0] as any;
            expect(tool.name).toBe('write');
        });

        it('should map run_shell_command to bash', () => {
            const prompt: LanguageModelV1Prompt = [{ role: 'user', content: [{ type: 'text', text: 'exec' }] }];
            const tools = [{ type: 'function', name: 'run_shell_command', parameters: {} }];
            const req = mapPromptToA2AJsonRpcRequest(prompt, { tools, toolMapping });
            
            const tool = req.params.configuration?.tools?.[0] as any;
            expect(tool.name).toBe('bash');
        });

        it('should map tool-result names back to A2A names', () => {
            const prompt: LanguageModelV1Prompt = [
                { role: 'tool', content: [{ type: 'tool-result', toolCallId: 'c1', toolName: 'read_file', result: 'content' }] }
            ];
            const req = mapPromptToA2AJsonRpcRequest(prompt, { toolMapping });
            const part = req.params.message.parts.find(p => (p as any).text.includes('[Tool Result:')) as any;
            expect(part.text).toContain('[Tool Result: read (c1)]');
        });
    });

    describe('inbound mapping (response)', () => {
        it('should map read back to read_file', () => {
            const result: A2AResponseResult = {
                kind: 'status-update',
                taskId: 't1',
                final: true,
                status: {
                    state: 'working',
                    message: {
                        parts: [{
                            kind: 'data',
                            data: {
                                request: { callId: 'c1', name: 'read', args: { path: 'test.txt' } }
                            }
                        }]
                    }
                }
            };
            
            const mapper = new A2AStreamMapper({ toolMapping });
            const parts = mapper.mapResult(result);
            const toolCall = parts.find(p => p.type === 'tool-call') as any;
            expect(toolCall.toolName).toBe('read_file');
        });

        it('should map bash back to run_shell_command', () => {
            const result: A2AResponseResult = {
                kind: 'status-update',
                taskId: 't1',
                final: true,
                status: {
                    state: 'working',
                    message: {
                        parts: [{
                            kind: 'data',
                            data: {
                                request: { callId: 'c1', name: 'bash', args: { command: 'ls' } }
                            }
                        }]
                    }
                }
            };
            
            const mapper = new A2AStreamMapper({ toolMapping });
            const parts = mapper.mapResult(result);
            const toolCall = parts.find(p => p.type === 'tool-call') as any;
            expect(toolCall.toolName).toBe('run_shell_command');
        });
    });
});
