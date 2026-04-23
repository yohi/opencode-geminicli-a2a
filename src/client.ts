import { createParser } from "eventsource-parser";
import { promises as dns } from "node:dns";
import { isIP } from "node:net";
import type { SendMessageRequest, StreamResponse, Task, Part, Artifact, Message } from "./a2a-types";

const VALID_STATES = [
  "TASK_STATE_PENDING",
  "TASK_STATE_WORKING",
  "TASK_STATE_COMPLETED",
  "TASK_STATE_FAILED",
  "TASK_STATE_SUBMITTED",
  "TASK_STATE_INPUT_REQUIRED",
  "INPUT-REQUIRED",
  "SUBMITTED",
  "COMPLETED",
  "FAILED",
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
  } else {
    const normalized = (task.status.state || "").toString().toUpperCase();
    if (!VALID_STATES.includes(normalized as typeof VALID_STATES[number])) {
      errors.push(`invalid status.state '${task.status.state}'`);
    }
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
  const o = obj as Record<string, unknown>;
  
  if (o.task && typeof o.task === "object") {
    return typeof (o.task as Record<string, unknown>).id === "string";
  }
  if (o.message && typeof o.message === "object") {
    return Array.isArray((o.message as Record<string, unknown>).parts);
  }
  if (o.statusUpdate && typeof o.statusUpdate === "object") {
    const su = o.statusUpdate as Record<string, unknown>;
    const status = su.status as Record<string, unknown> | undefined;
    return (
      typeof su.taskId === "string" &&
      !!status &&
      typeof status.state === "string"
    );
  }
  if (o.artifactUpdate && typeof o.artifactUpdate === "object") {
    const au = o.artifactUpdate as Record<string, unknown>;
    const artifact = au.artifact as Record<string, unknown> | undefined;
    return (
      typeof au.taskId === "string" &&
      !!artifact &&
      Array.isArray(artifact.parts)
    );
  }
  
  return false;
}

export interface SendA2AMessageOptions {
  token?: string;
  onProgress?: (text: string) => Promise<void> | void;
  onTaskId?: (taskId: string) => void;
  timeoutMs?: number;
  trustedHostnames?: string[];
}

/**
 * Validates if an IP address is in a private or reserved range for SSRF protection.
 */
function isPrivateIP(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    // IPv4 Private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8, 169.254.0.0/16
    const parts = ip.split(".").map(Number);
    return (
      parts[0] === 10 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      parts[0] === 127 ||
      (parts[0] === 169 && parts[1] === 254)
    );
  } else if (version === 6) {
    // IPv6 Private/Reserved: ::1, fc00::/7 (ULA), fe80::/10 (Link-local)
    const v6 = ip.toLowerCase();
    if (v6 === "::1" || v6 === "0:0:0:0:0:0:0:1") return true;

    // Normalize and extract the first block
    // Handling cases like "fe80::..." or "2001:db8:..."
    const firstBlock = v6.split(":")[0] || "0";
    const first = parseInt(firstBlock, 16);
    if (Number.isNaN(first)) return false;

    return (
      (first & 0xfe00) === 0xfc00 || // fc00::/7
      (first & 0xffc0) === 0xfe80    // fe80::/10
    );
  }
  return false;
}

/**
 * Validates the base URL for SSRF protection.
 */
