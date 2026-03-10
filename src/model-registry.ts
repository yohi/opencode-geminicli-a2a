import fs from 'node:fs';

/**
 * モデル情報を表すインターフェース。
 */
export interface ModelInfo {
    /** モデルの一意識別子 (例: 'gemini-2.5-pro') */
    readonly id: string;
    /** 表示名 (例: 'Gemini 2.5 Pro (A2A)') */
    readonly name: string;
    /** このモデルが紐づく A2A エンドポイントのキー（5-D マルチエージェントルーティングで使用） */
    readonly endpointKey?: string;
}

/**
 * モデルレジストリのインターフェース。
 *
 * プロバイダーが使用可能なモデルの一覧を管理します。
 * StaticModelRegistry がデフォルト実装で、将来的に A2A サーバーから
 * 動的にモデル一覧を取得する DynamicModelRegistry へ拡張可能です。
 */
export interface ModelRegistry {
    /** 全利用可能モデルを返す */
    listModels(): ModelInfo[];
    /** 指定IDのモデルを検索。存在しない場合は undefined */
    getModel(modelId: string): ModelInfo | undefined;
    /** レジストリを再読み込みする（設定変更時等に使用） */
    refresh(): void;
    /** モデルの Record 形式を返す（後方互換用） */
    toRecord(): Record<string, ModelInfo>;
}

/**
 * デフォルトのハードコード済みモデル一覧。
 * package.json の opencode.models と同期すること。
 */
const DEFAULT_MODELS: ModelInfo[] = [
    Object.freeze({ id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview (A2A)' }),
    Object.freeze({ id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview (A2A)' }),
    Object.freeze({ id: 'gemini-3.1-pro-preview-customtools', name: 'Gemini 3.1 Pro Preview Custom Tools (A2A)' }),
    Object.freeze({ id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview (A2A)' }),
    Object.freeze({ id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (A2A)' }),
    Object.freeze({ id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (A2A)' }),
    Object.freeze({ id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite (A2A)' }),
];

/**
 * モデルリストのパースと検証を行うヘルパー。
 * 環境変数やファイルからのモデル設定を安全にパースします。
 *
 * @returns パース済みモデル一覧。無効な場合は undefined
 */
function parseModelsConfig(raw: unknown): ModelInfo[] | undefined {
    if (!raw || typeof raw !== 'object') return undefined;

    const models: ModelInfo[] = [];

    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
        if (value && typeof value === 'object' && 'id' in value && 'name' in value) {
            const rawId = (value as Record<string, unknown>).id;
            const rawName = (value as Record<string, unknown>).name;

            if (
                (typeof rawId === 'string' || typeof rawId === 'number') &&
                (typeof rawName === 'string' || typeof rawName === 'number')
            ) {
                const strId = String(rawId);
                const strName = String(rawName);

                if (strId && strName) {
                    const endpointKey = (value as Record<string, unknown>).endpointKey;
                    models.push({
                        id: strId,
                        name: strName,
                        ...(typeof endpointKey === 'string' && endpointKey ? { endpointKey } : {}),
                    });
                }
            }
        } else if (typeof value === 'string' && value && key) {
            // 簡易形式: { "model-id": "Model Name" }
            models.push({ id: key, name: value });
        }
    }

    return models.length > 0 ? models : undefined;
}

/**
 * 設定ソース（環境変数・ファイル）からモデル一覧を読み込むヘルパー。
 *
 * 優先順位:
 * 1. OPENCODE_A2A_MODELS 環境変数（JSON 文字列）
 * 2. OPENCODE_A2A_MODELS_PATH 環境変数（JSON ファイルパス）
 * 3. デフォルトモデル一覧
 */
function loadModelsFromConfig(): ModelInfo[] | undefined {
    try {
        let modelsConfig: unknown;

        if (process.env['OPENCODE_A2A_MODELS']) {
            modelsConfig = JSON.parse(process.env['OPENCODE_A2A_MODELS']);
        } else if (process.env['OPENCODE_A2A_MODELS_PATH']) {
            if (fs.existsSync(process.env['OPENCODE_A2A_MODELS_PATH'])) {
                modelsConfig = JSON.parse(fs.readFileSync(process.env['OPENCODE_A2A_MODELS_PATH'], 'utf8'));
            }
        }

        return parseModelsConfig(modelsConfig);
    } catch (err) {
        if (process.env['DEBUG_OPENCODE']) {
            console.error('[opencode-geminicli-a2a] Failed to load custom models configuration; using default models.', err);
        }
        return undefined;
    }
}

/**
 * 静的モデルレジストリ。
 *
 * デフォルトモデル一覧または設定ソースからのモデル一覧を管理します。
 * refresh() を呼び出すことで、環境変数やファイルからモデル一覧を再読み込みできます。
 */
export class StaticModelRegistry implements ModelRegistry {
    private models: Map<string, ModelInfo> = new Map();
    private readonly initialModels?: ModelInfo[];

    constructor(initialModels?: ModelInfo[]) {
        this.initialModels = initialModels ? initialModels.map(model => Object.freeze({ ...model })) : undefined;
        this.resolveModels();
    }

    private resolveModels(): void {
        const source = this.initialModels ?? loadModelsFromConfig() ?? DEFAULT_MODELS;
        this.models.clear();
        for (const model of source) {
            // 格納時に防御的コピーを作成してフリーズし、外部からの変更を防ぐ
            this.models.set(model.id, Object.freeze({ ...model }));
        }
    }

    listModels(): ModelInfo[] {
        return Array.from(this.models.values());
    }

    getModel(modelId: string): ModelInfo | undefined {
        return this.models.get(modelId);
    }

    refresh(): void {
        this.resolveModels();
    }

    toRecord(): Record<string, ModelInfo> {
        const record: Record<string, ModelInfo> = {};
        for (const [id, info] of this.models) {
            record[id] = info;
        }
        return record;
    }
}

/**
 * デフォルトモデル一覧を取得する（テスト等での利用向け）。
 */
export function getDefaultModels(): ModelInfo[] {
    return DEFAULT_MODELS.map(model => Object.freeze({ ...model }));
}
