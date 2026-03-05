import {
    type LanguageModelV1Prompt,
    type LanguageModelV1StreamPart,
    type LanguageModelV1FinishReason,
} from '@ai-sdk/provider';
import type { A2AJsonRpcRequest, A2AResponseResult } from '../schemas';
import { v4 as uuidv4 } from 'uuid';

/**
 * AI SDK のプロンプトを A2A (JSON-RPC) リクエストに変換する。
 * シンプルな実装として、最新のユーザーメッセージを送信対象とする。
 */
export function mapPromptToA2AJsonRpcRequest(prompt: LanguageModelV1Prompt): A2AJsonRpcRequest {
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
        // assistant や tool も実情に応じてマッピング
        // 本来はコンテキスト履歴全体を A2A サーバーに送るか、taskId で継続すべきだが、
        // 簡易実装として文字列化して送る。
        content = '[Unsupported message role in A2A mapping]';
    }

    return {
        jsonrpc: '2.0',
        id: uuidv4(),
        method: 'message/stream',
        params: {
            message: {
                messageId: uuidv4(),
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
