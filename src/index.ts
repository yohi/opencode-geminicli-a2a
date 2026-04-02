import { Plugin, tool } from "@opencode-ai/plugin";
import { sendA2AMessage, subscribeToA2ATask, getA2ATask } from "./client";
import type { StreamResponse, Task } from "./a2a-types";

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
            let currentTaskId: string | null = null;
            let finalTask: Task | undefined;

            try {
              const response = await sendA2AMessage(baseUrl, {
                message: {
                  role: "ROLE_USER",
                  parts: [{ text: taskDescription }]
                }
              }, {
                token,
                onProgress: (text) => {
                  process.stdout.write(text);
                },
                onTaskId: (id) => {
                  currentTaskId = id;
                }
              });
              finalTask = response.task;
            } catch (err: any) {
              if (!currentTaskId) {
                throw err;
              }
              
              process.stdout.write("\nConnection lost. Attempting to re-attach to task...\n");
              
              try {
                const subResponse = await subscribeToA2ATask(baseUrl, currentTaskId, {
                  token,
                  onProgress: (text) => {
                    process.stdout.write(text);
                  },
                  onTaskId: (id) => {
                    currentTaskId = id;
                  }
                });
                finalTask = subResponse.task;
              } catch (subErr: any) {
                process.stdout.write(`\nStreaming failed (${subErr.message}). Falling back to polling...\n`);
                
                // Polling loop
                const maxPollingAttempts = 60; // 最大2分間（60回 × 2秒）
                let pollingAttempts = 0;
                while (true) {
                  if (pollingAttempts >= maxPollingAttempts) {
                    throw new Error(`Polling timed out after ${maxPollingAttempts} attempts`);
                  }
                  const task = await getA2ATask(baseUrl, currentTaskId, { token });
                  if (task.status.state === "TASK_STATE_COMPLETED" || task.status.state === "TASK_STATE_FAILED") {
                    finalTask = task;
                    break;
                  }
                  process.stdout.write("."); // tick
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  pollingAttempts++;
                }
                process.stdout.write("\n");
              }
            }

            // If we only got a statusUpdate but no full task, fetch the full task to get artifacts
            if (!finalTask && currentTaskId) {
              finalTask = await getA2ATask(baseUrl, currentTaskId, { token });
            }

            if (finalTask && finalTask.status.state === "TASK_STATE_COMPLETED") {
               const artifacts = finalTask.artifacts || [];
               const resultText = artifacts.map(a => a.parts.map(p => p.text ?? "").join("")).join("\n");
               return `Task completed by Gemini agent. Result:\n${resultText}`;
            }

            if (finalTask && finalTask.status.state === "TASK_STATE_FAILED") {
              throw new Error(`Task failed on the Gemini agent side. Final task state: ${JSON.stringify(finalTask)}`);
            }

            return `Task initiated, but returned unexpected state. Task: ${JSON.stringify(finalTask)}`;
          } catch (error: any) {
            throw new Error(`Error delegating task to Gemini: ${error?.message || String(error)}`);
          }
        },
      }),
    }
  };
};