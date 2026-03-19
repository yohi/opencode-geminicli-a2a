import {
    type LanguageModelV1Prompt,
    type LanguageModelV1StreamPart,
    type LanguageModelV1FinishReason,
} from '@ai-sdk/provider';
import type { A2AJsonRpcRequest, A2AResponseResult, Tool } from '../schemas';
import crypto from 'node:crypto';
import { Logger } from './logger';

/**
 * Gemini CLI A2A サーバーのデフォルト内部ツールリスト。
 * これらは OpenCode 側には露出させず、プロバイダー層で自動承認（auto-confirm）する。
 */
export const DEFAULT_INTERNAL_TOOLS = [
    'activate_skill',
    'load_skill',
    'search_skills',
    'search_skills_by_id',
    'search_skills_by_name',
    'sequentialthinking',
    'save_memory',
    'cli_help',
    'codebase_investigator',
    'generalist'
];

export interface ExtendedFinishPart {
    type: 'finish';
    finishReason: LanguageModelV1FinishReason;
    usage: { 
        inputTokens: { total: number }; 
        outputTokens: { total: number };
    };
    providerMetadata?: Record<string, any>;
    inputRequired?: boolean;
    rawState?: string;
    coderAgentKind?: string;
    hasExposedTools?: boolean;
}

export type ExtendedStreamPart = LanguageModelV1StreamPart | ExtendedFinishPart | FileStreamPart;

// AI SDK v3 の LanguageModelV3StreamPart に含まれる file 型
export interface FileStreamPart {
    type: 'file';
    mimeType: string; // V1/V2 互換用
    mediaType: string; // V3 互換用
    data: string | Uint8Array;
}


interface ToolRequest {
    request: {
        callId?: string;
        name: string;
        args?: unknown;
    };
}

interface ThoughtData {
    subject?: string;
    description?: string;
}

function isToolRequest(data: unknown): data is ToolRequest {
    if (!data || typeof data !== 'object') return false;
    const req = (data as Record<string, unknown>).request;
    return !!req && typeof req === 'object' && typeof (req as Record<string, unknown>).name === 'string';
}

function isThoughtData(data: unknown): data is Record<string, any> & { subject?: string; description?: string } {
    return typeof data === 'object' && data !== null && ('subject' in data || 'description' in data);
}

/**
 * Parses percent-encoded payload directly to Uint8Array treating non-% sequences as single bytes.
 * Bypasses encodeURIComponent UTF-8 limitations.
 */
function percentPayloadToBytes(payload: string): Uint8Array {
    const bytes: number[] = [];
    for (let i = 0; i < payload.length; i++) {
        if (payload[i] === '%' && i + 2 < payload.length) {
            const hex = payload.substring(i + 1, i + 3);
            if (/^[0-9a-fA-F]{2}$/.test(hex)) {
                bytes.push(parseInt(hex, 16));
                i += 2;
                continue;
            }
        }
        bytes.push(payload.charCodeAt(i) & 0xFF);
    }
    return new Uint8Array(bytes);
}

/**
 * mapPromptToA2AJsonRpcRequest のオプション。
 * マルチターン対話で contextId / taskId を引き継ぐ際に使用。
 */
export interface MapPromptOptions {
    tools?: Tool[];
    /** ツール名のマッピング (OpenCode -> Server) */
    toolMapping?: Record<string, string>;
    /** 内部ツールリスト */
    internalTools?: string[];
    /** OpenCode 側がリクエストしたツールの一覧 (A2A 内部ツールとの識別に使う) */
    clientTools?: string[];
    /** 前回レスポンスから取得した contextId。コンテキスト継続に使用 */
    contextId?: string;
    /** 前回レスポンスから取得した taskId。タスク継続（input-required 状態）に使用 */
    taskId?: string;
    /** リクエストで使用するモデルID。A2Aサーバー起動時のデフォルトモデルを上書きする */
    modelId?: string;
    /** 前回までに送信済みのプロンプトメッセージ数。重複した履歴送信を避けるため */
    processedMessagesCount?: number;
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
}

/**
 * AI SDK のプロンプトを A2A (JSON-RPC) リクエストに変換する。
 *
 * マルチターン対話:
 *   - contextId が指定されている場合、params.contextId に付与してコンテキストを継続
 *   - taskId が指定されている場合、params.taskId に付与してタスクを継続
 *   - prompt 末尾が tool ロールの場合、ツール結果をテキスト化して user メッセージに含める
 */
