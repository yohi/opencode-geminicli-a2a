import crypto from 'node:crypto';
import type {
    LanguageModelV1CallOptions,
    LanguageModelV1StreamPart,
    LanguageModelV1FunctionToolCall,
    LanguageModelV1FinishReason,
    LanguageModelV1StreamResult,
    LanguageModelV1CallResult,
    LanguageModelV1TextPart,
    LanguageModelV1ToolCallPart,
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

    private client: A2AClient | null = null;
    private sessionStore: SessionStore;
    private options?: OpenCodeProviderOptions;
    /** 解決済みの実行時設定。ホットリロード時に再構築される */
    private resolvedOptions?: OpenCodeProviderOptions;
    private fallbackConfig?: FallbackConfig;
    private unregisterConfigWatcher?: () => void;

    constructor(modelId: string, options?: OpenCodeProviderOptions) {
        this.modelId = modelId;
        this.modelID = modelId;
        this.options = options;
        // 最小限の初期化。詳細は init() で設定される。
        this.sessionStore = options?.sessionStore ?? new InMemorySessionStore();
        this.init();

        if (options?.hotReload) {
            this.unregisterConfigWatcher = ConfigManager.getInstance().onChange(() => {
                Logger.info(`[Provider] Hot-reloading configuration for model ${this.modelId}`);
                this.init();
            });
        }
    }

    private init() {
        try {
            const config = resolveConfig(this.options);
            const router = config.agents ? new DefaultMultiAgentRouter(config.agents) : undefined;
            const resolved = router?.resolve(this.modelId);
            const agentConfig = resolved?.endpoint;
            const modelConfig = resolved?.config;

            const finalConfig = {
                ...config,
                host: agentConfig?.host ?? config.host,
                port: agentConfig?.port ?? config.port,
                token: agentConfig?.token ?? config.token,
                protocol: agentConfig?.protocol ?? config.protocol,
            };

            const defaultGenerationConfig = {
                ...this.options?.generationConfig,
                ...modelConfig?.options?.generationConfig,
            };

            const newClient = new A2AClient(finalConfig);
            const newSessionStore = this.options?.sessionStore ?? this.sessionStore ?? new InMemorySessionStore();
            const newFallbackConfig = resolveFallbackConfig(this.options?.fallback);

            const defaultToolMapping: Record<string, string> = {
                'docker-mcp-gateway_read_file': 'read',
                'docker-mcp-gateway_directory_tree': 'glob',
                'docker-mcp-gateway_read_multiple_files': 'read_multiple_files',
                'docker-mcp-gateway_edit_file': 'edit',
                'docker-mcp-gateway_write_file': 'write',
                'docker-mcp-gateway_search_files': 'grep',
                'docker-mcp-gateway_get_file_info': 'get_file_info',
                'run_shell_command': 'bash',
                'bash': 'bash',
                ...(finalConfig.toolMapping || {})
            };

            const newResolvedOptions: OpenCodeProviderOptions = {
                ...this.options,
                host: finalConfig.host,
                port: finalConfig.port,
                token: finalConfig.token,
                protocol: finalConfig.protocol,
                generationConfig: defaultGenerationConfig,
                sessionStore: newSessionStore,
                fallback: newFallbackConfig,
                toolMapping: defaultToolMapping,
                internalTools: finalConfig.internalTools,
            };

            // Commit all changes at once
            this.client = newClient;
            this.sessionStore = newSessionStore;
            this.fallbackConfig = newFallbackConfig;
            this.resolvedOptions = newResolvedOptions;

        } catch (err) {
            Logger.error(`ERROR IN MODEL INIT (${this.modelId}):`, err);
            // In constructor, we throw if client is not yet established.
            // In init (hot-reload), we just log and keep old state if possible.
            if (!this.client) throw err;
        }
    }

    public dispose() {
        if (this.unregisterConfigWatcher) {
            this.unregisterConfigWatcher();
        }
    }

    private createA2ARequest(options: LanguageModelV1CallOptions, session: A2ASession): A2AJsonRpcRequest {
        // NOTE: OpenCode (AI SDK) 側のツール定義 (options.mode.tools) は A2A サーバーへ送信しない。
        // A2A の設計思想「Opaque Execution」に従い、Gemini CLI は自身の内部ツール
        // (read, bash, edit 等) のみを使用する。OpenCode ツールの結果は
        // formatToolResults() によりテキスト化されてメッセージ本文に混入する。

        const mergedGenerationConfig = {
            ...this.resolvedOptions?.generationConfig,
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

        const mapOptions: MapPromptOptions = { 
            toolMapping: this.resolvedOptions?.toolMapping,
            internalTools: this.resolvedOptions?.internalTools
        };
        if (Object.keys(filteredConfig).length > 0) {
            mapOptions.generationConfig = filteredConfig;
        }
        mapOptions.modelId = this.modelId;

        const rawToolsConfig = options.mode?.type === 'regular' ? options.mode.tools : (options as any).tools;
        // Do NOT pass rawToolsConfig to mapOptions.tools. OpenCode dynamically loads humongous tools
        // like Terraform docs which immediately block A2A with '413 Payload Too Large'.
        // Let the invisible A2A tools stay hidden.

        if (session.contextId) {
            mapOptions.contextId = session.contextId;
        }
        if (session.processedMessagesCount !== undefined) {
            mapOptions.processedMessagesCount = session.processedMessagesCount;
        }
        if ((session.lastFinishReason === 'tool-calls' || session.rawState === 'input-required' || session.inputRequired === true) && session.taskId) {
            mapOptions.taskId = session.taskId;
        }

        return mapPromptToA2AJsonRpcRequest(options.prompt, mapOptions);
    }

    async doStream(options: LanguageModelV1CallOptions): Promise<LanguageModelV1StreamResult> {
        if (!this.client) throw new Error('A2AClient is not initialized.');

        let result: LanguageModelV1StreamResult;
        try {
            result = await this._doStreamInternal(options);
        } catch (error) {
            if (this.fallbackConfig && isQuotaError(error, this.fallbackConfig)) {
                return this._attemptFallback(options, error);
            }
            throw error;
        }

        const fallbackConfig = this.fallbackConfig;
        if (!fallbackConfig) {
            return result;
        }

        let currentReader = result.stream.getReader();
        let fallbackAttempted = false;
        let streamStartEmitted = false;
        const self = this;

        const proxyStream = new ReadableStream<any>({
            async pull(controller) {
                while (true) {
                    try {
                        const { done, value } = await currentReader.read();
                        if (done) {
                            controller.close();
                            return;
                        }

                        if (value?.type === 'stream-start') {
                            if (streamStartEmitted) continue;
                            streamStartEmitted = true;
                        }

                        controller.enqueue(value);
                        return;
                    } catch (error) {
                        if (!fallbackAttempted && isQuotaError(error, fallbackConfig)) {
                            fallbackAttempted = true;
                            if (process.env['DEBUG_OPENCODE']) {
                                console.warn(`[opencode-geminicli-a2a] Stream error detected. Attempting fallback...`);
                            }
                            try {
                                const fallbackResult = await self._attemptFallback(options, error);
                                currentReader.releaseLock();
                                currentReader = fallbackResult.stream.getReader();
                                continue;
                            } catch (fallbackError) {
                                controller.error(fallbackError);
                                return;
                            }
                        } else {
                            controller.error(error);
                            return;
                        }
                    }
                }
            },
            cancel(reason) {
                currentReader.cancel(reason);
            }
        });

        return {
            ...result,
            stream: proxyStream,
        };
    }

    private async _attemptFallback(
        callOptions: LanguageModelV1CallOptions,
        originalError: unknown,
    ): Promise<LanguageModelV1StreamResult> {
        if (!this.fallbackConfig) throw originalError;

        const fallbackCount = (callOptions as any)._fallbackCount ?? 0;
        if (fallbackCount >= 3) {
            throw originalError;
        }

        const nextModelId = getNextFallbackModel(this.modelId, this.fallbackConfig);
        if (!nextModelId) {
            throw originalError;
        }

        if (process.env['DEBUG_OPENCODE']) {
            console.warn(`[opencode-geminicli-a2a] Falling back from ${this.modelId} to ${nextModelId} (level ${fallbackCount + 1})`);
        }

        const fallbackProvider = new OpenCodeGeminiA2AProvider(nextModelId, {
            ...this.options,
            hotReload: false, // フォールバックインスタンスはホットリロードを監視しない
        });
        return fallbackProvider.doStream({
            ...callOptions,
            _fallbackCount: fallbackCount + 1
        } as any);
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
            delete session.inputRequired;
            delete session.rawState;
        }

        const request = this.createA2ARequest(options, session);
        const idempotencyKey = (options.providerMetadata?.opencode?.idempotencyKey as string) || undefined;

        let responseStream;
        let headers;
        try {
            const response = await this.client!.chatStream({ request, idempotencyKey, abortSignal: options.abortSignal });
            responseStream = response.stream;
            headers = response.headers;
        } catch (error) {
            if (sessionId) await this.sessionStore.update(sessionId, { lastFinishReason: undefined });
            throw error;
        }

        const rawToolsInput = options.mode?.type === 'regular' ? options.mode.tools : (options as any).tools;
        const clientTools = Array.isArray(rawToolsInput)
            ? rawToolsInput.map((t: any) => t.name || t.id || t.function?.name || t.type).filter(Boolean) as string[]
            : (rawToolsInput && typeof rawToolsInput === 'object' ? Object.keys(rawToolsInput) : undefined);

        const mapper = new A2AStreamMapper({
            toolMapping: this.resolvedOptions?.toolMapping,
            internalTools: this.resolvedOptions?.internalTools,
            clientTools
        });
        let textPartCounter = 0;
        let reasoningPartCounter = 0;
        let activeTextId: string | undefined;

        const stream = new ReadableStream<any>({
            start: async (controller) => {
                let currentRequest = request;
                let autoConfirmCount = 0;
                let toolCallConfirmCount = 0;
                const MAX_AUTO_CONFIRM = 50;          // internal-tool-call 用 (codebase_investigator 等の長時間実行エージェント対応のため拡大)
                const MAX_TOOL_CONFIRM = 1;           // tool-call-confirmation 用 (invalid ツールのリトライループ防止)

                let firstResponse: any = { stream: responseStream, headers: headers || {} };
                let lastFinishPart: ExtendedFinishPart | undefined;

                try {
                    controller.enqueue({ type: 'stream-start' });

                    while (autoConfirmCount < MAX_AUTO_CONFIRM) {
                        let hasFinished = false;
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
                                            // OpenCode は内部的に tool-input-start を受けてツールを pending 登録し、
                                            // その後の tool-call パーツ（またはストリームの完了）を受けて running 状態に遷移させる。
                                            // ID が不一致だと登録済みのツールを更新できず、未完了のまま終了したとみなされて abort される。
                                            const toolId = part.toolCallId;
                                            
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

                                            // 状態を 'running' に遷移させるために tool-call パーツも送出する。
                                            // V2/V3 両方の SDK が理解できるようにプロパティを重複させておく。
                                            controller.enqueue({
                                                type: 'tool-call',
                                                toolCallType: 'function',
                                                toolCallId: part.toolCallId,
                                                toolName: part.toolName,
                                                args: part.args,
                                                input: part.args, // V3 compatible
                                            } as LanguageModelV1StreamPart);
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

                        if (isAutoConfirmTarget(lastFinishPart) && mapper.taskId) {
                            const isToolConfirm = lastFinishPart?.coderAgentKind === 'tool-call-confirmation';

                            if (isToolConfirm) {
                                toolCallConfirmCount++;
                                if (toolCallConfirmCount > MAX_TOOL_CONFIRM) {
                                    // invalid なツール（read_file 等）によるループを検知。
                                    // これ以上 "Proceed" を送るとループするため、finish を emit して終了する。
                                    Logger.warn(`[auto-confirm] tool-call-confirmation が ${toolCallConfirmCount} 回発生。ループの可能性があるため中断します。`);
                                    controller.enqueue({
                                        type: 'finish',
                                        finishReason: 'stop',
                                        usage: {
                                            promptTokens: lastFinishPart.usage.inputTokens.total,
                                            completionTokens: lastFinishPart.usage.outputTokens.total,
                                        },
                                        finishReasonV3: { unified: 'stop' as any, raw: 'tool-confirm-loop-detected' },
                                    } as any);
                                    break;
                                }
                            } else {
                                autoConfirmCount++;
                                if (autoConfirmCount >= MAX_AUTO_CONFIRM) {
                                    break;
                                }
                            }

                            currentRequest = buildConfirmationRequest(mapper.taskId, this.modelId);
                            continue;
                        }
                        break;
                    }

                    if (sessionId) {
                        await this.sessionStore.update(sessionId, {
                            contextId: mapper.contextId || session.contextId,
                            taskId: mapper.taskId || session.taskId,
                            lastFinishReason: mapper.lastFinishReason || lastFinishPart?.finishReason,
                            processedMessagesCount: options.prompt.length,
                            inputRequired: lastFinishPart?.inputRequired,
                            rawState: lastFinishPart?.rawState
                        });
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

    async doGenerate(options: LanguageModelV1CallOptions): Promise<LanguageModelV1CallResult> {
        const { stream: sdkStream, rawCall, rawResponse, request, warnings } = await this.doStream(options);
        const reader = sdkStream.getReader();
        let text = '';
        let reasoning = '';
        const toolCalls: LanguageModelV1FunctionToolCall[] = [];
        const content: (LanguageModelV1TextPart | LanguageModelV1ToolCallPart)[] = [];
        let finishReason: LanguageModelV1FinishReason = 'other';
        const usage = { promptTokens: 0, completionTokens: 0 };
        let providerMetadata: Record<string, any> = {};
        let inputRequired: boolean | undefined;
        let rawState: string | undefined;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                switch (value.type) {
                    case 'text-delta':
                        text += value.delta;
                        if (content.length > 0 && content[content.length - 1].type === 'text') {
                            (content[content.length - 1] as LanguageModelV1TextPart).text += value.delta;
                        } else {
                            content.push({ type: 'text', text: value.delta });
                        }
                        break;
                    case 'reasoning-delta':
                        reasoning += value.delta;
                        break;
                    case 'tool-call':
                        toolCalls.push({ toolCallType: 'function', toolCallId: value.toolCallId, toolName: value.toolName, args: value.args });
                        content.push({ type: 'tool-call', toolCallId: value.toolCallId, toolName: value.toolName, args: value.args });
                        break;
                    case 'finish':
                        finishReason = value.finishReason;
                        if (value.usage) {
                            usage.promptTokens = value.usage.promptTokens ?? 0;
                            usage.completionTokens = value.usage.completionTokens ?? 0;
                        }
                        if (value.providerMetadata) {
                            providerMetadata = { ...providerMetadata, ...value.providerMetadata };
                        }
                        // V3 compatibility fields often passed in finish part by this provider
                        if ('inputRequired' in value) inputRequired = (value as any).inputRequired;
                        if ('rawState' in value) rawState = (value as any).rawState;
                        break;
                }
            }
        } finally {
            reader.releaseLock();
        }

        if (inputRequired !== undefined) providerMetadata.inputRequired = inputRequired;
        if (rawState !== undefined) providerMetadata.rawState = rawState;

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
            providerMetadata: Object.keys(providerMetadata).length > 0 ? providerMetadata : undefined,
        };
    }
}
