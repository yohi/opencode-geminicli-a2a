import { Plugin, tool } from "@opencode-ai/plugin";
import { delegateTaskToGemini, sendA2AMessage } from "./client";
import type { 
  LanguageModelV3, 
  LanguageModelV3CallOptions, 
  LanguageModelV3GenerateResult, 
  LanguageModelV3StreamResult,
  LanguageModelV3StreamPart,
  LanguageModelV3Usage,
  LanguageModelV3FinishReason
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

  console.error(`[A2A] Plugin initialized with baseUrl: ${baseUrl}`);

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
}

const emptyUsage: LanguageModelV3Usage = {
  inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 0, text: 0, reasoning: 0 }
};

const stopFinishReason: LanguageModelV3FinishReason = {
  unified: "stop",
  raw: "stop"
};

/**
 * AI SDK Provider implementation
 */
export const createGeminiA2a = (options: GeminiA2aOptions = {}) => {
  const protocol = options.protocol || "http";
  const host = options.host || "localhost";
  const port = options.port || 8080;
  const baseUrl = options.baseUrl || `${protocol}://${host}:${port}`;
  const token = options.token;

  console.error(`[A2A] Provider initialized with baseUrl: ${baseUrl}`);

  return {
    languageModel: (modelId: string): LanguageModelV3 => ({
      specificationVersion: "v3",
      provider: "gemini-a2a",
      modelId,
      supportedUrls: {},
      async doGenerate(params: LanguageModelV3CallOptions): Promise<LanguageModelV3GenerateResult> {
        const prompt = params.prompt.map(p => {
          if (p.role === "user") {
            return p.content.map(c => {
              if (c.type === "text") return c.text;
              return "";
            }).join("");
          }
          return "";
        }).join("\n");

        const result = await delegateTaskToGemini(baseUrl, prompt, { 
          token,
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
      async doStream(params: LanguageModelV3CallOptions): Promise<LanguageModelV3StreamResult> {
        const prompt = params.prompt.map(p => {
          if (p.role === "user") {
            return p.content.map(c => {
              if (c.type === "text") return c.text;
              return "";
            }).join("");
          }
          return "";
        }).join("\n");

        const stream = new ReadableStream<LanguageModelV3StreamPart>({
          async start(controller) {
            try {
              const streamId = "a2a-stream-" + Date.now();
              const request: SendMessageRequest = {
                message: {
                  role: "ROLE_USER",
                  parts: [{ text: prompt }]
                }
              };
              // Add metadata via type assertion to respect the underlying API expectations 
              // while keeping the code clean of 'any' where possible.
              (request as any).metadata = { 
                coderAgent: {
                  kind: "agent-settings",
                  workspacePath: process.cwd(),
                  model: modelId
                }
              };

              controller.enqueue({ type: "text-start", id: streamId });
              await sendA2AMessage(baseUrl, request, {
                token,
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
