import crypto from 'node:crypto';
import type {
    LanguageModelV1CallOptions,
    LanguageModelV1StreamPart,
    LanguageModelV1FunctionToolCall,
    LanguageModelV1FinishReason,
    LanguageModelV1StreamResult,
} from '@ai-sdk/provider';
import { resolveConfig, type OpenCodeProviderOptions } from './config';
import { A2AClient } from './a2a-client';
import { 
    mapPromptToA2AJsonRpcRequest, 
    A2AStreamMapper, 
    buildConfirmationRequest,
    type MapPromptOptions, 
    type ExtendedFinishPart 
} from './utils/mapper';
import { parseA2AStream } from './utils/stream';
import type { A2AJsonRpcRequest, A2AConfig } from './schemas';
import { type SessionStore, InMemorySessionStore, type A2ASession } from './session';
import { isQuotaError, getNextFallbackModel, resolveFallbackConfig, type FallbackConfig } from './fallback';
import { DefaultMultiAgentRouter } from './router';
import { Logger } from './utils/logger';


function isAutoConfirmTarget(part: ExtendedFinishPart | undefined): boolean {
    if (!part) return false;
    return part.inputRequired === true && 
           part.hasExposedTools !== true &&
           (part.coderAgentKind === 'tool-call-confirmation' || part.coderAgentKind === 'internal-tool-call');
}

/**
 * OpenCode Gemini CLI A2A Provider.
 * Supports AI SDK Language Model Specification V2 and V3 (Compatibility Mode).
 */
export class OpenCodeGeminiA2AProvider {
    // V2 をベースにすることで OpenCode の多くのバージョンで安定動作させる
    readonly specificationVersion = 'v2' as const;
    readonly provider = 'opencode-geminicli-a2a';
    readonly providerId = 'opencode-geminicli-a2a';
    readonly providerID = 'opencode-geminicli-a2a';
    readonly id = 'opencode-geminicli-a2a'; 
    readonly name = 'Gemini CLI (A2A)';
    readonly defaultObjectGenerationMode = undefined;
    readonly modelId: string;
    readonly modelID: string;

    private client: A2AClient;
    private sessionStore: SessionStore;
    private options?: OpenCodeProviderOptions;
    private fallbackConfig?: FallbackConfig;

    constructor(modelId: string, options?: OpenCodeProviderOptions) {
        this.modelId = modelId;
        this.modelID = modelId;
        try {
            const router = options?.agents ? new DefaultMultiAgentRouter(options.agents) : undefined;
            const resolved = router?.resolve(modelId);
            const agentConfig = resolved?.endpoint;
            const modelConfig = resolved?.config;

            const finalConfig = resolveConfig({
                ...options,
                host: agentConfig?.host ?? options?.host,
                port: agentConfig?.port ?? options?.port,
                token: agentConfig?.token ?? options?.token,
                protocol: agentConfig?.protocol ?? options?.protocol,
            });

            const defaultGenerationConfig = {
                ...options?.generationConfig,
                ...modelConfig?.options?.generationConfig,
            };

            this.client = new A2AClient(finalConfig);
            this.sessionStore = options?.sessionStore ?? new InMemorySessionStore();
            this.fallbackConfig = resolveFallbackConfig(options?.fallback);

            this.options = {
                ...options,
                host: finalConfig.host,
                port: finalConfig.port,
                token: finalConfig.token,
                protocol: finalConfig.protocol,
                generationConfig: defaultGenerationConfig,
                sessionStore: this.sessionStore,
                fallback: this.fallbackConfig,
            };
        } catch (err) {
            Logger.error(`ERROR IN MODEL CONSTRUCTOR (${modelId}):`, err);
            throw err;
        }
    }