async function validateBaseUrl(baseUrl: string, trustedHostnames: string[] = []): Promise<void> {
  if (!baseUrl) {
    throw new Error("Base URL is required");
  }

  try {
    const url = new URL(baseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Only http and https protocols are supported");
    }

    const hostname = url.hostname;
    if (!hostname) {
      throw new Error("Invalid URL: Hostname is missing");
    }

    // Standard local check
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "0.0.0.0";

    // Enforce allowlist for external domains
    if (!isLocal) {
      if (trustedHostnames.length === 0) {
        throw new Error(`Hostname '${hostname}' is external but no trusted hostnames were provided. Access denied for security.`);
      }
      const isTrusted = trustedHostnames.some(trusted => 
        hostname === trusted || hostname.endsWith(`.${trusted}`)
      );
      if (!isTrusted) {
        throw new Error(`Hostname '${hostname}' is not in the trusted allowlist`);
      }
    }
    
    // Resolve DNS and check for private IPs for extra safety (DNS Rebinding prevention)
    const ipVersion = isIP(hostname);
    if (ipVersion !== 0) {
      if (isPrivateIP(hostname) && !isLocal) {
         throw new Error(`Access to private IP address is disallowed: ${hostname}`);
      }
    } else {
      // Use dns.lookup with { all: true } to check ALL resolved addresses
      const addresses = await dns.lookup(hostname, { all: true });
      if (addresses.length === 0) {
        throw new Error(`Hostname ${hostname} could not be resolved`);
      }
      for (const record of addresses) {
        if (isPrivateIP(record.address) && !isLocal) {
          throw new Error(`Hostname ${hostname} resolves to a private IP ${record.address} which is disallowed`);
        }
      }
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
    headers.Authorization = `Bearer ${token}`;
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
    const progressQueue: Promise<void>[]=[];
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

          const state = (statusUpdate.status.state || "").toString().toUpperCase();
          const isTerminal = statusUpdate.status.final === true || 
                          state === "TASK_STATE_COMPLETED" || 
                          state === "TASK_STATE_FAILED" || 
                          state === "TASK_STATE_INPUT_REQUIRED" ||
                          state === "COMPLETED" || 
                          state === "FAILED" ||
                          state === "INPUT-REQUIRED" ||
                          state === "INPUT_REQUIRED";
          
          if (isTerminal) {
            if (!resolved) {
              resolved = true;
              terminalData = typedData;
              controller.abort();
            }
          }
        }

        if (typedData.task?.status) {
          notifyTaskId(typedData.task.id);
          const state = (typedData.task.status.state || "").toString().toUpperCase();
          const isTerminal = typedData.task.status.final === true || 
                          state === "TASK_STATE_COMPLETED" || 
                          state === "TASK_STATE_FAILED" || 
                          state === "TASK_STATE_INPUT_REQUIRED" ||
                          state === "COMPLETED" || 
                          state === "FAILED" ||
                          state === "INPUT-REQUIRED" ||
                          state === "INPUT_REQUIRED";
          if (isTerminal) {
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
  const opt = typeof options === "string" ? { token: options } : options;
  await validateBaseUrl(baseUrl, opt?.trustedHostnames);
  const timeoutMs = opt?.timeoutMs ?? 120_000;

  const restRequest = {
    message: {
      role: request.message.role,
      parts: request.message.parts,
      messageId: request.message.messageId || `msg-${Date.now()}`,
      contextId: (request.message as Message & { contextId?: string }).contextId || "default-context",
      metadata: (request as SendMessageRequest & { metadata?: Record<string, unknown> }).metadata,
      configuration: (request as SendMessageRequest & { configuration?: Record<string, unknown> }).configuration
    }
  };

  const { response, controller, timeoutId } = await executeA2AFetch(
    `${baseUrl}/message:stream`,
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
  const opt = typeof options === "string" ? { token: options } : options;
  await validateBaseUrl(baseUrl, opt?.trustedHostnames);
  const timeoutMs = opt?.timeoutMs ?? 120_000;

  const { response, controller, timeoutId } = await executeA2AFetch(
    `${baseUrl}/tasks/${encodeURIComponent(taskId)}:subscribe`,
    {
      method: "POST",
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
  options: { token?: string; timeoutMs?: number; trustedHostnames?: string[] } = {}
): Promise<Task> {
  const { token, timeoutMs = 30000, trustedHostnames } = options;
  await validateBaseUrl(baseUrl, trustedHostnames);

  const { response, timeoutId } = await executeA2AFetch(
    `${baseUrl}/tasks/${encodeURIComponent(taskId)}`,
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
  pollIntervalMs: number = 2000,
  onProgress?: (text: string) => void,
  trustedHostnames?: string[]
): Promise<Task> {
  const maxPollingAttempts = 60; // Max 2 minutes
  let pollingAttempts = 0;
  let consecutiveErrorCount = 0;

  while (pollingAttempts < maxPollingAttempts) {
    try {
      const task = await getA2ATask(baseUrl, taskId, { token, timeoutMs: 5000, trustedHostnames });
      consecutiveErrorCount = 0;
      
      const state = (task.status.state || "").toString().toUpperCase();
      if (state === "TASK_STATE_COMPLETED" || state === "TASK_STATE_FAILED" || state === "TASK_STATE_INPUT_REQUIRED" ||
          state === "COMPLETED" || state === "FAILED" || state === "INPUT-REQUIRED" || state === "INPUT_REQUIRED") {
        return task;
      }
      if (onProgress) onProgress(".");
    } catch (e: unknown) {
      consecutiveErrorCount++;
      if (consecutiveErrorCount > 5) {
        throw new Error(`Polling failed after ${consecutiveErrorCount} consecutive errors for task ${taskId}: ${e instanceof Error ? e.message : String(e)}`);
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
    onProgress?: (text: string) => void;
    onTaskId?: (id: string) => void;
    trustedHostnames?: string[];
  } = {}
): Promise<string> {
  const { token, pollIntervalMs = 2000, metadata, configuration, onProgress, onTaskId, trustedHostnames } = options;
  await validateBaseUrl(baseUrl, trustedHostnames);
  let currentTaskId: string | null = null;
  let finalTask: Task | undefined;
  let finalMessage: StreamResponse["message"] | undefined;

  const handleTaskId = (id: string) => {
    currentTaskId = id;
    if (onTaskId) onTaskId(id);
  };

  try {
    try {
      const response = await sendA2AMessage(baseUrl, {
        message: { role: "ROLE_USER", parts: [{ text: taskDescription }] },
        metadata,
        configuration
      } as SendMessageRequest, { token, onProgress, onTaskId: handleTaskId, trustedHostnames });
      finalTask = response.task;
      finalMessage = response.message;
    } catch (err: unknown) {
      if (!currentTaskId) throw err;
      
      if (onProgress) onProgress("\nConnection lost. Attempting to re-attach to task...\n");
      try {
        const subResponse = await subscribeToA2ATask(baseUrl, currentTaskId, { token, onProgress, onTaskId: handleTaskId, trustedHostnames });
        finalTask = subResponse.task;
        finalMessage = subResponse.message;
      } catch (subErr: unknown) {
        const msg = subErr instanceof Error ? subErr.message : String(subErr);
        if (onProgress) onProgress(`\nStreaming failed (${msg}). Falling back to polling...\n`);
        finalTask = await pollA2ATask(baseUrl, currentTaskId, token, pollIntervalMs, onProgress, trustedHostnames);
        if (onProgress) onProgress("\n");
      }
    }

    if (finalMessage) {
       const resultText = (finalMessage.parts || []).map(p => p.text ?? "").join("");
       return `Gemini agent replied:\n${resultText}`;
    }

    if (!finalTask && currentTaskId) {
      finalTask = await getA2ATask(baseUrl, currentTaskId, { token, timeoutMs: 5000, trustedHostnames });
    }

    if (finalTask) {
      const state = (finalTask.status.state || "").toString().toUpperCase();
      if (state === "TASK_STATE_COMPLETED" || state === "COMPLETED") {
        if ((!finalTask.artifacts || finalTask.artifacts.length === 0) && currentTaskId) {
          try {
            const refreshedTask = await getA2ATask(baseUrl, currentTaskId, { token, timeoutMs: 5000, trustedHostnames });
            if (refreshedTask) finalTask = refreshedTask;
          } catch {
            // Ignore refresh error if we already have some state
          }
       }
       const artifacts = finalTask.artifacts || [];
       const resultText = artifacts.map(a => a.parts.map(p => p.text ?? "").join("")).join("\n");
       return `Task completed by Gemini agent. Result:\n${resultText}`;
      }

      if (state === "TASK_STATE_INPUT_REQUIRED" || state === "INPUT_REQUIRED" || state === "INPUT-REQUIRED") {
        const message = finalTask.status.message;
        const resultText = message ? (message.parts || []).map(p => p.text ?? "").join("") : "";
        return `Task requires input. Gemini agent says:\n${resultText}\n(Task ID: ${currentTaskId})`;
      }

      if (state === "TASK_STATE_FAILED" || state === "FAILED") {
        throw new Error(`Task failed on the Gemini agent side. Final task state: ${JSON.stringify(finalTask)}`);
      }
    }

    return `Task initiated, but returned unexpected state. Task: ${JSON.stringify(finalTask)}`;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Error delegating task to Gemini: ${msg}`);
  }
}
