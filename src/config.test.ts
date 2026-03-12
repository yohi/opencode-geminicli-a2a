import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveConfig } from './config';

describe('resolveConfig', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('should use default values when nothing is provided', () => {
        const config = resolveConfig();
        expect(config).toEqual({
            host: '127.0.0.1',
            port: 41242,
            token: undefined,
            protocol: 'http',
        });
    });

    it('should use options from opencode config', () => {
        const config = resolveConfig({
            host: '192.168.1.10',
            port: 8080,
            token: 'secret-token',
        });
        expect(config).toEqual({
            host: '192.168.1.10',
            port: 8080,
            token: 'secret-token',
            protocol: 'http',
        });
    });

    it('should prioritize options over environment variables', () => {
        process.env.GEMINI_A2A_HOST = 'env-host';
        process.env.GEMINI_A2A_PORT = '9999';
        process.env.GEMINI_A2A_TOKEN = 'env-token';
        process.env.GEMINI_A2A_PROTOCOL = 'https';

        const config = resolveConfig({
            host: 'opt-host',
            port: 8888,
            token: 'opt-token',
            protocol: 'http',
        });

        expect(config).toEqual({
            host: 'opt-host',
            port: 8888,
            token: 'opt-token',
            protocol: 'http',
        });
    });

    it('should coerce environment variable port to number', () => {
        process.env.GEMINI_A2A_PORT = '12345';
        const config = resolveConfig();
        expect(config.port).toBe(12345);
        expect(typeof config.port).toBe('number');
    });

    it('should handle partial options overlaying environment variables', () => {
        process.env.GEMINI_A2A_PORT = '12345';
        process.env.GEMINI_A2A_TOKEN = 'env-token';
        process.env.GEMINI_A2A_PROTOCOL = 'https';

        const config = resolveConfig({
            host: 'opt-host',
            token: 'opt-token',
        });

        expect(config).toEqual({
            host: 'opt-host', // defined in opt
            port: 12345,      // defined in env
            token: 'opt-token', // opt prioritized over env
            protocol: 'https', // defined in env
        });
    });

    it('should throw error for invalid port in environment variable', () => {
        process.env.GEMINI_A2A_PORT = 'invalid-port';
        expect(() => resolveConfig()).toThrow();
    });

    it('should fall back to defaults or options when env vars are empty strings', () => {
        process.env.GEMINI_A2A_HOST = '';
        process.env.GEMINI_A2A_PORT = '   '; // Whitespace only
        process.env.GEMINI_A2A_TOKEN = '';

        const config = resolveConfig();
        expect(config).toEqual({
            host: '127.0.0.1',
            port: 41242,
            token: undefined,
            protocol: 'http',
        });

        const configWithOptions = resolveConfig({
            host: 'fallback-host',
            port: 1234,
            protocol: 'https',
        });
        expect(configWithOptions).toEqual({
            host: 'fallback-host',
            port: 1234,
            token: undefined,
            protocol: 'https',
        });
    });

    it('should include generationConfig from options', () => {
        const generationConfig = {
            temperature: 0.8,
            topP: 0.9,
        };
        const config = resolveConfig({ generationConfig });
        expect(config.generationConfig).toEqual(generationConfig);
    });

    it('should coerce string values in generationConfig to numbers', () => {
        const options = {
            generationConfig: {
                temperature: '0.5',
                maxOutputTokens: '100',
            }
        } as any;
        const config = resolveConfig(options);
        expect(config.generationConfig).toEqual({
            temperature: 0.5,
            maxOutputTokens: 100,
        });
    });
});
