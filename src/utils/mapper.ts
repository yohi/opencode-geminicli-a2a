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

function isThoughtData(data: unknown): data is ThoughtData {
    if (!data || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;
    return typeof obj.subject === 'string' || typeof obj.description === 'string';
}

/**
 * AI SDK のプロンプトを A2A (JSON-RPC) リクエストに変換する。
 * シンプルな実装として、最新のユーザーメッセージを送信対象とする。
 */
export function mapPromptToA2AJsonRpcRequest(prompt: LanguageModelV1Prompt, tools?: Tool[]): A2AJsonRpcRequest {
    if (prompt.length === 0) {
        return {
            jsonrpc: '2.0',
            id: crypto.randomUUID(),
            method: 'message/stream',
            params: {
                message: {
                    messageId: crypto.randomUUID(),
                    role: 'user',
                    parts: [{ kind: 'text', text: '(empty prompt)' }]
                },
                configuration: {
                    blocking: false,
                    ...(tools && tools.length > 0 ? { tools } : {})
                }
            }
        };
    }

    // TODO: A2Aプロトコルでは本来コンテキスト履歴全体を送るかtaskIdで継続すべき。
    // https://github.com/google/opencode-geminicli-a2a-provider/issues/xxx
    // プロンプトを末尾から走査し、直近の 'user' または 'system' メッセージを取得する
    let targetMessage: LanguageModelV1Prompt[number] | undefined;
    for (let i = prompt.length - 1; i >= 0; i--) {
        if (prompt[i].role === 'user' || prompt[i].role === 'system') {
            targetMessage = prompt[i];
            break;
        }
    }

    let content = '';

    if (targetMessage) {
        if (targetMessage.role === 'user') {
            for (const part of targetMessage.content) {
                if (part.type === 'text') {
                    content += part.text;
                }
            }
        } else if (targetMessage.role === 'system') {
            content = targetMessage.content;
        }
    }

    if (targetMessage?.role === 'user' && content === '') {
        throw new Error(
            'Unsupported user message: contains no text parts (only image/file parts). ' +
            'The A2A provider currently supports text-only user messages.'
        );
    }

    return {
        jsonrpc: '2.0',
        id: crypto.randomUUID(),
        method: 'message/stream',
        params: {
            message: {
                messageId: crypto.randomUUID(),
                role: 'user', // A2A サーバーへ送る際は基本 'user'
                parts: [
                    { kind: 'text', text: content || '(empty prompt)' }
                ]
            },
            configuration: {
                blocking: false,
                ...(tools && tools.length > 0 ? { tools } : {})
            }
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
    /** 出力済みテキストの累計。スナップショット重複排除に使用 */
    private emittedText = '';
    /** 出力済みツールコール ID の Set。重複排除に使用 */
    private emittedToolCallIds = new Set<string>();

    /**
     * A2A のレスポンス（各チャンク）を AI SDK のストリームパーツに変換する。
     */
    mapResult(result: A2AResponseResult): LanguageModelV1StreamPart[] {
        const parts: LanguageModelV1StreamPart[] = [];

        if (result.kind === 'task') {
            return parts;
        }

        if (result.kind === 'status-update') {
            const msg = result.status.message;
            const metadata = result.metadata as Record<string, any> | undefined;
            const coderAgentKind = metadata?.coderAgent?.kind as string | undefined;

            const shouldProcessParts = result.status.state === 'working' || result.status.state === 'input-required' || result.status.state === 'tool_calls';
            if (shouldProcessParts && msg && msg.parts) {
                for (const p of msg.parts) {
                    if (p.kind === 'text' && p.text && result.status.state === 'working') {
                        // スナップショット重複排除:
                        // 新しいテキストが前回出力済みテキストで始まっている場合は差分のみ emit
                        const delta = this.extractTextDelta(p.text);
                        if (delta) {
                            parts.push({
                                type: 'text-delta',
                                textDelta: delta,
                            });
                        }
                    } else if (p.kind === 'data' && isToolRequest(p.data)) {
                        // ツール実行要求のマッピング
                        const req = p.data.request;
                        const toolName = req.name;

                        const toolCallId = req.callId || `call_${crypto.createHash('sha256').update(toolName + JSON.stringify(req.args ?? {})).digest('hex').substring(0, 16)}`;
                        // ツールコール ID ベースの重複排除
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
                        // 思考プロセスのマッピング → AI SDK reasoning パーツ
                        if (p.data.subject && p.data.description) {
                            parts.push({
                                type: 'reasoning',
                                textDelta: `[${p.data.subject}] ${p.data.description}`,
                            });
                            continue;
                        } else if (p.data.subject) {
                            parts.push({
                                type: 'reasoning',
                                textDelta: `[${p.data.subject}]`,
                            });
                            continue;
                        } else if (p.data.description) {
                            parts.push({
                                type: 'reasoning',
                                textDelta: p.data.description,
                            });
                            continue;
                        }
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
    private extractTextDelta(newText: string): string {
        if (newText.startsWith(this.emittedText)) {
            // スナップショット: 前回の累計テキストで始まっている → 差分を抽出
            const delta = newText.slice(this.emittedText.length);
            this.emittedText = newText;
            return delta;
        } else {
            // 新しいメッセージまたは差分形式 → 全テキストを emit
            this.emittedText = newText;
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
