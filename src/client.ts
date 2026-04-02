import { createParser } from "eventsource-parser";
import type { SendMessageRequest, StreamResponse, Task } from "./a2a-types";

const VALID_STATES = [
  "TASK_STATE_PENDING",
  "TASK_STATE_WORKING",
  "TASK_STATE_COMPLETED",
  "TASK_STATE_FAILED",
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

export function isValidStreamResponse(obj: any): obj is StreamResponse {
  if (!obj || typeof obj !== "object") return false;

  let hasValidField = false;

  if ("task" in obj) {
    const t = obj.task;
    if (
      !t ||
      typeof t !== "object" ||
      typeof t.id !== "string" ||
      !t.status ||
      typeof t.status !== "object" ||
      !VALID_STATES.includes(t.status.state)
    ) {
      return false;
    }
    if (t.artifacts !== undefined) {
      if (!Array.isArray(t.artifacts) || !t.artifacts.every(isValidArtifact)) {
        return false;
      }
    }
    hasValidField = true;
  }

  if ("message" in obj) {
    const m = obj.message;
    if (
      !m ||
      typeof m !== "object" ||
      !VALID_ROLES.includes(m.role) ||
      !Array.isArray(m.parts) ||
      !m.parts.every(isValidPart)
    ) {
      return false;
    }
    hasValidField = true;
  }

  if ("statusUpdate" in obj) {
    const su = obj.statusUpdate;
    if (
      !su ||
      typeof su !== "object" ||
      typeof su.taskId !== "string" ||
      !su.status ||
      typeof su.status !== "object" ||
      !VALID_STATES.includes(su.status.state)
    ) {
      return false;
    }
    hasValidField = true;
  }

  if ("artifactUpdate" in obj) {
    const au = obj.artifactUpdate;
    if (!au || typeof au !== "object" || typeof au.taskId !== "string" || !isValidArtifact(au.artifact)) {
      return false;
    }
    hasValidField = true;
  }

  return hasValidField;
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
    const progressQueue: Promise<void>[] = [];
    let taskIdNotified = false;

    const notifyTaskId = (taskId: string) => {
      if (!taskIdNotified && onTaskId) {
        taskIdNotified = true;
        try {
          onTaskId(taskId);
        } catch (e) {
          // Ignore errors from onTaskId callback
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

        if (data.statusUpdate?.status) {
          notifyTaskId(data.statusUpdate.taskId);
          const state = data.statusUpdate.status.state;
          if (state === "TASK_STATE_COMPLETED" || state === "TASK_STATE_FAILED") {
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
          if (state === "TASK_STATE_COMPLETED" || state === "TASK_STATE_FAILED") {
            if (!resolved) {
              resolved = true;
              terminalData = data;
              controller.abort();
            }
          }
        }
        if (data.message) {
          if (data.message.taskId) {
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
    "Content-Type": "application/a2a+json",
    "A2A-Version": "1.0",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

  try {
    const response = await fetch(`${baseUrl}/message:stream`, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
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
    const response = await fetch(`${baseUrl}/tasks/${taskId}:subscribe`, {
      method: "POST",
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

export async function getA2ATask(
  baseUrl: string,
  taskId: string,
  options?: { token?: string }
): Promise<Task> {
  const headers: Record<string, string> = {
    "Accept": "application/a2a+json",
    "A2A-Version": "1.0",
  };
  if (options?.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const response = await fetch(`${baseUrl}/tasks/${taskId}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    let errorBody = "";
    try {
      errorBody = await response.text();
    } catch (e) {
      errorBody = "Failed to read response body";
    }
    throw new Error(`A2A GetTask failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  if (!data || typeof data !== "object" || typeof data.id !== "string" || !data.status) {
    throw new Error("Invalid task response from server");
  }

  return data as Task;
}
