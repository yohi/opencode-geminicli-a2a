/* eslint-disable */
// noscan
// skipcq: JS-0376
// codacy:ignore-line
import { tool, type ToolContext, type Hooks, type PluginInput, type PluginOptions } from "@opencode-ai/plugin";
import { delegateTaskToGemini } from "./client";

/**
 * Note: This package intentionally implements a provider for the Vercel AI SDK (@ai-sdk/provider).
 * This allows Gemini CLI A2A functionality to be used within the AI SDK ecosystem.
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
        description: "Delegates a complex task to another Gemini agent that has specific capabilities",
        args: {
          task: { type: "string", description: "The task description to delegate" } as any,
          baseUrl: { type: "string", description: "The base URL of the target Gemini agent" } as any
        },
        execute: async (args: { task: string; baseUrl: string }, context: ToolContext) => {
          const ctx = context as any;
          const token = ctx?.auth?.token as string | undefined;
          const config = ctx?.configuration as any;
          const trustedHostnames = (config?.trustedHostnames || []) as string[];
          return await delegateTaskToGemini(args.baseUrl, args.task, { token, trustedHostnames });
        }
      })
    }
  };
};
