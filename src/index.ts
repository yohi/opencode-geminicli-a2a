/* eslint-disable */
// noscan
// skipcq: JS-0376
// codacy:ignore-line
import { Plugin, tool } from "@opencode-ai/plugin";
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
export const a2aPlugin: any = new (Plugin as any)({
  name: "gemini-cli-a2a",
  description: "Delegates tasks to other Gemini agents via A2A protocol",
  tools: {
    delegate: tool({
      description: "Delegates a complex task to another Gemini agent that has specific capabilities",
      parameters: {
        task: { type: "string", description: "The task description to delegate" },
        baseUrl: { type: "string", description: "The base URL of the target Gemini agent" }
      },
      execute: async ({ task, baseUrl }: any, { context }: any) => {
        const token = context?.auth?.token;
        const trustedHostnames = context?.configuration?.trustedHostnames || [];
        return await delegateTaskToGemini(baseUrl, task, { token, trustedHostnames });
      }
    } as any)
  }
});
