import { createParser } from "eventsource-parser";
import type { SendMessageRequest, StreamResponse, Task } from "./a2a-types";

const VALID_STATES = [
  "TASK_STATE_PENDING",
  "TASK_STATE_WORKING",
  "TASK_STATE_COMPLETED",
  "TASK_STATE_FAILED",
  "TASK_STATE_SUBMITTED",
  "TASK_STATE_INPUT_REQUIRED",
];

const VALID_ROLES = ["ROLE_USER", "ROLE_AGENT"];

function isValidPart(p: any): boolean {
  return p && typeof p === "object" && (typeof p.text === "string" || typeof p.text === "undefined");
}

function isValidArtifact(a: any): boolean {
  return (
    a &&
    typeof a === "object" &&
    typeof a.artifactId === "string" &&
    Array.isArray(a.parts) &&
    a.parts.every(isValidPart)
  );
}

export function validateTask(t: any): { valid: true; task: Task } | { valid: false; errors: string[] } {
  const errors: string[] = [];
  if (!t || typeof t !== "object") {
    errors.push("not an object");
    return { valid: false, errors };
  }
  if (typeof t.id !== "string") {
    errors.push("missing or invalid 'id'");
  }
  if (!t.status || typeof t.status !== "object") {
    errors.push("missing or invalid 'status'");
  } else if (!VALID_STATES.includes(t.status.state)) {
    errors.push(`invalid status.state '${t.status.state}'`);
  }
  if (t.artifacts !== undefined) {
    if (!Array.isArray(t.artifacts)) {
      errors.push("artifacts is not an array");
    } else if (!t.artifacts.every(isValidArtifact)) {
      errors.push("failed validation in artifacts or parts");
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true, task: t as Task };
}

export function isValidTask(t: any): t is Task {
  return validateTask(t).valid;
}

export function isValidStreamResponse(obj: any): obj is StreamResponse {
  return true;
}

export interface SendA2AMessageOptions {
  token?: string;
  onProgress?: (text: string) => Promise<void> | void;
  onTaskId?: (taskId: string) => void;
  timeoutMs?: number;
}

async function processA2AStream(
  response: Response,
  controller: AbortController,
  onProgress?: (text: string) => Promise<void> | void,
  onTaskId?: (taskId: string) => void
): Promise<StreamResponse> {
  if (!response.body) {
    throw new Error("No response body");
  }

  return await new Promise<StreamResponse>((resolve, reject) => {
    let resolved = false;
    let terminalData: StreamResponse | null = null;
    let streamError: any = null;
    let receivedAnyText = false;
    const progressQueue: Promise<void>[] = [];
    let taskIdNotified = false;

    const notifyTaskId = (taskId: string) => {
      if (!taskIdNotified && onTaskId && taskId.trim()) {
        taskIdNotified = true;
        try {
          onTaskId(taskId);
        } catch (e) {
          console.error("Error in onTaskId callback for task", taskId, e);
        }
      }
    };

    const parser = createParser({
      onError(err) {
        if (!resolved) {
          resolved = true;
          streamError = err;
          controller.abort();
        }
      },
      onEvent(event) {
        if (resolved) return;
        if (event.data === "") return;
        let data: any;
        try {
          data = JSON.parse(event.data);
          if (!isValidStreamResponse(data)) {
            if (!resolved) {
              resolved = true;
              streamError = new Error("Invalid stream response: " + JSON.stringify(data));
              controller.abort();
            }
            return;
          }
        } catch (e) {
          if (!resolved) {
            resolved = true;
            streamError = new Error("Failed to parse SSE event data: " + event.data + " - " + (e instanceof Error ? e.message : String(e)));
            controller.abort();
          }
          return;
        }

        if (data.artifactUpdate) {
          notifyTaskId(data.artifactUpdate.taskId);
          if (onProgress) {
            const parts = data.artifactUpdate.artifact.parts;
            if (Array.isArray(parts)) {
              for (const part of parts) {
                if (part.text) {
                  try {
                    const res = onProgress(part.text);
                    if (res && typeof res.then === 'function') {
                      progressQueue.push(res.catch(e => {
                        if (!streamError) {
                          streamError = e;
                        }
                        if (!resolved) {
                          resolved = true;
                          controller.abort();
                        }
                      }));
                    }
                  } catch (e) {
                    if (!streamError) {
                      streamError = e;
                    }
                    if (!resolved) {
                      resolved = true;
                      controller.abort();
                    }
                    return;
                  }
                }
              }
            }
          }
        }

        const statusUpdate = data.statusUpdate || data.status_update;
        if (statusUpdate?.status) {
          notifyTaskId(statusUpdate.taskId || statusUpdate.task_id);

          // A2A 1.0: Extract text content from message inside status update
          const message = statusUpdate.status.message;
          if (message && Array.isArray(message.parts)) {
            for (const part of message.parts) {
              const text = part.text || (part.kind === "text" ? part.text : undefined);
              if (text && onProgress) {
                receivedAnyText = true;
                try {
                  const res = onProgress(text);
                  if (res && typeof res.then === 'function') {
                    progressQueue.push(res);
                  }
                } catch (e) {
                  console.error("Error in onProgress", e);
                }
              }
            }
          }

          const state = statusUpdate.status.state;
          const isFinal = statusUpdate.final === true || statusUpdate.status.final === true;
          
          if (isFinal || state === "TASK_STATE_COMPLETED" || state === "TASK_STATE_FAILED" || state === "input-required" || state === "completed" || state === "failed") {
            if (!resolved) {
              resolved = true;
              terminalData = data;
              controller.abort();
            }
          }
        }

        if (data.task?.status) {
          notifyTaskId(data.task.id);
          const state = data.task.status.state;
          const isFinal = data.task.status.final === true;
          if (isFinal || state === "TASK_STATE_COMPLETED" || state === "TASK_STATE_FAILED") {
            if (!resolved) {
              resolved = true;
              terminalData = data;
              controller.abort();
            }
          }
        }
        if (data.message) {
          if (typeof data.message.taskId === "string") {
             notifyTaskId(data.message.taskId);
          }
          if (!resolved) {
            resolved = true;
            terminalData = data;
            controller.abort();
          }
        }
      }
    });

    const processStream = async () => {
      try {
        const decoder = new TextDecoder();
        const reader = response.body!.getReader();
        try {
          while (true) {
            if (resolved) break;
            const { done, value } = await reader.read();
            if (done) break;
            parser.feed(decoder.decode(value, { stream: true }));
          }
        } finally {
          reader.releaseLock();
        }
        // Final flush
        if (!resolved) {
          parser.feed(decoder.decode());
          parser.reset({ consume: true });
        }
      } catch (e: any) {
        if (!streamError) {
          streamError = e;
        }
      }

      try {
        await Promise.all(progressQueue);
      } catch (e) {
        reject(e);
        return;
      }

      if (streamError) {
        reject(streamError);
      } else if (terminalData) {
        resolve(terminalData);
      } else if (receivedAnyText) {
        // Fallback for A2A 1.0 where stream might end without a formal terminal event but we got text
        resolve({ statusUpdate: { status: { state: "TASK_STATE_COMPLETED" } } } as any);
      } else {
        reject(new Error("Stream ended without a terminal event (task, statusUpdate, or message)"));
      }
    };

    processStream().catch((err) => {
      reject(err);
    });
  });
}

export async function sendA2AMessage(
  baseUrl: string,
  request: SendMessageRequest,
  options?: SendA2AMessageOptions | string
): Promise<StreamResponse> {
  if (typeof options === "string") {
    options = { token: options };
  }

  const token = options?.token;
  const timeoutMs = options?.timeoutMs ?? 120_000;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "A2A-Version": "1.0",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

  console.error(`[A2A] Sending request to: ${baseUrl}/v1/message:stream`);
  console.error(`[A2A] Headers: ${JSON.stringify(headers)}`);

  try {
    const restRequest = {
      message: {
        role: 1, // ROLE_USER
        content: (request.message.parts || []).map(p => ({ text: p.text })),
        messageId: request.message.messageId || `msg-${Date.now()}`,
        contextId: request.message.contextId || "default-context",
        metadata: request.metadata,
        configuration: request.configuration
      }
    };

    const response = await fetch(`${baseUrl}/v1/message:stream`, {
      method: "POST",
      headers,
      body: JSON.stringify(restRequest),
      signal: controller.signal,
    });

    console.error(`[A2A] Response received: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorBody = "";
      try {
        errorBody = await response.text();
      } catch (e: any) {
        if (e.name === "AbortError") {
          throw e;
        }
        errorBody = "Failed to read response body";
      }
      throw new Error(`A2A Request failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    return await processA2AStream(response, controller, options?.onProgress, options?.onTaskId);
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error(`A2A Request timeout: Request took longer than ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function subscribeToA2ATask(
  baseUrl: string,
  taskId: string,
  options?: SendA2AMessageOptions | string
): Promise<StreamResponse> {
  if (typeof options === "string") {
    options = { token: options };
  }

  const token = options?.token;
  const timeoutMs = options?.timeoutMs ?? 120_000;

  const headers: Record<string, string> = {
    "Accept": "text/event-stream",
    "A2A-Version": "1.0",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

  try {
    const response = await fetch(`${baseUrl}/v1/tasks/${encodeURIComponent(taskId)}`, {
      method: "GET",
      headers,
      signal: controller.signal,
    });


    if (!response.ok) {
      let errorBody = "";
      try {
        errorBody = await response.text();
      } catch (e: any) {
        if (e.name === "AbortError") {
          throw e;
        }
        errorBody = "Failed to read response body";
      }
      throw new Error(`A2A Subscribe failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    return await processA2AStream(response, controller, options?.onProgress, options?.onTaskId);
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error(`A2A Subscribe timeout: Request took longer than ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function delegateTaskToGemini(
  baseUrl: string,
  taskDescription: string,
  options: {
    token?: string;
    pollIntervalMs?: number;
    metadata?: any;
    configuration?: any;
  } = {}
): Promise<string> {
  const { token, pollIntervalMs = 2000, metadata, configuration } = options;
  let currentTaskId: string | null = null;
  let finalTask: Task | undefined;
  let finalMessage: StreamResponse["message"] | undefined;

  try {
    try {
      const response = await sendA2AMessage(baseUrl, {
        message: {
          role: "ROLE_USER",
          parts: [{ text: taskDescription }]
        },
        metadata,
        configuration
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
      finalMessage = response.message;
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
        finalMessage = subResponse.message;
      } catch (subErr: any) {
        process.stdout.write(`\nStreaming failed (${subErr.message}). Falling back to polling...\n`);
        
        // Polling loop
        const maxPollingAttempts = 60; // Max 2 minutes
        let pollingAttempts = 0;
        let consecutiveErrorCount = 0;
        while (true) {
          if (pollingAttempts >= maxPollingAttempts) {
            throw new Error(`Polling timed out after ${maxPollingAttempts} attempts for task ${currentTaskId}`);
          }

          let task;
          try {
            task = await getA2ATask(baseUrl, currentTaskId, { token, timeoutMs: 5000 });
            consecutiveErrorCount = 0;
          } catch (e: any) {
            consecutiveErrorCount++;
            console.error(`\nError fetching task ${currentTaskId}: ${e.message}`);
            if (consecutiveErrorCount > 5) {
              throw new Error(`Polling failed after ${consecutiveErrorCount} consecutive errors for task ${currentTaskId}`);
            }
            await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
            pollingAttempts++;
            continue;
          }

          if (task.status.state === "TASK_STATE_COMPLETED" || task.status.state === "TASK_STATE_FAILED") {
            finalTask = task;
            break;
          }
          process.stdout.write("."); // tick
          await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
          pollingAttempts++;
        }
        process.stdout.write("\n");
      }
    }

    if (finalMessage) {
       const resultText = (finalMessage.parts || []).map(p => p.text ?? "").join("");
       return `Gemini agent replied:\n${resultText}`;
    }

    // If we only got a statusUpdate but no full task, fetch the full task to get artifacts
    if (!finalTask && currentTaskId) {
      finalTask = await getA2ATask(baseUrl, currentTaskId, { token, timeoutMs: 5000 });
      if (!finalTask || !finalTask.status) {
        throw new Error(`Failed to fetch valid task for ${currentTaskId}: ${JSON.stringify(finalTask)}`);
      }
    }

    if (finalTask && finalTask.status.state === "TASK_STATE_COMPLETED") {
        if ((!finalTask.artifacts || finalTask.artifacts.length === 0) && currentTaskId) {
          // Perform one additional fetch to refresh canonical task artifacts
          try {
            const refreshedTask = await getA2ATask(baseUrl, currentTaskId, { token, timeoutMs: 5000 });
            if (refreshedTask && refreshedTask.status.state === "TASK_STATE_COMPLETED") {
              if (!refreshedTask.artifacts || refreshedTask.artifacts.length === 0) {
                console.warn(`[A2A] Task ${currentTaskId} refreshed but artifacts are still missing/empty. State: ${refreshedTask.status.state}`);
              }
              finalTask = refreshedTask;
            }
          } catch (e) {
            console.error(`Failed to refresh task ${currentTaskId} for artifacts:`, e);
          }
       }
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
}

