import type { ProviderV1, EmbeddingModelV1 } from '@ai-sdk/provider';
import { OpenCodeGeminiA2AProvider } from './provider';
import type { OpenCodeProviderOptions } from './config';

export * from './a2a-client';
export * from './config';
export * from './schemas';
export * from './provider';
export * from './session';

/**
 * OpenCode Gemini CLI A2A Provider を生成するファクトリ関数
 * 
 * @example
 * const a2a = createGeminiA2AProvider({ host: '127.0.0.1', port: 41242 });
 * const model = a2a.languageModel('gemini-2.5-pro');
 */
export interface GeminiA2AProvider extends ProviderV1 {
    (modelId: string, settings?: Partial<OpenCodeProviderOptions>): OpenCodeGeminiA2AProvider;
    languageModel(modelId: string, settings?: Partial<OpenCodeProviderOptions>): OpenCodeGeminiA2AProvider;
}

export function createGeminiA2AProvider(options?: OpenCodeProviderOptions): GeminiA2AProvider {
    const createModel = (modelId: string, settings?: Partial<OpenCodeProviderOptions>) => {
        return new OpenCodeGeminiA2AProvider(modelId, { ...options, ...settings });
    };

    const provider = function geminicliA2A(modelId: string, settings?: Partial<OpenCodeProviderOptions>) {
        return createModel(modelId, settings);
    };

    return Object.assign(provider, {
        providerId: 'opencode-geminicli-a2a',
        languageModel: createModel,
        textEmbeddingModel: (_modelId: string): EmbeddingModelV1<string> => {
            throw new Error('textEmbeddingModel is not supported by opencode-geminicli-a2a provider');
        },
    }) satisfies GeminiA2AProvider;
}