export function mapPromptToA2AJsonRpcRequest(
    prompt: LanguageModelV1Prompt,
    optionsOrTools?: MapPromptOptions | Tool[]
): A2AJsonRpcRequest {
    // 後方互換: 第2引数が配列の場合は tools として扱う
    const options: MapPromptOptions = Array.isArray(optionsOrTools)
        ? { tools: optionsOrTools }
        : (optionsOrTools ?? {});

    const { tools, contextId, taskId, modelId, generationConfig, toolMapping } = options;

    if (prompt.length === 0) {
        return buildRequest('(empty prompt)', options);
    }

    let newMessages = prompt;
    if (contextId && options.processedMessagesCount !== undefined && options.processedMessagesCount > 0) {
        newMessages = prompt.slice(options.processedMessagesCount);
    }

    let parts: A2AJsonRpcRequest['params']['message']['parts'] = [];

    if (!contextId) {
        parts.push({
            kind: 'text',
            text: `[SYSTEM]\nCRITICAL INSTRUCTION: When calling tools, you MUST use their exact full names as they appear in your 'Available tools' list. Do NOT use short aliases or guess prefixes! If a tool is listed WITH a prefix (e.g., 'docker-mcp-gateway_read_file'), you MUST include it. If it is listed WITHOUT a prefix (e.g., 'read'), you MUST NOT add one. The server will reject the tool call with an 'invalid' error if the name does not match exactly.\n`
        });
    }

    for (const msg of newMessages) {
        if (msg.role === 'system') {
            parts.push({ kind: 'text', text: `[SYSTEM]\n${msg.content}\n` });
        } else if (msg.role === 'user') {
            parts.push({ kind: 'text', text: `[USER]\n` });
            parts.push(...extractUserParts(msg));
        } else if (msg.role === 'assistant') {
            let text = '';
            if (typeof msg.content === 'string') text = msg.content;
            else if (Array.isArray(msg.content)) {
                text = msg.content.filter(p => p.type === 'text').map(p => p.text).join('\n');
            }
            parts.push({ kind: 'text', text: `[ASSISTANT]\n${text}\n` });
        } else if (msg.role === 'tool') {
            parts.push({ kind: 'text', text: `[TOOL RESULT]\n${formatToolResults(msg.content, toolMapping)}\n` });
        }
    }

    if (parts.length === 0) {
        parts = [{ kind: 'text' as const, text: '(empty prompt)' }];
    }

    return buildRequest(parts, options);
}

/**
 * 内部ツール承認などの継続リクエスト（confirmation）を構築する
 */
export function buildConfirmationRequest(
    taskId: string,
    modelId?: string,
    confirmation: boolean = true
): A2AJsonRpcRequest {
    const ts = Date.now();
    return {
        jsonrpc: '2.0',
        id: `confirm_${ts}`,
        method: 'message/stream',
        params: {
            message: {
                messageId: `confirm_${ts}`,
                role: 'user',
                parts: [{ kind: 'text', text: confirmation ? 'Proceed' : 'Cancel' }]
            },
            configuration: {
                blocking: false
            },
            taskId,
            ...(modelId ? { model: modelId } : {})
        }
    };
}

/**
 * バイナリデータやURIを抽出するヘルパー。
 */
