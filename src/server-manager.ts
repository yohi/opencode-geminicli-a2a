import { spawn, exec, type ChildProcess } from 'node:child_process';
import { createConnection } from 'node:net';
import { existsSync } from 'node:fs';
import { promisify } from 'node:util';
import path from 'node:path';
import { Logger } from './utils/logger';
import { ConfigManager } from './config';

const execAsync = promisify(exec);

export interface AutoStartConfig {
    /** サーバーの .mjs ファイルへの絶対パス。未指定時は自動検出を試みる。 */
    serverPath?: string;
    /** 起動時に追加・上書きする環境変数。USE_CCPA, GEMINI_API_KEY, A2A_GEMINI_MODEL 等を渡す */
    env?: Record<string, string>;
    /** TCP接続確認のポーリング間隔 (ms, デフォルト: 200) */
    pollIntervalMs?: number;
    /** サーバー起動タイムアウト (ms, デフォルト: 15000) */
    startupTimeoutMs?: number;
}

/** ポートが Listen 状態かどうかをプローブする */
function probePort(port: number, host: string): Promise<boolean> {
    return new Promise((resolve) => {
        const sock = createConnection({ port, host });
        sock.once('connect', () => { sock.destroy(); resolve(true); });
        sock.once('error', () => resolve(false));
        sock.setTimeout(300, () => { sock.destroy(); resolve(false); });
    });
}

/** ポートが Listen 状態になるまで待機する */
function waitForPort(port: number, host: string, timeoutMs: number, pollMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
        const deadline = Date.now() + timeoutMs;
        const poll = async () => {
            if (await probePort(port, host)) {
                resolve();
                return;
            }
            if (Date.now() >= deadline) {
                reject(new Error(`[ServerManager] A2A server did not become ready on ${host}:${port} within ${timeoutMs}ms`));
                return;
            }
            setTimeout(poll, pollMs);
        };
        poll();
    });
}

/** 起動済みサーバーの管理エントリ */
interface ManagedServer {
    proc: ChildProcess;
    port: number;
    host: string;
    refCount: number;
}

/**
 * A2A サーバープロセスを起動・管理するシングルトンマネージャー。
 * 同一ポートへの多重起動を防ぎ、参照カウントでプロセスのライフサイクルを管理する。
 */
export class ServerManager {
    private static instance: ServerManager | undefined;
    private servers = new Map<number, ManagedServer>(); // keyed by port
    private startingUp = new Map<number, Promise<() => void>>(); // keyed by port
    private cleanupRegistered = false;
    private cachedNpmRoot: string | null = null;

    private constructor() {}

    static getInstance(): ServerManager {
        if (!ServerManager.instance) {
            ServerManager.instance = new ServerManager();
        }
        return ServerManager.instance;
    }

