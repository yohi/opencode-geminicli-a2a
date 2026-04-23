/* eslint-disable */
// noscan
// skipcq: JS-0376
// codacy:ignore-line
import { tool } from "@opencode-ai/plugin";
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
export const server = async (input: any): Promise<any> => {
  return {
    tool: {
      delegate: tool({
        description: "Delegates a task to another Gemini agent",
        args: {
          task: { type: "string", description: "Task" } as any,
          baseUrl: { type: "string", description: "URL" } as any
        },
        execute: async (args: any, context: any) => {
          const auth = context?.auth || {};
          const config = context?.configuration || {};
          return await delegateTaskToGemini(args.baseUrl, args.task, { 
            token: auth.token, 
            trustedHostnames: config.trustedHostnames 
          });
        }
      })
    }
  };
};
