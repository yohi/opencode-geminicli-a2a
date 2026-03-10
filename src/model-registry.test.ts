import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StaticModelRegistry, getDefaultModels, type ModelInfo } from './model-registry';

describe('StaticModelRegistry', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('constructor', () => {
        it('デフォルトモデルで初期化される', () => {
            const registry = new StaticModelRegistry();
            const models = registry.listModels();
            expect(models.length).toBeGreaterThan(0);
            expect(models.some(m => m.id === 'gemini-2.5-pro')).toBe(true);
            expect(models.some(m => m.id === 'gemini-2.5-flash')).toBe(true);
        });

        it('初期モデルを指定して初期化できる', () => {
            const customModels: ModelInfo[] = [
                { id: 'custom-model-1', name: 'Custom Model 1' },
                { id: 'custom-model-2', name: 'Custom Model 2' },
            ];
            const registry = new StaticModelRegistry(customModels);
            const models = registry.listModels();
            expect(models).toHaveLength(2);
            expect(models[0].id).toBe('custom-model-1');
            expect(models[1].id).toBe('custom-model-2');
        });

        it('endpointKey 付きのモデルを初期化できる', () => {
            const customModels: ModelInfo[] = [
                { id: 'model-a', name: 'Model A', endpointKey: 'server-pro' },
            ];
            const registry = new StaticModelRegistry(customModels);
            const model = registry.getModel('model-a');
            expect(model?.endpointKey).toBe('server-pro');
        });
    });

    describe('listModels', () => {
        it('全モデルの配列を返す', () => {
            const registry = new StaticModelRegistry([
                { id: 'a', name: 'A' },
                { id: 'b', name: 'B' },
            ]);
            expect(registry.listModels()).toHaveLength(2);
        });
    });

    describe('getModel', () => {
        it('存在するモデルIDで ModelInfo を返す', () => {
            const registry = new StaticModelRegistry();
            const model = registry.getModel('gemini-2.5-pro');
            expect(model).toBeDefined();
            expect(model!.id).toBe('gemini-2.5-pro');
            expect(model!.name).toContain('Gemini 2.5 Pro');
        });

        it('存在しないモデルIDで undefined を返す', () => {
            const registry = new StaticModelRegistry();
            const model = registry.getModel('non-existent-model');
            expect(model).toBeUndefined();
        });
    });

    describe('toRecord', () => {
        it('モデルの Record 形式を返す', () => {
            const registry = new StaticModelRegistry([
                { id: 'model-x', name: 'Model X' },
                { id: 'model-y', name: 'Model Y' },
            ]);
            const record = registry.toRecord();
            expect(Object.keys(record)).toHaveLength(2);
            expect(record['model-x']).toEqual({ id: 'model-x', name: 'Model X' });
            expect(record['model-y']).toEqual({ id: 'model-y', name: 'Model Y' });
        });
    });

    describe('refresh', () => {
        it('環境変数から再読み込みできる', () => {
            const registry = new StaticModelRegistry();
            const initialCount = registry.listModels().length;

            process.env['OPENCODE_A2A_MODELS'] = JSON.stringify({
                'new-model': { id: 'new-model', name: 'New Model' },
            });

            registry.refresh();

            const models = registry.listModels();
            expect(models).toHaveLength(1);
            expect(models[0].id).toBe('new-model');
        });

        it('環境変数が設定されていない場合はモデルを保持する', () => {
            const registry = new StaticModelRegistry([
                { id: 'keep-this', name: 'Keep This' },
            ]);

            delete process.env['OPENCODE_A2A_MODELS'];
            delete process.env['OPENCODE_A2A_MODELS_PATH'];

            registry.refresh();
            expect(registry.listModels()).toHaveLength(1);
            expect(registry.getModel('keep-this')).toBeDefined();
        });

        it('endpointKey 付きの環境変数モデルを読み込める', () => {
            const registry = new StaticModelRegistry();

            process.env['OPENCODE_A2A_MODELS'] = JSON.stringify({
                'routed-model': { id: 'routed-model', name: 'Routed Model', endpointKey: 'server-1' },
            });

            registry.refresh();

            const model = registry.getModel('routed-model');
            expect(model?.endpointKey).toBe('server-1');
        });
    });

    describe('環境変数からの初期化', () => {
        it('OPENCODE_A2A_MODELS 環境変数から初期化できる', () => {
            process.env['OPENCODE_A2A_MODELS'] = JSON.stringify({
                'env-model': { id: 'env-model', name: 'Env Model' },
            });

            const registry = new StaticModelRegistry();
            const models = registry.listModels();
            expect(models).toHaveLength(1);
            expect(models[0].id).toBe('env-model');
        });

        it('簡易形式の環境変数モデル定義をサポートする', () => {
            process.env['OPENCODE_A2A_MODELS'] = JSON.stringify({
                'simple-model': 'Simple Model Name',
            });

            // 注: 簡易形式は parseModelsConfig で key=id, value=name としてパースされる
            const registry = new StaticModelRegistry();
            const model = registry.getModel('simple-model');
            expect(model).toBeDefined();
            expect(model!.name).toBe('Simple Model Name');
        });

        it('無効な JSON の場合はデフォルトモデルにフォールバックする', () => {
            process.env['OPENCODE_A2A_MODELS'] = 'invalid json!!!';

            const registry = new StaticModelRegistry();
            const models = registry.listModels();
            // デフォルトモデルが使用される
            expect(models.length).toBeGreaterThan(0);
            expect(models.some(m => m.id === 'gemini-2.5-pro')).toBe(true);
        });
    });
});

describe('getDefaultModels', () => {
    it('デフォルトモデルのコピーを返す', () => {
        const models1 = getDefaultModels();
        const models2 = getDefaultModels();
        expect(models1).toEqual(models2);
        // 異なる参照であること（コピーの確認）
        expect(models1).not.toBe(models2);
    });

    it('全デフォルトモデルが id と name を持つ', () => {
        const models = getDefaultModels();
        for (const model of models) {
            expect(model.id).toBeTruthy();
            expect(model.name).toBeTruthy();
        }
    });
});
