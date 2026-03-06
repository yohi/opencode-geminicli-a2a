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
export function mapPromptToA2AJsonRpcRequest(prompt: LanguageModelV1Prompt): A2AJsonRpcRequest {
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
                configuration: { blocking: false }
            }
        };
    }

    // TODO: A2Aプロトコルでは本来コンテキスト履歴全体を送るかtaskIdで継続すべき。
    // https://github.com/google/opencode-geminicli-a2a-provider/issues/xxx
    // 最新のメッセージを取得
    const lastMessage = prompt[prompt.length - 1];
    let content = '';

    if (lastMessage.role === 'user') {
        for (const part of lastMessage.content) {
            if (part.type === 'text') {
                content += part.text;
            }
        }
    } else if (lastMessage.role === 'system') {
        content = lastMessage.content;
    } else {
        // TODO: assistant/tool ロールのサポートは未実装
        // tool ロールは tool result を含む場合があるため、エラーとして扱う
        throw new Error(`Unsupported last message role for A2A mapping: ${(lastMessage as any).role}`);
    }

    // TODO: options.mode.tools のツール定義が A2A リクエストに含まれていない問題の修正。
    // params.message.parts が kind: 'data' 等を受け付けるようにするか、configuration に含める必要がある。

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
                blocking: false
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
        if (msg && msg.parts) {
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
