import { describe, it, expect } from 'vitest';
import { mapPromptToA2AJsonRpcRequest } from '../../src/utils/mapper';

describe('client tool mapping integration', () => {
    it('should include tools in configuration when passed to mapPromptToA2AJsonRpcRequest', () => {
        const req = mapPromptToA2AJsonRpcRequest(
            [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }],
            { 
                tools: [{ 
                    type: 'function', 
                    name: 'mcp_docker-mcp-gateway_list_directory', 
                    parameters: {
                        type: 'object',
                        properties: {
                            path: { type: 'string' }
                        },
                        required: ['path']
                    } 
                }] 
            }
        );

        expect(req.params.configuration?.tools).toBeDefined();
        expect(req.params.configuration?.tools).toHaveLength(1);
        expect(req.params.configuration?.tools?.[0]).toMatchObject({
            name: 'mcp_docker-mcp-gateway_list_directory'
        });
    });
});
