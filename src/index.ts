import { Plugin, tool } from "@opencode-ai/plugin";
import { delegateTaskToGemini, sendA2AMessage } from "./client";
import type { LanguageModelV1, LanguageModelV1StreamPart } from "@ai-sdk/provider";

/**
 * Standard Plugin implementation
 */
export const geminiA2aPlugin: Plugin = async (input, options) => {
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

/**
 * AI SDK Provider implementation
 */
export const createGeminiA2a = (options: any = {}) => {
  const protocol = options.protocol || "http";
  const host = options.host || "localhost";
  const port = options.port || 8080;
  const baseUrl = options.baseUrl || `${protocol}://${host}:${port}`;
  const token = options.token;

  console.error(`[A2A] Provider initialized with baseUrl: ${baseUrl}`);

  return {
    languageModel: (modelId: string): LanguageModelV1 => ({
      specificationVersion: "v1",
      defaultObjectGenerationMode: "json",
      modelId,
      async doGenerate(params) {
        const prompt = params.prompt.map(p => {
          if (p.role === "user") return p.content.map(c => (c as any).text || "").join("");
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
        } as any);
        return {
          text: result,
          finishReason: "stop",
          usage: { inputTokens: 0, outputTokens: 0 },
          rawCall: { rawPrompt: params.prompt, rawSettings: params.settings },
        };
      },
      async doStream(params) {
        const prompt = params.prompt.map(p => {
          if (p.role === "user") return p.content.map(c => (c as any).text || "").join("");
          return "";
        }).join("\n");

        const stream = new ReadableStream<LanguageModelV1StreamPart>({
          async start(controller) {
            try {
              await sendA2AMessage(baseUrl, {
                message: {
                  role: "ROLE_USER",
                  parts: [{ text: prompt }]
                },
                metadata: { 
                  coderAgent: {
                    kind: "agent-settings",
                    workspacePath: process.cwd(),
                    model: modelId
                  }
                } as any
              }, {
                token,
                onProgress: (text) => {
                  controller.enqueue({ type: "text-delta", textDelta: text });
                }
              });
              controller.enqueue({ type: "finish", finishReason: "stop", usage: { inputTokens: 0, outputTokens: 0 } });
              controller.close();
            } catch (err: any) {
              controller.error(err);
            }
          }
        });

        return {
          stream,
          rawCall: { rawPrompt: params.prompt, rawSettings: params.settings },
        };
      }
    })
  };
};

// Common export names for OpenCode to find the provider
export const provider = createGeminiA2a;
export default createGeminiA2a;
