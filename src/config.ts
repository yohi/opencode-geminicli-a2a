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

// ユーティリティ: 環境変数を正規化し、空または空白のみの文字列は undefined とする
function getNormalizedEnv(key: string): string | undefined {
    const val = process.env[key];
    return val && val.trim() !== '' ? val.trim() : undefined;
}

export function resolveConfig(options?: OpenCodeProviderOptions): A2AConfig {
    // 1. 環境変数の取得（文字列として取得されるが、空文字を undefined に正規化）
    const envHost = getNormalizedEnv('GEMINI_A2A_HOST');
    const envPortStr = getNormalizedEnv('GEMINI_A2A_PORT');
    const envToken = getNormalizedEnv('GEMINI_A2A_TOKEN');
    const envProtocol = getNormalizedEnv('GEMINI_A2A_PROTOCOL');

    // 2. 引数によるオプションの取得
    const optHost = options?.host;
    const optPortStr = options?.port; // 文字列・数値の可能性を考慮
    const optToken = options?.token;
    const optProtocol = options?.protocol;

    // 3. 優先順位（環境変数 > オプション）でマージ
    const mergedConfig = {
        host: envHost ?? optHost,
        port: envPortStr ?? optPortStr,
        token: envToken ?? optToken,
        protocol: (envProtocol as 'http' | 'https' | undefined) ?? optProtocol,
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