function extractBinaryOrUri(data: unknown): { bytes?: string; uri?: string; extractedMimeType?: string } {
    const isBuffer = typeof Buffer !== 'undefined' && Buffer.isBuffer(data);
    const isUint8Array = data instanceof Uint8Array;
    const isArrayBuffer = data instanceof ArrayBuffer || (typeof SharedArrayBuffer !== 'undefined' && data instanceof SharedArrayBuffer);
    const isUrlObj = data instanceof URL;
    const isString = typeof data === 'string';

    let bytes: string | undefined = undefined;
    let uri: string | undefined = undefined;
    let extractedMimeType: string | undefined = undefined;

    if (isBuffer || isUint8Array) {
        if (typeof Buffer !== 'undefined') {
            bytes = Buffer.from(data as unknown as Uint8Array).toString('base64');
        } else {
            const arr = data as unknown as Uint8Array;
            bytes = btoa(Array.from(arr, b => String.fromCharCode(b)).join(''));
        }
    } else if (isArrayBuffer) {
        if (typeof Buffer !== 'undefined') {
            bytes = Buffer.from(new Uint8Array(data as unknown as ArrayBuffer)).toString('base64');
        } else {
            const arr = new Uint8Array(data as unknown as ArrayBuffer);
            bytes = btoa(Array.from(arr, b => String.fromCharCode(b)).join(''));
        }
    } else if (isUrlObj) {
        uri = (data as URL).href;
    } else if (isString) {
        const str = data as unknown as string;
        if (str.startsWith('data:')) {
            const matchBase64 = str.match(/^data:(.*?);base64,(.*)$/);
            if (matchBase64) {
                extractedMimeType = matchBase64[1];
                bytes = matchBase64[2];
            } else {
                const matchPlain = str.match(/^data:(.*?),(.*)$/);
                if (matchPlain) {
                    extractedMimeType = matchPlain[1];
                    const u8 = percentPayloadToBytes(matchPlain[2]);
                    if (typeof Buffer !== 'undefined') {
                        bytes = Buffer.from(u8).toString('base64');
                    } else {
                        bytes = btoa(Array.from(u8, b => String.fromCharCode(b)).join(''));
                    }
                } else {
                    Logger.warn('Malformed data URI format.');
                }
            }
        } else if (str.startsWith('http://') || str.startsWith('https://')) {
            uri = str;
        } else {
            // Validate that the string is a valid base64 (or base64url) payload.
            // This prevents incorrectly treating generic text or relative paths as binary data.
            const isBase64 = str.length > 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(str);
            const isBase64Url = str.length > 0 && /^[A-Za-z0-9\-_]+={0,2}$/.test(str);
            
            const isValidLength = str.length % 4 === 0 || (!str.endsWith('=') && str.length % 4 !== 1);

            if ((isBase64 || isBase64Url) && isValidLength) {
                bytes = str;
            } else {
                Logger.warn('Invalid base64 string provided for binary data. Part will be dropped.');
            }
        }
    }

    return { bytes, uri, extractedMimeType };
}

/**
 * ユーザーメッセージから全パーツを抽出する。
 */
function extractUserParts(message: LanguageModelV1Prompt[number]): A2AJsonRpcRequest['params']['message']['parts'] {
    if (message.role !== 'user') return [];

    const content = typeof message.content === 'string'
        ? [{ type: 'text' as const, text: message.content }]
        : message.content;

    return content.map(part => {
        if (part.type === 'text') {
            return { kind: 'text' as const, text: part.text };
        } else if (part.type === 'image') {
            const extracted = extractBinaryOrUri(part.image);

            if (extracted.bytes === undefined && !extracted.uri) {
                Logger.warn('Unsupported image format: could not extract bytes or uri from image part. Part will be dropped.');
                return null;
            }

            const finalMimeType = part.mimeType || extracted.extractedMimeType;

            return {
                kind: 'image' as const,
                image: {
                    ...(finalMimeType ? { mimeType: finalMimeType } : {}),
                    ...(extracted.bytes !== undefined ? { bytes: extracted.bytes } : {}),
                    ...(extracted.uri ? { uri: extracted.uri } : {})
                }
            };
        } else if (part.type === 'file') {
            const extracted = extractBinaryOrUri(part.data);

            if (extracted.bytes === undefined && !extracted.uri) {
                Logger.warn('Unsupported file format: could not extract bytes or uri from file part. Part will be dropped.');
                return null;
            }

            const finalMimeType = part.mimeType || extracted.extractedMimeType;

            return {
                kind: 'file' as const,
                file: {
                    name: part.filename || 'file',
                    ...(finalMimeType ? { mimeType: finalMimeType } : {}),
                    ...(extracted.bytes !== undefined ? { fileWithBytes: extracted.bytes } : {}),
                    ...(extracted.uri ? { uri: extracted.uri } : {})
                }
            };
        }

        return null;
    }).filter((p): p is NonNullable<typeof p> => p !== null);
}

/**
 * AI SDK の tool-result パーツをテキスト形式に変換する。
 * A2A サーバーが理解できるよう、構造化されたテキストとして送信する。
 */
function formatToolResults(
    content: Array<{ type: 'tool-result'; toolCallId: string; toolName: string; result: unknown; isError?: boolean }>,
    toolMapping?: Record<string, string>
): string {
    return content.map(part => {
        const resultStr = typeof part.result === 'string'
            ? part.result
            : JSON.stringify(part.result);
        const prefix = part.isError ? '[Tool Error' : '[Tool Result';
        const mappedToolName = toolMapping?.[part.toolName] || part.toolName;
        return `${prefix}: ${mappedToolName} (${part.toolCallId})]\n${resultStr}`;
    }).join('\n\n');
}

