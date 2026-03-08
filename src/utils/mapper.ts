import {
    type LanguageModelV1Prompt,
    type LanguageModelV1StreamPart,
    type LanguageModelV1FinishReason,
} from '@ai-sdk/provider';
import type { A2AJsonRpcRequest, A2AResponseResult, Tool } from '../schemas';
import crypto from 'node:crypto';

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
    /** 前回レスポンスから取得した contextId。コンテキスト継続に使用 */
    contextId?: string;
    /** 前回レスポンスから取得した taskId。タスク継続（input-required 状態）に使用 */
    taskId?: string;
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

    const { tools, contextId, taskId } = options;

    if (prompt.length === 0) {
        return buildRequest('(empty prompt)', { tools, contextId, taskId });
    }

    // prompt 末尾が tool ロールの場合: ツール結果をテキスト化
    const lastMessage = prompt[prompt.length - 1];
    if (lastMessage.role === 'tool') {
        const toolResultText = formatToolResults(lastMessage.content);
        // user メッセージも含める（もしあれば）
        let userParts: A2AJsonRpcRequest['params']['message']['parts'] = [];
        for (let i = prompt.length - 1; i >= 0; i--) {
            if (prompt[i].role === 'user') {
                userParts = extractUserParts(prompt[i]);
                break;
            }
        }

        const finalParts: A2AJsonRpcRequest['params']['message']['parts'] = [
            ...userParts,
            ...(toolResultText ? [{ kind: 'text' as const, text: toolResultText }] : [])
        ];

        return buildRequest(finalParts.length > 0 ? finalParts : '(empty prompt)', { tools, contextId, taskId });
    }

    // 通常の処理: 末尾から user/system メッセージを探す
    let targetMessage: LanguageModelV1Prompt[number] | undefined;
    for (let i = prompt.length - 1; i >= 0; i--) {
        if (prompt[i].role === 'user' || prompt[i].role === 'system') {
            targetMessage = prompt[i];
            break;
        }
    }

    let parts: A2AJsonRpcRequest['params']['message']['parts'] = [];

    if (targetMessage) {
        if (targetMessage.role === 'user') {
            parts = extractUserParts(targetMessage);
        } else if (targetMessage.role === 'system') {
            parts = [{ kind: 'text' as const, text: targetMessage.content }];
        }
    }

    if (parts.length === 0) {
        parts = [{ kind: 'text' as const, text: '(empty prompt)' }];
    }

    return buildRequest(parts, { tools, contextId, taskId });
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
                    console.warn('[A2A mapper] Malformed data URI format.');
                }
            }
        } else if (str.startsWith('http://') || str.startsWith('https://')) {
            uri = str;
        } else {
            // Validate that the string is a valid base64 (or base64url) payload.
            // This prevents incorrectly treating generic text or relative paths as binary data.
            const isBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(str);
            const isBase64Url = /^[A-Za-z0-9\-_]*={0,2}$/.test(str);

            if ((isBase64 || isBase64Url) && (str.length % 4 === 0 || !str.endsWith('='))) {
                bytes = str;
            } else {
                console.warn('[A2A mapper] Invalid base64 string provided for binary data. Part will be dropped.');
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
                console.warn('[A2A mapper] Unsupported image format: could not extract bytes or uri from image part. Part will be dropped.');
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
                console.warn('[A2A mapper] Unsupported file format: could not extract bytes or uri from file part. Part will be dropped.');
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
function formatToolResults(content: Array<{ type: 'tool-result'; toolCallId: string; toolName: string; result: unknown; isError?: boolean }>): string {
    return content.map(part => {
        const resultStr = typeof part.result === 'string'
            ? part.result
            : JSON.stringify(part.result);
        const prefix = part.isError ? '[Tool Error' : '[Tool Result';
        return `${prefix}: ${part.toolName} (${part.toolCallId})]\n${resultStr}`;
    }).join('\n\n');
}

/**
 * A2A JSON-RPC リクエストを構築するヘルパー。
 */
function buildRequest(
    content: string | A2AJsonRpcRequest['params']['message']['parts'],
    options: { tools?: Tool[]; contextId?: string; taskId?: string }
): A2AJsonRpcRequest {
    const { tools, contextId, taskId } = options;
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
                ...(tools && tools.length > 0 ? { tools } : {})
            },
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
    /** 出力済みテキストの累計インデックス別マップ。スナップショット重複排除に使用 */
    private emittedTextByIndex = new Map<number, string>();
    /** 出力済みツールコール ID の Set。重複排除に使用 */
    private emittedToolCallIds = new Set<string>();
    /** レスポンスから抽出した contextId */
    private _contextId?: string;
    /** レスポンスから抽出した taskId */
    private _taskId?: string;
    /** 最後の finishReason */
    private _lastFinishReason?: string;

    /** レスポンスから抽出した contextId を取得 */
    get contextId(): string | undefined { return this._contextId; }
    /** レスポンスから抽出した taskId を取得 */
    get taskId(): string | undefined { return this._taskId; }
    /** 最後の finishReason を取得 */
    get lastFinishReason(): string | undefined { return this._lastFinishReason; }

    /**
     * A2A のレスポンス（各チャンク）を AI SDK のストリームパーツに変換する。
     */
    mapResult(result: A2AResponseResult): LanguageModelV1StreamPart[] {
        const parts: LanguageModelV1StreamPart[] = [];

        // contextId / taskId の抽出
        if (result.kind === 'task') {
            this._contextId = result.contextId;
            if (this._taskId !== result.id) {
                this._taskId = result.id;
                this.emittedTextByIndex.clear();
                this.emittedToolCallIds.clear();
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
                this._lastFinishReason = undefined;
            }

            const msg = result.status.message;
            const metadata = result.metadata as Record<string, any> | undefined;
            const coderAgentKind = metadata?.coderAgent?.kind as string | undefined;

            const shouldProcessParts = result.status.state === 'working' || result.status.state === 'input-required' || result.status.state === 'tool_calls';
            if (shouldProcessParts && msg && msg.parts) {
                for (const [index, p] of msg.parts.entries()) {
                    if (p.kind === 'text' && p.text && result.status.state === 'working') {
                        const delta = this.extractTextDelta(index, p.text);
                        if (delta) {
                            parts.push({
                                type: 'text-delta',
                                textDelta: delta,
                            });
                        }
                    } else if (p.kind === 'data' && isToolRequest(p.data)) {
                        const req = p.data.request;
                        const toolName = req.name;

                        const toolCallId = req.callId || `call_${crypto.createHash('sha256').update(toolName + JSON.stringify(req.args ?? {})).digest('hex').substring(0, 16)}_${index}`;
                        if (this.emittedToolCallIds.has(toolCallId)) continue;
                        this.emittedToolCallIds.add(toolCallId);

                        parts.push({
                            type: 'tool-call',
                            toolCallType: 'function',
                            toolCallId,
                            toolName,
                            args: JSON.stringify(req.args ?? {}),
                        });
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
                            parts.push({
                                type: 'reasoning',
                                textDelta,
                            });
                        }
                        continue;
                    }
                }
            }

            if (result.final) {
                let finishReason: LanguageModelV1FinishReason = 'stop';
                switch (result.status.state) {
                    case 'error':
                        finishReason = 'error';
                        break;
                    case 'input-required':
                        finishReason = 'tool-calls';
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
                        finishReason = 'tool-calls';
                        break;
                    case 'stop':
                        finishReason = 'stop';
                        break;
                    default:
                        finishReason = 'other';
                        break;
                }

                this._lastFinishReason = finishReason;

                const usage = {
                    promptTokens: result.usage?.promptTokens ?? Number.NaN,
                    completionTokens: result.usage?.completionTokens ?? Number.NaN,
                };

                parts.push({
                    type: 'finish',
                    finishReason,
                    usage,
                });
            }
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
export function mapA2AResponseToStreamParts(result: A2AResponseResult): LanguageModelV1StreamPart[] {
    const mapper = new A2AStreamMapper();
    return mapper.mapResult(result);
}