    /**
     * 指定ポートで A2A サーバーを起動する。
     * すでにそのポートでサーバーが動作している場合（外部プロセス含む）は起動をスキップする。
     * 返却値はプロセスをリリースするための関数。
     */
    async ensureRunning(
        port: number,
        host: string,
        modelId: string,
        config: AutoStartConfig,
        debug: boolean
    ): Promise<() => Promise<void>> {
        // 1. 既に本マネージャーが管理しているプロセスが存在するか確認
        const existing = this.servers.get(port);
        if (existing) {
            existing.refCount++;
            Logger.info(`[ServerManager] Reusing managed server on ${host}:${port} (refCount=${existing.refCount})`);
            return this.makeReleaseFn(port, debug);
        }

        // 2. すでに起動処理が走っている場合はそれを待つ
        const inflight = this.startingUp.get(port);
        if (inflight) {
            Logger.debug(`[ServerManager] Waiting for inflight startup on port ${port}...`);
            await inflight;
            const existingInflight = this.servers.get(port);
            if (existingInflight) {
                existingInflight.refCount++;
                Logger.info(`[ServerManager] Reusing managed server on ${host}:${port} after inflight (new refCount=${existingInflight.refCount})`);
                return this.makeReleaseFn(port, debug);
            }
            Logger.warn(`[ServerManager] Inflight startup on port ${port} finished but server not found in map. Retrying ensureRunning.`);
            return this.ensureRunning(port, host, modelId, config, debug);
        }

        // 並行呼び出しでのレースコンディションを防ぐため、外部チェックの前に一旦予約する
        let resolveInflight: (val: any) => void;
        const inflightPromise = new Promise(r => { resolveInflight = r; });
        this.startingUp.set(port, inflightPromise);

        try {
            // 3. 既に外部プロセスがリッスンしているか確認
            if (await probePort(port, host)) {
                Logger.info(`Port ${host}:${port} already listening. Skipping auto-start.`);
                this.startingUp.delete(port);
                resolveInflight!(null);
                // 外部プロセスなので管理しない（リリース時にも何もしない）
                return async () => {};
            }

            // 起動処理を登録
            const startupPromise = (async () => {
                let proc: ChildProcess | undefined = undefined;
                try {
                    // 新規起動
                    const serverPath = await this.resolveServerPath(config.serverPath);
                    const env: Record<string, string> = {
                        ...process.env as Record<string, string>,
                        CODER_AGENT_PORT: String(port),
                        CODER_AGENT_HOST: host,
                        A2A_GEMINI_MODEL: modelId,
                        GEMINI_AUTO_APPROVE: 'false',
                        ...config.env,
                    };

                    Logger.info(`Starting A2A server: node ${serverPath} (port=${port}, host=${host})`);

                    proc = spawn('node', [serverPath], {
                        env,
                        stdio: debug ? ['ignore', 'pipe', 'pipe'] : 'ignore',
                        detached: false,
                    });

                    if (debug && proc.stdout) {
                        proc.stdout.on('data', (d: Buffer) => process.stdout.write(`[A2A-${port}] ${d}`));
                    }
                    if (debug && proc.stderr) {
                        proc.stderr.on('data', (d: Buffer) => process.stderr.write(`[A2A-${port}] ${d}`));
                    }

                    // 起動待機
                    const pollMs = config.pollIntervalMs ?? 200;
                    const timeoutMs = config.startupTimeoutMs ?? 15000;
                    await Promise.race([
                        waitForPort(port, host, timeoutMs, pollMs),
                        new Promise<void>((_, reject) => {
                            if (!proc) return;
                            proc.on('error', (err: Error) => reject(new Error(`A2A server spawn error: ${err.message}`)));
                            proc.once('exit', (code: number | null) => {
                                if (code !== 0 && code !== null) {
                                    reject(new Error(`A2A server exited early with code ${code}`));
                                }
                            });
                        })
                    ]);

                    const entry: ManagedServer = { proc, port, host, refCount: 1 };
                    this.servers.set(port, entry);
                    this.registerCleanup(debug);

                    proc.once('exit', (code: number | null) => {
                        Logger.info(`A2A server on port ${port} exited (code=${code})`);
                        if (this.servers.get(port)?.proc === proc) {
                            this.servers.delete(port);
                        }
                    });

                    Logger.info(`A2A server on ${host}:${port} is ready.`);
                    return this.makeReleaseFn(port, debug);
                } catch (err) {
                    if (proc) {
                        proc.kill();
                    }
                    throw err;
                } finally {
                    this.startingUp.delete(port);
                }
            })();

            // 予約していた Promise を本物の起動 Promise で上書き（または連動）
            startupPromise.then(res => resolveInflight!(res)).catch(err => resolveInflight!(null));
            return startupPromise;
        } catch (err) {
            this.startingUp.delete(port);
            resolveInflight!(null);
            throw err;
        }
    }

    /** @google/gemini-cli-a2a-server の .mjs ファイルを自動検出する */
    private async resolveServerPath(overridePath?: string): Promise<string> {
        if (overridePath) {
            if (!existsSync(overridePath)) {
                throw new Error(`[ServerManager] Specified serverPath does not exist: ${overridePath}`);
            }
            return overridePath;
        }

        // 1. グローバルインストールのパスを npm root -g で取得
        try {
            if (!this.cachedNpmRoot) {
                const result = await execAsync('npm root -g', { timeout: 5000 });
                if (result && typeof result.stdout === 'string') {
                    this.cachedNpmRoot = result.stdout.trim();
                } else if (typeof (result as any) === 'string') {
                    this.cachedNpmRoot = (result as any).trim();
                }
            }
            if (this.cachedNpmRoot) {
                const globalPath = path.join(this.cachedNpmRoot, '@google', 'gemini-cli-a2a-server', 'dist', 'a2a-server.mjs');
                if (existsSync(globalPath)) {
                    return globalPath;
                }
            }
        } catch (err) {
            // npm が使えない場合はスキップ
            Logger.debug(`npm root -g failed: ${err instanceof Error ? err.message : String(err)}`);
        }

        // 2. Homebrew (linuxbrew) など代替パスを確認
        const altPaths = [
            '/home/linuxbrew/.linuxbrew/lib/node_modules/@google/gemini-cli-a2a-server/dist/a2a-server.mjs',
            '/usr/local/lib/node_modules/@google/gemini-cli-a2a-server/dist/a2a-server.mjs',
            '/usr/lib/node_modules/@google/gemini-cli-a2a-server/dist/a2a-server.mjs',
        ];
        for (const p of altPaths) {
            if (existsSync(p)) return p;
        }

        throw new Error(
            '[ServerManager] Could not locate @google/gemini-cli-a2a-server. ' +
            'Install it with `npm install -g @google/gemini-cli-a2a-server` or specify `autoStart.serverPath`.'
        );
    }

