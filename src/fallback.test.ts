import { describe, it, expect } from 'vitest';
import { APICallError } from '@ai-sdk/provider';
import {
    isQuotaError,
    isQuotaErrorMessage,
    getNextFallbackModel,
    resolveFallbackConfig,
    setAllowedVendorQuotaCodes,
    type FallbackConfig,
} from './fallback';

describe('isQuotaError', () => {

    describe('APICallError の場合', () => {
        it('HTTP 429 をクォータエラーとして検知する', () => {
            const error = new APICallError({
                message: 'Too Many Requests',
                url: 'http://localhost:41242/',
                requestBodyValues: {},
                statusCode: 429,
                isRetryable: true,
            });
            expect(isQuotaError(error)).toBe(true);
        });

        it('HTTP 500 はクォータエラーではない', () => {
            const error = new APICallError({
                message: 'Internal Server Error',
                url: 'http://localhost:41242/',
                requestBodyValues: {},
                statusCode: 500,
                isRetryable: true,
            });
            expect(isQuotaError(error)).toBe(false);
        });

        it('エラーメッセージに "exhausted your capacity" を含む場合はクォータエラー', () => {
            const error = new APICallError({
                message: 'You have exhausted your capacity on this model.',
                url: 'http://localhost:41242/',
                requestBodyValues: {},
                isRetryable: false,
            });
            expect(isQuotaError(error)).toBe(true);
        });

        it('レスポンスボディに "resource exhausted" を含む場合はクォータエラー', () => {
            const error = new APICallError({
                message: 'Server error',
                url: 'http://localhost:41242/',
                requestBodyValues: {},
                responseBody: '{"error": "Resource exhausted for this project"}',
                isRetryable: false,
            });
            expect(isQuotaError(error)).toBe(true);
        });
    });

    describe('汎用 Error の場合', () => {
        it('エラーメッセージにパターンが含まれる場合はクォータエラー', () => {
            const error = new Error('Rate limit exceeded, please wait');
            expect(isQuotaError(error)).toBe(true);
        });

        it('無関係なエラーメッセージはクォータエラーではない', () => {
            const error = new Error('Connection refused');
            expect(isQuotaError(error)).toBe(false);
        });

        it('汎用Errorにcodeプロパティがあり設定したベンダーコードと一致する場合はクォータエラーになる', () => {
            setAllowedVendorQuotaCodes([-32050, -32051]);
            const error = new Error('Unknown server failure');
            (error as any).code = -32051;
            expect(isQuotaError(error)).toBe(true);
            setAllowedVendorQuotaCodes([]); // reset
        });
    });

    describe('JSON-RPC エラーオブジェクトの場合', () => {
        it('プロバイダ固有のallowlistに含まれないコードはクォータエラーではない', () => {
            setAllowedVendorQuotaCodes([-32051]);
            const error = { code: -32050, message: 'Server error' };
            expect(isQuotaError(error)).toBe(false);
            setAllowedVendorQuotaCodes([]); // reset
        });

        it('プロバイダ固有のallowlistに含まれるコードはクォータエラーになる', () => {
            setAllowedVendorQuotaCodes([-32050]);
            const error = { code: -32050, message: 'Server error' };
            expect(isQuotaError(error)).toBe(true);
            setAllowedVendorQuotaCodes([]); // reset
        });

        it('メッセージが一致する場合はクォータエラー', () => {
            const error = { code: -32600, message: 'Quota exceeded for this model' };
            expect(isQuotaError(error)).toBe(true);
        });
    });

    describe('カスタムパターン', () => {
        it('カスタムクォータパターンで検知できる', () => {
            const config: FallbackConfig = {
                enabled: true,
                fallbackChain: [],
                quotaErrorPatterns: ['custom capacity limit'],
            };
            const error = new Error('Custom capacity limit reached');
            expect(isQuotaError(error, config)).toBe(true);
        });

        it('空文字や空白のみのパターンは除外されるため異常検知しない', () => {
            const config: FallbackConfig = {
                enabled: true,
                fallbackChain: [],
                quotaErrorPatterns: ['', '   ', 'specific quota issue'],
            };
            // 空文字が原因で全てのエラーがマッチしてしまう不具合を防ぐためのテスト
            const error1 = new Error('Random innocent error');
            expect(isQuotaError(error1, config)).toBe(false);

            const error2 = new Error('Encountered specific quota issue here.');
            expect(isQuotaError(error2, config)).toBe(true);
        });
    });

    describe('エッジケース', () => {
        it('null はクォータエラーではない', () => {
            expect(isQuotaError(null)).toBe(false);
        });

        it('undefined はクォータエラーではない', () => {
            expect(isQuotaError(undefined)).toBe(false);
        });

        it('文字列はクォータエラーではない', () => {
            expect(isQuotaError('some error')).toBe(false);
        });
    });
});

