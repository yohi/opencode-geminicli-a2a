import type {
    LanguageModelV1CallOptions,
    LanguageModelV1StreamPart,
    LanguageModelV1FunctionToolCall,
    LanguageModelV1FinishReason,
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


export class OpenCodeGeminiA2AProvider {
    readonly specificationVersion = 'v2' as const;
    readonly provider = 'opencode-geminicli-a2a';
    readonly providerId = 'opencode-geminicli-a2a';
    readonly providerID = 'opencode-geminicli-a2a';
    readonly id = 'opencode-geminicli-a2a'; // プロバイダーとしてのID
    readonly name = 'Gemini CLI (A2A)';
    readonly defaultObjectGenerationMode = undefined;
    readonly modelId: string;
    readonly modelID: string;

    private client: A2AClient;
    private sessionStore: SessionStore;
    private options?: OpenCodeProviderOptions;
    private fallbackConfig?: FallbackConfig;

    /**
     * @note 複数プロセス・複数インスタンス・サーバーレス環境でのデプロイ時は、
     * デフォルトの InMemorySessionStore ではなく外部共有ストレージ実装を
     * OpenCodeProviderOptions.sessionStore に渡す必要があります。
     * 例: `new OpenCodeGeminiA2AProvider(modelId, { sessionStore: myRedisStore })`
     */
    constructor(modelId: string, options?: OpenCodeProviderOptions) {
        try {
            if (process.env['DEBUG_OPENCODE']) {
                console.log(`[opencode-geminicli-a2a] Initializing model: ${modelId}`);
            }
            this.modelId = modelId;
            this.modelID = modelId;
            this.options = options;
            const config = resolveConfig(options);
            
            let finalConfig: A2AConfig = config;
            if (options?.agents && options.agents.length > 0) {
                const router = new DefaultMultiAgentRouter(options.agents);
                const endpoint = router.resolve(modelId);
                if (endpoint) {
                    if (process.env['DEBUG_OPENCODE']) {
                        console.log(`[opencode-geminicli-a2a] Routing model '${modelId}' to endpoint '${endpoint.key}' (${endpoint.host}:${endpoint.port})`);
                    }

                    const endpointProtocol = endpoint.protocol || config.protocol || 'http';
                    const configProtocol = config.protocol || 'http';
                    const endpointOrigin = `${endpointProtocol}://${endpoint.host}:${endpoint.port}`;
                    const configOrigin = `${configProtocol}://${config.host}:${config.port}`;
                    
                    const token = endpoint.token !== undefined 
                        ? endpoint.token 
                        : (endpointOrigin === configOrigin ? config.token : undefined);

                    finalConfig = {
                        host: endpoint.host,
                        port: endpoint.port,
                        token: token,
                        protocol: endpointProtocol as 'http' | 'https'
                    };
                }
            }

            this.client = new A2AClient(finalConfig);
            this.sessionStore = options?.sessionStore ?? new InMemorySessionStore();
            this.fallbackConfig = resolveFallbackConfig(options?.fallback);

            this.options = {
                ...options,
                host: finalConfig.host,
                port: finalConfig.port,
                token: finalConfig.token,
                protocol: finalConfig.protocol,
                sessionStore: this.sessionStore,
                fallback: this.fallbackConfig,
            };
        } catch (err) {
            console.error(`[opencode-geminicli-error] ERROR IN MODEL CONSTRUCTOR (${modelId}):`, err);
            throw err;
        }
    }

    private createA2ARequest(options: LanguageModelV1CallOptions, session: A2ASession): A2AJsonRpcRequest {
        let tools: any[] | undefined;
        if (options.mode && 'tools' in options.mode && options.mode.tools?.length) {
            tools = options.mode.tools;
        }

        const mapOptions: MapPromptOptions = { tools };

        // リクエスト単位でモデルIDを指定（A2Aサーバーの動的モデル変更をサポート）
        mapOptions.modelId = this.modelId;

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
     * sessionId は providerMetadata から取得されます。
     * 並行リクエスト時の状態の競合を避けるため、呼び出し元は必ず一意の sessionId を指定してください。
     */
    async doStream(options: LanguageModelV1CallOptions) {
        let result: any;
        try {
            result = await this._doStreamInternal(options);
        } catch (error) {
            // フォールバック判定: クォータエラーの場合に別モデルで再試行
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

                        // stream-start の重複送信を防ぐ
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
                                console.warn(`[opencode-geminicli-a2a] Stream error detected over A2A. Attempting fallback...`);
                            }
                            try {
                                const fallbackResult = await self._attemptFallback(options, error);
                                currentReader.releaseLock();
                                currentReader = fallbackResult.stream.getReader();
                                continue; // 新しいリーダーから読み取りを試行する
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

    /**
     * フォールバック試行。クォータエラー発生時に代替モデルで doStream をリトライする。
     * Phase 1: 同一サーバーに別モデルIDで再試行（A2A サーバーの制約上、効果は限定的）
     * Phase 2 (5-D 後): MultiAgentRouter 経由で別サーバーへルーティング
     */
    private async _attemptFallback(
        callOptions: LanguageModelV1CallOptions,
        originalError: unknown,
    ) {
        if (!this.fallbackConfig) throw originalError;

        const maxRetries = this.fallbackConfig.maxRetries ?? 2;
        let currentModelId = this.modelId;
        let lastError = originalError;

        for (let i = 0; i < maxRetries; i++) {
            const nextModelId = getNextFallbackModel(currentModelId, this.fallbackConfig);
            if (!nextModelId) {
                if (process.env['DEBUG_OPENCODE']) {
                    console.warn(`[opencode-geminicli-a2a] No more fallback models available after '${currentModelId}'.`);
                }
                break;
            }

            if (process.env['DEBUG_OPENCODE']) {
                console.warn(`[opencode-geminicli-a2a] Quota error on model '${currentModelId}'. Falling back to '${nextModelId}'.`);
            }

            try {
                // フォールバック先のモデルで新しいプロバイダーインスタンスを生成
                const fallbackProvider = new OpenCodeGeminiA2AProvider(nextModelId, {
                    ...this.options,
                    sessionStore: this.sessionStore,
                });
                const result = await fallbackProvider._doStreamInternal(callOptions);
                
                let currentReader = result.stream.getReader();
                let streamFallbackAttempted = false;
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
                            } catch (streamError) {
                                if (!streamFallbackAttempted && isQuotaError(streamError, self.fallbackConfig)) {
                                    streamFallbackAttempted = true;
                                    if (process.env['DEBUG_OPENCODE']) {
                                        console.warn(`[opencode-geminicli-a2a] Stream error on fallback model '${nextModelId}'. Attempting further fallback...`);
                                    }
                                    try {
                                        const fallbackResult = await fallbackProvider._attemptFallback(callOptions, streamError);
                                        currentReader.releaseLock();
                                        currentReader = fallbackResult.stream.getReader();
                                        continue;
                                    } catch (furtherError) {
                                        controller.error(furtherError);
                                        return;
                                    }
                                } else {
                                    controller.error(streamError);
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
            } catch (retryError) {
                if (isQuotaError(retryError, this.fallbackConfig)) {
                    currentModelId = nextModelId;
                    lastError = retryError;
                    continue;
                }
                // クォータエラーでない場合はそのままスロー
                throw retryError;
            }
        }

        // 全フォールバックが失敗した場合は元のエラーをスロー
        throw lastError;
    }

    /** @internal ストリーミングの内部実装 */
    private async _doStreamInternal(options: LanguageModelV1CallOptions) {
        if (process.env['DEBUG_OPENCODE']) {
            console.log('[opencode-geminicli-a2a] doStream called for model:', this.modelId);
        }
        let sessionId: string | undefined = undefined;
        const opencodeMetadata = options.providerMetadata?.opencode;

        if (opencodeMetadata?.sessionId !== undefined) {
            if (typeof opencodeMetadata.sessionId === 'string') {
                const trimmed = opencodeMetadata.sessionId.trim();
                if (trimmed !== '') {
                    sessionId = trimmed;
                } else {
                    console.warn(`[opencode-geminicli-a2a] Invalid or empty sessionId. Expected a non-empty string. Session tracking is disabled.`);
                }
            } else {
                console.warn(`[opencode-geminicli-a2a] Invalid or empty sessionId. Expected a non-empty string. Session tracking is disabled.`);
            }
        }

        const session = sessionId ? await this.sessionStore.get(sessionId) || {} : {};

        // resetContext フラグの検出: 新規チャットスレッド開始時等にコンテキストをリセット
        if (opencodeMetadata?.resetContext === true && sessionId) {
            await this.sessionStore.resetSession(sessionId);
            // リセット後はセッション情報をクリアして新規コンテキストで開始
            delete session.contextId;
            delete session.taskId;
            delete session.lastFinishReason;
            if (process.env['DEBUG_OPENCODE']) {
                const maskedId = sessionId.length > 8 ? `${sessionId.substring(0, 4)}...${sessionId.substring(sessionId.length - 4)}` : '***';
                console.log(`[opencode-geminicli-a2a] Context reset for session: ${maskedId}`);
            }
        }

        const request = this.createA2ARequest(options, session);
        const idempotencyKey = (options.providerMetadata?.opencode?.idempotencyKey as string) || undefined;

        let responseStream;
        let headers;

        try {
            const response = await this.client.chatStream({
                request,
                idempotencyKey,
                abortSignal: options.abortSignal,
            });
            responseStream = response.stream;
            headers = response.headers;
        } catch (error) {
            if (sessionId) {
                const currentSession = await this.sessionStore.get(sessionId);
                if (currentSession && Object.keys(currentSession).length > 0) {
                    await this.sessionStore.update(sessionId, { lastFinishReason: undefined });
                }
            }
            throw error;
        }

        const chunkGenerator = parseA2AStream(responseStream);
        const mapper = new A2AStreamMapper();

        // v2 ストリーム変換: v1 の LanguageModelV1StreamPart を
        // AI SDK v2 のストリームパーツ形式に変換する。
        // OpenCode は v2 形式（text-start/text-delta(delta,id)/text-end 等）を要求。
        let textPartCounter = 0;
        let reasoningPartCounter = 0;
        let activeTextId: string | undefined;
        let toolCallCounter = 0;

        const stream = new ReadableStream<any>({
            start: async (controller) => {
                let currentRequest = request;
                let autoConfirmCount = 0;
                const MAX_AUTO_CONFIRM = 10;
                let firstResponse: { stream: any, headers: Record<string, string> } | undefined = { stream: responseStream, headers: headers || {} };

                try {
                    // stream-start を送信
                    controller.enqueue({ type: 'stream-start' });

                    while (autoConfirmCount < MAX_AUTO_CONFIRM) {
                        let hasFinished = false;
                        let lastFinishPart: ExtendedFinishPart | undefined;
                        
                        let response;
                        if (firstResponse) {
                            response = firstResponse;
                            firstResponse = undefined;
                        } else {
                            response = await this.client.chatStream({
                                request: currentRequest,
                                idempotencyKey: undefined,
                                abortSignal: options.abortSignal,
                            });
                        }

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
                                            controller.enqueue({
                                                type: 'text-delta',
                                                id: activeTextId,
                                                delta: part.textDelta,
                                            });
                                            break;
                                        }
                                        case 'reasoning': {
                                            if (activeTextId !== undefined) {
                                                controller.enqueue({ type: 'text-end', id: activeTextId });
                                                activeTextId = undefined;
                                            }
                                            const reasoningId = `reasoning-${reasoningPartCounter++}`;
                                            controller.enqueue({ type: 'reasoning-start', id: reasoningId });
                                            controller.enqueue({
                                                type: 'reasoning-delta',
                                                id: reasoningId,
                                                delta: part.textDelta,
                                            });
                                            controller.enqueue({ type: 'reasoning-end', id: reasoningId });
                                            break;
                                        }
                                        case 'tool-call': {
                                            if (activeTextId !== undefined) {
                                                controller.enqueue({ type: 'text-end', id: activeTextId });
                                                activeTextId = undefined;
                                            }
                                            const toolId = `tool-${toolCallCounter++}`;
                                            controller.enqueue({
                                                type: 'tool-input-start',
                                                id: toolId,
                                                toolCallId: part.toolCallId,
                                                toolName: part.toolName,
                                            });
                                            controller.enqueue({
                                                type: 'tool-input-delta',
                                                id: toolId,
                                                delta: part.args,
                                            });
                                            controller.enqueue({
                                                type: 'tool-input-end',
                                                id: toolId,
                                            });
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

                                            // 自動承認が必要な状態でなければ、OpenCodeに finish を流して終了判定する
                                            const isAutoConfirmTarget = finishPart.rawState === 'input-required' && 
                                                                       finishPart.coderAgentKind === 'tool-call-confirmation';
                                            
                                            if (!isAutoConfirmTarget) {
                                                controller.enqueue({
                                                    type: 'finish',
                                                    finishReason: finishPart.finishReason,
                                                    usage: finishPart.usage,
                                                    ...(finishPart.providerMetadata !== undefined ? { providerMetadata: finishPart.providerMetadata } : {}),
                                                });
                                            }
                                            break;
                                        }
                                        default:
                                            controller.enqueue(part);
                                            break;
                                    }
                                }
                            } else if ('error' in chunk && chunk.error) {
                                // エラー時は以前と同様に処理
                                const rpcError = new Error(`A2A JSON-RPC Error: [${chunk.error.code}] ${chunk.error.message}`);
                                const isQuota = isQuotaError({ code: chunk.error.code, message: chunk.error.message }, this.fallbackConfig);
                                Object.assign(rpcError, { code: chunk.error.code, id: chunk.id, ...(isQuota ? { isQuotaError: true } : {}) });
                                if (sessionId) await this.sessionStore.update(sessionId, { lastFinishReason: undefined });
                                controller.error(rpcError);
                                return;
                            }
                        }

                        if (!hasFinished) {
                            controller.error(new Error('A2A stream disconnected before sending final status-update.'));
                            return;
                        }

                        // 自動承認ロジック: 内部ツール確認中の場合は次のリクエストを自動送信
                        if (lastFinishPart?.rawState === 'input-required' && 
                            lastFinishPart?.coderAgentKind === 'tool-call-confirmation' && 
                            mapper.taskId) {
                            
                            autoConfirmCount++;
                            if (process.env['DEBUG_OPENCODE']) {
                                console.log(`[opencode-geminicli-a2a] Auto-confirming tool call (count: ${autoConfirmCount}) for taskId: ${mapper.taskId}`);
                            }
                            currentRequest = buildConfirmationRequest(mapper.taskId, this.modelId);
                            // ループ継続して次を取得
                            continue;
                        }

                        // 通常終了
                        break;
                    }

                    // テキストパーツが開いていれば閉じる
                    if (activeTextId !== undefined) {
                        controller.enqueue({ type: 'text-end', id: activeTextId });
                        activeTextId = undefined;
                    }

                    // マルチターン情報の保存
                    if (sessionId) {
                        await this.sessionStore.update(sessionId, {
                            ...(mapper.contextId !== undefined && { contextId: mapper.contextId }),
                            ...(mapper.taskId !== undefined && { taskId: mapper.taskId }),
                            lastFinishReason: mapper.lastFinishReason as any,
                        });
                    }

                    controller.close();
                } catch (error) {
                    // エラー時は lastFinishReason をリセットして、次回の taskId 送信を防ぐ
                    if (sessionId) {
                        const currentSession = await this.sessionStore.get(sessionId);
                        if (currentSession && Object.keys(currentSession).length > 0) {
                            await this.sessionStore.update(sessionId, { lastFinishReason: undefined });
                        }
                    }
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
        const files: Array<{ data: string | Uint8Array; mimeType: string }> = [];
        let finishReason: LanguageModelV1FinishReason = 'unknown';
        const usage = { promptTokens: 0, completionTokens: 0 };
        let providerMetadata: Record<string, any> | undefined;
        let inputRequired: boolean | undefined;
        let rawState: string | undefined;

        const activeToolCalls = new Map<string, { toolCallId: string; name: string; args: string }>();

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                switch (value.type) {
                    // v2 ストリームパーツ
                    case 'stream-start':
                    case 'text-start':
                    case 'text-end':
                    case 'reasoning-start':
                    case 'reasoning-end':
                        // ライフサイクルイベントはスキップ
                        break;
                    case 'text-delta':
                        text += value.delta;
                        break;
                    case 'reasoning-delta':
                        reasoning += value.delta;
                        break;
                    case 'tool-input-start':
                        activeToolCalls.set(value.id, { toolCallId: value.toolCallId, name: value.toolName, args: '' });
                        break;
                    case 'tool-input-delta':
                        if (activeToolCalls.has(value.id)) {
                            activeToolCalls.get(value.id)!.args += value.delta;
                        }
                        break;
                    case 'tool-input-end':
                        // 完了時に toolCalls に追加
                        if (activeToolCalls.has(value.id)) {
                            const call = activeToolCalls.get(value.id)!;
                            toolCalls.push({
                                toolCallType: 'function',
                                toolCallId: call.toolCallId,
                                toolName: call.name,
                                args: call.args,
                            });
                            activeToolCalls.delete(value.id);
                        }
                        break;
                    case 'finish':
                        finishReason = value.finishReason;
                        if (value.usage) {
                            usage.promptTokens = value.usage.promptTokens;
                            usage.completionTokens = value.usage.completionTokens;
                        }
                        if ('providerMetadata' in value) providerMetadata = (value as any).providerMetadata;
                        if ('inputRequired' in value) inputRequired = (value as any).inputRequired;
                        if ('rawState' in value) rawState = (value as any).rawState;
                        break;
                    case 'file': {
                        // マルチモーダルレスポンス: file パーツを蓄積
                        const filePart = value as import('./utils/mapper').FileStreamPart;
                        files.push({ data: filePart.data, mimeType: filePart.mimeType });
                        break;
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }

        return {
            text: text.length > 0 ? text : undefined,
            reasoning: reasoning.length > 0 ? reasoning : undefined,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
            files: files.length > 0 ? files : undefined,
            finishReason,
            usage,
            rawCall,
            rawResponse,
            request,
            warnings,
            ...(providerMetadata !== undefined ? { providerMetadata } : {}),
            ...(inputRequired !== undefined ? { inputRequired } : {}),
            ...(rawState !== undefined ? { rawState } : {})
        };
    }
}
