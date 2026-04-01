import { Plugin, tool } from "@opencode-ai/plugin";
import { sendA2AMessage } from "./client";

export const geminiA2aPlugin: Plugin = async (input, options) => {
  const baseUrl = (options?.baseUrl as string) || "http://localhost:8080";
  const token = options?.token as string | undefined;

  return {
    tool: {
      delegate_to_gemini: tool({
        description: "Delegate a complex task to the Gemini CLI agent via A2A protocol.",
        args: {
          taskDescription: tool.schema.string().describe("The description of the task to delegate"),
        },
        async execute({ taskDescription }) {
          try {
            const response = await sendA2AMessage(baseUrl, {
              message: {
                role: "ROLE_USER",
                parts: [{ text: taskDescription }]
              }
            }, token, (text) => {
              process.stdout.write(text);
            });

            if (response.task && response.task.status.state === "TASK_STATE_COMPLETED") {
               const artifacts = response.task.artifacts || [];
               const resultText = artifacts.map(a => a.parts.map(p => p.text ?? "").join("")).join("\n");
               return `Task completed by Gemini agent. Result:\n${resultText}`;
            }

            if (response.task && response.task.status.state === "TASK_STATE_FAILED") {
              throw new Error(`Task failed on the Gemini agent side. Response: ${JSON.stringify(response)}`);
            }

            return `Task initiated, but returned unexpected state: ${JSON.stringify(response)}`;
          } catch (error: any) {
            throw new Error(`Error delegating task to Gemini: ${error?.message || String(error)}`);
          }
        },
      }),
    }
  };
};
