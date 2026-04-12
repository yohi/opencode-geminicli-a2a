import { createParser } from "eventsource-parser";
import type { SendMessageRequest, StreamResponse, Task, Part, Artifact, Message } from "./a2a-types";

const VALID_STATES = [
  "TASK_STATE_PENDING",
  "TASK_STATE_WORKING",
  "TASK_STATE_COMPLETED",
  "TASK_STATE_FAILED",
  "TASK_STATE_SUBMITTED",
  "TASK_STATE_INPUT_REQUIRED",
] as const;

function isValidPart(p: unknown): p is Part {
  return (
    typeof p === "object" &&
    p !== null &&
    (typeof (p as Part).text === "string" || typeof (p as Part).text === "undefined")
  );
}

function isValidArtifact(a: unknown): a is Artifact {
  const artifact = a as Artifact;
  return (
    typeof a === "object" &&
    a !== null &&
    typeof artifact.artifactId === "string" &&
    Array.isArray(artifact.parts) &&
    artifact.parts.every(isValidPart)
  );
}

export function validateTask(t: unknown): { valid: true; task: Task } | { valid: false; errors: string[] } {
  const errors: string[] = [];
  if (!t || typeof t !== "object") {
    errors.push("not an object");
    return { valid: false, errors };
  }

  const task = t as Task;
  if (typeof task.id !== "string") {
    errors.push("missing or invalid 'id'");
  }
  if (!task.status || typeof task.status !== "object") {
    errors.push("missing or invalid 'status'");
  } else if (!VALID_STATES.includes(task.status.state as any)) {
    errors.push(`invalid status.state '${task.status.state}'`);
  }
  if (task.artifacts !== undefined) {
    if (!Array.isArray(task.artifacts)) {
      errors.push("artifacts is not an array");
    } else if (!task.artifacts.every(isValidArtifact)) {
      errors.push("failed validation in artifacts or parts");
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true, task: task as Task };
}

export function isValidTask(t: unknown): t is Task {
  return validateTask(t).valid;
}

export function isValidStreamResponse(obj: unknown): obj is StreamResponse {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, any>;
  
  if (o.task) {
    return typeof o.task.id === "string";
  }
  if (o.message) {
    return Array.isArray(o.message.parts);
  }
  if (o.statusUpdate) {
    return (
      typeof o.statusUpdate.taskId === "string" &&
      o.statusUpdate.status &&
      typeof o.statusUpdate.status.state === "string"
    );
  }
  if (o.artifactUpdate) {
    return (
      typeof o.artifactUpdate.taskId === "string" &&
      o.artifactUpdate.artifact &&
      Array.isArray(o.artifactUpdate.artifact.parts)
    );
  }
  
  return false;
}

export interface SendA2AMessageOptions {
  token?: string;
  onProgress?: (text: string) => Promise<void> | void;
  onTaskId?: (taskId: string) => void;
  timeoutMs?: number;
}

/**
 * Validates the base URL for SSRF protection.
 */
function validateBaseUrl(baseUrl: string): void {
  try {
    const url = new URL(baseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Only http and https protocols are supported");
    }
  } catch (e) {
    throw new Error(`Invalid base URL: ${baseUrl}${e instanceof Error ? ` - ${e.message}` : ""}`);
  }
}

/**
 * Constructs common A2A headers.
 */
function getA2AHeaders(token?: string, extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    "A2A-Version": "1.0",
    ...extra,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Shared fetch execution with timeout and error handling.
 */
async function executeA2AFetch(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  actionName: string
): Promise<{ response: Response; controller: AbortController; timeoutId: NodeJS.Timeout | undefined }> {
  const controller = new AbortController();
  const timeoutId = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorBody = "";
      try {
        errorBody = await response.text();
      } catch (e: unknown) {
        if (e instanceof Error && e.name === "AbortError") throw e;
        errorBody = "Failed to read response body";
      }
      throw new Error(`A2A ${actionName} failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    return { response, controller, timeoutId };
  } catch (error: unknown) {
    if (timeoutId) clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`A2A ${actionName} timeout: Request took longer than ${timeoutMs}ms`);
    }
    throw error;
  }
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
    let streamError: unknown = null;
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
        let data: unknown;
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

        const typedData = data as StreamResponse;

        if (typedData.artifactUpdate) {
          notifyTaskId(typedData.artifactUpdate.taskId);
          const parts = typedData.artifactUpdate.artifact?.parts;
          if (Array.isArray(parts)) {
            for (const part of parts) {
              if (part.text) {
                receivedAnyText = true;
                if (onProgress) {
                  try {
                    const res = onProgress(part.text);
                    if (res instanceof Promise) {
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
                  }
                }
              }
            }
          }
        }

        const statusUpdate = typedData.statusUpdate;
        if (statusUpdate?.status) {
          notifyTaskId(statusUpdate.taskId);

          // A2A 1.0: Extract text content from message inside status update
          const message = statusUpdate.status.message;
          if (message && Array.isArray(message.parts)) {
            for (const part of message.parts) {
              const text = part.text || (part.kind === "text" ? part.text : undefined);
              if (text) {
                receivedAnyText = true;
                if (onProgress) {
                  try {
                    const res = onProgress(text);
                    if (res instanceof Promise) {
                      progressQueue.push(res);
                    }
                  } catch (e) {
                    console.error("Error in onProgress", e);
                  }
                }
              }
            }
          }

          const state = (statusUpdate.status.state || "").toLowerCase();
          const isFinal = statusUpdate.status.final === true || 
                          state === "task_state_completed" || 
                          state === "task_state_failed" || 
                          state === "completed" || 
                          state === "failed";
          
          if (isFinal || state === "input-required") {
            if (!resolved) {
              resolved = true;
              terminalData = typedData;
              controller.abort();
            }
          }
        }

        if (typedData.task?.status) {
          notifyTaskId(typedData.task.id);
          const state = (typedData.task.status.state || "").toLowerCase();
          const isFinal = typedData.task.status.final === true || 
                          state === "task_state_completed" || 
                          state === "task_state_failed" || 
                          state === "completed" || 
                          state === "failed";
          if (isFinal) {
            if (!resolved) {
              resolved = true;
              terminalData = typedData;
              controller.abort();
            }
          }
        }
        if (typedData.message) {
          if (typeof typedData.message.taskId === "string") {
             notifyTaskId(typedData.message.taskId);
          }
          
          // Stream message parts to onProgress before aborting
          if (onProgress && Array.isArray(typedData.message.parts)) {
            for (const part of typedData.message.parts) {
              if (part.text) {
                try {
                  const res = onProgress(part.text);
                  if (res instanceof Promise) {
                    progressQueue.push(res);
                  }
                } catch (e) {
                  console.error("Error in onProgress for terminal message", e);
                }
              }
            }
          }

          if (!resolved) {
            resolved = true;
            terminalData = typedData;
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
      } catch (e: unknown) {
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
      } else {
        reject(new Error("Unexpected end of stream: No terminal event received (task, statusUpdate, or message)"));
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
  validateBaseUrl(baseUrl);
  const opt = typeof options === "string" ? { token: options } : options;
  const timeoutMs = opt?.timeoutMs ?? 120_000;

  const restRequest = {
    message: {
      role: 1, // 1: User
      parts: request.message.parts,
      messageId: request.message.messageId || `msg-${Date.now()}`,
      contextId: (request.message as Message & { contextId?: string }).contextId || "default-context",
      metadata: (request as SendMessageRequest & { metadata?: Record<string, unknown> }).metadata,
      configuration: (request as SendMessageRequest & { configuration?: Record<string, unknown> }).configuration
    }
  };

  const { response, controller, timeoutId } = await executeA2AFetch(
    `${baseUrl}/v1/message:stream`,
    {
      method: "POST",
      headers: getA2AHeaders(opt?.token, { "Content-Type": "application/json" }),
      body: JSON.stringify(restRequest),
    },
    timeoutMs,
    "Request"
  );

  try {
    return await processA2AStream(response, controller, opt?.onProgress, opt?.onTaskId);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function subscribeToA2ATask(
  baseUrl: string,
  taskId: string,
  options?: SendA2AMessageOptions | string
): Promise<StreamResponse> {
  validateBaseUrl(baseUrl);
  const opt = typeof options === "string" ? { token: options } : options;
  const timeoutMs = opt?.timeoutMs ?? 120_000;

  const { response, controller, timeoutId } = await executeA2AFetch(
    `${baseUrl}/v1/tasks/${encodeURIComponent(taskId)}`,
    {
      method: "GET",
      headers: getA2AHeaders(opt?.token, { "Accept": "text/event-stream" }),
    },
    timeoutMs,
    "Subscribe"
  );

  try {
    return await processA2AStream(response, controller, opt?.onProgress, opt?.onTaskId);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function getA2ATask(
  baseUrl: string,
  taskId: string,
  options: { token?: string; timeoutMs?: number } = {}
): Promise<Task> {
  validateBaseUrl(baseUrl);
  const { token, timeoutMs = 30000 } = options;

  const { response, timeoutId } = await executeA2AFetch(
    `${baseUrl}/v1/tasks/${encodeURIComponent(taskId)}`,
    {
      method: "GET",
      headers: getA2AHeaders(token, { "Content-Type": "application/json" }),
    },
    timeoutMs,
    "Fetch Task"
  );

  try {
    const data = await response.json() as { task: Task };
    return data.task;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Polls for task completion.
 */
async function pollA2ATask(
  baseUrl: string,
  taskId: string,
  token?: string,
  pollIntervalMs: number = 2000
): Promise<Task> {
  const maxPollingAttempts = 60; // Max 2 minutes
  let pollingAttempts = 0;
  let consecutiveErrorCount = 0;

  while (pollingAttempts < maxPollingAttempts) {
    try {
      const task = await getA2ATask(baseUrl, taskId, { token, timeoutMs: 5000 });
      consecutiveErrorCount = 0;
      
      const state = (task.status.state || "").toLowerCase();
      if (state === "task_state_completed" || state === "task_state_failed" || state === "completed" || state === "failed") {
        return task;
      }
      process.stdout.write("."); // tick
    } catch (e: unknown) {
      consecutiveErrorCount++;
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`\nError fetching task ${taskId}: ${msg}`);
      if (consecutiveErrorCount > 5) {
        throw new Error(`Polling failed after ${consecutiveErrorCount} consecutive errors for task ${taskId}`);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    pollingAttempts++;
  }
  throw new Error(`Polling timed out after ${maxPollingAttempts} attempts for task ${taskId}`);
}

export async function delegateTaskToGemini(
  baseUrl: string,
  taskDescription: string,
  options: {
    token?: string;
    pollIntervalMs?: number;
    metadata?: Record<string, unknown>;
    configuration?: Record<string, unknown>;
  } = {}
): Promise<string> {
  validateBaseUrl(baseUrl);
  const { token, pollIntervalMs = 2000, metadata, configuration } = options;
  let currentTaskId: string | null = null;
  let finalTask: Task | undefined;
  let finalMessage: StreamResponse["message"] | undefined;

  const onProgress = (text: string) => { process.stdout.write(text); };
  const onTaskId = (id: string) => { currentTaskId = id; };

  try {
    try {
      const response = await sendA2AMessage(baseUrl, {
        message: { role: "ROLE_USER", parts: [{ text: taskDescription }] },
        metadata,
        configuration
      } as SendMessageRequest, { token, onProgress, onTaskId });
      finalTask = response.task;
      finalMessage = response.message;
    } catch (err: unknown) {
      if (!currentTaskId) throw err;
      
      process.stdout.write("\nConnection lost. Attempting to re-attach to task...\n");
      try {
        const subResponse = await subscribeToA2ATask(baseUrl, currentTaskId, { token, onProgress, onTaskId });
        finalTask = subResponse.task;
        finalMessage = subResponse.message;
      } catch (subErr: unknown) {
        const msg = subErr instanceof Error ? subErr.message : String(subErr);
        process.stdout.write(`\nStreaming failed (${msg}). Falling back to polling...\n`);
        finalTask = await pollA2ATask(baseUrl, currentTaskId, token, pollIntervalMs);
        process.stdout.write("\n");
      }
    }

    if (finalMessage) {
       const resultText = (finalMessage.parts || []).map(p => p.text ?? "").join("");
       return `Gemini agent replied:\n${resultText}`;
    }

    if (!finalTask && currentTaskId) {
      finalTask = await getA2ATask(baseUrl, currentTaskId, { token, timeoutMs: 5000 });
    }

    if (finalTask) {
      const state = (finalTask.status.state || "").toLowerCase();
      if (state === "task_state_completed" || state === "completed") {
        if ((!finalTask.artifacts || finalTask.artifacts.length === 0) && currentTaskId) {
          try {
            const refreshedTask = await getA2ATask(baseUrl, currentTaskId, { token, timeoutMs: 5000 });
            if (refreshedTask) finalTask = refreshedTask;
          } catch (e) {
            console.error(`Failed to refresh task ${currentTaskId} for artifacts:`, e);
          }
       }
       const artifacts = finalTask.artifacts || [];
       const resultText = artifacts.map(a => a.parts.map(p => p.text ?? "").join("")).join("\n");
       return `Task completed by Gemini agent. Result:\n${resultText}`;
      }

      if (state === "task_state_failed" || state === "failed") {
        throw new Error(`Task failed on the Gemini agent side. Final task state: ${JSON.stringify(finalTask)}`);
      }
    }

    return `Task initiated, but returned unexpected state. Task: ${JSON.stringify(finalTask)}`;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Error delegating task to Gemini: ${msg}`);
  }
}
