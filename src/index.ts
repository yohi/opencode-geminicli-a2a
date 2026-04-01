import type { ProviderV2 } from '@ai-sdk/provider';
import { OpenCodeGeminiA2AProvider } from './provider';
import { InMemorySessionStore } from './session';
import { type OpenCodeProviderOptions } from './config';
import { StaticModelRegistry, type ModelRegistry, type ModelInfo } from './model-registry';
import { ServerManager } from './server-manager';
import { Logger } from './utils/logger';

/**
 * @note これはプロセス内シングルトンであり、サーバレスやマルチプロセス環境では
...
 */
export const sharedSessionStore = new InMemorySessionStore();

if (process.env['NODE_ENV'] !== 'production') {
    Logger.debug('PLUGIN SCRIPT LOADED');
}

export { createGeminiA2AProvider, OpenCodeGeminiA2AProvider };
export { StaticModelRegistry, type ModelRegistry, type ModelInfo } from './model-registry';
export { ServerManager, type AutoStartConfig } from './server-manager';

/**
 * OpenCode Gemini CLI A2A Provider のインターフェース
 */
export interface GeminiA2AProvider extends Omit<ProviderV2, 'languageModel' | 'specificationVersion'> {
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
        const logPayload: Record<string, any> = {};
        if (options) {
            for (const [key, value] of Object.entries(options)) {
                if (key === 'token') {
                    logPayload[key] = '***REDACTED***';
                } else if (key === 'sessionStore' || key === 'modelRegistry') {
                    logPayload[key] = `<${key}>`;
                } else if (typeof value !== 'object' && typeof value !== 'function') {
                    logPayload[key] = value;
                }
            }
        }
        Logger.info(`Provider factory called with options: ${JSON.stringify(logPayload)}`);
        
        const sessionStore = options?.sessionStore ?? sharedSessionStore;
        const modelRegistry = options?.modelRegistry ?? new StaticModelRegistry();

        const createModel = (modelId: string, settings?: any) => {
            const { sessionStore: modelSessionStore, ...restSettings } = settings ?? {};
            if (modelSessionStore && modelSessionStore !== sessionStore) {
                throw new Error('Conflicting session stores detected: Per-model sessionStore overrides are not permitted. Please configure the sessionStore at the provider level.');
            }
            const sanitizedSettings = Object.fromEntries(
                Object.entries(restSettings).filter(([_, v]) => v !== undefined)
            );
            const providerInstance = new OpenCodeGeminiA2AProvider(modelId, { ...options, sessionStore, ...sanitizedSettings });

            // OpenCode sometimes strips custom options via strict Zod validation schemas.
            // For robust A2A integration, default to auto-starting if not explicitly disabled.
            const shouldAutoStart = (options?.autoStart as any) !== false;
            
            if (shouldAutoStart) {
                const manager = ServerManager.getInstance();
                const debug = !!process.env['DEBUG_OPENCODE'];
                
                // プロバイダー内で解決された最終的な接続先を取得
                const providerOpts = providerInstance as unknown as { options?: { host?: string; port?: number } };
                const resolvedHost = providerOpts.options?.host ?? options?.host ?? '127.0.0.1';
                const resolvedPort = providerOpts.options?.port ?? options?.port ?? 41242;

                // A2A サーバーに引き継ぐ環境変数の構築
                const autoStartConfig = typeof options?.autoStart === 'object' ? { ...options.autoStart } : {};
                autoStartConfig.env = {
                    USE_CCPA: 'true',
                    ...autoStartConfig.env,
                    ...(options?.token ? { GEMINI_API_KEY: options.token } : {}),
                };

                // サーバー起動は非同期なので Promise としてプロバイダーに持たせる
                Logger.debug(`AutoStart configured for model '${modelId}' on ${resolvedHost}:${resolvedPort}`);
                (providerInstance as any)._serverReady = manager.ensureRunning(
                    resolvedPort,
                    resolvedHost,
                    modelId,
                    autoStartConfig,
                    debug
                ).catch((err: unknown) => {
                    Logger.error(`Failed to auto-start server for model '${modelId}' on ${resolvedHost}:${resolvedPort}`, err);
                    throw err;
                });
            }

            return providerInstance;
        };

        const models = modelRegistry.toRecord();

        // createModel を直接呼び出し可能なプロバイダー関数として使用し、
        // プロパティを付与して ProviderV1 互換にする。
        // これにより ESM/CJS 両方で provider('model-id') の直接呼び出し構文が動作する。
        const providerProperties: Record<string, unknown> = {
            providerId: 'opencode-geminicli-a2a-dev',
            providerID: 'opencode-geminicli-a2a-dev',
            id: 'opencode-geminicli-a2a-dev',
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

        Logger.info('Provider instance created successfully');
        
        if (!isGeminiA2AProvider(createModel)) {
            const missing = [];
            if (typeof createModel !== 'function') missing.push('type is not function');
            if (typeof (createModel as any).languageModel !== 'function') missing.push('languageModel is not function');
            if (typeof (createModel as any).providerId !== 'string') missing.push('providerId is not string');
            throw new Error(`Runtime type check failed: createModel does not satisfy GeminiA2AProvider (${missing.join(', ')})`);
        }
        return createModel;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('--- GeminiA2A Factory Initialization Error ---');
        console.error(err);
        Logger.error('CRITICAL ERROR IN FACTORY:', err);
        // OpenCode 側で認識されやすいように詳細を含めてスロー
        const initError = new Error(`ProviderInitError: ${message}`);
        (initError as any).originalError = err;
        throw initError;
    }
}

/**
 * OpenCode 向けの互換エクスポート
 */
export const createProvider = createGeminiA2AProvider;

export const provider = createGeminiA2AProvider;
export const opencodeGeminicliA2a = createGeminiA2AProvider;
export default createGeminiA2AProvider;
