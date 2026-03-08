import type {
    LanguageModelV1,
    LanguageModelV1CallOptions,
    LanguageModelV1StreamPart,
    LanguageModelV1FunctionToolCall,
    LanguageModelV1FinishReason,
} from '@ai-sdk/provider';
import { resolveConfig, type OpenCodeProviderOptions } from './config';
import { A2AClient } from './a2a-client';
import { mapPromptToA2AJsonRpcRequest, A2AStreamMapper, type MapPromptOptions } from './utils/mapper';
import { parseA2AStream } from './utils/stream';
import type { A2AJsonRpcRequest } from './schemas';
import { type SessionStore, InMemorySessionStore, type A2ASession } from './session';

export class OpenCodeGeminiA2AProvider implements LanguageModelV1 {
    readonly specificationVersion = 'v1';
    readonly provider = 'opencode-geminicli-a2a';
    readonly defaultObjectGenerationMode = undefined;
    readonly modelId: string;

    private client: A2AClient;
    private sessionStore: SessionStore;

    constructor(modelId: string, options?: OpenCodeProviderOptions) {
        this.modelId = modelId;
        const config = resolveConfig(options);
        this.client = new A2AClient(config);
        this.sessionStore = options?.sessionStore ?? new InMemorySessionStore();
    }

    private createA2ARequest(options: LanguageModelV1CallOptions, session: A2ASession): A2AJsonRpcRequest {
        let tools: any[] | undefined;
        if (options.mode && 'tools' in options.mode && options.mode.tools?.length) {
            tools = options.mode.tools;
        }

        const mapOptions: MapPromptOptions = { tools };

        // マルチターン: contextId を引き継ぐ
        if (session.contextId) {
            mapOptions.contextId = session.contextId;
        }

        // マルチターン: 前回が tool-calls で終了した場合、taskId も引き継いでタスク継続
        if (session.lastFinishReason === 'tool-calls' && session.taskId) {
            mapOptions.taskId = session.taskId;
        }

        return mapPromptToA2AJsonRpcRequest(options.prompt, mapOptions);
    }

    /**
     * @note sessionStore を利用して、並行実行時の状態を分離して管理します。
     * sessionId は providerMetadata から取得され、ない場合は 'default' が使われます。
     * 並行リクエスト時の状態の競合を避けるため、呼び出し元は必ず一意の sessionId を指定してください。
     */
    async doStream(options: LanguageModelV1CallOptions) {
        let sessionId = 'default';
        const opencodeMetadata = options.providerMetadata?.opencode;

        if (opencodeMetadata?.sessionId !== undefined) {
            if (typeof opencodeMetadata.sessionId === 'string') {
                sessionId = opencodeMetadata.sessionId;
            } else {
                console.warn(`[opencode-geminicli-a2a] Invalid sessionId type (${typeof opencodeMetadata.sessionId}), expected string. Falling back to 'default'.`);
            }
        }

        const session = this.sessionStore.get(sessionId);

        const request = this.createA2ARequest(options, session);
        const idempotencyKey = (options.providerMetadata?.opencode?.idempotencyKey as string) || undefined;

        const { stream: responseStream, headers } = await this.client.chatStream({
            request,
            idempotencyKey,
            abortSignal: options.abortSignal,
        });

        const chunkGenerator = parseA2AStream(responseStream);
        const mapper = new A2AStreamMapper();

        const stream = new ReadableStream<LanguageModelV1StreamPart>({
            start: async (controller) => {
                try {
                    let hasFinished = false;
                    for await (const chunk of chunkGenerator) {
                        if ('result' in chunk && chunk.result) {
                            const parts = mapper.mapResult(chunk.result);
                            for (const part of parts) {
                                if (part.type === 'finish') hasFinished = true;
                                controller.enqueue(part);
                            }
                        } else if ('error' in chunk && chunk.error) {
                            const rpcError = new Error(`A2A JSON-RPC Error: [${chunk.error.code}] ${chunk.error.message}`);
                            Object.assign(rpcError, {
                                code: chunk.error.code,
                                data: (chunk.error as any).data,
                                id: chunk.id,
                            });
                            throw rpcError;
                        }
                    }

                    // マルチターン: mapper から contextId / taskId / finishReason を抽出して保存
                    this.sessionStore.update(sessionId, {
                        ...(mapper.contextId !== undefined && { contextId: mapper.contextId }),
                        ...(mapper.taskId !== undefined && { taskId: mapper.taskId }),
                        lastFinishReason: mapper.lastFinishReason,
                    });

                    if (!hasFinished) {
                        controller.enqueue({
                            type: 'finish',
                            finishReason: 'unknown',
                            usage: { promptTokens: 0, completionTokens: 0 },
                        });
                    }
                    controller.close();
                } catch (error) {
                    // エラー時は lastFinishReason をリセットして、次回の taskId 送信を防ぐ
                    this.sessionStore.update(sessionId, { lastFinishReason: undefined });
                    controller.error(error);
                }
            },
        });

        return {
            stream,
            rawCall: {
                rawPrompt: request.params.message,
                rawSettings: request.params.configuration || {},
            },
            rawResponse: {
                headers,
            },
            request: {
                body: JSON.stringify(request),
            },
            warnings: [],
        };
    }

    async doGenerate(options: LanguageModelV1CallOptions) {
        const { stream: sdkStream, rawCall, rawResponse, request, warnings } = await this.doStream(options);

        const reader = sdkStream.getReader();
        let text = '';
        let reasoning = '';
        const toolCalls: LanguageModelV1FunctionToolCall[] = [];
        let finishReason: LanguageModelV1FinishReason = 'unknown';
        const usage = { promptTokens: 0, completionTokens: 0 };

        const activeToolCalls = new Map<string, { name: string; args: string }>();

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                switch (value.type) {
                    case 'text-delta':
                        text += value.textDelta;
                        break;
                    case 'reasoning':
                        reasoning += value.textDelta;
                        break;
                    case 'tool-call':
                        activeToolCalls.set(value.toolCallId, { name: value.toolName, args: value.args });
                        break;
                    case 'tool-call-delta':
                        if (value.toolCallId) {
                            if (activeToolCalls.has(value.toolCallId)) {
                                const current = activeToolCalls.get(value.toolCallId)!;
                                current.args += value.argsTextDelta;
                            } else {
                                activeToolCalls.set(value.toolCallId, { name: value.toolName, args: value.argsTextDelta });
                            }
                        }
                        break;
                    case 'finish':
                        finishReason = value.finishReason;
                        if (value.usage) {
                            usage.promptTokens = value.usage.promptTokens;
                            usage.completionTokens = value.usage.completionTokens;
                        }
                        break;
                }
            }

            for (const [id, call] of activeToolCalls.entries()) {
                toolCalls.push({
                    toolCallType: 'function',
                    toolCallId: id,
                    toolName: call.name,
                    args: call.args,
                });
            }

        } finally {
            reader.releaseLock();
        }

        return {
            text: text.length > 0 ? text : undefined,
            reasoning: reasoning.length > 0 ? reasoning : undefined,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
            finishReason,
            usage,
            rawCall,
            rawResponse,
            request,
            warnings,
        };
    }
}
