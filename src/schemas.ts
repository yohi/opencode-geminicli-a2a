import { z } from 'zod';

// 1. Configuration Schema
export const ConfigSchema = z.object({
    host: z.string().default('127.0.0.1'),
    port: z.number().int().default(41242),
    token: z.string().optional(),
});

export type A2AConfig = z.infer<typeof ConfigSchema>;

// 2. A2A Request Schema (to Gemini CLI)
export const A2ARequestSchema = z.object({
    model: z.string(),
    messages: z.array(
        z.object({
            role: z.enum(['user', 'assistant', 'system']),
            content: z.string(),
        })
    ),
    tools: z
        .array(
            z.object({
                type: z.string(),
                function: z
                    .object({
                        name: z.string(),
                        description: z.string().optional(),
                        parameters: z.unknown().optional(),
                    })
                    .passthrough()
                    .optional(),
            }).passthrough()
        )
        .optional(),
    stream: z.literal(true),
});

export type A2ARequest = z.infer<typeof A2ARequestSchema>;

// 3. A2A Response Chunk Schema (from Gemini CLI)
export const A2AResponseChunkSchema = z.object({
    id: z.string(),
    choices: z.array(
        z.object({
            delta: z.object({
                content: z.string().optional(),
                tool_calls: z
                    .array(
                        z.object({
                            id: z.string().optional(),
                            type: z.string().optional(),
                            function: z
                                .object({
                                    name: z.string().optional(),
                                    arguments: z.string().optional(),
                                })
                                .passthrough()
                                .optional(),
                        }).passthrough()
                    )
                    .optional(),
            }),
            finish_reason: z.string().nullable(),
        })
    ),
});

export type A2AResponseChunk = z.infer<typeof A2AResponseChunkSchema>;
