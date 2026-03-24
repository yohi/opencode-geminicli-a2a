import { z } from 'zod';
import { ConfigSchema, type A2AConfig, type AgentEndpoint, AgentEndpointSchema, LiteLLMProxyConfigSchema } from './schemas';
import type { SessionStore } from './session';
import type { ModelRegistry } from './model-registry';
import type { FallbackConfig } from './fallback';
import { readFileSync, watch, existsSync } from 'node:fs';
import path from 'node:path';
import { Logger } from './utils/logger';

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
    /** 
     * ツール名のマッピング。
     * クライアント側のツール名をサーバー側（A2Aサーバー/Gemini CLI）が認識できる名称に変換します。
     * 例: { "read_file": "read", "run_shell_command": "bash" }
     */
    toolMapping?: Record<string, string>;
    /**
     * 内部ツールリスト。
     * これらのツール呼び出しはプロバイダー層で自動承認され、クライアント側には露出しません。
     */
    internalTools?: string[];
    /** カスタムモデルレジストリ。未指定時は StaticModelRegistry が使用される */
    modelRegistry?: ModelRegistry;
    /** エラー時自動フォールバック設定。未指定時はフォールバック無効 */
    fallback?: Partial<FallbackConfig>;
    /** マルチエージェント構成（5-D）。指定された場合、提供されたエンドポイントにルーティングする */
    agents?: AgentEndpoint[];
    /** A2A サーバーの自動起動設定 */
    autoStart?: Partial<import('./server-manager').AutoStartConfig>;
    /** 外部設定ファイルのパス (デフォルト: a2a-config.json) */
    configPath?: string;
    /** ホットリロードを有効にするか */
    hotReload?: boolean;
    /** LiteLLM プロキシ URL。指定時はリクエストを LiteLLM 経由でルーティング */
    litellmProxy?: {
        url: string;
        apiKey?: string;
    };
    /**
     * A2A ストリームのチャンク間タイムアウト (ms)。
     * この時間内に次のチャンクが届かなければエラーとしてストリームを終了する。
     * codebase_investigator など長時間タスクを使う場合は大きめの値を設定してください。
     * デフォルト: 600000 (10分)
     */
    chunkTimeoutMs?: number;
    /**
     * 同一引数での同一ツール呼び出しの許容回数。
     * この回数を超えると、内部ツールの場合はループ強制中断、
     * 外部ツールの場合は bash フォールバックに変換される。
     * デフォルト: 3
     */
    maxToolCallFrequency?: number;
    /**
     * 内部ツールの auto-confirm ループの最大回数。
     * この回数を超えるとループを停止し、テキスト未出力であればフォールバックメッセージを返す。
     * デフォルト: 50
     */
    maxAutoConfirm?: number;
}

/** 外部設定ファイルのスキーマ */
const ExternalConfigSchema = z.object({
    host: z.string().optional(),
    port: z.number().optional(),
    token: z.string().optional(),
    protocol: z.enum(['http', 'https']).optional(),
    agents: z.array(AgentEndpointSchema).optional(),
    toolMapping: z.record(z.string()).optional(),
    internalTools: z.array(z.string()).optional(),
    litellmProxy: LiteLLMProxyConfigSchema.optional(),
}).passthrough();

export class ConfigManager {
    private static instance: ConfigManager;
    private externalConfig: z.infer<typeof ExternalConfigSchema> = {};
    private configPath: string = path.resolve(process.cwd(), 'a2a-config.json');
    private watchers: Set<() => void> = new Set();
    private isWatching: boolean = false;
    private configWatcher: import('node:fs').FSWatcher | null = null;
    private _changeTimer: NodeJS.Timeout | null = null;

    private constructor() {
        this.load();
    }

    static getInstance(): ConfigManager {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }

    public setConfigPath(p: string) {
        const newPath = path.resolve(p);
        if (this.configPath !== newPath) {
            this.stopWatch();
            this.configPath = newPath;
            this.load();
        }
    }

    public getExternalConfig() {
        return this.externalConfig;
    }

    public load() {
        if (!existsSync(this.configPath)) {
            // Keep current config if file is missing (e.g. temporary delete during save)
            return;
        }
        try {
            const content = readFileSync(this.configPath, 'utf8');
            const parsed = JSON.parse(content);
            const validated = ExternalConfigSchema.parse(parsed);
            this.externalConfig = validated;
            Logger.info(`[ConfigManager] Loaded external config from ${this.configPath}`);
        } catch (err) {
            Logger.error(`[ConfigManager] Failed to load config from ${this.configPath} (previous config preserved):`, err);
        }
    }