    private createA2ARequest(options: LanguageModelV1CallOptions, session: A2ASession): A2AJsonRpcRequest {
        let tools: any[] | undefined;
        if (options.mode && 'tools' in options.mode && options.mode.tools?.length) {
            tools = options.mode.tools;
        }

        const mergedGenerationConfig = {
            ...this.options?.generationConfig,
            ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
            ...(options.topP !== undefined ? { topP: options.topP } : {}),
            ...(options.topK !== undefined ? { topK: options.topK } : {}),
            ...(options.maxTokens !== undefined ? { maxOutputTokens: options.maxTokens } : {}),
            ...(options.stopSequences !== undefined ? { stopSequences: options.stopSequences } : {}),
            ...(options.presencePenalty !== undefined ? { presencePenalty: options.presencePenalty } : {}),
            ...(options.frequencyPenalty !== undefined ? { frequencyPenalty: options.frequencyPenalty } : {}),
            ...(options.seed !== undefined ? { seed: options.seed } : {}),
        };
        const filteredConfig = Object.fromEntries(
            Object.entries(mergedGenerationConfig).filter(([_, v]) => v !== undefined)
        );

        const mapOptions: MapPromptOptions = { tools };
        if (Object.keys(filteredConfig).length > 0) {
            mapOptions.generationConfig = filteredConfig;
        }
        mapOptions.modelId = this.modelId;

        if (session.contextId) {
            mapOptions.contextId = session.contextId;
        }
        if (session.processedMessagesCount !== undefined) {
            mapOptions.processedMessagesCount = session.processedMessagesCount;
        }
        if (session.lastFinishReason === 'tool-calls' && session.taskId) {
            mapOptions.taskId = session.taskId;
        }

        return mapPromptToA2AJsonRpcRequest(options.prompt, mapOptions);
    }

    async doStream(options: LanguageModelV1CallOptions) {
        let result: any;
        try {
            result = await this._doStreamInternal(options);
        } catch (error) {
            if (this.fallbackConfig && isQuotaError(error, this.fallbackConfig)) {
                return this._attemptFallback(options, error);
            }
            throw error;
        }
        return result;
    }

    private async _attemptFallback(
        callOptions: LanguageModelV1CallOptions,
        originalError: unknown,
    ): Promise<LanguageModelV1StreamResult> {
        let currentModelId = this.modelId;
        let lastError = originalError;
        const fallbackModels = this.fallbackConfig?.models || [];
        for (const nextModelId of fallbackModels) {
            if (nextModelId === currentModelId) continue;
            try {
                const fallbackProvider = new OpenCodeGeminiA2AProvider(nextModelId, this.options);
                return await fallbackProvider._doStreamInternal(callOptions);
            } catch (retryError) {
                if (isQuotaError(retryError, this.fallbackConfig)) {
                    currentModelId = nextModelId;
                    lastError = retryError;
                    continue;
                }
                throw retryError;
            }
        }
        throw lastError;
    }

