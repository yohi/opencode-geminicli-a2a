import { describe, it, expect, beforeEach } from 'vitest';
import { DefaultMultiAgentRouter, DynamicModelRouter } from './router';
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
            const endpoints = router.getEndpoints();
            expect(endpoints).toEqual(mockEndpoints);
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

        it('should resolve explicitly targeted model ID (agentKey:modelId)', () => {
            const router = new DefaultMultiAgentRouter(mockEndpoints);
            const result = router.resolve('server-2:gemini-3.1-pro-preview');
            expect(result).toBeDefined();
            expect(result?.endpoint.key).toBe('server-2');
            expect(result?.actualModelId).toBe('gemini-3.1-pro-preview');
        });

        it('複数のエンドポイントでモデルIDが重複していても初期化を許可する', () => {
            const endpoints: AgentEndpoint[] = [
                { key: 'a1', host: 'h1', port: 1, models: ['m1'] },
                { key: 'a2', host: 'h2', port: 2, models: ['m1'] },
            ];
            expect(() => new DefaultMultiAgentRouter(endpoints)).not.toThrow();
        });

        it('重複するエージェントキーがある場合は初期化時にエラーを投げる', () => {
            const endpoints: AgentEndpoint[] = [
                { key: 'dup', host: 'h1', port: 1, models: ['m1'] },
                { key: 'dup', host: 'h2', port: 2, models: ['m2'] },
            ];
            expect(() => new DefaultMultiAgentRouter(endpoints)).toThrow("Duplicate agent key 'dup' found");
        });

        it('プレフィックスなしで重複モデルを指定した場合は曖昧さエラーを投げる', () => {
            const endpoints: AgentEndpoint[] = [
                { key: 'a1', host: 'h1', port: 1, models: ['m1'] },
                { key: 'a2', host: 'h2', port: 2, models: ['m1'] },
            ];
            const router = new DefaultMultiAgentRouter(endpoints);
            expect(() => router.resolve('m1')).toThrow("Ambiguous model ID 'm1' found in multiple endpoints: a1, a2");
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

describe('DynamicModelRouter', () => {
  it('should select a flash model for low complexity tasks', () => {
    const router = new DynamicModelRouter();
    const model = router.selectModel({ complexity: 'low' });
    expect(model).toContain('flash');
  });

  it('should select a pro model for high complexity tasks', () => {
    const router = new DynamicModelRouter();
    const model = router.selectModel({ complexity: 'high' });
    expect(model).toContain('pro');
  });

  it('should select a flash model for medium complexity tasks', () => {
    const router = new DynamicModelRouter();
    const model = router.selectModel({ complexity: 'medium' });
    expect(model).toContain('flash');
  });

  it('should select auto for auto complexity tasks', () => {
    const router = new DynamicModelRouter();
    const model = router.selectModel({ complexity: 'auto' });
    expect(model).toBe('auto');
  });
});
