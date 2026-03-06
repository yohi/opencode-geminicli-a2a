import {
    type LanguageModelV1Prompt,
    type LanguageModelV1StreamPart,
    type LanguageModelV1FinishReason,
} from '@ai-sdk/provider';
import type { A2AJsonRpcRequest, A2AResponseResult } from '../schemas';
import crypto from 'node:crypto';

/**
 * AI SDK のプロンプトを A2A (JSON-RPC) リクエストに変換する。
 * シンプルな実装として、最新のユーザーメッセージを送信対象とする。
 */
export function mapPromptToA2AJsonRpcRequest(prompt: LanguageModelV1Prompt, tools?: any[]): A2AJsonRpcRequest {
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
 * A2A のレスポンス（各チャンク）を AI SDK のストリームパーツに変換する。
 */
export function mapA2AResponseToStreamParts(result: A2AResponseResult): LanguageModelV1StreamPart[] {
    const parts: LanguageModelV1StreamPart[] = [];

    if (result.kind === 'task') {
        // TODO: Explicitly handle task response parts or metadata if needed.
        // Currently intentionally ignoring 'task' since actual text generation
        // comes from 'status-update' events.
        return parts;
    }

    if (result.kind === 'status-update') {
        const msg = result.status.message;
        if (result.status.state === 'working' && msg && msg.parts) {
            for (const p of msg.parts) {
                if (p.kind === 'text' && p.text) {
                    parts.push({
                        type: 'text-delta',
                        textDelta: p.text,
                    });
                }
                // 'thought' などは必要に応じてメタデータとして出すか、無視する
            }
        }

        if (result.final) {
            let finishReason: LanguageModelV1FinishReason = 'stop';
            // A2A state に応じてマッピング
            if (result.status.state === 'error') {
                finishReason = 'error';
            }

            parts.push({
                type: 'finish',
                finishReason,
                usage: { promptTokens: 0, completionTokens: 0 },
            });
        }
    }

    return parts;
}
