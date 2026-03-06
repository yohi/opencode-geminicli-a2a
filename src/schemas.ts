import { z } from 'zod';

// 1. Configuration Schema (Stable)
export const ConfigSchema = z.object({
    host: z.string().default('127.0.0.1'),
    port: z.number().int().default(41242),
    token: z.string().optional(),
    protocol: z.enum(['http', 'https']).default('http'),
});

export type A2AConfig = z.infer<typeof ConfigSchema>;

// 2. A2A JSON-RPC Request Schema
export const ToolSchema = z.unknown();
export type Tool = z.infer<typeof ToolSchema>;

export const A2AJsonRpcRequestSchema = z.object({
    jsonrpc: z.literal('2.0'),
    id: z.union([z.string(), z.number()]),
    method: z.literal('message/stream'),
    params: z.object({
        message: z.object({
            messageId: z.string(),
            role: z.enum(['user', 'assistant']),
            parts: z.array(z.object({
                kind: z.literal('text'),
                text: z.string()
            }))
        }),
        configuration: z.object({
            blocking: z.boolean().default(false),
            tools: z.array(ToolSchema).optional()
        }).optional()
    })
});

export type A2AJsonRpcRequest = z.infer<typeof A2AJsonRpcRequestSchema>;

// 3. A2A JSON-RPC Response Result Schema
export const A2AResponseResultSchema = z.discriminatedUnion('kind', [
    z.object({
        kind: z.literal('task'),
        id: z.string(),
        contextId: z.string(),
        status: z.object({ state: z.string() }),
        history: z.array(z.any()).optional(),
        metadata: z.record(z.any()).optional(),
        artifacts: z.array(z.any()).optional(),
    }),
    z.object({
        kind: z.literal('status-update'),
        taskId: z.string(),
        contextId: z.string().optional(),
        status: z.object({
            state: z.string(),
            message: z.object({
                parts: z.array(z.object({
                    kind: z.string(),
                    text: z.string().optional(),
                    data: z.unknown().optional()
                }))
            }).optional(),
            timestamp: z.string().optional()
        }),
        final: z.boolean().optional(),
        metadata: z.record(z.any()).optional(),
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
    id: z.union([z.string(), z.number()]),
    result: A2AResponseResultSchema,
    error: z.never().optional(),
}).strict();

export const ErrorResponseSchema = z.object({
    jsonrpc: z.literal('2.0'),
    id: z.union([z.string(), z.number()]).nullable(),
    result: z.never().optional(),
    error: z.object({
        code: z.number(),
        message: z.string(),
        data: z.unknown().optional()
    })
}).strict();


export const A2AJsonRpcResponseSchema = z.union([ResultResponseSchema, ErrorResponseSchema]);

export type A2AJsonRpcResponse = z.infer<typeof A2AJsonRpcResponseSchema>;