/**
 * A2A JSON-RPC リクエストを構築するヘルパー。
 */
function buildRequest(
    content: string | A2AJsonRpcRequest['params']['message']['parts'],
    options: MapPromptOptions
): A2AJsonRpcRequest {
    const { tools, contextId, taskId, modelId, generationConfig, toolMapping } = options;

    // ツール名のマッピング適用し、OpenAIスキーマのラッパーを解除する
    const mappedTools = tools?.map(tool => {
        const toolObj = tool as any;
        const isWrapped = toolObj.type === 'function' && typeof toolObj.function === 'object';
        const flatTool = isWrapped ? {
            name: toolObj.function.name,
            description: toolObj.function.description,
            parameters: toolObj.function.parameters
        } : { ...toolObj };

        if (flatTool.name && toolMapping?.[flatTool.name]) {
            return { ...flatTool, name: toolMapping[flatTool.name] };
        }
        return flatTool;
    });

    const parts = typeof content === 'string'
        ? [{ kind: 'text' as const, text: content }]
        : content;

    return {
        jsonrpc: '2.0',
        id: crypto.randomUUID(),
        method: 'message/stream',
        params: {
            message: {
                messageId: crypto.randomUUID(),
                role: 'user',
                parts,
            },
            configuration: {
                blocking: false,
                ...(mappedTools && mappedTools.length > 0 ? { tools: mappedTools } : {})
            },
            ...(generationConfig ? { generationConfig } : {}),
            ...(modelId ? { model: modelId } : {}),
            ...(contextId ? { contextId } : {}),
            ...(taskId ? { taskId } : {}),
        }
    };
}

/**
 * A2A レスポンスストリームを AI SDK ストリームパーツに変換するステートフルマッパー。
 *
 * スナップショット対応:
 *   A2A サーバーがテキストを差分ではなく累計（スナップショット）で返す場合、
 *   前方一致ベースの重複排除により差分のみを text-delta として出力する。
 *
 * 思考プロセス対応:
 *   kind: "data" 内の思考プロセス（subject/description）を
 *   AI SDK の reasoning ストリームパーツとして出力する。
 */
export class A2AStreamMapper {
    private toolMapping: Record<string, string>;
    private reverseToolMapping: Record<string, string>;
    private internalTools: Set<string>;

    /** 出力済みテキストの累計インデックス別マップ。スナップショット重複排除に使用 */
    private bufferedTools = new Map<string, { toolName: string; args: any }>();
    /** レスポンスから抽出した contextId */
    private _contextId?: string;
    /** レスポンスから抽出した taskId */
    private _taskId?: string;
    /** 発行済みのツール呼び出しID (taskId ごとにリセット) */
    private emittedToolCallIds = new Set<string>();
    /** 現在のターン番号 (Turn boundary でインクリメント) */
    private _turnSequence = 0;
    /** req.callId が無い場合のフォールバックID管理。ツール名_インデックス -> ユニークID */
    private fallbackToolCallIds = new Map<string, string>();
    /** 出力済みテキストの累計インデックス別マップ。スナップショット重複排除に使用 (taskId ごとにリセット) */
    private emittedTextByIndex = new Map<number, string>();
    /** 現在のチャンクの coderAgentKind */
    private _currentCoderAgentKind?: string;
    /** 最後の finishReason */
    private _lastFinishReason?: string;

    /** OpenCode によって要求されたツールの Set (指定がある場合、これに含まれないツールはすべて internal 扱いになる) */
    private clientTools?: Set<string>;

    constructor(options?: { toolMapping?: Record<string, string>, internalTools?: string[], clientTools?: string[] }) {
        this.toolMapping = options?.toolMapping ?? {};
        this.internalTools = new Set(options?.internalTools ?? DEFAULT_INTERNAL_TOOLS);
        if (options?.clientTools) {
            this.clientTools = new Set(options.clientTools);
        }

        // reverseToolMapping の構築 (Server -> OpenCode)
        // 1つのサーバー側ツール名（例: bash）に複数の OpenCode ツール名（例: bash, run_shell_command）
        // が対応する場合、OpenCode が実際にサポートしている方を優先する。
        this.reverseToolMapping = {};
        for (const [openCodeName, serverName] of Object.entries(this.toolMapping)) {
            const currentMapped = this.reverseToolMapping[serverName];
            const isBetterMatch = !currentMapped || (this.clientTools?.has(openCodeName) && !this.clientTools?.has(currentMapped));
            if (isBetterMatch) {
                this.reverseToolMapping[serverName] = openCodeName;
            }
        }
    }

