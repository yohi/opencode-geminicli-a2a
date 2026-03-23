import { describe, it, expect, afterEach } from 'vitest';
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
    afterEach(() => {
        delete process.env.LITELLM_PROXY_URL;
        delete process.env.LITELLM_PROXY_API_KEY;
    });

    it('resolves LITELLM_PROXY_URL env variable', () => {
        process.env.LITELLM_PROXY_URL = 'http://env-litellm:4000';
        const config = resolveConfig();
        expect((config as any).litellmProxy?.url).toBe('http://env-litellm:4000');
    });

    it('prioritizes options over env', () => {
        process.env.LITELLM_PROXY_URL = 'http://env-litellm:4000';
        const config = resolveConfig({ litellmProxy: { url: 'http://opt-litellm:4000' } } as any);
        expect((config as any).litellmProxy?.url).toBe('http://opt-litellm:4000');
    });
});

import { A2AClient } from '../src/a2a-client';

describe('A2AClient with litellmProxy', () => {
    it('uses proxy url when configured', () => {
        const client = new A2AClient({
            host: '127.0.0.1',
            port: 41242,
            protocol: 'http',
            litellmProxy: { url: 'http://litellm-proxy:8000', apiKey: 'secret' }
        } as any);

        const internalEndpoint = (client as any).endpoint;
        expect(internalEndpoint).toBe('http://litellm-proxy:8000/'); 
    });
});
