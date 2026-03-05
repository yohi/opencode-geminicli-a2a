import type {
    LanguageModelV1,
    LanguageModelV1CallOptions,
    LanguageModelV1StreamPart,
    LanguageModelV1FunctionToolCall,
    LanguageModelV1FinishReason,
} from '@ai-sdk/provider';
import { resolveConfig, type OpenCodeProviderOptions } from './config';
import { A2AClient } from './a2a-client';
import { mapPromptToA2AJsonRpcRequest, mapA2AResponseToStreamParts } from './utils/mapper';
import { parseA2AStream } from './utils/stream';
import type { A2AJsonRpcRequest } from './schemas';

export class OpenCodeGeminiA2AProvider implements LanguageModelV1 {
    readonly specificationVersion = 'v1';
    readonly provider = 'opencode-geminicli-a2a';
    readonly defaultObjectGenerationMode = undefined;
    readonly modelId: string;

    private client: A2AClient;

    constructor(modelId: string, options?: OpenCodeProviderOptions) {
        this.modelId = modelId;
        const config = resolveConfig(options);
        this.client = new A2AClient(config);
    }

    private createA2ARequest(options: LanguageModelV1CallOptions): A2AJsonRpcRequest {
        return mapPromptToA2AJsonRpcRequest(options.prompt);
    }

    async doStream(options: LanguageModelV1CallOptions) {
        const request = this.createA2ARequest(options);
        const idempotencyKey = (options.providerMetadata?.opencode?.idempotencyKey as string) || undefined;

        const { stream: responseStream, headers } = await this.client.chatStream({
            request,
            idempotencyKey,
            abortSignal: options.abortSignal,
        });

        const chunkGenerator = parseA2AStream(responseStream);

        const stream = new ReadableStream<LanguageModelV1StreamPart>({
            async start(controller) {
                try {
                    for await (const chunk of chunkGenerator) {
                        if (chunk.result) {
                            const parts = mapA2AResponseToStreamParts(chunk.result);
                            for (const part of parts) {
                                controller.enqueue(part);
                            }
                        } else if (chunk.error) {
                            // JSON-RPC エラーのハンドリング
                            throw new Error(`A2A JSON-RPC Error: [${chunk.error.code}] ${chunk.error.message}`);
                        }
                    }
                    controller.close();
                } catch (error) {
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
