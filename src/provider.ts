import crypto from 'node:crypto';
import {
    type LanguageModelV2,
    type LanguageModelV2CallOptions,
    type LanguageModelV2StreamPart,
    type LanguageModelV2FinishReason,
    type LanguageModelV2TextPart,
    type LanguageModelV2ToolCallPart,
} from '@ai-sdk/provider';
import { resolveConfig, type OpenCodeProviderOptions, ConfigManager } from './config';
import { A2AClient } from './a2a-client';
import { 
    mapPromptToA2AJsonRpcRequest, 
    A2AStreamMapper, 
    buildConfirmationRequest,
    type MapPromptOptions, 
    type ExtendedFinishPart
} from './utils/mapper';
import { parseA2AStream } from './utils/stream';
import type { A2AJsonRpcRequest, A2AConfig, Tool } from './schemas';
import { type SessionStore, InMemorySessionStore, type A2ASession } from './session';
import { isQuotaError, getNextFallbackModel, resolveFallbackConfig, type FallbackConfig } from './fallback';
import { DefaultMultiAgentRouter } from './router';
import { Logger } from './utils/logger';


/** チャンクが届かない場合のウォッチドッグタイムアウト (ms)のデフォルト値、10分 */
const DEFAULT_CHUNK_TIMEOUT_MS = 10 * 60 * 1000;

function anySignal(signals: (AbortSignal | undefined)[]): AbortSignal {
    const controller = new AbortController();
    for (const signal of signals) {
        if (!signal) continue;
        if (signal.aborted) {
            controller.abort(signal.reason);
            return signal;
        }
        signal.addEventListener('abort', () => {
            controller.abort(signal.reason);
        }, { once: true });
    }
    return controller.signal;
}

function isAutoConfirmTarget(part: ExtendedFinishPart | undefined, textPartCounter: number = 0): boolean {
    if (!part) return false;
    const hasSpoken = textPartCounter > 0;
    if (part.coderAgentKind === 'tool-call-confirmation') {
        return part.inputRequired === true && part.hasExposedTools !== true;
    }
    const isInternalRecall = part.coderAgentKind === 'internal-tool-call';
    const isBackgroundAgent = part.coderAgentKind === 'codebase_investigator' || part.coderAgentKind === 'generalist';
    if (isBackgroundAgent) {
        return part.inputRequired === true && part.hasExposedTools !== true;
    }
    if (isInternalRecall) {
        return !hasSpoken && part.inputRequired === true && part.hasExposedTools !== true;
    }
    return false;
}

async function* withChunkTimeout<T>(iterable: AsyncIterable<T>, timeoutMs: number): AsyncIterable<T> {
    const iterator = iterable[Symbol.asyncIterator]();
    while (true) {
        let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutHandle = setTimeout(() => {
                reject(new Error(`Chunk timeout after ${timeoutMs}ms. The upstream agent may be stuck.`));
            }, timeoutMs);
        });
        try {
            const nextPromise = iterator.next();
            const result = await Promise.race([nextPromise, timeoutPromise]);
            if (result.done) break;
            yield result.value;
        } finally {
            clearTimeout(timeoutHandle);
        }
    }
}

export class OpenCodeGeminiA2AProvider implements LanguageModelV2 {
    private options: OpenCodeProviderOptions;
    private client: A2AClient | undefined;
    private sessionStore: SessionStore;
    private contextToolFrequency: Map<string, Record<string, number>> = new Map();
    public readonly modelId: string;
    public readonly modelID: string;
    public readonly specificationVersion = 'v2';
    public readonly provider = 'opencode-geminicli-a2a';
    public readonly providerId = 'opencode-geminicli-a2a';
    public readonly providerID = 'opencode-geminicli-a2a';
    public readonly id = 'opencode-geminicli-a2a';
    public readonly name = 'Gemini CLI (A2A)';
    public readonly supportedUrls: Record<string, RegExp[]> = {};

    private unregisterConfigWatcher?: () => void;

