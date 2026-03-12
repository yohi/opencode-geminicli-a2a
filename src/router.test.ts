import { describe, it, expect, beforeEach } from 'vitest';
import { DefaultMultiAgentRouter } from './router';
import type { AgentEndpoint } from './schemas';

describe('DefaultMultiAgentRouter', () => {
    let mockEndpoints: AgentEndpoint[];

    beforeEach(() => {
        mockEndpoints = [
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
    });

    describe('constructor', () => {
        it('初期化時にエンドポイントを保持する', () => {
            const router = new DefaultMultiAgentRouter(mockEndpoints);
            expect(router.getEndpoints()).toHaveLength(2);
        });

        it('複数のエンドポイントでモデルIDが重複している場合はエラーを投げる', () => {
            const duplicateEndpoints: AgentEndpoint[] = [
                ...mockEndpoints,
                {
                    key: 'server-3',
                    host: '10.0.0.1',
                    port: 8080,
                    protocol: 'http',
                    models: ['gemini-2.5-pro'],
                }
            ];
            expect(() => new DefaultMultiAgentRouter(duplicateEndpoints))
                .toThrowError("Duplicate model ID 'gemini-2.5-pro' found in endpoints 'server-1' and 'server-3'");
        });
    });

    describe('resolve', () => {
        it('モデルIDにマッチするエンドポイントを返す', () => {
            const router = new DefaultMultiAgentRouter(mockEndpoints);
            
            const res1 = router.resolve('gemini-2.5-pro');
            expect(res1?.endpoint.key).toBe('server-1');

            const res2 = router.resolve('gemini-3.1-pro-preview');
            expect(res2?.endpoint.key).toBe('server-2');
        });

        it('モデル固有の設定（options）を正しく解決する', () => {
            const endpointsWithConfig: AgentEndpoint[] = [
                {
                    key: 'config-server',
                    host: '127.0.0.1',
                    port: 8080,
                    models: {
                        'model-with-opt': {
                            options: {
                                generationConfig: { temperature: 0.1 }
                            }
                        },
                        'model-boolean': true
                    }
                }
            ];
            const router = new DefaultMultiAgentRouter(endpointsWithConfig);
            
            const res1 = router.resolve('model-with-opt');
            expect(res1?.endpoint.key).toBe('config-server');
            expect(res1?.config?.options?.generationConfig?.temperature).toBe(0.1);

            const res2 = router.resolve('model-boolean');
            expect(res2?.endpoint.key).toBe('config-server');
            expect(res2?.config).toBeUndefined();
        });

        it('複数のモデルを持つエンドポイントでも正しくマッチする', () => {
            const router = new DefaultMultiAgentRouter(mockEndpoints);
            
            const res = router.resolve('gemini-2.5-flash');
            expect(res).toBeDefined();
            expect(res?.endpoint.key).toBe('server-1');
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
