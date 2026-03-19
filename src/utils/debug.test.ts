import { describe, it, expect } from 'vitest';
import { mapPromptToA2AJsonRpcRequest } from './mapper';
describe('debug', () => {
    it('should debug concatenate multiple text parts', () => {
        const prompt: any = [
            { role: 'user', content: [{ type: 'text', text: 'Hello ' }, { type: 'text', text: 'World' }] }
        ];
        const req = mapPromptToA2AJsonRpcRequest(prompt);
        console.log('DEBUG Parts length:', req.params.message.parts.length);
        console.log('DEBUG Parts:', JSON.stringify(req.params.message.parts, null, 2));
    });
});
