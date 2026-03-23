/**
 * OpenCode Gemini CLI A2A Provider 専用のロガーユーティリティ。
 * デバッグモードの切り替えやログレベルの制御を一元化します。
 */
export class Logger {
    private static prefix = '[opencode-geminicli-a2a]';

    private static get isDebug(): boolean {
        return !!process.env['DEBUG_OPENCODE'];
    }

    /**
     * デバッグ情報を出力します (DEBUG_OPENCODE=1 の場合のみ)
     */
    static debug(message: string, ...args: any[]): void {
        if (this.isDebug) {
            console.log(`${this.prefix} DEBUG: ${message}`, ...args);
        }
    }

    /**
     * 一般的な情報を出力します (DEBUG_OPENCODE=1 の場合のみ)
     */
    static info(message: string, ...args: any[]): void {
        if (this.isDebug) {
            console.log(`${this.prefix} INFO: ${message}`, ...args);
        }
    }

    /**
     * 警告を出力します (常に表示)
     */
    static warn(message: string, ...args: any[]): void {
        console.warn(`${this.prefix} WARN: ${message}`, ...args);
    }

    /**
     * エラーを出力します (常に表示)
     */
    static error(message: string, ...args: any[]): void {
        console.error(`${this.prefix} ERROR: ${message}`, ...args);
    }
}
