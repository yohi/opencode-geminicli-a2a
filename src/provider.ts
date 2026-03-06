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

export class OpenCodeGeminiA2AProvider implements LanguageModelV1 {
    readonly specificationVersion = 'v1';
    readonly provider = 'opencode-geminicli-a2a';
    readonly defaultObjectGenerationMode = undefined;
    readonly modelId: string;

    private client: A2AClient;

    /** マルチターン: 前回レスポンスから取得した contextId */
    private lastContextId?: string;
    /** マルチターン: 前回レスポンスから取得した taskId */
    private lastTaskId?: string;
    /** マルチターン: 前回の finishReason（tool-calls の場合に taskId を再送する判断に使用） */
    private lastFinishReason?: string;

    constructor(modelId: string, options?: OpenCodeProviderOptions) {
        this.modelId = modelId;
        const config = resolveConfig(options);
        this.client = new A2AClient(config);
    }

    private createA2ARequest(options: LanguageModelV1CallOptions): A2AJsonRpcRequest {
        let tools: any[] | undefined;
        if (options.mode && 'tools' in options.mode && options.mode.tools?.length) {
            tools = options.mode.tools;
        }

        const mapOptions: MapPromptOptions = { tools };

        // マルチターン: contextId を引き継ぐ
        if (this.lastContextId) {
            mapOptions.contextId = this.lastContextId;
        }

        // マルチターン: 前回が tool-calls で終了した場合、taskId も引き継いでタスク継続
        if (this.lastFinishReason === 'tool-calls' && this.lastTaskId) {
            mapOptions.taskId = this.lastTaskId;
        }

        return mapPromptToA2AJsonRpcRequest(options.prompt, mapOptions);
    }

    /**
     * @note 同一インスタンスで doStream を並行して呼び出すと、lastContextIdなどのマルチターン状態が競合する可能性があります。
     * 並行でリクエストを送信する場合は、個別のプロバイダーインスタンスを作成することを推奨します。
     */
    async doStream(options: LanguageModelV1CallOptions) {
        const request = this.createA2ARequest(options);
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
                    this.lastContextId = mapper.contextId ?? this.lastContextId;
                    this.lastTaskId = mapper.taskId ?? this.lastTaskId;
                    this.lastFinishReason = mapper.lastFinishReason;

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
                    this.lastFinishReason = undefined;
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