    private makeReleaseFn(port: number, debug: boolean): () => void {
        let released = false;
        return () => {
            if (released) return;
            released = true;
            const entry = this.servers.get(port);
            if (!entry) return;
            entry.refCount--;
            Logger.debug(`Released server on port ${port} (refCount=${entry.refCount})`);
            if (entry.refCount <= 0) {
                entry.proc.kill();
                this.servers.delete(port);
            }
        };
    }

    private cleanupHandlers: Array<{ event: string; handler: (...args: any[]) => void }> = [];

    private registerCleanup(debug: boolean) {
        if (this.cleanupRegistered) return;
        this.cleanupRegistered = true;

        const cleanupAndExit = (signal?: NodeJS.Signals) => {
            Logger.info(`[ServerManager] Received ${signal || 'exit'}, cleaning up...`);
            try {
                this.dispose();
            } catch (err) {
                Logger.error('[ServerManager] Error during dispose in signal handler:', err);
            }
            if (signal) {
                // Remove this handler to avoid infinite recursion then kill itself
                const h = this.cleanupHandlers.find(ch => ch.event === signal);
                if (h) process.off(signal as any, h.handler);
                process.kill(process.pid, signal);
            }
        };

        const exitHandler = () => {
            try {
                this.dispose();
            } catch (err) {
                Logger.error('[ServerManager] Error during dispose in exit handler:', err);
            }
        };
        const termHandler = () => cleanupAndExit('SIGTERM');
        const intHandler = () => cleanupAndExit('SIGINT');
        const exceptionHandler = (err: Error) => {
            Logger.error('[ServerManager] Uncaught Exception:', err);
            try {
                this.dispose();
            } catch (disposeErr) {
                Logger.error('[ServerManager] Error during dispose in exception handler:', disposeErr);
            }
            process.exit(1);
        };
        const rejectionHandler = (reason: any) => {
            Logger.error('[ServerManager] Unhandled Rejection:', reason);
            try {
                this.dispose();
            } catch (disposeErr) {
                Logger.error('[ServerManager] Error during dispose in rejection handler:', disposeErr);
            }
            process.exit(1);
        };

        process.once('exit', exitHandler);
        process.once('SIGTERM', termHandler);
        process.once('SIGINT', intHandler);
        process.once('uncaughtException', exceptionHandler);
        process.once('unhandledRejection', rejectionHandler);

        this.cleanupHandlers.push(
            { event: 'exit', handler: exitHandler },
            { event: 'SIGTERM', handler: termHandler },
            { event: 'SIGINT', handler: intHandler },
            { event: 'uncaughtException', handler: exceptionHandler },
            { event: 'unhandledRejection', handler: rejectionHandler }
        );
    }

    public dispose() {
        for (const [port, entry] of this.servers) {
            try { entry.proc.kill(); } catch { /* ignore */ }
        }
        this.servers.clear();
        this.cleanupRegistered = false;
        for (const { event, handler } of this.cleanupHandlers) {
            process.removeListener(event, handler);
        }
        this.cleanupHandlers = [];
        
        // Use a safe way to dispose ConfigManager if it was loaded.
        try {
            ConfigManager.getInstance().dispose();
        } catch (err) {
            // Ignore if already disposed
        }
    }

    /** テスト用: インスタンスをリセットする */
    static _reset() {
        if (ServerManager.instance) {
            ServerManager.instance.dispose();
            ServerManager.instance.cachedNpmRoot = null;
        }
        ServerManager.instance = undefined;
    }
}
