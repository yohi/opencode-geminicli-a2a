import { ofetch, FetchError } from 'ofetch';
import { APICallError } from '@ai-sdk/provider';
import type { A2AConfig, A2ARequest } from './schemas';

export interface ChatStreamOptions {
    request: A2ARequest;
    idempotencyKey?: string;
    abortSignal?: AbortSignal;
}

export interface ChatStreamResponse {
    stream: ReadableStream<Uint8Array>;
    status: number;
    headers: Record<string, string>;
}

export class A2AClient {
    private config: A2AConfig;
    private endpoint: string;

    constructor(config: A2AConfig) {
        this.config = config;
        this.endpoint = `http://${config.host}:${config.port}/v1/a2a/chat`;
    }

    /**
     * チャットリクエストを送信し、ストリームとレスポンスメタデータを返す
     */
    async chatStream({ request, idempotencyKey, abortSignal }: ChatStreamOptions): Promise<ChatStreamResponse> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (idempotencyKey) {
            headers['Idempotency-Key'] = idempotencyKey;
        }

        if (this.config.token) {
            headers['Authorization'] = `Bearer ${this.config.token}`;
        }

        const retryCount = idempotencyKey ? 3 : 0;

        try {
            const response = await ofetch.raw(this.endpoint, {
                method: 'POST',
                headers,
                body: request, // ofetch will automatically JSON.stringify if object
                retry: retryCount,
                retryDelay: 500,
                retryStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504],
                timeout: 60000,
                signal: abortSignal,
                ignoreResponseError: true,
                responseType: 'stream',
            });

            if (!response.ok) {
                throw new APICallError({
                    message: `HTTP error ${response.status}: ${response.statusText}`,
                    url: this.endpoint,
                    requestBodyValues: request,
                    statusCode: response.status,
                    isRetryable: [408, 409, 425, 429, 500, 502, 503, 504].includes(response.status),
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
                    responseBody = undefined;
                }
            }

            const isRetryableStatus = statusCode ? [408, 409, 425, 429, 500, 502, 503, 504].includes(statusCode) : true;

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
