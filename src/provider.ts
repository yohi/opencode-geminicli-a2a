import crypto from 'node:crypto';
import {
    type LanguageModelV2,
    type LanguageModelV2CallOptions,
    type LanguageModelV2StreamPart,
    type LanguageModelV2FinishReason,
} from '@ai-sdk/provider';
import { resolveConfig, type OpenCodeProviderOptions, ConfigManager } from './config';
import { A2AClient } from './a2a-client';
import { 
    mapPromptToA2AJsonRpcRequest, 
    A2AStreamMapper, 
    buildConfirmationRequest,
    type MapPromptOptions, 
    type ExtendedFinishPart,
} from './utils/mapper';
import { parseA2AStream } from './utils/stream';
import { type SessionStore, InMemorySessionStore } from './session';
import { isQuotaError, getNextFallbackModel, resolveFallbackConfig } from './fallback';
import { DefaultMultiAgentRouter } from './router';
import { Logger } from './utils/logger';
import { META_TOOLS } from './utils/constants';


/** チャンクが届かない場合のウォッチドッグタイムアウト (ms)のデフォルト値、10分 */
const DEFAULT_CHUNK_TIMEOUT_MS = 10 * 60 * 1000;
/** contextToolFrequency の最大キャッシュ件数 */
const MAX_CONTEXT_CACHE = 100;

const BACKGROUND_TOOLS = ['codebase_investigator', 'generalist'];

function anySignal(signals: (AbortSignal | undefined)[]): AbortSignal {
    const controller = new AbortController();
    const handlers: Array<{ signal: AbortSignal; handler: () => void }> = [];

    const cleanup = () => {
        for (const { signal, handler } of handlers) {
            signal.removeEventListener('abort', handler);
        }
        handlers.length = 0;
    };

    for (const signal of signals) {
        if (!signal) continue;
        if (signal.aborted) {
            cleanup();
            controller.abort(signal.reason);
            return signal;
        }
        const handler = () => {
            cleanup();
            controller.abort(signal.reason);
        };
        signal.addEventListener('abort', handler, { once: true });
        handlers.push({ signal, handler });
    }

    // controller 自体が外部からアボートされた場合もクリーンアップする
    controller.signal.addEventListener('abort', cleanup, { once: true });

    return controller.signal;
}

function isAutoConfirmTarget(
    part: ExtendedFinishPart | undefined, 
    textPartCounter: number = 0, 
    autoConfirmCount: number = 0,
    maxAutoConfirm: number = 5
): boolean {
    if (!part) return false;
    if (autoConfirmCount >= maxAutoConfirm) return false;

    const internalToolNames = part.internalToolNames || [];
    const hasMetaTool = internalToolNames.some(name => META_TOOLS.includes(name));
    if (hasMetaTool) return false;

    const isBackgroundTool = internalToolNames.some(name => BACKGROUND_TOOLS.includes(name));
    const hasSpoken = textPartCounter > 0;

    if (part.coderAgentKind === 'tool-call-confirmation') {
        return part.inputRequired === true && part.hasExposedTools !== true;
    }

    if (isBackgroundTool) {
        return part.inputRequired === true && part.hasExposedTools !== true;
    }

    const isInternalRecall = part.coderAgentKind === 'internal-tool-call';
    if (isInternalRecall) {
        // Even if the model has spoken (e.g. reasoning), we should auto-confirm internal tools 
        // to keep the flow moving, as long as no tools are exposed to the user.
        return part.inputRequired === true && part.hasExposedTools !== true;
    }

    // A2A server might trigger state change that requires continuation without exposing tools to OpenCode.
    // We always allow this to keep the session alive during server-side state transitions.
    if (part.coderAgentKind === 'state-change') {
        return part.inputRequired === true && part.hasExposedTools !== true;
    }

    return false;
}