    /** レスポンスから抽出した contextId を取得 */
    get contextId(): string | undefined { return this._contextId; }
    /** レスポンスから抽出した taskId を取得 */
    get taskId(): string | undefined { return this._taskId; }
    /** 最後の finishReason を取得 */
    get lastFinishReason(): string | undefined { return this._lastFinishReason; }

    /** ターン開始時のリセット処理 */
    startNewTurn() {
        this._turnSequence++;
        this.emittedTextByIndex.clear();
        this.emittedToolCallIds.clear();
        this.fallbackToolCallIds.clear();
        this.bufferedTools.clear();
    }

    /**
     * A2A のレスポンス（各チャンク）を AI SDK のストリームパーツに変換する。
     */
    mapResult(result: A2AResponseResult): ExtendedStreamPart[] {
        const parts: ExtendedStreamPart[] = [];

        // contextId / taskId の抽出
        if (result.kind === 'task') {
            this._contextId = result.contextId;
            if (this._taskId !== result.id) {
                this._taskId = result.id;
                this.emittedTextByIndex.clear();
                this.emittedToolCallIds.clear();
                this.fallbackToolCallIds.clear();
                this.bufferedTools.clear();
                this._lastFinishReason = undefined;
            }
            return parts;
        }

        if (result.kind === 'status-update') {
            if (result.contextId) this._contextId = result.contextId;
            if (this._taskId !== result.taskId) {
                this._taskId = result.taskId;
                this.emittedTextByIndex.clear();
                this.emittedToolCallIds.clear();
                this.fallbackToolCallIds.clear();
                this.bufferedTools.clear();
                this._lastFinishReason = undefined;
            }

            const msg = result.status.message;
            const metadata = result.metadata as Record<string, any> | undefined;
            const coderAgentKind = metadata?.coderAgent?.kind as string | undefined;
            this._currentCoderAgentKind = coderAgentKind;

            const shouldProcessParts = result.status.state === 'working' || 
                                       result.status.state === 'input-required' || 
                                       result.status.state === 'tool_calls' ||
                                       result.status.state === 'stop' ||
                                       result.status.state === 'completed';
            if (shouldProcessParts && msg && msg.parts) {
                for (const [index, p] of msg.parts.entries()) {
                    if (p.kind === 'text' && p.text) {
                        const delta = this.extractTextDelta(index, p.text);
                        if (delta) {
                            parts.push({
                                type: 'text-delta',
                                textDelta: delta,
                            });
                        }
                    } else if (p.kind === 'data' && isToolRequest(p.data)) {
                        const req = p.data.request;
                        let toolName = req.name;

                        // A2A側から callId が無い場合は toolName と index で一意に決定 (引数が変化してもIDが変わらないようにする)
                        // ツール呼び出しの引数はストリーム中に徐々に構築されるため、
                        // 最終的な引数が確定するまでツールコールを emit せず、バッファに最新の引数を上書き保存する。
                        // final: true のタイミングでバッファされたツールコールを一括で emit する。
                        let toolCallId = req.callId;
                        if (!toolCallId) {
                            const fallbackKey = `${toolName}_${index}`;
                            if (!this.fallbackToolCallIds.has(fallbackKey)) {
                                // 完全にランダムなUUIDだと、チャンクごとにIDが変わってバッファリングが効かなくなるため、
                                // ターン内では安定したID（ただしUUID形式）を生成する
                                const turnSeed = `${this._turnSequence}_${fallbackKey}`;
                                const hash = crypto.createHash('md5').update(turnSeed).digest('hex');
                                this.fallbackToolCallIds.set(fallbackKey, `call_${hash}`);
                            }
                            toolCallId = this.fallbackToolCallIds.get(fallbackKey)!;
                        }
                        // CRITICAL: A2A natively hallucinates 'invalid' tools when it fails.
                        // OpenCode tracks 'invalid' across the entire session and crashes with doom_loop if it hits 5.
                        // We intercept 'invalid' and convert it to a harmless text warning so the LLM knows it failed
                        // without OpenCode ever seeing a tool call.
                        Logger.info(`[Sandbox-Debug] Received tool call from A2A stream. Initial name: '${toolName}', callId: '${toolCallId}', raw request:`, JSON.stringify(req));

                        if (toolName === 'invalid') {
                            Logger.info(`[Sandbox] Intercepted A2A native 'invalid' tool call. Converting to bash echo to prevent doom_loop.`);
                            this.bufferedTools.set(toolCallId, {
                                toolName: 'bash',
                                args: { command: 'echo "SYSTEM WARNING: I attempted to use an invalid tool. I must check my available tools and use the EXACT names as they appear there (including prefixes if they exist)."' }
                            });
                            continue;
                        }

                        // Argument normalization for Schema Bridging
                        if (req.args && typeof req.args === 'object') {
                            const args: any = req.args;
                            if (args.file_path && !args.filePath) args.filePath = args.file_path;
                            if (args.path && !args.filePath) args.filePath = args.path;
                            if (args.cmd && !args.command) args.command = args.cmd;

                            if ((toolName === 'bash' || toolName === 'run_shell_command') && typeof args.command === 'string') {
                                // Block pseudocode calls like task(subject="foo") but allow legitimate shell commands
                                if (/^\s*task\s*\(/i.test(args.command)) {
                                    args.command = `echo '[opencode-geminicli-a2a] Error: You cannot execute task() pseudocode inside a bash shell. You MUST use the dedicated "task" tool.'`;
                                }
                            }
                            
                            req.args = args;
                        }

                        // Common Gemini hallucinations to Server names
                        const commonHallucinations: Record<string, string> = {
                            'read_file': 'read',
                            'write_file': 'write',
                            'list_directory': 'glob',
                            'directory_tree': 'glob',
                            'search_files': 'grep',
                            'edit_file': 'edit',
                            'run_shell_command': 'bash',
                            'run_command': 'bash',
                            'exec_command': 'bash',
                            'shell': 'bash',
                            // Normalize 'sequentialthinking' to its full MCP server/tool name format
                            // to ensure correct routing in A2A server.
                            'sequentialthinking': 'sequential-thinking_sequentialthinking'
                        };

                        const baseName = toolName.startsWith('docker-mcp-gateway_') 
                            ? toolName.replace('docker-mcp-gateway_', '') 
                            : toolName;

                        if (commonHallucinations[baseName] && !this.clientTools?.has(toolName)) {
                            const targetServerName = commonHallucinations[baseName];
                            Logger.info(`[Workaround] Normalizing hallucinated tool call '${toolName}' to server-side name '${targetServerName}'`);
                            toolName = targetServerName;
                            
                            // Fix specific arguments for mapped tools
                            if (toolName === 'glob' && req.args && typeof req.args === 'object') {
                                const a = req.args as any;
                                if (a.pattern === undefined) {
                                    const p = a.dir_path || a.path || '.';
                                    a.pattern = `${p}/**/*`;
                                }
                            } else if (toolName === 'grep' && req.args && typeof req.args === 'object') {
                                const a = req.args as any;
                                if (a.pattern === undefined) {
                                    a.pattern = a.query || a.text || '';
                                }
                            }
                        }

                        this.bufferedTools.set(toolCallId, { toolName, args: req.args });
                    } else if (coderAgentKind === 'thought' && p.kind === 'data' && isThoughtData(p.data)) {
                        let textDelta = '';
                        if (p.data.subject && p.data.description) {
                            textDelta = `[${p.data.subject}] ${p.data.description}\n`;
                        } else if (p.data.subject) {
                            textDelta = `[${p.data.subject}]\n`;
                        } else if (p.data.description) {
                            textDelta = `${p.data.description}\n`;
                        }

                        if (textDelta) {
                            // v2 ストリーム形式では reasoning-start/reasoning-delta/reasoning-end
                            // がサポートされている。provider.ts の v1→v2 変換レイヤーで
                            // 適切な v2 ライフサイクルイベントに変換される。
                            parts.push({
                                type: 'reasoning',
                                textDelta,
                            });
                        }
                        continue;
                    } else if (p.kind === 'image') {
                        // マルチモーダルパーツは text の working 状態以外でも処理する。
                        // ツール呼び出し時(tool_calls)や入力要求時(input-required)等に、
                        // 現在のコンテキストとしての画像データをストリームに流す必要があるため。
                        // A2A レスポンスの画像パーツを AI SDK の file パーツに変換
                        const imageData = (p as any).image;
                        if (imageData && (imageData.bytes || imageData.uri)) {
                            const mimeType = imageData.mimeType || 'image/png';
                            // bytes がある場合は base64 データとして、uri がある場合はそのまま渡す
                            const data: string = imageData.bytes || imageData.uri;
                            parts.push({
                                type: 'file',
                                mimeType,
                                mediaType: mimeType,
                                data,
                            } as FileStreamPart);
                        } else {
                            Logger.warn('Received image part without bytes or uri. Skipping.');
                        }
                    } else if (p.kind === 'file') {
                        // 画像と同様に、マルチモーダルパーツは working 状態以外でも処理する。
                        // A2A レスポンスのファイルパーツを AI SDK の file パーツに変換
                        const fileData = (p as any).file;
                        if (fileData && (fileData.fileWithBytes || fileData.uri)) {
                            const mimeType = fileData.mimeType || 'application/octet-stream';
                            const data: string = fileData.fileWithBytes || fileData.uri;
                            parts.push({
                                type: 'file',
                                mimeType,
                                mediaType: mimeType,
                                data,
                            } as FileStreamPart);
                        } else {
                            Logger.warn('Received file part without fileWithBytes or uri. Skipping.');
                        }
                    }
                }
            }

            // final のタイミング、または input-required / tool_calls などの状態で、
            // バッファされている最終状態のツール呼び出しを一括で emit する
            const isFinal = result.final === true || result.status.state === 'input-required' || result.status.state === 'tool_calls';
            if (isFinal) {
                const isInternalToolConfirmation = result.status.state === 'input-required' && coderAgentKind === 'tool-call-confirmation';

                // Schema Bridging: DO NOT use Opaque Execution. We emit everything as tool-call so OpenCode handles it.
                let hasExposedTools = false;
                let hasInternalTools = false;

                for (const [toolCallId, toolInfo] of this.bufferedTools.entries()) {
                    let originalToolName = this.reverseToolMapping[toolInfo.toolName] || toolInfo.toolName;
                    
                    const isInvalidToolName = toolInfo.toolName === 'invalid';
                    const isUnknownToClient = this.clientTools ? !this.clientTools.has(originalToolName) : false;

                    if (isInvalidToolName || isUnknownToClient) {
                        Logger.info(`[Workaround] Intercepted hallucinated/invalid tool call '${toolInfo.toolName}' (mapped to '${originalToolName}'). Rewriting to a safe 'bash' call.`);
                        
                        const badName = originalToolName;
                        originalToolName = 'bash';
                        toolInfo.toolName = 'bash';
                        // OpenCode の bash ツールは { command: string, description: string } を引数として受け取る
                        toolInfo.args = { 
                            command: `echo '[opencode-geminicli-a2a] Warning: Model called unknown tool: ${badName}'`,
                            description: `Fallback for hallucinated tool ${badName}` 
                        };
                    }
                    
                    // Add description to satisfy OpenCode strict schemas
                    if (toolInfo.args && typeof toolInfo.args === 'object' && !('description' in (toolInfo.args as any))) {
                        (toolInfo.args as any).description = `Execute ${originalToolName} via A2A (${toolCallId})`;
                    }

                    if (isInternalToolConfirmation) {
                        hasInternalTools = true;
                    } else {
                        hasExposedTools = true;
                        if (!this.emittedToolCallIds.has(toolCallId)) {
                            let argsStr = typeof toolInfo.args === 'string'
                                ? toolInfo.args
                                : JSON.stringify(toolInfo.args ?? {});
                            if (!argsStr || argsStr === '""') argsStr = '{}';
                            
                            Logger.info(`Emitting tool call: ${originalToolName} (from: ${toolInfo.toolName}) (${toolCallId}) with args: ${argsStr}`);

                            parts.push({
                                type: 'tool-call',
                                toolCallType: 'function',
                                toolCallId,
                                toolName: originalToolName,
                                args: argsStr,
                            });
                            this.emittedToolCallIds.add(toolCallId);
                        }
                    }
                }

                let finishReason: LanguageModelV1FinishReason = 'stop';
                const hasTools = this.bufferedTools.size > 0;

                switch (result.status.state) {
                    case 'error':
                    case 'failed':
                        finishReason = 'error';
                        break;
                    case 'input-required':
                        // A2A の input-required は「エージェントがユーザー入力を待っている（ターン終了）」状態。
                        // ツールコールが存在しないのに 'tool-calls' を返すとOpenCodeが空のツール実行を試みて無限ループするため、
                        // 実際にツールが発行された場合のみ 'tool-calls'、それ以外は 'stop' とし、別途 inputRequired フラグを付与する。
                        // ただし内部ツールの場合は OpenCode 側にはストップとして見せる（実際には provider が auto-confirm して握り潰す）
                        finishReason = (hasExposedTools && hasTools) ? 'tool-calls' : 'stop';
                        break;
                    case 'cancelled':
                    case 'timeout':
                    case 'aborted':
                        finishReason = 'other';
                        break;
                    case 'length':
                    case 'max_tokens':
                        finishReason = 'length';
                        break;
                    case 'content_filter':
                    case 'blocked':
                        finishReason = 'content-filter';
                        break;
                    case 'tool_calls':
                        finishReason = hasExposedTools ? 'tool-calls' : 'stop';
                        break;
                    case 'stop':
                    case 'completed':
                        finishReason = hasExposedTools ? 'tool-calls' : 'stop';
                        break;
                    default:
                        // final=true で認識できない state (working 等) の場合
                        // 露出ツールがあれば tool-calls、なければ stop 扱いとする
                        finishReason = hasExposedTools ? 'tool-calls' : 'stop';
                        if (!hasExposedTools && hasInternalTools) {
                            // すべて内部ツールの場合は stop (provider が内部で回す)
                            finishReason = 'stop';
                        }
                        if (!hasTools) {
                            Logger.warn(`Unexpected final status state: '${result.status.state}' for taskId: '${result.taskId}'. Treating as 'stop'.`);
                        }
                        break;
                }

                this._lastFinishReason = finishReason;

                const usage = {
                    inputTokens: { total: result.usage?.promptTokens ?? 0 },
                    outputTokens: { total: result.usage?.completionTokens ?? 0 },
                };

                let coderAgentKindValue: string | undefined = undefined;
                if (hasInternalTools && !isInternalToolConfirmation) {
                    coderAgentKindValue = 'internal-tool-call';
                } else if (this._currentCoderAgentKind) {
                    coderAgentKindValue = this._currentCoderAgentKind;
                } else if (isInternalToolConfirmation) {
                    coderAgentKindValue = 'tool-call-confirmation';
                }

                // If input is required but no internal tools are being processed (because they were dropped, e.g., 'invalid')
                // and no exposed tools are present, we must NOT set inputRequired to true, 
                // otherwise provider.ts will auto-confirm an empty array into an infinite loop.
                const shouldPromptInput = result.status.state === 'input-required' && (hasExposedTools || hasInternalTools);

                parts.push({
                    type: 'finish',
                    finishReason,
                    usage,
                    hasExposedTools,
                    ...(shouldPromptInput || hasInternalTools ? { 
                        inputRequired: true, 
                        rawState: result.status.state,
                        ...(coderAgentKindValue !== undefined ? { coderAgentKind: coderAgentKindValue } : {})
                    } : {})
                } as ExtendedFinishPart);

                // 発行が完了したらバッファをクリアして重複を防ぐ
                this.bufferedTools.clear();
            }
        } else if (result.kind === 'artifact-update') {
            // artifact-update の場合はストリームパーツに変換しない
        } else {
            // 'invalid' など、スキーマ外の kind が返ることがある（Gemini CLI のツール呼び出し失敗など）。
            // ストリームをクラッシュさせず、ログを出してスキップする。
            Logger.warn(`Skipping unexpected A2A result kind: '${(result as any).kind}'`);
        }

        return parts;
    }

    /**
     * スナップショット形式のテキストから差分を抽出する。
     * 新しいテキストが前回出力済みテキストで始まっている場合、差分のみを返す。
     * それ以外の場合（別メッセージ等）は全テキストを返し、累計をリセットする。
     */
    private extractTextDelta(index: number, newText: string): string {
        const emittedText = this.emittedTextByIndex.get(index) || '';
        if (newText.startsWith(emittedText)) {
            const delta = newText.slice(emittedText.length);
            this.emittedTextByIndex.set(index, newText);
            return delta;
        } else {
            this.emittedTextByIndex.set(index, newText);
            return newText;
        }
    }
}

/**
 * 後方互換のためのステートレスラッパー関数。
 * 既存テストとの互換性を維持する。
 */
export function mapA2AResponseToStreamParts(result: A2AResponseResult): ExtendedStreamPart[] {
    const mapper = new A2AStreamMapper();
    return mapper.mapResult(result);
}
