import { mapPromptToA2AJsonRpcRequest } from '../../src/utils/mapper';

const req = mapPromptToA2AJsonRpcRequest(
    [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }],
    { tools: [{ type: 'function', name: 'mcp_docker-mcp-gateway_list_directory', parameters: {} }] }
);

console.log(JSON.stringify(req.params.configuration?.tools, null, 2));
