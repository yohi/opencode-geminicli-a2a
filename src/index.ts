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
export interface GeminiA2AProvider {
    (modelId: string, settings?: any): OpenCodeGeminiA2AProvider;
    languageModel(modelId: string, settings?: any): OpenCodeGeminiA2AProvider;
}

export function createGeminiA2AProvider(options?: OpenCodeProviderOptions): GeminiA2AProvider {
    const provider = function geminicliA2A(modelId: string, settings?: any) {
        return new OpenCodeGeminiA2AProvider(modelId, { ...options, ...settings });
    } as GeminiA2AProvider;

    provider.languageModel = (modelId: string, settings?: any) => {
        return new OpenCodeGeminiA2AProvider(modelId, { ...options, ...settings });
    };

    return provider;
}