    constructor(modelId: string, options: OpenCodeProviderOptions = {}) {
        this.modelId = modelId;
        this.modelID = modelId;
        this.options = options;
        this.sessionStore = options.sessionStore || new InMemorySessionStore();

        if (options.hotReload) {
            this.unregisterConfigWatcher = ConfigManager.getInstance().onChange(() => {
                Logger.info(`[Provider] Hot-reloading configuration for model ${this.modelId}`);
                this.client = undefined; // Force re-creation on next use
            });
        }
    }

    public dispose() {
        if (this.unregisterConfigWatcher) {
            this.unregisterConfigWatcher();
        }
    }

    private async ensureClient(): Promise<void> {
        if (this.client) return;
        const config = resolveConfig(this.options);
        
        // マルチエージェント対応: modelId に対応するエンドポイントがあればそれを使う
        const agents = config.agents;
        if (agents && agents.length > 0) {
            const router = new DefaultMultiAgentRouter(agents);
            const resolved = router.resolve(this.modelId);
            if (resolved) {
                const agentConfig = {
                    ...config,
                    host: resolved.endpoint.host,
                    port: resolved.endpoint.port,
                    protocol: resolved.endpoint.protocol || config.protocol,
                    token: resolved.endpoint.token || config.token,
                };
                this.client = new A2AClient(agentConfig);
                return;
            }
        }
        
        this.client = new A2AClient(config);
    }

    private get resolvedOptions() {
        return resolveConfig(this.options);
    }

