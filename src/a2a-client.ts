import { ofetch, FetchError } from 'ofetch';
import { APICallError } from '@ai-sdk/provider';
import type { A2AConfig, A2AJsonRpcRequest, LiteLLMProxyConfig } from './schemas';
import { Logger } from './utils/logger';
import crypto from 'node:crypto';

const RETRY_STATUS_CODES = [408, 409, 425, 429, 500, 502, 503, 504];

export interface ChatStreamOptions {
    request: A2AJsonRpcRequest;
    idempotencyKey?: string;
    abortSignal?: AbortSignal;
    traceId?: string;
}

export interface ChatStreamResponse {
    stream: ReadableStream<Uint8Array>;
    status: number;
    headers: Record<string, string>;
}

export class A2AClient {
    private config: A2AConfig & { litellmProxy?: LiteLLMProxyConfig };
    private endpoint: string;

    constructor(config: A2AConfig & { litellmProxy?: LiteLLMProxyConfig }) {
        this.config = config;
        // A2A SDK 通常、ルートまたは特定のベースパスで待機する。
        // 実情に合わせてルート (/) を指定。
        this.endpoint = config.litellmProxy?.url 
            ? (config.litellmProxy.url.endsWith('/') ? config.litellmProxy.url : `${config.litellmProxy.url}/`)
            : `${config.protocol ?? 'http'}://${config.host}:${config.port}/`;
    }

    /**
     * チャットリクエストを送信し、ストリームとレスポンスメタデータを返す
     */
    async chatStream({ request, idempotencyKey, abortSignal, traceId }: ChatStreamOptions): Promise<ChatStreamResponse> {
        const finalTraceId = traceId || crypto.randomUUID();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'x-a2a-trace-id': finalTraceId,
        };

        if (idempotencyKey) {
            headers['Idempotency-Key'] = idempotencyKey;
        }

        if (this.config.litellmProxy?.apiKey) {
            headers['Authorization'] = `Bearer ${this.config.litellmProxy.apiKey}`;
        }

        if (this.config.token && !this.config.litellmProxy) {
            const isSecure = this.endpoint.startsWith('https://');
            const normalizedHost = (this.config.host || '').replace(/^\[|\]$/g, '');
            const isLocalhost = normalizedHost === '127.0.0.1' || normalizedHost === 'localhost' || normalizedHost === '::1';
            if (isSecure || isLocalhost) {
                headers['Authorization'] = `Bearer ${this.config.token}`;
            } else {
                throw new APICallError({
                    message: 'A2AClient: Token cannot be sent over an insecure non-localhost connection.',
                    url: this.endpoint,
                    requestBodyValues: request,
                    isRetryable: false,
                });
            }
        }

        const retryCount = idempotencyKey ? 3 : 0;
        
        Logger.debug(`Request to ${this.endpoint}:`, JSON.stringify(request, null, 2));

        try {
            const response = await ofetch.raw(this.endpoint, {
                method: 'POST',
                headers,
                body: request,
                retry: retryCount,
                retryDelay: 1000,
                retryStatusCodes: RETRY_STATUS_CODES,
                signal: abortSignal,
                ignoreResponseError: true,
                responseType: 'stream',
            });

            Logger.debug(`Response status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                throw new APICallError({
                    message: `HTTP error ${response.status}: ${response.statusText}`,
                    url: this.endpoint,
                    requestBodyValues: request,
                    statusCode: response.status,
                    isRetryable: RETRY_STATUS_CODES.includes(response.status),
                });
            }

            const responseHeaders: Record<string, string> = {};
            response.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });

            return {
                stream: response._data as ReadableStream<Uint8Array>,
                status: response.status,
                headers: responseHeaders,
            };
        } catch (error) {
            if (error instanceof APICallError) {
                throw error;
            }

            let statusCode: number | undefined;
            let responseBody: string | undefined;

            if (error instanceof FetchError) {
                statusCode = error.response?.status;
                try {
                    responseBody = await error.response?.text();
                } catch (e) {
                    Logger.error(`Failed to read response body for ${error.response?.url ?? this.endpoint} (status: ${statusCode}):`, e);
                    responseBody = undefined;
                }
            }

            const isRetryableStatus = statusCode ? RETRY_STATUS_CODES.includes(statusCode) : true;

            // その他のネットワークエラー等
            throw new APICallError({
                message: error instanceof Error ? error.message : String(error),
                url: this.endpoint,
                requestBodyValues: request,
                statusCode,
                responseBody,
                cause: error,
                isRetryable: isRetryableStatus,
            });
        }
    }
}
