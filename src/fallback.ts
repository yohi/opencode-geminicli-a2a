import { APICallError } from '@ai-sdk/provider';
import type { ModelRegistry, ModelInfo } from './model-registry';

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

/**
 * エラーがクォータ関連のエラーか判定する。
 *
 * 以下の条件のいずれかに該当する場合にクォータエラーとみなす:
 * - HTTP 429 ステータスコード
 * - レスポンスメッセージに既知のクォータエラーパターンを含む
 * - JSON-RPC エラーコードが -32000 から -32099 の範囲（サーバー定義エラー）
 */
export function isQuotaError(error: unknown, config?: FallbackConfig): boolean {
    // 1. APICallError の場合
    if (error instanceof APICallError) {
        // HTTP 429
        if (error.statusCode === 429) return true;

        // レスポンスボディのパターンマッチ
        if (error.responseBody && isQuotaErrorMessage(error.responseBody, config)) {
            return true;
        }

        // エラーメッセージのパターンマッチ
        if (isQuotaErrorMessage(error.message, config)) {
            return true;
        }

        return false;
    }

    // 2. 汎用 Error の場合
    if (error instanceof Error) {
        return isQuotaErrorMessage(error.message, config);
    }

    // 3. JSON-RPC エラーオブジェクトの場合
    if (error && typeof error === 'object' && 'code' in error) {
        const code = (error as Record<string, unknown>).code;
        if (typeof code === 'number' && code >= -32099 && code <= -32000) {
            return true;
        }
        const message = (error as Record<string, unknown>).message;
        if (typeof message === 'string' && isQuotaErrorMessage(message, config)) {
            return true;
        }
    }

    return false;
}

/**
 * メッセージ文字列がクォータエラーのパターンに該当するか判定する。
 */
export function isQuotaErrorMessage(message: string, config?: FallbackConfig): boolean {
    const lowerMessage = message.toLowerCase();
    const patterns = [...DEFAULT_QUOTA_PATTERNS];

    if (config?.quotaErrorPatterns) {
        patterns.push(...config.quotaErrorPatterns);
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

    // 現在のモデルがチェーンに含まれていない場合、チェーンの先頭を返す
    // （ただし先頭が現在のモデルと同じ場合は次へ）
    if (currentIndex === -1) {
        const candidate = chain[0];
        if (candidate === currentModelId) {
            return chain.length > 1 ? chain[1] : undefined;
        }
        return candidate;
    }

    // チェーン末端に到達した場合
    if (currentIndex >= chain.length - 1) return undefined;

    // 次のモデルを返す
    const nextModelId = chain[currentIndex + 1];

    // レジストリが指定されている場合、モデルの存在を確認
    if (registry) {
        const model = registry.getModel(nextModelId);
        if (!model) {
            // 次のモデルがレジストリに存在しない場合、さらに次を探す
            if (process.env['DEBUG_OPENCODE']) {
                console.warn(`[opencode-geminicli-a2a] Fallback model '${nextModelId}' not found in registry. Trying next.`);
            }
            // 再帰的に次のモデルを探す（チェーン内の存在しないモデルをスキップ）
            return getNextFallbackModel(nextModelId, config, registry);
        }
    }

    return nextModelId;
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
        fallbackChain: config.fallbackChain ?? [],
        quotaErrorPatterns: config.quotaErrorPatterns,
        maxRetries: config.maxRetries ?? 2,
    };
}
