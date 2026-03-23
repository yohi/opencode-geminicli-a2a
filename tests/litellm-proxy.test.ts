import { describe, it, expect } from 'vitest';
import { LiteLLMProxyConfigSchema } from '../src/schemas';

describe('LiteLLMProxyConfigSchema', () => {
    it('validates correct config', () => {
        const config = { url: 'http://litellm:4000', apiKey: 'test-key' };
        expect(LiteLLMProxyConfigSchema.parse(config)).toEqual(config);
    });

    it('throws on invalid url', () => {
        const config = { url: 'invalid-url' };
        expect(() => LiteLLMProxyConfigSchema.parse(config)).toThrow();
    });
});