describe('isQuotaErrorMessage', () => {
    it('大文字小文字を無視してパターンマッチする', () => {
        expect(isQuotaErrorMessage('RATE LIMIT EXCEEDED')).toBe(true);
        expect(isQuotaErrorMessage('Too Many Requests')).toBe(true);
    });

    it('一致しないメッセージは false を返す', () => {
        expect(isQuotaErrorMessage('Connection timeout')).toBe(false);
    });
});

describe('getNextFallbackModel', () => {
    const config: FallbackConfig = {
        enabled: true,
        fallbackChain: ['gemini-3.1-pro-preview', 'gemini-2.5-pro', 'gemini-2.5-flash'],
    };

    it('チェーン内の次のモデルを返す', () => {
        expect(getNextFallbackModel('gemini-3.1-pro-preview', config)).toBe('gemini-2.5-pro');
        expect(getNextFallbackModel('gemini-2.5-pro', config)).toBe('gemini-2.5-flash');
    });

    it('チェーン末端に到達した場合は undefined を返す', () => {
        expect(getNextFallbackModel('gemini-2.5-flash', config)).toBeUndefined();
    });

    it('チェーンに含まれないモデルの場合はチェーン先頭を返す', () => {
        expect(getNextFallbackModel('unknown-model', config)).toBe('gemini-3.1-pro-preview');
    });

    it('空のチェーンでは undefined を返す', () => {
        const emptyConfig: FallbackConfig = {
            enabled: true,
            fallbackChain: [],
        };
        expect(getNextFallbackModel('any-model', emptyConfig)).toBeUndefined();
    });

    it('チェーン内の先頭モデルの場合は2番目のモデルを返す', () => {
        const sameConfig: FallbackConfig = {
            enabled: true,
            fallbackChain: ['current-model', 'fallback-model'],
        };
        expect(getNextFallbackModel('current-model', sameConfig)).toBe('fallback-model');
    });

    it('現在のモデルと同じモデルがチェーンにある場合はスキップして次を返す', () => {
        const dupConfig: FallbackConfig = {
            enabled: true,
            fallbackChain: ['model-a', 'model-a', 'model-b'],
        };
        // resolveFallbackConfigで重複排除されていなくても、ループ内のガードでスキップされる
        expect(getNextFallbackModel('model-a', dupConfig)).toBe('model-b');
    });

    describe('レジストリが指定されている場合', () => {
        it('レジストリに存在しないモデルをスキップし、存在するモデルを返す', () => {
            const mockRegistry = {
                getModel: (id: string) => id === 'model-c' ? {} as any : undefined,
                listModels: () => [],
                refresh: async () => {},
                toRecord: () => ({}),
            } as any;
            
            const configWithRegistry: FallbackConfig = {
                enabled: true,
                fallbackChain: ['model-a', 'model-b', 'model-c'],
            };
            
            expect(getNextFallbackModel('model-a', configWithRegistry, mockRegistry)).toBe('model-c');
        });

        it('チェーン内のすべてのモデルがレジストリに存在しない場合は undefined を返す', () => {
            const mockRegistry = {
                getModel: () => undefined,
                listModels: () => [],
                refresh: async () => {},
                toRecord: () => ({}),
            } as any;
            
            const configWithRegistry: FallbackConfig = {
                enabled: true,
                fallbackChain: ['model-a', 'model-b', 'model-c'],
            };
            
            expect(getNextFallbackModel('model-a', configWithRegistry, mockRegistry)).toBeUndefined();
        });
    });
});

describe('resolveFallbackConfig', () => {
    it('enabled=false の場合は undefined を返す', () => {
        expect(resolveFallbackConfig({ enabled: false, fallbackChain: ['a'] })).toBeUndefined();
    });

    it('undefined の場合は undefined を返す', () => {
        expect(resolveFallbackConfig(undefined)).toBeUndefined();
    });

    it('enabled=true の場合はデフォルト値を補完して返す', () => {
        const result = resolveFallbackConfig({
            enabled: true,
            fallbackChain: ['model-a', 'model-b'],
        });
        expect(result).toBeDefined();
        expect(result!.enabled).toBe(true);
        expect(result!.fallbackChain).toEqual(['model-a', 'model-b']);
        expect(result!.maxRetries).toBe(2);
    });

    it('カスタム maxRetries を受け付ける', () => {
        const result = resolveFallbackConfig({
            enabled: true,
            fallbackChain: ['a'],
            maxRetries: 5,
        });
        expect(result!.maxRetries).toBe(5);
    });

    it('fallbackChain 未指定時は空配列がデフォルト', () => {
        const result = resolveFallbackConfig({ enabled: true });
        expect(result!.fallbackChain).toEqual([]);
    });

    it('fallbackChain に重複がある場合は一意にして返す', () => {
        const result = resolveFallbackConfig({ 
            enabled: true,
            fallbackChain: ['model-a', 'model-a', 'model-b', 'model-a']
        });
        expect(result!.fallbackChain).toEqual(['model-a', 'model-b']);
    });
});
