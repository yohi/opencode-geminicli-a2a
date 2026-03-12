import { z } from 'zod';
import { ConfigSchema, type A2AConfig, type AgentEndpoint } from './schemas';
import type { SessionStore } from './session';
import type { ModelRegistry } from './model-registry';
import type { FallbackConfig } from './fallback';

export interface OpenCodeProviderOptions {
    host?: string;
    port?: number;
    token?: string;
    protocol?: 'http' | 'https';
    sessionStore?: SessionStore;
    /** モデルの挙動を微調整する設定（温度感など） */
    generationConfig?: {
        temperature?: number;
        topP?: number;
        topK?: number;
        maxOutputTokens?: number;
        stopSequences?: string[];
        presencePenalty?: number;
        frequencyPenalty?: number;
        seed?: number;
        responseFormat?: any;
    };
    /** カスタムモデルレジストリ。未指定時は StaticModelRegistry が使用される */
    modelRegistry?: ModelRegistry;
    /** エラー時自動フォールバック設定。未指定時はフォールバック無効 */
    fallback?: Partial<FallbackConfig>;
    /** マルチエージェント構成（5-D）。指定された場合、提供されたエンドポイントにルーティングする */
    agents?: AgentEndpoint[];
    /** A2A サーバーの自動起動設定 */
    autoStart?: Partial<import('./server-manager').AutoStartConfig>;
}

// ユーティリティ: 文字列を正規化し、空、空白のみ、または "undefined"/"null" 文字列は undefined とする
function getNormalizedValue(val: any): any {
    if (typeof val !== 'string') return val === null ? undefined : val;
    const trimmed = val.trim();
    if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') return undefined;
    return trimmed;
}

// 4. Zod スキーマでパース（デフォルト値の適用と型変換）
// coerce を使って port の文字列を数値に変換するスキーマを作成
const parseSchema = z.object({
    host: z.string().optional(),
    port: z.coerce.number().int().refine(n => Number.isFinite(n) && n > 0 && n <= 65535, 'invalid port').optional(),
    token: z.string().optional(),
    protocol: z.enum(['http', 'https']).optional(),
    generationConfig: z.object({
        temperature: z.coerce.number().optional(),
        topP: z.coerce.number().optional(),
        topK: z.coerce.number().optional(),
        maxOutputTokens: z.coerce.number().int().optional(),
        stopSequences: z.array(z.string()).optional(),
        presencePenalty: z.coerce.number().optional(),
        frequencyPenalty: z.coerce.number().optional(),
        seed: z.coerce.number().int().optional(),
        responseFormat: z.any().optional(),
    }).optional(),
});

export function resolveConfig(options?: OpenCodeProviderOptions): A2AConfig & { generationConfig?: OpenCodeProviderOptions['generationConfig'] } {
    // 1. 環境変数の取得（空文字、"undefined" などを undefined に正規化）
    const envHost = getNormalizedValue(process.env['GEMINI_A2A_HOST']);
    const envPort = getNormalizedValue(process.env['GEMINI_A2A_PORT']);
    const envToken = getNormalizedValue(process.env['GEMINI_A2A_TOKEN']);
    const envProtocol = getNormalizedValue(process.env['GEMINI_A2A_PROTOCOL']);

    // 2. 引数によるオプションの取得（同様に正規化）
    const optHost = getNormalizedValue(options?.host);
    const optPort = getNormalizedValue(options?.port);
    const optToken = getNormalizedValue(options?.token);
    const optProtocol = getNormalizedValue(options?.protocol);

    // 3. 優先順位（オプション > 環境変数）でマージ
    const mergedConfig = {
        host: optHost ?? envHost,
        port: optPort ?? envPort,
        token: optToken ?? envToken,
        protocol: optProtocol ?? (envProtocol as 'http' | 'https' | undefined),
        generationConfig: options?.generationConfig,
    };


    const parsedData = parseSchema.parse(mergedConfig);

    // 最終的な ConfigSchema で検証とデフォルト値適用
    const baseConfig = ConfigSchema.parse(parsedData);
    return {
        ...baseConfig,
        generationConfig: parsedData.generationConfig,
    };
}
