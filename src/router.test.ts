import { describe, it, expect } from 'vitest';
import { DefaultMultiAgentRouter } from './router';
import type { AgentEndpoint } from './schemas';

describe('DefaultMultiAgentRouter', () => {
    const mockEndpoints: AgentEndpoint[] = [
        {
            key: 'server-1',
            host: '127.0.0.1',
            port: 41242,
            protocol: 'http',
            models: ['gemini-2.5-pro', 'gemini-2.5-flash'],
        },
        {
            key: 'server-2',
            host: '192.168.1.100',
            port: 50000,
            token: 'secret-token',
            protocol: 'https',
            models: ['gemini-3.1-pro-preview'],
        },
    ];

    describe('constructor', () => {
        it('初期化時にエンドポイントを保持する', () => {
            const router = new DefaultMultiAgentRouter(mockEndpoints);
            expect(router.getEndpoints()).toHaveLength(2);
        });
    });

    describe('resolve', () => {
        it('モデルIDにマッチするエンドポイントを返す', () => {
            const router = new DefaultMultiAgentRouter(mockEndpoints);
            
            const endpoint1 = router.resolve('gemini-2.5-pro');
            expect(endpoint1).toBeDefined();
            expect(endpoint1?.key).toBe('server-1');

            const endpoint2 = router.resolve('gemini-3.1-pro-preview');
            expect(endpoint2).toBeDefined();
            expect(endpoint2?.key).toBe('server-2');
        });

        it('複数のモデルを持つエンドポイントでも正しくマッチする', () => {
            const router = new DefaultMultiAgentRouter(mockEndpoints);
            
            const endpoint = router.resolve('gemini-2.5-flash');
            expect(endpoint).toBeDefined();
            expect(endpoint?.key).toBe('server-1');
        });

        it('マッチするモデルがない場合は undefined を返す', () => {
            const router = new DefaultMultiAgentRouter(mockEndpoints);
            
            const endpoint = router.resolve('unknown-model');
            expect(endpoint).toBeUndefined();
        });
    });

    describe('getEndpoints', () => {
        it('登録された全エンドポイントを返す', () => {
            const router = new DefaultMultiAgentRouter(mockEndpoints);
            const endpoints = router.getEndpoints();
            
            expect(endpoints).toHaveLength(2);
            expect(endpoints[0].key).toBe('server-1');
            expect(endpoints[1].key).toBe('server-2');
        });
    });
});