    public watch(enable: boolean) {
        if (!enable || this.isWatching || !existsSync(this.configPath)) return;
        this.isWatching = true;
        try {
            this.configWatcher = watch(this.configPath, (event) => {
                if (event === 'change' || event === 'rename') {
                    if (this._changeTimer) clearTimeout(this._changeTimer);
                    this._changeTimer = setTimeout(() => {
                        Logger.info(`[ConfigManager] Config file ${event}, reloading...`);
                        this.load();
                        
                        // For 'rename' (atomic write), we might need to recreate the watcher
                        if (event === 'rename' && existsSync(this.configPath)) {
                            this.stopWatch();
                            this.watch(true);
                        }

                        for (const cb of this.watchers) cb();
                    }, 300);
                }
            });
        } catch (err) {
            Logger.error(`[ConfigManager] Failed to watch config file:`, err);
            this.isWatching = false;
        }
    }

    public stopWatch() {
        if (this._changeTimer) {
            clearTimeout(this._changeTimer);
            this._changeTimer = null;
        }
        if (this.configWatcher) {
            this.configWatcher.close();
            this.configWatcher = null;
        }
        this.isWatching = false;
    }

    public dispose() {
        this.stopWatch();
        this.watchers.clear();
        // Reset the singleton for clean test isolation
        if (ConfigManager.instance === this) {
            ConfigManager.instance = undefined as any;
        }
    }

    /** テスト用: インスタンスをリセットする */
    static _reset() {
        ConfigManager.instance?.dispose();
        ConfigManager.instance = undefined as any;
    }

    public onChange(cb: () => void) {
        this.watchers.add(cb);
        return () => this.watchers.delete(cb);
    }
}

// ユーティリティ: 文字列を正規化し、空、空白のみ、または "undefined"/"null" 文字列は undefined とする
function getNormalizedValue(val: any): any {
    if (typeof val !== 'string') return val === null ? undefined : val;
    const trimmed = val.trim();
    if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') return undefined;
    return trimmed;
}

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
    litellmProxy: LiteLLMProxyConfigSchema.optional(),
});

const DEFAULT_TOOL_MAPPING = {
    'read_file': 'read',
    'write_file': 'write',
    'run_shell_command': 'bash',
    'bash': 'bash',
    'list_directory': 'glob',
    'read_multiple_files': 'read_multiple_files',
    'create_directory': 'create_directory',
    'search_files': 'grep',
    'edit_file': 'edit',
    'get_file_info': 'get_file_info',
    'directory_tree': 'glob',
    'move_file': 'move_file',
};

export function resolveConfig(options?: OpenCodeProviderOptions): A2AConfig & { 
    generationConfig?: OpenCodeProviderOptions['generationConfig'],
    toolMapping?: Record<string, string>,
    internalTools?: string[],
    agents?: AgentEndpoint[],
    litellmProxy?: { url: string; apiKey?: string; }
} {
    const manager = ConfigManager.getInstance();
    if (options?.configPath) manager.setConfigPath(options.configPath);
    if (options?.hotReload) manager.watch(true);

    const external = manager.getExternalConfig();

    const envHost = getNormalizedValue(process.env['GEMINI_A2A_HOST']);
    const envPort = getNormalizedValue(process.env['GEMINI_A2A_PORT']);
    const envToken = getNormalizedValue(process.env['GEMINI_A2A_TOKEN']);
    const envProtocol = getNormalizedValue(process.env['GEMINI_A2A_PROTOCOL']);
    const envLiteLLMUrl = getNormalizedValue(process.env['LITELLM_PROXY_URL']);
    const envLiteLLMKey = getNormalizedValue(process.env['LITELLM_PROXY_API_KEY']);

    const mergedConfig = {
        host: getNormalizedValue(options?.host) ?? external.host ?? envHost,
        port: getNormalizedValue(options?.port) ?? external.port ?? envPort,
        token: getNormalizedValue(options?.token) ?? external.token ?? envToken,
        protocol: getNormalizedValue(options?.protocol) ?? external.protocol ?? (envProtocol as 'http' | 'https' | undefined),
        generationConfig: options?.generationConfig,
        litellmProxy: options?.litellmProxy ?? external.litellmProxy ?? (envLiteLLMUrl ? { url: envLiteLLMUrl, apiKey: envLiteLLMKey } : undefined),
    };

    const parsedData = parseSchema.parse(mergedConfig);
    const baseConfig = ConfigSchema.parse(parsedData);

    return {
        ...baseConfig,
        generationConfig: parsedData.generationConfig,
        toolMapping: {
            ...DEFAULT_TOOL_MAPPING,
            ...external.toolMapping,
            ...options?.toolMapping,
        },
        internalTools: options?.internalTools ?? external.internalTools,
        agents: options?.agents ?? external.agents,
        litellmProxy: parsedData.litellmProxy,
    };
}
