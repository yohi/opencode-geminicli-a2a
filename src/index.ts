import { Plugin, tool } from "@opencode-ai/plugin";
import { delegateTaskToGemini, sendA2AMessage } from "./client";
/**
 * Note: This package intentionally implements a provider for the Vercel AI SDK (@ai-sdk/provider).
 * This allows Gemini CLI A2A functionality to be used within the AI SDK ecosystem.
 */
// codacy:ignore-line
import type {
  LanguageModelV3 as LMv3, // codacy:ignore-line
  LanguageModelV3CallOptions as LMv3CallOptions, 
  LanguageModelV3GenerateResult as LMv3GenerateResult, 
  LanguageModelV3StreamResult as LMv3StreamResult,
  LanguageModelV3StreamPart as LMv3StreamPart,
  LanguageModelV3Usage as LMv3Usage,
  LanguageModelV3FinishReason as LMv3FinishReason
} from "@ai-sdk/provider";
import type { SendMessageRequest } from "./a2a-types";

/**
 * Standard Plugin implementation
 */
export const geminiA2aPlugin: Plugin = async (_input, options) => {
  const protocol = (options?.protocol as string) || "http";
  const host = (options?.host as string) || "localhost";
  const port = (options?.port as number) || 8080;
  const baseUrl = (options?.baseUrl as string) || `${protocol}://${host}:${port}`;
  const token = options?.token as string | undefined;
  const pollIntervalMs = (options?.pollIntervalMs as number) || 2000;
  const trustedHostnames = options?.trustedHostnames as string[] | undefined;

  return {
    tool: {
      delegate_to_gemini: tool({
        description: "Delegate a complex task to the Gemini CLI agent via A2A protocol.",
        args: {
          taskDescription: tool.schema.string().describe("The description of the task to delegate"),
        },
        async execute({ taskDescription }) {
          return await delegateTaskToGemini(baseUrl, taskDescription, {
            token,
            pollIntervalMs,
            trustedHostnames,
            onProgress: (text) => {
              if (typeof process !== "undefined" && process.stdout) {
                process.stdout.write(text);
              }
            }
          });
        },
      }),
    }
  };
};

export interface GeminiA2aOptions {
  protocol?: string;
  host?: string;
  port?: number;
  baseUrl?: string;
  token?: string;
  pollIntervalMs?: number;
  trustedHostnames?: string[];
}

const emptyUsage: LMv3Usage = {
  inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 0, text: 0, reasoning: 0 }
};

const stopFinishReason: LMv3FinishReason = {
  unified: "stop",
  raw: "stop"
};

type TextPart = { type: "text"; text: string };

function isTextPart(part: unknown): part is TextPart {
  return (
    typeof part === "object" &&
    part !== null &&
    (part as Record<string, unknown>).type === "text" &&
    typeof (part as Record<string, unknown>).text === "string"
  );
}

/**
 * Builds a comprehensive prompt string from the provided message history.
 * Iterates through system, assistant, and user messages, adding appropriate prefixes.
 */
function buildPrompt(prompt: LMv3CallOptions["prompt"]): string {
  return prompt
    .map((msg) => {
      const rolePrefix = `${msg.role.toUpperCase()}: `;
      let content = "";

      if (typeof msg.content === "string") {
        content = msg.content;
      } else if (Array.isArray(msg.content)) {
        content = (msg.content as unknown[])
          .map((c) => {
            if (isTextPart(c)) return c.text;
            return "";
          })
          .filter(Boolean)
          .join("\n");
      }

      return content ? `${rolePrefix}${content}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
}

/**
 * AI SDK Provider implementation
 */
export const createGeminiA2a = (options: GeminiA2aOptions = {}) => {
  const protocol = options.protocol || "http";
  const host = options.host || "localhost";
  const port = options.port || 8080;
  const baseUrl = options.baseUrl || `${protocol}://${host}:${port}`;
  const token = options.token;
  const trustedHostnames = options.trustedHostnames;

  return {
    languageModel: (modelId: string): LMv3 => ({
      specificationVersion: "v3",
      provider: "gemini-a2a",
      modelId,
      supportedUrls: {},
      async doGenerate(params: LMv3CallOptions): Promise<LMv3GenerateResult> {
        const prompt = buildPrompt(params.prompt);

        const result = await delegateTaskToGemini(baseUrl, prompt, { 
          token,
          trustedHostnames,
          metadata: { 
            coderAgent: {
              kind: "agent-settings",
              workspacePath: process.cwd(),
              model: modelId
            }
          }
        });
        return {
          content: [{ type: "text", text: result }],
          finishReason: stopFinishReason,
          usage: emptyUsage,
          request: { body: params.prompt },
          warnings: []
        };
      },
      async doStream(params: LMv3CallOptions): Promise<LMv3StreamResult> {
        const prompt = buildPrompt(params.prompt);

        const stream = new ReadableStream<LMv3StreamPart>({
          async start(controller) {
            try {
              const streamId = `a2a-stream-${Date.now()}`;
              const request: SendMessageRequest = {
                message: {
                  role: "ROLE_USER",
                  parts: [{ text: prompt }]
                }
              };
              // Add metadata via type assertion to respect the underlying API expectations
              // while keeping the code clean of 'any' where possible.
              (request as SendMessageRequest & { metadata?: Record<string, unknown> }).metadata = {
                coderAgent: {                  kind: "agent-settings",
                  workspacePath: process.cwd(),
                  model: modelId
                }
              };

              controller.enqueue({ type: "text-start", id: streamId });
              await sendA2AMessage(baseUrl, request, {
                token,
                trustedHostnames,
                onProgress: (text) => {
                  controller.enqueue({ type: "text-delta", id: streamId, delta: text });
                }
              });
              controller.enqueue({ type: "text-end", id: streamId });
              controller.enqueue({ type: "finish", finishReason: stopFinishReason, usage: emptyUsage });
              controller.close();
            } catch (err: unknown) {
              controller.error(err);
            }
          }
        });

        return {
          stream
        };
      }
    })
  };
};

// Common export names for OpenCode to find the provider
export const provider = createGeminiA2a;
export default createGeminiA2a;