    private async _doStreamInternal(options: LanguageModelV1CallOptions) {
        let sessionId: string | undefined = undefined;
        const opencodeMetadata = options.providerMetadata?.opencode;
        if (opencodeMetadata?.sessionId) sessionId = String(opencodeMetadata.sessionId).trim();
        if (!sessionId) sessionId = `cli-session-${crypto.randomUUID()}`;

        const session = await this.sessionStore.get(sessionId) || {};
        if (opencodeMetadata?.resetContext === true && sessionId) {
            await this.sessionStore.resetSession(sessionId);
            delete session.contextId;
            delete session.taskId;
            delete session.lastFinishReason;
        }

        const request = this.createA2ARequest(options, session);
        const idempotencyKey = (options.providerMetadata?.opencode?.idempotencyKey as string) || undefined;

        let responseStream;
        let headers;
        try {
            const response = await this.client.chatStream({ request, idempotencyKey, abortSignal: options.abortSignal });
            responseStream = response.stream;
            headers = response.headers;
        } catch (error) {
            if (sessionId) await this.sessionStore.update(sessionId, { lastFinishReason: undefined });
            throw error;
        }

        const mapper = new A2AStreamMapper();
        let textPartCounter = 0;
        let reasoningPartCounter = 0;
        let activeTextId: string | undefined;

        const stream = new ReadableStream<any>({
            start: async (controller) => {
                let currentRequest = request;
                let autoConfirmCount = 0;
                const MAX_AUTO_CONFIRM = 10;
                let firstResponse: any = { stream: responseStream, headers: headers || {} };

                try {
                    controller.enqueue({ type: 'stream-start' });

                    while (autoConfirmCount < MAX_AUTO_CONFIRM) {
                        let hasFinished = false;
                        let lastFinishPart: ExtendedFinishPart | undefined;
                        let response = firstResponse || await this.client.chatStream({ request: currentRequest, abortSignal: options.abortSignal });
                        firstResponse = undefined;

                        mapper.startNewTurn();
                        const chunkGenerator = parseA2AStream(response.stream);

                        for await (const chunk of chunkGenerator) {
                            if ('result' in chunk && chunk.result) {
                                const parts = mapper.mapResult(chunk.result);
                                for (const part of parts) {
                                    switch (part.type) {
                                        case 'text-delta': {
                                            if (activeTextId === undefined) {
                                                activeTextId = `text-${textPartCounter++}`;
                                                controller.enqueue({ type: 'text-start', id: activeTextId });
                                            }
                                            controller.enqueue({ type: 'text-delta', id: activeTextId, delta: part.textDelta });
                                            break;
                                        }
                                        case 'reasoning': {
                                            if (activeTextId !== undefined) {
                                                controller.enqueue({ type: 'text-end', id: activeTextId });
                                                activeTextId = undefined;
                                            }
                                            const reasoningId = `reasoning-${reasoningPartCounter++}`;
                                            controller.enqueue({ type: 'reasoning-start', id: reasoningId });
                                            controller.enqueue({ type: 'reasoning-delta', id: reasoningId, delta: part.textDelta });
                                            controller.enqueue({ type: 'reasoning-end', id: reasoningId });
                                            break;
                                        }
                                        case 'tool-call': {
                                            if (activeTextId !== undefined) {
                                                controller.enqueue({ type: 'text-end', id: activeTextId });
                                                activeTextId = undefined;
                                            }
                                            // OpenCode は内部的に tool-input-start をフックしてツール実行の初期化(pending state の登録)を行うため、
                                            // チャンク単位のツール送信（V2/V3ストリーミング形式）にエミュレートする必要がある。
                                            // 直接 'tool-call' を投げると、OpenCodeが認識できずに Tool execution aborted になる。
                                            const toolId = part.toolCallId || `tool-${toolCallCounter++}`;
                                            
                                            controller.enqueue({
                                                type: 'tool-input-start',
                                                id: toolId,
                                                toolCallId: part.toolCallId,
                                                toolName: part.toolName,
                                            } as any);

                                            controller.enqueue({
                                                type: 'tool-input-delta',
                                                id: toolId,
                                                delta: part.args,
                                            });

                                            controller.enqueue({
                                                type: 'tool-input-end',
                                                id: toolId,
                                            });
                                            
                                            // さらに、V3系のAI SDKが最後に統合された 'tool-call' オブジェクトを必要とする場合があるため念のため流す
                                            // (ただし OpenCode は上記 start/delta/end で状態を完了させる)
                                            controller.enqueue({
                                                type: 'tool-call',
                                                toolCallType: 'function',
                                                toolCallId: part.toolCallId,
                                                toolName: part.toolName,
                                                args: part.args,
                                                input: part.args,
                                            } as any);
                                            break;
                                        }
                                        case 'file': {
                                            if (activeTextId !== undefined) {
                                                controller.enqueue({ type: 'text-end', id: activeTextId });
                                                activeTextId = undefined;
                                            }
                                            controller.enqueue(part);
                                            break;
                                        }
                                        case 'finish': {
                                            hasFinished = true;
                                            if (activeTextId !== undefined) {
                                                controller.enqueue({ type: 'text-end', id: activeTextId });
                                                activeTextId = undefined;
                                            }
                                            const finishPart = part as ExtendedFinishPart;
                                            lastFinishPart = finishPart;

                                            if (!isAutoConfirmTarget(finishPart)) {
                                                const unifiedFinishReason = (finishPart.finishReason === 'unknown' ? 'stop' : finishPart.finishReason);
                                                controller.enqueue({
                                                    type: 'finish',
                                                    finishReason: unifiedFinishReason, // V2用
                                                    usage: {
                                                        promptTokens: finishPart.usage.inputTokens.total,
                                                        completionTokens: finishPart.usage.outputTokens.total,
                                                    },
                                                    // V3用フィールドも混ぜる
                                                    finishReasonV3: {
                                                        unified: unifiedFinishReason as any,
                                                        raw: finishPart.rawState || finishPart.finishReason,
                                                    },
                                                    ...(finishPart.providerMetadata !== undefined ? { providerMetadata: finishPart.providerMetadata } : {}),
                                                } as any);
                                            }
                                            break;
                                        }
                                        default:
                                            controller.enqueue(part);
                                            break;
                                    }
                                }
                            } else if ('error' in chunk && chunk.error) {
                                controller.error(new Error(`A2A JSON-RPC Error: [${chunk.error.code}] ${chunk.error.message}`));
                                return;
                            }
                        }

                        if (!hasFinished) {
                            controller.error(new Error('A2A stream disconnected before sending final status-update.'));
                            return;
                        }

                        if (sessionId) {
                            await this.sessionStore.update(sessionId, {
                                contextId: mapper.contextId || session.contextId,
                                taskId: mapper.taskId || session.taskId,
                                lastFinishReason: mapper.lastFinishReason || lastFinishPart?.finishReason,
                                processedMessagesCount: options.prompt.length
                            });
                        }

                        if (isAutoConfirmTarget(lastFinishPart) && mapper.taskId) {
                            autoConfirmCount++;
                            currentRequest = buildConfirmationRequest(mapper.taskId, this.modelId);
                            continue;
                        }
                        break;
                    }
                    if (activeTextId !== undefined) controller.enqueue({ type: 'text-end', id: activeTextId });
                    controller.close();
                } catch (error) {
                    if (sessionId) await this.sessionStore.update(sessionId, { lastFinishReason: undefined });
                    controller.error(error);
                }
            },
        });

        return {
            stream,
            rawCall: { rawPrompt: options.prompt, rawSettings: options },
            rawResponse: { headers },
            request: { body: JSON.stringify(request) },
            warnings: [],
        };
    }