    async doStream(options: LanguageModelV2CallOptions): Promise<{
        stream: ReadableStream<LanguageModelV2StreamPart>;
        request?: { body?: string };
        response?: { headers?: Record<string, string> };
    }> {
        await this.ensureClient();
        
        const sessionId = options.headers?.['x-opencode-session-id'] || options.headers?.['x-session-id'] || (options as any).providerMetadata?.opencode?.sessionId;
        let session = sessionId ? await this.sessionStore.get(sessionId) : undefined;
        const resetContext = (options as any).providerMetadata?.opencode?.resetContext || (options as any).providerOptions?.opencode?.resetContext;
        
        if (session && resetContext) {
            session.contextId = undefined;
            session.taskId = undefined;
            if (sessionId && sessionId !== 'undefined') {
                await this.sessionStore.update(sessionId, session);
            }
        }
        
        if (!session) {
            session = { 
                contextId: undefined, 
                taskId: undefined, 
                processedMessagesCount: 0,
                toolCallFrequency: {},
                fallbackCounters: {},
            };
            if (sessionId && sessionId !== 'undefined') {
                await this.sessionStore.update(sessionId, session);
            }
        }

        const idempotencyKey = options.headers?.['idempotency-key'] || 
                               options.headers?.['x-opencode-idempotency-key'] || 
                               (options as any).providerMetadata?.opencode?.idempotencyKey || 
                               crypto.randomUUID();

        const baseConfig = this.resolvedOptions;

        let agentOptions: any = undefined;
        if (baseConfig.agents) {
            const router = new DefaultMultiAgentRouter(baseConfig.agents);
            const resolved = router.resolve(this.modelId);
            if (resolved && resolved.config && resolved.config.options) {
                agentOptions = resolved.config.options;
            }
        }

        const resolvedBaseConfig = {
            ...baseConfig,
            ...(agentOptions || {}),
        };

        const generationConfig: Record<string, any> = {
            ...(baseConfig.generationConfig || {}),
            ...(agentOptions?.generationConfig || {}),
            ...(options as any).generationConfig || {},
        };

        if ((options as any).temperature !== undefined) generationConfig.temperature = (options as any).temperature;
        if ((options as any).topP !== undefined) generationConfig.topP = (options as any).topP;
        if ((options as any).topK !== undefined) generationConfig.topK = (options as any).topK;
        if ((options as any).maxTokens !== undefined) generationConfig.maxOutputTokens = (options as any).maxTokens;
        if ((options as any).stopSequences !== undefined) generationConfig.stopSequences = (options as any).stopSequences;

        const mapOptions: MapPromptOptions = {
            tools: (options as any).mode?.type === 'regular' ? (options as any).mode.tools : ((options as any).tools || undefined),
            toolMapping: resolvedBaseConfig.toolMapping,
            internalTools: resolvedBaseConfig.internalTools,
            contextId: session.contextId,
            taskId: session.taskId,
            processedMessagesCount: session.processedMessagesCount,
            modelId: this.modelId,
            generationConfig: Object.keys(generationConfig).length > 0 ? generationConfig : undefined,
        };

        const initialRequestData = mapPromptToA2AJsonRpcRequest(options.prompt, mapOptions);
        const serializedRequestForTest = JSON.stringify(initialRequestData);
        
        const toolsArr = (options as any).mode?.type === 'regular' ? (options as any).mode.tools : ((options as any).tools || []);
        const clientTools = toolsArr ? toolsArr.map((t: any) => t.name || t.type) : [];
        const isNewUserTurn = options.prompt.length > (session.processedMessagesCount || 0);

        let responseStream: ReadableStream<Uint8Array>;
        let headers: Record<string, string>;
        let lastFinishPart: ExtendedFinishPart | undefined = undefined;

        try {
            const firstChatResponse = await this.client!.chatStream({ 
                request: initialRequestData, 
                abortSignal: options.abortSignal,
                idempotencyKey
            });
            responseStream = firstChatResponse.stream;
            headers = firstChatResponse.headers;
        } catch (error) {
            const currentFallbackConfig = resolveFallbackConfig(this.options.fallback);
            if (isQuotaError(error, currentFallbackConfig) && currentFallbackConfig) {
                const nextModel = getNextFallbackModel(this.modelId, currentFallbackConfig);
                if (nextModel) {
                    Logger.warn(`Quota exceeded for ${this.modelId}. Falling back to ${nextModel}.`);
                    const counters = (session as any).fallbackCounters || {};
                    counters[this.modelId] = (counters[this.modelId] || 0) + 1;
                    (session as any).fallbackCounters = counters;
                    if (sessionId && sessionId !== 'undefined') await this.sessionStore.update(sessionId, { fallbackCounters: counters });
                    
                    const provider = new OpenCodeGeminiA2AProvider(nextModel, {
                        ...this.options,
                        sessionStore: this.sessionStore
                    });
                    return provider.doStream({
                        ...options,
                        headers: {
                            ...options.headers,
                            'idempotency-key': idempotencyKey
                        }
                    });
                }
            }
            throw error;
        }

        const frequencyContextId = session.contextId;
        if (isNewUserTurn && sessionId) {
            session.toolCallFrequency = {};
            if (frequencyContextId) {
                this.contextToolFrequency.delete(frequencyContextId);
            }
        }

        const instanceFreq = frequencyContextId
            ? this.contextToolFrequency.get(frequencyContextId)
            : undefined;
            
        const mapper = new A2AStreamMapper({
            toolMapping: resolvedBaseConfig.toolMapping,
            internalTools: resolvedBaseConfig.internalTools,
            clientTools: clientTools as string[],
            initialToolCallFrequency: instanceFreq ?? session.toolCallFrequency,
            maxToolCallFrequency: this.options?.maxToolCallFrequency,
        });

        const startTime = Date.now();
        const isTestEnv = process.env.NODE_ENV === 'test';
        const TIMEOUT_MS = isTestEnv ? 3000 : 300000;
        
        const timeoutAbortController = new AbortController();
        const timeoutHandle = setTimeout(() => {
            timeoutAbortController.abort('EXECUTION_TIMEOUT');
        }, TIMEOUT_MS);

        const stream = new ReadableStream<LanguageModelV2StreamPart>({
            start: (controller) => {
                let textPartCounter = 0;
                let reasoningPartCounter = 0;
                let activeTextId: string | undefined;
                let activeReasoningId: string | undefined;
                let isControllerClosed = false;

                const safeEnqueue = (part: LanguageModelV2StreamPart) => {
                    if (!isControllerClosed) {
                        try {
                            controller.enqueue(part);
                        } catch (e) {
                            Logger.warn('[Provider] controller closed prematurely');
                            isControllerClosed = true;
                        }
                    }
                };
                const safeError = (err: any) => {
                    if (!isControllerClosed) {
                        controller.error(err);
                        isControllerClosed = true;
                    }
                };
                const safeClose = () => {
                    if (!isControllerClosed) {
                        controller.close();
                        isControllerClosed = true;
                    }
                };

                const closeText = () => {
                    if (activeTextId !== undefined) {
                        safeEnqueue({ type: 'text-end', id: activeTextId } as any);
                        activeTextId = undefined;
                    }
                };
                const closeReasoning = () => {
                    if (activeReasoningId !== undefined) {
                        safeEnqueue({ type: 'reasoning-end', id: activeReasoningId } as any);
                        activeReasoningId = undefined;
                    }
                };
                const enqueueText = (delta: string) => {
                    if (!delta) return;
                    if (activeTextId === undefined) {
                        activeTextId = `text-${textPartCounter++}`;
                        safeEnqueue({ type: 'text-start', id: activeTextId } as any);
                    }
                    safeEnqueue({ type: 'text-delta', id: activeTextId, delta } as any);
                };

                (async () => {
                    try {
                        let currentRequest = initialRequestData;
                        let autoConfirmCount = 0;
                        let toolCallConfirmCount = 0;
                        const MAX_AUTO_CONFIRM = this.options?.maxAutoConfirm ?? 50;
                        const MAX_TOOL_CONFIRM = 1;

                        let firstResponse: any = { stream: responseStream, headers: headers || {} };

                        const loop = async () => {
                            while (true) {
                                if (Date.now() - startTime > TIMEOUT_MS) {
                                    throw new Error('EXECUTION_TIMEOUT');
                                }

                                let hasFinishedInThisTurn = false;
                                const combinedSignal = options.abortSignal 
                                    ? anySignal([options.abortSignal, timeoutAbortController.signal])
                                    : timeoutAbortController.signal;

                                const response = firstResponse || await this.client!.chatStream({ 
                                    request: currentRequest, 
                                    abortSignal: combinedSignal,
                                    idempotencyKey
                                });
                                firstResponse = undefined;

                                mapper.startNewTurn();
                                const chunkTimeoutMs = this.options?.chunkTimeoutMs ?? DEFAULT_CHUNK_TIMEOUT_MS;
                                const chunkGenerator = withChunkTimeout(parseA2AStream(response.stream), chunkTimeoutMs);

                                for await (const chunk of chunkGenerator) {
                                    if ('result' in chunk && chunk.result) {
                                        const parts = mapper.mapResult(chunk.result);
                                        for (const part of parts) {
                                            switch (part.type) {
                                                case 'text-delta': {
                                                    enqueueText((part as any).textDelta || (part as any).delta);
                                                    break;
                                                }
                                                case 'reasoning-delta': {
                                                    closeText();
                                                    if (activeReasoningId === undefined) {
                                                        activeReasoningId = `reasoning-${reasoningPartCounter++}`;
                                                        safeEnqueue({ type: 'reasoning-start', id: activeReasoningId } as any);
                                                    }
                                                    safeEnqueue(part as any);
                                                    break;
                                                }
                                                case 'tool-call': {
                                                    closeText();
                                                    closeReasoning();
                                                    safeEnqueue({
                                                        type: 'tool-call',
                                                        toolCallId: part.toolCallId,
                                                        toolName: part.toolName,
                                                        args: typeof (part as any).args === 'string' ? (part as any).args : JSON.stringify((part as any).args),
                                                    } as any);
                                                    break;
                                                }
                                                case 'finish': {
                                                    hasFinishedInThisTurn = true;
                                                    lastFinishPart = part as ExtendedFinishPart;
                                                    if (!isAutoConfirmTarget(lastFinishPart, textPartCounter)) {
                                                        closeText();
                                                        closeReasoning();
                                                        const unifiedFinishReason = (lastFinishPart.finishReason === 'unknown' ? 'stop' : lastFinishPart.finishReason);
                                                        safeEnqueue({
                                                            type: 'finish',
                                                            finishReason: unifiedFinishReason as LanguageModelV2FinishReason,
                                                            usage: {
                                                                promptTokens: lastFinishPart.usage.promptTokens,
                                                                completionTokens: lastFinishPart.usage.completionTokens,
                                                            },
                                                        } as any);
                                                    }
                                                    break;
                                                }
                                                default:
                                                    safeEnqueue(part as any);
                                                    break;
                                            }
                                        }
                                    } else if ('error' in chunk && chunk.error) {
                                        throw new Error(`A2A JSON-RPC Error: [${chunk.error.code}] ${chunk.error.message}`);
                                    }
                                }

                                if (!hasFinishedInThisTurn) {
                                    throw new Error('A2A stream disconnected before sending final status-update.');
                                }

                                if (lastFinishPart?.shouldInterruptLoop) {
                                    Logger.warn(`[auto-confirm] Loop detected. Force terminating.`);
                                    enqueueText(`\n\n[opencode-geminicli-a2a] ⚠️ エージェントが同一の内部ツールを何度も呼び出したため、ループを強制中断しました。\n`);
                                    closeText();
                                    closeReasoning();
                                    safeEnqueue({
                                        type: 'finish',
                                        finishReason: 'stop',
                                        usage: {
                                            promptTokens: lastFinishPart.usage.promptTokens || 0,
                                            completionTokens: lastFinishPart.usage.completionTokens || 0,
                                        },
                                    } as any);
                                    
                                    // A2Aサーバーがinput-requiredのままでハングしないよう、Cancelを送信する
                                    if ((lastFinishPart as any).taskId) {
                                        const cancelParam = buildConfirmationRequest((lastFinishPart as any).taskId, this.modelId, false);
                                        this.client!.chatStream({ request: cancelParam, abortSignal: timeoutAbortController.signal }).catch((err: any) => {
                                            Logger.error(`[Provider] Failed to send loop-interrupt Cancel to A2A server:`, err);
                                        });
                                    }
                                    
                                    break;
                                }

                                const canAutoConfirm = isAutoConfirmTarget(lastFinishPart!, textPartCounter);
                                if (canAutoConfirm) {
                                    if (autoConfirmCount < MAX_AUTO_CONFIRM) {
                                        autoConfirmCount++;
                                        currentRequest = buildConfirmationRequest(
                                            (lastFinishPart as any).taskId!,
                                            this.modelId,
                                            true
                                        );
                                        mapper.startNewTurn();
                                        continue;
                                    } else {
                                        Logger.warn(`[auto-confirm] MAX_AUTO_CONFIRM reached. Forcing stop.`);
                                        if (textPartCounter === 0) {
                                            enqueueText(`\n\n[opencode-geminicli-a2a] ⚠️ エージェントが内部処理を繰り返しすぎたため、処理を中断しました。回答が生成されていません。\n`);
                                        }
                                        closeText();
                                        closeReasoning();
                                        safeEnqueue({
                                            type: 'finish',
                                            finishReason: 'stop',
                                            usage: { promptTokens: 0, completionTokens: 0 },
                                        } as any);
                                        break;
                                    }
                                }

                                const isToolCallConfirm = (lastFinishPart as any).coderAgentKind === 'tool-call-confirmation' && (lastFinishPart as any).hasExposedTools === true;
                                if (isToolCallConfirm) {
                                    if (toolCallConfirmCount < MAX_TOOL_CONFIRM) {
                                        toolCallConfirmCount++;
                                        currentRequest = buildConfirmationRequest(
                                            (lastFinishPart as any).taskId!,
                                            this.modelId,
                                            true
                                        );
                                        mapper.startNewTurn();
                                        continue;
                                    } else {
                                        Logger.warn(`[auto-confirm] MAX_TOOL_CONFIRM reached. Forcing stop.`);
                                        closeText();
                                        closeReasoning();
                                        safeEnqueue({
                                            type: 'finish',
                                            finishReason: 'stop',
                                            usage: { promptTokens: 0, completionTokens: 0 },
                                        } as any);
                                        break;
                                    }
                                }

                                break;
                            }
                        };

                        await loop();
                    } catch (err: any) {
                        const isTimeout = err.message === 'EXECUTION_TIMEOUT' || err.name === 'AbortError' || (err as any).name === 'AbortError';
                        if (isTimeout) {
                            Logger.warn(`[Provider] doStream reached timeout or abort.`);
                            enqueueText(`\n\n[opencode-geminicli-a2a] ⚠️ 処理がタイムアウトしたか、中断されました。\n`);
                            closeText();
                            safeEnqueue({
                                type: 'finish',
                                finishReason: 'stop',
                                usage: {
                                    promptTokens: 0,
                                    completionTokens: 0,
                                },
                            } as any);
                        } else {
                            safeError(err);
                        }
                    } finally {
                        clearTimeout(timeoutHandle);
                        if (sessionId && sessionId !== 'undefined' && session) {
                            const updatedFreq = mapper.currentToolCallFrequency;
                            const updatedContextId = mapper.contextId || session.contextId;
                            if (updatedContextId) {
                                this.contextToolFrequency.set(updatedContextId, updatedFreq);
                            }
                            await this.sessionStore.update(sessionId, {
                                contextId: mapper.contextId || session.contextId,
                                taskId: mapper.taskId || session.taskId,
                                processedMessagesCount: options.prompt.length,
                                toolCallFrequency: updatedFreq,
                                inputRequired: (lastFinishPart as any)?.inputRequired,
                                rawState: (lastFinishPart as any)?.inputRequired ? 'input-required' : undefined,
                            });
                        }
                        safeClose();
                    }
                })();
            },
        });

        return {
            stream,
            request: { body: serializedRequestForTest },
            response: { headers: headers! },
        };
    }

