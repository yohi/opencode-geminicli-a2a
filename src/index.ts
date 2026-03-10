import type { ProviderV1, EmbeddingModelV1 } from '@ai-sdk/provider';
import { OpenCodeGeminiA2AProvider } from './provider';
import { type OpenCodeProviderOptions } from './config';

// ファイルが読み込まれた瞬間にログを出力（最優先）
console.error('[opencode-geminicli-a2a] PLUGIN SCRIPT LOADED');

export { createGeminiA2AProvider, OpenCodeGeminiA2AProvider };

/**
 * OpenCode Gemini CLI A2A Provider のインターフェース
 */
export interface GeminiA2AProvider extends ProviderV1 {
    providerId: string;
    providerID: string;
    id: string;
    specificationVersion: 'v1';
    languageModel: (modelId: string, settings?: any) => OpenCodeGeminiA2AProvider;
}

function createGeminiA2AProvider(options?: OpenCodeProviderOptions): GeminiA2AProvider {
    try {
        console.error(`[opencode-geminicli-a2a] Provider factory called with options: ${JSON.stringify(options)}`);
        
        const createModel = (modelId: string, settings?: any) => {
            const sanitizedSettings = Object.fromEntries(
                Object.entries(settings ?? {}).filter(([_, v]) => v !== undefined)
            );
            return new OpenCodeGeminiA2AProvider(modelId, { ...options, ...sanitizedSettings });
        };

        const models = {
            'gemini-3-pro-preview': { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview (A2A)' },
            'gemini-3.1-pro-preview': { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview (A2A)' },
            'gemini-3.1-pro-preview-customtools': { id: 'gemini-3.1-pro-preview-customtools', name: 'Gemini 3.1 Pro Preview Custom Tools (A2A)' },
            'gemini-3-flash-preview': { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview (A2A)' },
            'gemini-2.5-pro': { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (A2A)' },
            'gemini-2.5-flash': { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (A2A)' },
            'gemini-2.5-flash-lite': { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite (A2A)' },
        };

        // createModel を直接呼び出し可能なプロバイダー関数として使用し、
        // プロパティを付与して ProviderV1 互換にする。
        // これにより ESM/CJS 両方で provider('model-id') の直接呼び出し構文が動作する。
        const providerProperties: Record<string, unknown> = {
            providerId: 'opencode-geminicli-a2a',
            providerID: 'opencode-geminicli-a2a',
            id: 'opencode-geminicli-a2a',
            specificationVersion: 'v1',
            models,
            languageModel: createModel,
            textEmbeddingModel: (modelId: string) => {
                throw new Error(`Embedding model '${modelId}' is not supported by Gemini CLI (A2A).`);
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

        console.error('[opencode-geminicli-a2a] Provider instance created successfully');
        return createModel as unknown as GeminiA2AProvider;
    } catch (err) {
        console.error('[opencode-geminicli-error] CRITICAL ERROR IN FACTORY:', err);
        throw err;
    }
}

/**
 * OpenCode 向けの互換エクスポート
 */
export const createProvider = createGeminiA2AProvider;
export const provider = createGeminiA2AProvider();
export const opencodeGeminicliA2a = provider;
export default createGeminiA2AProvider;