    async doGenerate(options: LanguageModelV1CallOptions) {
        const { stream: sdkStream, rawCall, rawResponse, request, warnings } = await this.doStream(options);
        const reader = sdkStream.getReader();
        let text = '';
        let reasoning = '';
        const toolCalls: LanguageModelV1FunctionToolCall[] = [];
        const content: any[] = [];
        const files: Array<{ data: string | Uint8Array; mimeType: string }> = [];
        let finishReason: any = 'unknown';
        const usage = { promptTokens: 0, completionTokens: 0 };
        let providerMetadata: Record<string, any> | undefined;
        let inputRequired: boolean | undefined;
        let rawState: string | undefined;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                switch (value.type) {
                    case 'text-delta':
                        text += value.delta;
                        if (content.length > 0 && content[content.length - 1].type === 'text') content[content.length - 1].text += value.delta;
                        else content.push({ type: 'text', text: value.delta });
                        break;
                    case 'reasoning-delta':
                        reasoning += value.delta;
                        if (content.length > 0 && content[content.length - 1].type === 'reasoning') content[content.length - 1].text += value.delta;
                        else content.push({ type: 'reasoning', text: value.delta });
                        break;
                    case 'tool-call':
                        toolCalls.push({ toolCallType: 'function', toolCallId: value.toolCallId, toolName: value.toolName, args: value.input });
                        content.push({ type: 'tool-call', toolCallId: value.toolCallId, toolName: value.toolName, input: value.input });
                        break;
                    case 'finish':
                        finishReason = value.finishReason;
                        if (value.usage) {
                            usage.promptTokens = value.usage.promptTokens ?? 0;
                            usage.completionTokens = value.usage.completionTokens ?? 0;
                        }
                        if ('providerMetadata' in value) providerMetadata = (value as any).providerMetadata;
                        if ('inputRequired' in value) inputRequired = (value as any).inputRequired;
                        if ('rawState' in value) rawState = (value as any).rawState;
                        break;
                    case 'file': {
                        const filePart = value as import('./utils/mapper').FileStreamPart;
                        const mediaType = filePart.mediaType || filePart.mimeType;
                        files.push({ data: filePart.data, mimeType: mediaType });
                        content.push({ type: 'file', data: filePart.data, mediaType });
                        break;
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }

        const finalFinishReasonV3 = (typeof finishReason === 'string')
            ? { unified: (finishReason === 'unknown' ? 'stop' : finishReason) as any, raw: rawState || finishReason }
            : finishReason;

        return {
            text: text.length > 0 ? text : undefined,
            reasoning: reasoning.length > 0 ? reasoning : undefined,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
            content: content.length > 0 ? content : undefined,
            files: files.length > 0 ? files : undefined,
            finishReason: (typeof finishReason === 'object' ? finishReason.unified : finishReason),
            finishReasonV3: finalFinishReasonV3,
            usage,
            usageV3: { inputTokens: { total: usage.promptTokens }, outputTokens: { total: usage.completionTokens } },
            rawCall, rawResponse, request, warnings,
            ...(providerMetadata !== undefined ? { providerMetadata } : {}),
            ...(inputRequired !== undefined ? { inputRequired } : {}),
            ...(rawState !== undefined ? { rawState } : {})
        } as any;
    }
}
