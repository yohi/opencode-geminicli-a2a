import type { ProviderV1, EmbeddingModelV1 } from '@ai-sdk/provider';
import fs from 'node:fs';
import { OpenCodeGeminiA2AProvider } from './provider';
import { InMemorySessionStore } from './session';
import { type OpenCodeProviderOptions } from './config';

/**
 * @note これはプロセス内シングルトンであり、サーバレスやマルチプロセス環境では
 * プロセス間で状態を共有しないため外部セッションストアを使う必要があります。
 */
export const sharedSessionStore = new InMemorySessionStore();

function getAvailableModels(): Record<string, { id: string; name: string }> {
    const defaultModels = {
        'gemini-3-pro-preview': { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview (A2A)' },
        'gemini-3.1-pro-preview': { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview (A2A)' },
        'gemini-3.1-pro-preview-customtools': { id: 'gemini-3.1-pro-preview-customtools', name: 'Gemini 3.1 Pro Preview Custom Tools (A2A)' },
        'gemini-3-flash-preview': { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview (A2A)' },
        'gemini-2.5-pro': { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (A2A)' },
        'gemini-2.5-flash': { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (A2A)' },
        'gemini-2.5-flash-lite': { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite (A2A)' },
    };

    try {
        let modelsConfig: any;

        if (process.env['OPENCODE_A2A_MODELS']) {
            modelsConfig = JSON.parse(process.env['OPENCODE_A2A_MODELS']);
        } else if (process.env['OPENCODE_A2A_MODELS_PATH']) {
            if (fs.existsSync(process.env['OPENCODE_A2A_MODELS_PATH'])) {
                modelsConfig = JSON.parse(fs.readFileSync(process.env['OPENCODE_A2A_MODELS_PATH'], 'utf8'));
            }
        }

        if (modelsConfig && typeof modelsConfig === 'object') {
            const parsedModels: Record<string, { id: string; name: string }> = {};
            for (const [key, value] of Object.entries(modelsConfig)) {
                if (value && typeof value === 'object' && 'id' in value && 'name' in value) {
                    const rawId = (value as any).id;
                    const rawName = (value as any).name;
                    if ((typeof rawId === 'string' || typeof rawId === 'number') &&
                        (typeof rawName === 'string' || typeof rawName === 'number')) {
                        const strId = String(rawId);
                        const strName = String(rawName);
                        if (strId && strName) {
                            parsedModels[key] = {
                                id: strId,
                                name: strName
                            };
                        }
                    }
                }
            }
            if (Object.keys(parsedModels).length > 0) {
                return parsedModels;
            }
        }
    } catch (err) {
        if (process.env['DEBUG_OPENCODE']) {
            console.error('[opencode-geminicli-a2a] Failed to load custom models configuration; using default models.', err);
        }
    }

    return defaultModels;
}

if (process.env['NODE_ENV'] !== 'production' && process.env['DEBUG_OPENCODE']) {
    console.log('[opencode-geminicli-a2a] PLUGIN SCRIPT LOADED');
}

export { createGeminiA2AProvider, OpenCodeGeminiA2AProvider };

/**
 * OpenCode Gemini CLI A2A Provider のインターフェース
 */
export interface GeminiA2AProvider extends Omit<ProviderV1, 'languageModel' | 'specificationVersion'> {
    providerId: string;
    providerID: string;
    id: string;
    specificationVersion: 'v2';
    languageModel: (modelId: string, settings?: any) => OpenCodeGeminiA2AProvider;
    /**
     * 指定されたセッションのコンテキスト（contextId / taskId）をリセットします。
     * 新規チャットスレッド開始時等に使用してください。
     */
    resetSession: (sessionId: string) => Promise<void>;
    (modelId: string, settings?: any): OpenCodeGeminiA2AProvider;
}

function isGeminiA2AProvider(obj: any): obj is GeminiA2AProvider {
    return obj !== null && typeof obj === 'function' && typeof obj.languageModel === 'function' && typeof obj.providerId === 'string';
}

function createGeminiA2AProvider(options?: OpenCodeProviderOptions): GeminiA2AProvider {
    try {
        if (process.env['DEBUG_OPENCODE']) {
            const logPayload: Record<string, any> = {};
            if (options) {
                for (const [key, value] of Object.entries(options)) {
                    if (key === 'token') {
                        logPayload[key] = '***REDACTED***';
                    } else if (key === 'sessionStore') {
                        logPayload[key] = '<sessionStore>';
                    } else if (typeof value !== 'object' && typeof value !== 'function') {
                        logPayload[key] = value;
                    }
                }
            }
            console.log(`[opencode-geminicli-a2a] Provider factory called with options: ${JSON.stringify(logPayload)}`);
        }
        
        const sessionStore = options?.sessionStore ?? sharedSessionStore;

        const createModel = (modelId: string, settings?: any) => {
            const { sessionStore: modelSessionStore, ...restSettings } = settings ?? {};
            if (modelSessionStore && modelSessionStore !== sessionStore) {
                throw new Error('Conflicting session stores detected: Per-model sessionStore overrides are not permitted. Please configure the sessionStore at the provider level.');
            }
            const sanitizedSettings = Object.fromEntries(
                Object.entries(restSettings).filter(([_, v]) => v !== undefined)
            );
            return new OpenCodeGeminiA2AProvider(modelId, { ...options, sessionStore, ...sanitizedSettings });
        };

        const models = getAvailableModels();

        // createModel を直接呼び出し可能なプロバイダー関数として使用し、
        // プロパティを付与して ProviderV1 互換にする。
        // これにより ESM/CJS 両方で provider('model-id') の直接呼び出し構文が動作する。
        const providerProperties: Record<string, unknown> = {
            providerId: 'opencode-geminicli-a2a',
            providerID: 'opencode-geminicli-a2a',
            id: 'opencode-geminicli-a2a',
            specificationVersion: 'v2',
            models,
            languageModel: createModel,
            textEmbeddingModel: (modelId: string) => {
                throw new Error(`Embedding model '${modelId}' is not supported by Gemini CLI (A2A).`);
            },
            resetSession: async (sessionId: string) => {
                await sessionStore.resetSession(sessionId);
            },
        };

        // Object.defineProperty を使って関数の readonly プロパティとの衝突を回避
        for (const [key, value] of Object.entries(providerProperties)) {
            Object.defineProperty(createModel, key, {
                value,
                writable: true,
                configurable: true,
                enumerable: true,
            });
        }

        // name プロパティは関数固有の readonly なので defineProperty で上書き
        Object.defineProperty(createModel, 'name', {
            value: 'Gemini CLI (A2A)',
            writable: false,
            configurable: true,
            enumerable: true,
        });

        if (process.env['DEBUG_OPENCODE']) {
            console.log('[opencode-geminicli-a2a] Provider instance created successfully');
        }
        
        if (!isGeminiA2AProvider(createModel)) {
            throw new Error('Runtime type check failed: createModel does not satisfy GeminiA2AProvider');
        }
        return createModel;
    } catch (err) {
        console.error('[opencode-geminicli-error] CRITICAL ERROR IN FACTORY:', err);
        throw err;
    }
}

/**
 * OpenCode 向けの互換エクスポート
 */
export const createProvider = createGeminiA2AProvider;

let _providerInstance: GeminiA2AProvider | undefined;

/**
 * OpenCode 向けのプロバイダーを初期化・取得します。
 * 初回呼び出し時の `config` を用いてインスタンス化し、以降の呼び出しでは
 * 同じインスタンスを返します。(後続の異なる config は無視されます)
 */
export function initProvider(config?: OpenCodeProviderOptions): GeminiA2AProvider {
    if (!_providerInstance) {
        _providerInstance = createGeminiA2AProvider(config);
    } else if (config !== undefined && !!process.env['DEBUG_OPENCODE']) {
        console.log('[opencode-geminicli-a2a] initProvider called with new config while _providerInstance already exists. The new config will be ignored.');
    }
    return _providerInstance;
}

export const provider = new Proxy(Function.prototype as unknown as GeminiA2AProvider, {
    get(_, prop) {
        if (!_providerInstance) {
            throw new Error('Provider not initialized. Call initProvider(config) first.');
        }
        return (_providerInstance as any)[prop];
    },
    apply(_, __, args) {
        if (!_providerInstance) {
            throw new Error('Provider not initialized. Call initProvider(config) first.');
        }
        return (_providerInstance as any)(...args);
    }
});

export const opencodeGeminicliA2a = provider;
export default createGeminiA2AProvider;
