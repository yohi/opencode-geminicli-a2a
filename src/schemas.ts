import { z } from 'zod';

// 1. Configuration Schema (Stable)
export const ConfigSchema = z.object({
    host: z.string().default('127.0.0.1'),
    port: z.number().int().min(1).max(65535).default(41242),
    token: z.string().optional(),
    protocol: z.enum(['http', 'https']).default('http'),
});

export type A2AConfig = z.infer<typeof ConfigSchema>;

// Agent Endpoint Schema (Phase 5-D)
export const AgentEndpointSchema = ConfigSchema.extend({
    key: z.string().min(1),
    models: z.array(z.string()).default([]),
});

export type AgentEndpoint = z.infer<typeof AgentEndpointSchema>;

// 2. A2A JSON-RPC Request Schema
export const ToolSchema = z.object({}).passthrough();
export type Tool = z.infer<typeof ToolSchema>;

export const A2AJsonRpcRequestSchema = z.object({
    jsonrpc: z.literal('2.0'),
    id: z.union([z.string(), z.number(), z.null()]),
    method: z.literal('message/stream'),
    params: z.object({
        message: z.object({
            messageId: z.string(),
            role: z.enum(['user', 'assistant']),
            parts: z.array(z.discriminatedUnion('kind', [
                z.object({
                    kind: z.literal('text'),
                    text: z.string()
                }),
                z.object({
                    kind: z.literal('file'),
                    file: z.object({
                        name: z.string().optional(),
                        mimeType: z.string().optional(),
                        fileWithBytes: z.string().optional(),
                        uri: z.string().optional()
                    }).passthrough().refine(
                        (obj: Record<string, any>) => Boolean(obj.fileWithBytes) || Boolean(obj.uri),
                        { message: 'file must contain at least one of fileWithBytes, or uri' }
                    )
                }),
                z.object({
                    kind: z.literal('image'),
                    image: z.object({
                        mimeType: z.string().optional(),
                        bytes: z.string().optional(),
                        uri: z.string().optional()
                    }).passthrough().refine(
                        (obj: Record<string, any>) => Boolean(obj.bytes) || Boolean(obj.uri),
                        { message: 'image must contain at least one of bytes, or uri' }
                    )
                })
            ])),
        }),
        configuration: z.object({
            blocking: z.boolean().default(false),
            tools: z.array(ToolSchema).optional()
        }).optional(),
        // dynamic model: リクエスト単位でモデルIDを指定（サーバー起動時のデフォルトを上書き）
        model: z.string().optional(),
        // multi-turn: コンテキスト継続時に使用
        contextId: z.string().optional(),
        // multi-turn: 既存タスクの継続時に使用
        taskId: z.string().optional(),
    })
});

export type A2AJsonRpcRequest = z.infer<typeof A2AJsonRpcRequestSchema>;

// 3. A2A JSON-RPC Response Result Schema
export const STATUS_STATES = ['submitted', 'queued', 'working', 'stop', 'error', 'input-required', 'completed', 'failed', 'tool_calls', 'cancelled', 'timeout', 'aborted', 'length', 'max_tokens', 'content_filter', 'blocked'] as const;

export const metadataSchema = z.object({
    coderAgent: z.object({
        kind: z.string()
    }).optional()
}).passthrough().optional();

export const A2AResponseResultSchema = z.discriminatedUnion('kind', [
    z.object({
        kind: z.literal('task'),
        id: z.string(),
        contextId: z.string(),
        status: z.object({ state: z.enum(STATUS_STATES) }),
        history: z.array(z.any()).optional(),
        metadata: metadataSchema,
        artifacts: z.array(z.any()).optional(),
    }),
    z.object({
        kind: z.literal('status-update'),
        taskId: z.string(),
        contextId: z.string().optional(),
        status: z.object({
            state: z.enum(STATUS_STATES),
            message: z.object({
                parts: z.array(z.object({
                    kind: z.string(),
                    text: z.string().optional(),
                    data: z.unknown().optional(),
                    // マルチモーダル対応: A2A レスポンス内の画像パーツ
                    image: z.object({
                        mimeType: z.string().optional(),
                        bytes: z.string().optional(),
                        uri: z.string().optional()
                    }).optional(),
                    // マルチモーダル対応: A2A レスポンス内のファイルパーツ
                    file: z.object({
                        name: z.string().optional(),
                        mimeType: z.string().optional(),
                        fileWithBytes: z.string().optional(),
                        uri: z.string().optional()
                    }).optional(),
                }))
            }).optional(),
            timestamp: z.string().optional()
        }),
        final: z.boolean().optional(),
        metadata: metadataSchema,
        usage: z.object({
            promptTokens: z.number().optional(),
            completionTokens: z.number().optional()
        }).optional(),
    })
]);

export type A2AResponseResult = z.infer<typeof A2AResponseResultSchema>;

// 4. A2A JSON-RPC Response Wrapper
export const ResultResponseSchema = z.object({
    jsonrpc: z.literal('2.0'),
    id: z.union([z.string(), z.number(), z.null()]),
    result: A2AResponseResultSchema,
    error: z.undefined().optional(),
}).passthrough();

export const ErrorResponseSchema = z.object({
    jsonrpc: z.literal('2.0'),
    id: z.union([z.string(), z.number(), z.null()]),
    error: z.object({
        code: z.number(),
        message: z.string(),
        data: z.unknown().optional()
    }),
    result: z.undefined().optional()
}).passthrough();


export const RpcResponseSchema = z.union([ResultResponseSchema, ErrorResponseSchema]);

export const A2AJsonRpcResponseSchema = RpcResponseSchema;

export type A2AJsonRpcResponse = z.infer<typeof A2AJsonRpcResponseSchema>;