    async doGenerate(options: LanguageModelV2CallOptions): Promise<any> {
        const { stream: sdkStream, request, response } = await this.doStream(options);
        const reader = sdkStream.getReader();
        let reasoning = '';
        const toolCalls: any[] = [];
        const content: any[] = [];
        let finishReason: LanguageModelV2FinishReason = 'other';
        const usage = { promptTokens: 0, completionTokens: 0 };

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                switch (value.type) {
                    case 'text-delta': {
                        const delta = (value as any).textDelta || (value as any).delta;
                        if (delta) {
                            if (content.length > 0 && content[content.length - 1].type === 'text') {
                                (content[content.length - 1] as any).text += delta;
                            } else {
                                content.push({ type: 'text', text: delta });
                            }
                        }
                        break;
                    }
                    case 'reasoning-delta': {
                        const delta = (value as any).delta || (value as any).reasoningDelta;
                        if (delta) {
                            reasoning += delta;
                        }
                        break;
                    }
                    case 'tool-call':
                        toolCalls.push({ 
                            toolCallId: value.toolCallId, 
                            toolName: value.toolName, 
                            args: (value as any).args as any
                        });
                        content.push({ 
                            type: 'tool-call', 
                            toolCallId: value.toolCallId, 
                            toolName: value.toolName, 
                            args: (value as any).args as any
                        });
                        break;
                    case 'finish':
                        finishReason = value.finishReason;
                        if (value.usage) {
                            usage.promptTokens = (value.usage as any).promptTokens ?? 0;
                            usage.completionTokens = (value.usage as any).completionTokens ?? 0;
                        }
                        break;
                }
            }
        } finally {
            reader.releaseLock();
        }

        return {
            text: content.filter(p => p.type === 'text').map(p => p.text).join(''),
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
            content,
            finishReason: finishReason as LanguageModelV2FinishReason,
            usage,
            response: response as any,
            request,
            warnings: [],
            reasoning: reasoning.length > 0 ? reasoning : undefined,
        };
    }
}
