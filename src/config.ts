import { z } from 'zod';
import { ConfigSchema, type A2AConfig, type AgentEndpoint, AgentEndpointSchema } from './schemas';
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
}

/** 外部設定ファイルのスキーマ */
const ExternalConfigSchema = z.object({
    host: z.string().optional(),
    port: z.number().optional(),
    token: z.string().optional(),
    protocol: z.enum(['http', 'https']).optional(),
    agents: z.array(z.any()).optional(),
    toolMapping: z.record(z.string()).optional(),
    internalTools: z.array(z.string()).optional(),
}).passthrough();

export class ConfigManager {
    private static instance: ConfigManager;
    private externalConfig: z.infer<typeof ExternalConfigSchema> = {};
    private configPath: string = path.resolve(process.cwd(), 'a2a-config.json');
    private watchers: Set<() => void> = new Set();
    private isWatching: boolean = false;

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
            this.configPath = newPath;
            this.load();
        }
    }

    public getExternalConfig() {
        return this.externalConfig;
    }

    public load() {
        if (!existsSync(this.configPath)) {
            this.externalConfig = {};
            return;
        }
        try {
            const content = readFileSync(this.configPath, 'utf8');
            const parsed = JSON.parse(content);
            this.externalConfig = ExternalConfigSchema.parse(parsed);
            Logger.info(`[ConfigManager] Loaded external config from ${this.configPath}`);
        } catch (err) {
            Logger.error(`[ConfigManager] Failed to load config from ${this.configPath}:`, err);
        }
    }

    public watch(enable: boolean) {
        if (!enable || this.isWatching || !existsSync(this.configPath)) return;
        this.isWatching = true;
        try {
            watch(this.configPath, (event) => {
                if (event === 'change') {
                    Logger.info(`[ConfigManager] Config file changed, reloading...`);
                    this.load();
                    for (const cb of this.watchers) cb();
                }
            });
        } catch (err) {
            Logger.error(`[ConfigManager] Failed to watch config file:`, err);
            this.isWatching = false;
        }
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
    agents?: AgentEndpoint[]
} {
    const manager = ConfigManager.getInstance();
    if (options?.configPath) manager.setConfigPath(options.configPath);
    if (options?.hotReload) manager.watch(true);

    const external = manager.getExternalConfig();

    const envHost = getNormalizedValue(process.env['GEMINI_A2A_HOST']);
    const envPort = getNormalizedValue(process.env['GEMINI_A2A_PORT']);
    const envToken = getNormalizedValue(process.env['GEMINI_A2A_TOKEN']);
    const envProtocol = getNormalizedValue(process.env['GEMINI_A2A_PROTOCOL']);

    const mergedConfig = {
        host: getNormalizedValue(options?.host) ?? external.host ?? envHost,
        port: getNormalizedValue(options?.port) ?? external.port ?? envPort,
        token: getNormalizedValue(options?.token) ?? external.token ?? envToken,
        protocol: getNormalizedValue(options?.protocol) ?? external.protocol ?? (envProtocol as 'http' | 'https' | undefined),
        generationConfig: options?.generationConfig,
    };

    const parsedData = parseSchema.parse(mergedConfig);
    const baseConfig = ConfigSchema.parse(parsedData);

    let externalAgents: AgentEndpoint[] | undefined = undefined;
    if (external.agents && Array.isArray(external.agents)) {
        externalAgents = external.agents.map(a => AgentEndpointSchema.parse(a));
    }

    return {
        ...baseConfig,
        generationConfig: parsedData.generationConfig,
        toolMapping: {
            ...DEFAULT_TOOL_MAPPING,
            ...external.toolMapping,
            ...options?.toolMapping,
        },
        internalTools: options?.internalTools ?? external.internalTools,
        agents: options?.agents ?? externalAgents,
    };
}
