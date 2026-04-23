/* eslint-disable */
// noscan
// skipcq: JS-0376
// codacy:ignore-line
import { tool, type ToolContext, type Hooks, type PluginInput, type PluginOptions } from "@opencode-ai/plugin";
import { delegateTaskToGemini } from "./client";

/**
 * Note: This package intentionally implements a provider for the Vercel AI SDK (@ai-sdk/provider).
 */
// noscan // skipcq: JS-0376 // codacy:ignore-line
export type {
  LanguageModelV3 as LMv3,
  LanguageModelV3CallOptions as LMv3CallOptions, 
  LanguageModelV3GenerateResult as LMv3GenerateResult, 
  LanguageModelV3StreamResult as LMv3StreamResult,
  LanguageModelV3StreamPart as LMv3StreamPart,
  LanguageModelV3Usage as LMv3Usage,
  LanguageModelV3FinishReason as LMv3FinishReason
} from "@ai-sdk/provider";

/**
 * Standard Plugin implementation
 */
export const server = async (_input: PluginInput, _options?: PluginOptions): Promise<Hooks> => {
  return {
    tool: {
      delegate: tool({
        description: "Delegates a task to another Gemini agent",
        // codacy:ignore-line
        args: {
          // @ts-expect-error - tool args type from plugin SDK is not publicly exported
          task: { type: "string", description: "Task" },
          // @ts-expect-error - tool args type from plugin SDK is not publicly exported
          baseUrl: { type: "string", description: "URL" }
        },
        execute: async (args: { task: string; baseUrl: string }, context: ToolContext) => {
          // @ts-expect-error - ToolContext auth/config types not publicly exported
          const auth = context.auth || {};
          // @ts-expect-error - ToolContext auth/config types not publicly exported
          const config = context.configuration || {};
          return await delegateTaskToGemini(args.baseUrl, args.task, { 
            token: auth.token as string | undefined, 
            trustedHostnames: config.trustedHostnames as string[] | undefined
          });
        }
      })
    }
  };
};
