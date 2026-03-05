import {
    type LanguageModelV1Prompt,
    type LanguageModelV1StreamPart,
    type LanguageModelV1CallOptions,
    type LanguageModelV1FinishReason,
} from '@ai-sdk/provider';
import type { A2ARequest, A2AResponseChunk } from '../schemas';

export function mapPromptToA2AMessages(prompt: LanguageModelV1Prompt): A2ARequest['messages'] {
    const messages: A2ARequest['messages'] = [];

    for (const part of prompt) {
        let contentStr = '';

        // Simplistic mapping for now to ensure type safety.
        // In reality, images/documents need specialized handling if A2A supports them.
        if (part.role === 'system') {
            messages.push({ role: 'system', content: part.content });
        } else if (part.role === 'user') {
            for (const item of part.content) {
                if (item.type === 'text') {
                    contentStr += item.text;
                }
            }
            if (contentStr) {
                messages.push({ role: 'user', content: contentStr });
            }
        } else if (part.role === 'assistant') {
            for (const item of part.content) {
                if (item.type === 'text') {
                    contentStr += item.text;
                }
            }
            if (contentStr) {
                messages.push({ role: 'assistant', content: contentStr });
            }
        } else if (part.role === 'tool') {
            // For tool responses, map them stringified or as expected by A2A.
            // Often, provider mapping serializes tool results as user messages or specialized tool msgs.
            // Assuming naive stringification for A2A specification constraints if not specified.
            for (const item of part.content) {
                contentStr += `Tool Result [${item.toolName}]: ${JSON.stringify(item.result)}\n`;
            }
            messages.push({ role: 'user', content: contentStr });
        }
    }

    return messages;
}

export function mapTools(options: LanguageModelV1CallOptions): A2ARequest['tools'] {
    if (options.mode?.type !== 'regular' || !options.mode.tools?.length) {
        return undefined;
    }

    return options.mode.tools.map(tool => {
        return {
            type: 'function',
            function: {
                name: tool.name,
                description: tool.type === 'function' ? tool.description : undefined,
                parameters: tool.type === 'function' ? tool.parameters : undefined,
            }
        };
    });
}

export function mapA2AChunkToStreamParts(chunk: A2AResponseChunk): LanguageModelV1StreamPart[] {
    const parts: LanguageModelV1StreamPart[] = [];

    if (!chunk.choices || chunk.choices.length === 0) {
        return parts;
    }

    const choice = chunk.choices[0];

    // 1. Text Delta
    if (choice.delta.content) {
        parts.push({
            type: 'text-delta',
            textDelta: choice.delta.content,
        });
    }

    // 2. Tool Calls
    if (choice.delta.tool_calls && choice.delta.tool_calls.length > 0) {
        for (const toolCall of choice.delta.tool_calls) {
            if (toolCall.function?.name) {
                parts.push({
                    type: 'tool-call',
                    toolCallType: 'function',
                    toolCallId: toolCall.id || crypto.randomUUID(),
                    toolName: toolCall.function.name,
                    args: toolCall.function.arguments || '{}'
                });
            } else if (toolCall.function?.arguments) {
                // tool-call-delta (streaming arguments)
                parts.push({
                    type: 'tool-call-delta',
                    toolCallType: 'function',
                    toolCallId: toolCall.id || '',
                    toolName: '', // A2A chunk might omit name on subsequent delta
                    argsTextDelta: toolCall.function.arguments,
                });
            }
        }
    }

    // 3. Finish Reason
    if (choice.finish_reason) {
        let finishReason: LanguageModelV1FinishReason = 'unknown';
        switch (choice.finish_reason) {
            case 'stop': finishReason = 'stop'; break;
            case 'length': finishReason = 'length'; break;
            case 'content_filter': finishReason = 'content-filter'; break;
            case 'tool_calls': finishReason = 'tool-calls'; break;
        }

        parts.push({
            type: 'finish',
            finishReason,
            // TODO: map actual usage tokens into usage when A2A responses include them
            usage: { promptTokens: 0, completionTokens: 0 },
        });
    }

    return parts;
}
