import { describe, it, expect } from 'vitest';
import { mapPromptToA2AJsonRpcRequest, A2AStreamMapper } from './mapper';
import type { LanguageModelV1Prompt } from '@ai-sdk/provider';
import type { A2AResponseResult } from '../schemas';

describe('mapper tool name mapping', () => {
    const toolMapping = {
        'docker-mcp-gateway_read_file': 'read',
        'docker-mcp-gateway_write_file': 'write',
        'run_shell_command': 'bash'
    };

    describe('inbound mapping (response) - Reverted Opaque Execution', () => {
        it('should treat read as a standard tool and emit an exposed tool call', () => {
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
            
            // Should emit a tool-call part
            const toolCall = parts.find(p => p.type === 'tool-call') as any;
            expect(toolCall).toBeDefined();
            expect(toolCall.toolName).toBe('docker-mcp-gateway_read_file');

            // SHOULD NOT emit a reasoning part
            const reasoningPart = parts.find(p => p.type === 'reasoning');
            expect(reasoningPart).toBeUndefined();
        });

        it('should treat bash as a standard tool and emit an exposed tool call', () => {
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
            
            // Should emit a tool-call part
            const toolCall = parts.find(p => p.type === 'tool-call') as any;
            expect(toolCall).toBeDefined();
            expect(toolCall.toolName).toBe('run_shell_command');

            // SHOULD NOT emit a reasoning part
            const reasoningPart = parts.find(p => p.type === 'reasoning');
            expect(reasoningPart).toBeUndefined();
        });

        it('should handle hallucinated prefixes (docker-mcp-gateway_search_files -> grep -> search_files) and emit as tool-call', () => {
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
                                request: { callId: 'c1', name: 'docker-mcp-gateway_search_files', args: { pattern: 'test' } }
                            }
                        }]
                    }
                }
            };
            
            const mapper = new A2AStreamMapper({ toolMapping: { 'search_files': 'grep' } });
            const parts = mapper.mapResult(result);
            
            const toolCall = parts.find(p => p.type === 'tool-call') as any;
            expect(toolCall).toBeDefined();
            expect(toolCall.toolName).toBe('search_files');
            
            const reasoningPart = parts.find(p => p.type === 'reasoning');
            expect(reasoningPart).toBeUndefined();
        });

        it('should emit exposed tool call for unknown tools not in nativeA2ATools', () => {
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
                                request: { callId: 'c1', name: 'my_custom_tool', args: { foo: 'bar' } }
                            }
                        }]
                    }
                }
            };
            
            // Mock clientTools to include 'my_custom_tool' so it isn't treated as a hallucination
            const mapper = new A2AStreamMapper({ clientTools: ['my_custom_tool'] });
            const parts = mapper.mapResult(result);
            
            const toolCall = parts.find(p => p.type === 'tool-call') as any;
            expect(toolCall).toBeDefined();
            expect(toolCall.toolName).toBe('my_custom_tool');
        });
    });
});