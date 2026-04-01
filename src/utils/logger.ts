import fs from 'node:fs';

/**
 * OpenCode Gemini CLI A2A Provider 専用のロガーユーティリティ。
 * TUI（Terminal User Interface）を崩さないよう、ログをファイルに出力します。
 */
export class Logger {
    private static prefix = '[opencode-geminicli-a2a]';
    private static logFile = 'opencode.log';

    private static get isDebug(): boolean {
        return !!process.env['DEBUG_OPENCODE'];
    }

    /**
     * ログをファイルに追記します。
     */
    private static writeToFile(level: string, message: string, ...args: any[]): void {
        const timestamp = new Date().toISOString();
        const argStr = args.length > 0 ? ' ' + args.map(a => {
            try {
                return typeof a === 'object' ? JSON.stringify(a) : String(a);
            } catch (e) {
                return '[Circular or Non-Serializable]';
            }
        }).join(' ') : '';
        
        const line = `${timestamp} ${this.prefix} ${level}: ${message}${argStr}\n`;
        
        try {
            // 同期書き込み。プラグインのライフサイクル内では許容範囲。
            fs.appendFileSync(this.logFile, line);
        } catch (e) {
            // 書き込み失敗時は無視
        }
    }

    /**
     * デバッグ情報を出力します (DEBUG_OPENCODE=1 の場合のみ)
     */
    static debug(message: string, ...args: any[]): void {
        if (this.isDebug) {
            this.writeToFile('DEBUG', message, ...args);
        }
    }

    /**
     * 一般的な情報を出力します (常にファイルへ出力)
     */
    static info(message: string, ...args: any[]): void {
        this.writeToFile('INFO', message, ...args);
    }

    /**
     * 警告を出力します (常にファイルへ出力)
     */
    static warn(message: string, ...args: any[]): void {
        this.writeToFile('WARN', message, ...args);
    }

    /**
     * エラーを出力します (常にファイルへ出力)
     */
    static error(message: string, ...args: any[]): void {
        this.writeToFile('ERROR', message, ...args);
    }
}
