import type { ProviderV1, EmbeddingModelV1 } from '@ai-sdk/provider';
import { OpenCodeGeminiA2AProvider } from './provider';
import type { OpenCodeProviderOptions } from './config';

// ファイルが読み込まれた瞬間にログを出力（最優先）
console.error('[opencode-geminicli-a2a] PLUGIN SCRIPT LOADED');

export { createGeminiA2AProvider };

/**
 * OpenCode Gemini CLI A2A Provider を生成するファクトリ関数
 * 
 * @example
 * const a2a = createGeminiA2AProvider({ host: '127.0.0.1', port: 41242 });
 * const model = a2a.languageModel('gemini-2.5-pro');
 */
export interface GeminiA2AProvider extends ProviderV1 {
    // 意図的な contravariance: ProviderV1 の settings に比べ型の範囲を絞っています。
    // satisfies によるコンパイル時の型チェックでこの挙動が安全であることを確認済みです。
    (modelId: string, settings?: Partial<OpenCodeProviderOptions>): OpenCodeGeminiA2AProvider;
    languageModel(modelId: string, settings?: Partial<OpenCodeProviderOptions>): OpenCodeGeminiA2AProvider;
}

function createGeminiA2AProvider(options?: OpenCodeProviderOptions): GeminiA2AProvider {
    // 起動確認用のログ（標準エラー出力に出るはずです）
    console.error(`[opencode-geminicli-a2a] Provider factory called with options: ${JSON.stringify(options)}`);
    
    const createModel = (modelId: string, settings?: Partial<OpenCodeProviderOptions>) => {
        const sanitizedSettings = Object.fromEntries(
            Object.entries(settings ?? {}).filter(([_, v]) => v !== undefined)
        );
        return new OpenCodeGeminiA2AProvider(modelId, { ...options, ...sanitizedSettings });
    };

    const providerInstance = function geminicliA2A(modelId: string, settings?: Partial<OpenCodeProviderOptions>) {
        return createModel(modelId, settings);
    };

    return Object.assign(providerInstance, {
        providerId: 'opencode-geminicli-a2a',
        id: 'opencode-geminicli-a2a',
        // AI SDK / OpenCode が OpenAI 互換として扱おうとした場合のフォールバック
        baseURL: 'http://127.0.0.1:41242/',
        languageModel: createModel,
        textEmbeddingModel: (_modelId: string): EmbeddingModelV1<string> => {
            throw new Error('textEmbeddingModel is not supported by opencode-geminicli-a2a provider');
        },
    }) satisfies GeminiA2AProvider;
}

/**
 * OpenCode 向けの互換エクスポート
 */
export const createProvider = createGeminiA2AProvider;
export const provider = createGeminiA2AProvider();
export const opencodeGeminicliA2a = provider;
export default createGeminiA2AProvider;
