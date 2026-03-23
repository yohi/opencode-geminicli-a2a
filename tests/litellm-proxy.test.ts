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

import { resolveConfig } from '../src/config';

describe('resolveConfig with LiteLLM', () => {
    it('resolves LITELLM_PROXY_URL env variable', () => {
        process.env.LITELLM_PROXY_URL = 'http://env-litellm:4000';
        const config = resolveConfig();
        expect((config as any).litellmProxy?.url).toBe('http://env-litellm:4000');
        delete process.env.LITELLM_PROXY_URL;
    });

    it('prioritizes options over env', () => {
        process.env.LITELLM_PROXY_URL = 'http://env-litellm:4000';
        const config = resolveConfig({ litellmProxy: { url: 'http://opt-litellm:4000' } } as any);
        expect((config as any).litellmProxy?.url).toBe('http://opt-litellm:4000');
        delete process.env.LITELLM_PROXY_URL;
    });
});
