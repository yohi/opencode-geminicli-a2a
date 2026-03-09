import { z } from 'zod';
import { ConfigSchema, type A2AConfig } from './schemas';
import type { SessionStore } from './session';

export interface OpenCodeProviderOptions {
    host?: string;
    port?: number;
    token?: string;
    protocol?: 'http' | 'https';
    sessionStore?: SessionStore;
}

// ユーティリティ: 文字列を正規化し、空、空白のみ、または "undefined"/"null" 文字列は undefined とする
function getNormalizedValue(val: any): string | undefined {
    if (typeof val !== 'string') return val === null ? undefined : val?.toString();
    const trimmed = val.trim();
    if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') return undefined;
    return trimmed;
}

export function resolveConfig(options?: OpenCodeProviderOptions): A2AConfig {
    // 1. 環境変数の取得（空文字、"undefined" などを undefined に正規化）
    const envHost = getNormalizedValue(process.env['GEMINI_A2A_HOST']);
    const envPortStr = getNormalizedValue(process.env['GEMINI_A2A_PORT']);
    const envToken = getNormalizedValue(process.env['GEMINI_A2A_TOKEN']);
    const envProtocol = getNormalizedValue(process.env['GEMINI_A2A_PROTOCOL']);

    // 2. 引数によるオプションの取得（同様に正規化）
    const optHost = getNormalizedValue(options?.host);
    const optPortStr = getNormalizedValue(options?.port);
    const optToken = getNormalizedValue(options?.token);
    const optProtocol = getNormalizedValue(options?.protocol);

    // 3. 優先順位（オプション > 環境変数）でマージ
    const mergedConfig = {
        host: optHost ?? envHost,
        port: optPortStr ?? envPortStr,
        token: optToken ?? envToken,
        protocol: optProtocol ?? (envProtocol as 'http' | 'https' | undefined),
    };

    // 4. Zod スキーマでパース（デフォルト値の適用と型変換）
    // coerce を使って port の文字列を数値に変換する一時的なスキーマを作成
    const parseSchema = z.object({
        host: z.string().optional(),
        port: z.coerce.number().int().refine(n => Number.isFinite(n) && n > 0 && n <= 65535, 'invalid port').optional(),
        token: z.string().optional(),
        protocol: z.enum(['http', 'https']).optional(),
    });

    const parsedData = parseSchema.parse(mergedConfig);

    // 最終的な ConfigSchema で検証とデフォルト値適用
    return ConfigSchema.parse(parsedData);
}