async function* withChunkTimeout<T>(iterable: AsyncIterable<T>, timeoutMs: number): AsyncIterable<T> {
    const iterator = iterable[Symbol.asyncIterator]();
    try {
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
    } finally {
        if (typeof iterator.return === 'function') {
            try {
                await iterator.return();
            } catch (e) {
                // Ignore errors during iterator closure
            }
        }
    }
}

export class OpenCodeGeminiA2AProvider implements LanguageModelV2 {
    private options: OpenCodeProviderOptions;
    private client: A2AClient | undefined;
    private serverVersionChecked = false;
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
        if (this.client) {
            await this.checkServerVersion();
            return;
        }
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
                await this.checkServerVersion();
                return;
            }
        }
        
        this.client = new A2AClient(config);
        await this.checkServerVersion();
    }

    /**
     * A2Aサーバーのバージョンを確認し、必要条件(>=0.35.0)を満たさない場合は警告またはエラーを出す。
     */
    private async checkServerVersion(): Promise<void> {
        if (!this.client || this.serverVersionChecked || process.env.NODE_ENV === 'test') return;

        try {
            const info = await this.client.getServerInfo();
            if (!info || !info.version) {
                Logger.warn('[Provider] Could not verify A2A server version. Some features might not work as expected.');
                this.serverVersionChecked = true;
                return;
            }

            const version = info.version;
            const [major, minor, patch] = version.split('.').map(Number);
            
            // v0.35.0 未満の場合はエラー（または警告）
            if (major === 0 && minor < 35) {
                const errorMsg = `[Provider] A2A server version ${version} is outdated. ` +
                                `Version 0.35.0 or higher is required for dynamic model selection and improved tool handling. ` +
                                `Please update with 'npm install -g @google/gemini-cli-a2a-server@latest'.`;
                Logger.error(errorMsg);
                throw new Error(errorMsg);
            }

            Logger.info(`[Provider] Connected to A2A server v${version}`);
            this.serverVersionChecked = true;
        } catch (err) {
            if (err instanceof Error && err.message.includes('outdated')) {
                throw err;
            }
            Logger.debug('[Provider] Version check failed, continuing anyway:', err);
            // 接続エラー等の場合は一旦無視して進む（doStream側でエラーになるため）
            this.serverVersionChecked = true; 
        }
    }

    private get resolvedOptions() {
        return resolveConfig(this.options);
    }

    async doStream(options: LanguageModelV2CallOptions): Promise<{
        stream: ReadableStream<LanguageModelV2StreamPart>;
        request?: { body?: string };
        response?: { headers?: Record<string, string> };
    }> {
        // If the server is being auto-started, wait for it to be ready
        const serverReady = (this as any)._serverReady;
        if (serverReady instanceof Promise) {
            try {
                await serverReady;
            } catch (err) {
                Logger.error('[Provider] Aborting stream because server failed to start:', err);
                throw err;
            }
        }

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
        let actualModelId = this.modelId;
        if (baseConfig.agents) {
            const router = new DefaultMultiAgentRouter(baseConfig.agents);
            const resolved = router.resolve(this.modelId);
            if (resolved) {
                actualModelId = resolved.actualModelId;
                if (resolved.config && resolved.config.options) {
                    agentOptions = resolved.config.options;
                }
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
            modelId: actualModelId,
            generationConfig: Object.keys(generationConfig).length > 0 ? generationConfig : undefined,
            toolChoice: options.toolChoice,
        };

        const initialRequestData = mapPromptToA2AJsonRpcRequest(options.prompt, mapOptions);
        const serializedRequestForTest = JSON.stringify(initialRequestData);
        
        const toolsArr = (options as any).mode?.type === 'regular' ? (options as any).mode.tools : ((options as any).tools || []);
        const clientTools = toolsArr 
            ? toolsArr.map((t: any) => t.function?.name || t.name || t.type).filter((n: any): n is string => !!n) 
            : [];
        
        // session.processedMessagesCount 以降に 'user' ロールのメッセージがあるかを確認して新規ユーザーターンと判定する
        const isNewUserTurn = options.prompt.slice(session.processedMessagesCount || 0).some(m => m.role === 'user');

        const startTime = Date.now();
        const isTestEnv = process.env.NODE_ENV === 'test';
        const TIMEOUT_MS = isTestEnv ? 3000 : 300000;
        
        const timeoutAbortController = new AbortController();
        const timeoutHandle = setTimeout(() => {
            timeoutAbortController.abort('EXECUTION_TIMEOUT');
        }, TIMEOUT_MS);

        const combinedAbortController = new AbortController();
        if (options.abortSignal) {
            options.abortSignal.addEventListener('abort', () => combinedAbortController.abort(options.abortSignal?.reason), { once: true });
        }
        timeoutAbortController.signal.addEventListener('abort', () => combinedAbortController.abort(timeoutAbortController.signal.reason), { once: true });

        let responseStream: ReadableStream<Uint8Array>;
        let headers: Record<string, string>;
        let lastFinishPart: ExtendedFinishPart | undefined = undefined;

        try {
            const firstChatResponse = await this.client!.chatStream({ 
                request: initialRequestData, 
                abortSignal: combinedAbortController.signal,
                idempotencyKey
            });
            responseStream = firstChatResponse.stream;
            headers = firstChatResponse.headers;
        } catch (error) {
            const currentFallbackConfig = resolveFallbackConfig(this.options.fallback);
            if (isQuotaError(error, currentFallbackConfig) && currentFallbackConfig) {
                const counters = (session as any).fallbackCounters || {};
                const totalRetries = Object.values(counters).reduce((sum: number, val: any) => sum + (val as number), 0);
                
                if (totalRetries < (currentFallbackConfig.maxRetries ?? 3)) {
                    const nextModel = getNextFallbackModel(this.modelId, currentFallbackConfig);
                    if (nextModel) {
                        Logger.warn(`Quota exceeded for ${this.modelId}. Falling back to ${nextModel}. Total retries: ${totalRetries + 1}`);
                        counters[this.modelId] = (counters[this.modelId] || 0) + 1;
                        (session as any).fallbackCounters = counters;
                        if (sessionId && sessionId !== 'undefined') await this.sessionStore.update(sessionId, { fallbackCounters: counters });
                        
                        const provider = new OpenCodeGeminiA2AProvider(nextModel, {
                            ...this.options,
                            sessionStore: this.sessionStore
                        });
                        clearTimeout(timeoutHandle);
                        return provider.doStream({
                            ...options,
                            headers: {
                                ...options.headers,
                                'idempotency-key': idempotencyKey
                            }
                        });
                    }
                } else {
                    Logger.error(`Max fallback retries reached (${totalRetries}). Giving up.`);
                }
            }
            clearTimeout(timeoutHandle);
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
            maxToolCallFrequency: resolvedBaseConfig.maxToolCallFrequency ?? this.options?.maxToolCallFrequency,
        });

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
                            // Ultimate compatibility for OpenCode/Bun consumers:
                            // 1. V2 uses textDelta
                            // 2. Some strict V1 consumers expect a top-level 'delta' string
                            // 3. Others expect 'delta' to be an object with 'content' (evaluating chunk.delta.content)
                            // 4. Yet others expect chunk.delta.length (string has .length)

                            const content = (part as any).textDelta || (part as any).reasoningDelta || "";

                            const compatibilityPart = {
                                ...part,
                                // Satisfy 'expected string, received undefined' for path: ['delta']
                                delta: content,
                                // Satisfy 'evaluating chunk.delta.content'
                                content: content,
                            };

                            controller.enqueue(compatibilityPart as any);
                        } catch (e) {
                            // Controller can be closed by the client (OpenCode) at any time.
                            if (process.env.DEBUG_OPENCODE) {
                                Logger.debug('[Provider] controller closed while enqueuing part');
                            }
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
                const enqueueText = (delta: string | undefined | null) => {
                    if (typeof delta !== 'string' || delta.length === 0) return;
                    if (activeTextId === undefined) {
                        activeTextId = `text-${textPartCounter++}`;
                        safeEnqueue({ type: 'text-start', id: activeTextId } as any);
                    }
                    safeEnqueue({ 
                        type: 'text-delta', 
                        id: activeTextId, 
                        textDelta: delta,
                        // Compatibility for older/strict OpenCode consumers
                        delta: delta
                    } as any);
                };

                (async () => {
                    try {
                        let currentRequest = initialRequestData;
                        let autoConfirmCount = 0;
                        let toolCallConfirmCount = 0;
                        const MAX_AUTO_CONFIRM = this.options.maxAutoConfirm || 100;
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
                                    abortSignal: combinedAbortController.signal,
                                    idempotencyKey
                                });
                                firstResponse = undefined;

                                mapper.startNewTurn();
                                const chunkTimeoutMs = resolvedBaseConfig.chunkTimeoutMs ?? this.options?.chunkTimeoutMs ?? DEFAULT_CHUNK_TIMEOUT_MS;
                                const chunkGenerator = withChunkTimeout(parseA2AStream(response.stream), chunkTimeoutMs);

                                try {
                                    for await (const chunk of chunkGenerator) {
                                        if (combinedAbortController.signal.aborted) {
                                            throw combinedAbortController.signal.reason || new Error('Aborted');
                                        }
                                        if ('result' in chunk && chunk.result) {
                                            const parts = mapper.mapResult(chunk.result);
                                            for (const part of parts) {
                                                switch (part.type) {
                                                    case 'text-delta': {
                                                        enqueueText((part as any).textDelta);
                                                        break;
                                                    }
                                                    case 'reasoning-delta': {
                                                        closeText();
                                                        if (activeReasoningId === undefined) {
                                                            activeReasoningId = `reasoning-${reasoningPartCounter++}`;
                                                            safeEnqueue({ type: 'reasoning-start', id: activeReasoningId } as any);
                                                        }
                                                        safeEnqueue({
                                                            type: 'reasoning-delta',
                                                            id: activeReasoningId,
                                                            reasoningDelta: (part as any).reasoningDelta,
                                                        } as any);
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
                                                        if (!isAutoConfirmTarget(lastFinishPart, textPartCounter, autoConfirmCount, MAX_AUTO_CONFIRM)) {
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
                                } catch (e: any) {
                                    if (e.message === 'CHUNK_TIMEOUT') {
                                        Logger.warn(`[Provider] Chunk timeout reached (${chunkTimeoutMs}ms).`);
                                    }
                                    throw e;
                                }

                                if (!hasFinishedInThisTurn || !lastFinishPart) {
                                    throw new Error('A2A stream disconnected before sending final status-update.');
                                }

                                if (lastFinishPart.shouldInterruptLoop) {
                                    Logger.warn(`[auto-confirm] Loop detected. Force terminating.`);
                                    closeReasoning();
                                    enqueueText(`\n\n[opencode-geminicli-a2a] ⚠️ エージェントが同一の内部ツールを何度も呼び出したため、ループを強制中断しました。\n`);
                                    closeText();
                                    safeEnqueue({
                                        type: 'finish',
                                        finishReason: 'stop',
                                        usage: {
                                            promptTokens: lastFinishPart.usage.promptTokens || 0,
                                            completionTokens: lastFinishPart.usage.completionTokens || 0,
                                        },
                                    } as any);
                                    
                                    // A2Aサーバーがinput-requiredのままでハングしないよう、Cancelを送信する
                                    if (lastFinishPart.taskId) {
                                        const cancelParam = buildConfirmationRequest(lastFinishPart.taskId, actualModelId, false);
                                        this.client!.chatStream({ request: cancelParam, abortSignal: timeoutAbortController.signal }).catch((err: any) => {
                                            Logger.error(`[Provider] Failed to send loop-interrupt Cancel to A2A server:`, err);
                                        });
                                    }
                                    
                                    break;
                                }

                                const canAutoConfirm = isAutoConfirmTarget(lastFinishPart!, textPartCounter, autoConfirmCount, MAX_AUTO_CONFIRM);
                                Logger.warn(`[Debug-Loop] canAutoConfirm: ${canAutoConfirm}, autoConfirmCount: ${autoConfirmCount}, lastFinishPart.coderAgentKind: ${lastFinishPart?.coderAgentKind}`);
                                if (lastFinishPart.taskId) {
                                    if (canAutoConfirm) {
                                        autoConfirmCount++;
                                        currentRequest = buildConfirmationRequest(
                                            lastFinishPart.taskId!,
                                            actualModelId,
                                            true
                                        );
                                        mapper.startNewTurn();
                                        continue;
                                    } else if (autoConfirmCount >= MAX_AUTO_CONFIRM && isAutoConfirmTarget(lastFinishPart!, textPartCounter, 0, Infinity)) {
                                        Logger.warn(`[auto-confirm] MAX_AUTO_CONFIRM reached. Forcing stop.`);
                                        closeReasoning();
                                        if (textPartCounter === 0) {
                                            enqueueText(`\n\n[opencode-geminicli-a2a] ⚠️ エージェントが内部処理を繰り返しすぎたため、処理を中断しました。回答が生成されていません。\n`);
                                        }
                                        closeText();
                                        safeEnqueue({
                                            type: 'finish',
                                            finishReason: 'stop',
                                            usage: { promptTokens: 0, completionTokens: 0 },
                                        } as any);
                                        break;
                                    }
                                }

                                const isToolCallConfirm = lastFinishPart.coderAgentKind === 'tool-call-confirmation' && lastFinishPart.hasExposedTools === true;
                                if (isToolCallConfirm && lastFinishPart.taskId) {
                                    if (toolCallConfirmCount < MAX_TOOL_CONFIRM) {
                                        toolCallConfirmCount++;
                                        currentRequest = buildConfirmationRequest(
                                            lastFinishPart.taskId!,
                                            actualModelId,
                                            true
                                        );
                                        mapper.startNewTurn();
                                        continue;
                                    } else {
                                        Logger.warn(`[auto-confirm] MAX_TOOL_CONFIRM reached. Forcing stop.`);
                                        closeReasoning();
                                        closeText();
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
                            closeReasoning();
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
                            // Fallback error messaging instead of raw safeError(err) to prevent OpenCode consumer crash
                            const message = err instanceof Error ? err.message : String(err);
                            Logger.error(`[Provider] Fatal stream error:`, err);
                            
                            closeReasoning();
                            enqueueText(`\n\n[opencode-geminicli-a2a] ❌ 致命的なエラーが発生しました: ${message}\n`);
                            closeText();
                            
                            safeEnqueue({
                                type: 'finish',
                                finishReason: 'error',
                                usage: { promptTokens: 0, completionTokens: 0 },
                            } as any);
                        }
                    } finally {
                        clearTimeout(timeoutHandle);
                        if (sessionId && sessionId !== 'undefined' && session) {
                            const updatedFreq = mapper.currentToolCallFrequency;
                            const updatedContextId = mapper.contextId || session.contextId;
                            if (updatedContextId) {
                                if (!this.contextToolFrequency.has(updatedContextId) && this.contextToolFrequency.size >= MAX_CONTEXT_CACHE) {
                                    const oldestKey = this.contextToolFrequency.keys().next().value;
                                    if (oldestKey !== undefined) this.contextToolFrequency.delete(oldestKey);
                                }
                                this.contextToolFrequency.set(updatedContextId, updatedFreq);
                            }
                            await this.sessionStore.update(sessionId, {
                                contextId: mapper.contextId || session.contextId,
                                taskId: mapper.taskId || session.taskId,
                                processedMessagesCount: options.prompt.length,
                                toolCallFrequency: updatedFreq,
                                inputRequired: lastFinishPart?.inputRequired,
                                rawState: lastFinishPart?.inputRequired ? 'input-required' : undefined,
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
                        const delta = (value as any).reasoningDelta || (value as any).delta;
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
