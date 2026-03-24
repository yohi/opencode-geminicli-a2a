import { APICallError } from '@ai-sdk/provider';
import type { ModelRegistry } from './model-registry';
import { Logger } from './utils/logger';

/**
 * フォールバック設定。
 * クォータ枯渇などのエラー時に代替モデルへ自動切替するための構成情報。
 */
export interface FallbackConfig {
    /** フォールバック機能を有効にするか (デフォルト: false) */
    enabled: boolean;
    /**
     * モデルIDの優先順位リスト。
     * リクエスト元のモデルが枯渇した場合、このリスト内でそれより後にあるモデルへ順に切り替わる。
     * 例: ['gemini-3.1-pro-preview', 'gemini-2.5-pro', 'gemini-2.5-flash']
     */
    fallbackChain: string[];
    /**
     * クォータエラーとして検知する追加のテキストパターン。
     * デフォルトのパターンに加えて検知したい文字列を追加する場合に使用。
     */
    quotaErrorPatterns?: string[];
    /**
     * フォールバック時に同一リクエスト内で試行する最大回数。
     * デフォルト: 2（元のモデルを含まない、フォールバック先のみのカウント）
     */
    maxRetries?: number;
}

/** デフォルトのクォータエラー検知パターン */
const DEFAULT_QUOTA_PATTERNS = [
    'exhausted your capacity',
    'rate limit exceeded',
    'quota exceeded',
    'resource exhausted',
    'too many requests',
];

/** 特定のベンダー固有クォータエラーとみなすJSON-RPCエラーコード（allowlist） */
export const ALLOWED_VENDOR_QUOTA_CODES = new Set<number>([
    // ベンダー固有のエラーコードが必要な場合はここに追加
]);

/**
 * ベンダー固有のクォータエラーコード（allowlist）を設定する。
 */
export function setAllowedVendorQuotaCodes(codes: number[]): void {
    ALLOWED_VENDOR_QUOTA_CODES.clear();
    for (const code of codes) {
        ALLOWED_VENDOR_QUOTA_CODES.add(code);
    }
}

/**
 * エラーがクォータ関連のエラーか判定する。
 *
 * 以下の条件のいずれかに該当する場合にクォータエラーとみなす:
 * - HTTP 429 ステータスコード
 * - レスポンスメッセージに既知のクォータエラーパターンを含む
 * - JSON-RPC エラーコードが特定のベンダー固有のクォータエラーコード（allowlist）に含まれる
 */
export function isQuotaError(error: unknown, config?: FallbackConfig): boolean {
    let statusCode: number | undefined;
    let message: string | undefined;
    let code: number | undefined;
    let responseBody: string | undefined;

    // 1. エラーオブジェクトの正規化
    if (error instanceof APICallError) {
        statusCode = error.statusCode;
        message = error.message;
        if (typeof error.responseBody === 'string') {
            responseBody = error.responseBody;
        }
    } else if (error instanceof Error) {
        message = error.message;
        if ('code' in error && typeof (error as any).code === 'number') {
            code = (error as any).code;
        }
    } else if (error && typeof error === 'object') {
        const record = error as Record<string, unknown>;
        if (typeof record.message === 'string') message = record.message;
        if (typeof record.code === 'number') code = record.code;
        if (record.isQuotaError === true) return true;
    } else if (typeof error === 'string') {
        message = error;
    }

    // 2. 正規化されたデータに基づく判定
    if (statusCode === 429) return true;
    if (responseBody && isQuotaErrorMessage(responseBody, config)) return true;
    if (message && isQuotaErrorMessage(message, config)) return true;
    if (code !== undefined && ALLOWED_VENDOR_QUOTA_CODES.has(code)) return true;

    return false;
}

/**
 * メッセージ文字列がクォータエラーのパターンに該当するか判定する。
 */
export function isQuotaErrorMessage(message: string, config?: FallbackConfig): boolean {
    const lowerMessage = message.toLowerCase();
    const patterns = [...DEFAULT_QUOTA_PATTERNS];

    if (config?.quotaErrorPatterns) {
        const validPatterns = config.quotaErrorPatterns
            .map(p => p.trim())
            .filter(p => p.length > 0);
        patterns.push(...validPatterns);
    }

    return patterns.some(pattern => lowerMessage.includes(pattern.toLowerCase()));
}

/**
 * フォールバックチェーンに基づいて次のモデルを取得する。
 *
 * @param currentModelId 現在使用中のモデルID
 * @param config フォールバック設定
 * @param registry モデルレジストリ（フォールバック先の有効性確認に使用）
 * @returns 次のフォールバック先モデルID。チェーン末端の場合は undefined
 */
export function getNextFallbackModel(
    currentModelId: string,
    config: FallbackConfig,
    registry?: ModelRegistry,
): string | undefined {
    const chain = config.fallbackChain;
    if (chain.length === 0) return undefined;

    const currentIndex = chain.indexOf(currentModelId);

    // 現在のモデルがチェーンに含まれていない場合は先頭(0)から、
    // 含まれている場合は次のモデル(currentIndex + 1)から探す
    let searchIndex = currentIndex === -1 ? 0 : currentIndex + 1;

    // 無限ループ防止用のセーフガード
    const maxIterations = chain.length;
    let iterations = 0;

    while (searchIndex < chain.length && iterations < maxIterations) {
        iterations++;
        const nextModelId = chain[searchIndex];

        // 念のため、次のモデルが現在のモデルと同じ場合はスキップ
        if (nextModelId === currentModelId) {
            searchIndex++;
            continue;
        }

        // レジストリが指定されている場合、モデルの存在を確認
        if (registry) {
            const model = registry.getModel(nextModelId);
            if (!model) {
                Logger.info(`Fallback model '${nextModelId}' not found in registry. Trying next.`);
                searchIndex++;
                continue;
            }
        }

        return nextModelId;
    }

    return undefined;
}

/**
 * フォールバック処理の結果を表す型。
 */
export interface FallbackResult {
    /** フォールバックが発生したか */
    fellBack: boolean;
    /** 最終的に使用されたモデルID */
    finalModelId: string;
    /** フォールバック回数 */
    retryCount: number;
    /** 元のエラー（フォールバック自体も失敗した場合） */
    originalError?: unknown;
}

/**
 * フォールバック設定のデフォルト値で補完する。
 */
export function resolveFallbackConfig(config?: Partial<FallbackConfig>): FallbackConfig | undefined {
    if (!config || !config.enabled) return undefined;

    return {
        enabled: true,
        // 重複エントリを除外する
        fallbackChain: config.fallbackChain ? Array.from(new Set(config.fallbackChain)) : [],
        quotaErrorPatterns: config.quotaErrorPatterns,
        maxRetries: config.maxRetries ?? 2,
    };
}
