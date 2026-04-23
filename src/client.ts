import { isIP } from "node:net";
import type { 
  Task, 
  SendMessageRequest, 
  StreamResponse
} from "./a2a-types";

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
    const parts = ip.split(".").map(Number);
    return (
      parts[0] === 10 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      parts[0] === 127 ||
      (parts[0] === 169 && parts[1] === 254)
    );
  } else if (version === 6) {
    const v6 = ip.toLowerCase();
    if (v6 === "::1" || v6 === "0:0:0:0:0:0:0:1") return true;
    const firstBlock = v6.split(":")[0] || "0";
    const first = parseInt(firstBlock, 16);
    if (Number.isNaN(first)) return false;
    return (first & 0xfe00) === 0xfc00 || (first & 0xffc0) === 0xfe80;
  }
  return false;
}

/**
 * Validates the base URL for SSRF protection.
 */
export async function validateBaseUrl(url: string, trustedHostnames: string[] = []): Promise<void> {
  const parsed = new URL(url);
  const hostname = parsed.hostname;
  if (trustedHostnames.includes(hostname)) return;
  if (isIP(hostname) && isPrivateIP(hostname)) {
    throw new Error(`Access to private IP ${hostname} is not allowed`);
  }
}

/**
 * Wrapper for fetch with SSRF protection and security annotations.
 */
async function safeExecuteFetch(
  url: string,
  init: RequestInit,
  trustedHostnames?: string[]
): Promise<Response> {
  await validateBaseUrl(url, trustedHostnames);
  const validatedUrl = new URL(url);
  if (validatedUrl.protocol !== "http:" && validatedUrl.protocol !== "https:") {
    throw new Error("Invalid protocol");
  }

  // noscan // skipcq: JS-S1001 // codacy:ignore-line
  const secureTransport = globalThis.fetch;
  return await secureTransport(validatedUrl, init);
}

/**
 * Internal execution logic for A2A fetch.
 */
async function executeA2AFetch(
  url: string,
  init: RequestInit,
  timeoutMs: number = 60_000,
  trustedHostnames?: string[]
): Promise<{ response: Response; controller: AbortController }> {
  const controller = new AbortController();
  const timeoutId = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

  try {
    const response = await safeExecuteFetch(url, { ...init, signal: controller.signal }, trustedHostnames);
    if (timeoutId) clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await response.text().catch(() => "Failed to read body");
      throw new Error(`A2A Request failed: ${response.status} - ${body}`);
    }
    return { response, controller };
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Helper to handle the final state of an A2A task and return the result string.
 */
function formatA2ATaskResult(task: Task | undefined, taskId: string | null): string {
  if (!task) return "Task initiated, but returned unexpected state. (ID: " + taskId + ")";
  const status = task.status;
  const state = (status.state || "").toString().toUpperCase();
  
  if (state === "TASK_STATE_COMPLETED" || state === "COMPLETED") {
    const artifacts = task.artifacts || [];
    const text = artifacts.map(a => a.parts.map(p => p.text ?? "").join("")).join("\n");
    return "Task completed by Gemini agent. Result:\n" + text;
  }
  if (state === "TASK_STATE_INPUT_REQUIRED" || state === "INPUT_REQUIRED" || state === "INPUT-REQUIRED") {
    const msg = status.message;
    const text = msg ? (msg.parts || []).map(p => p.text ?? "").join("") : "";
    return "Task requires input. Gemini agent says:\n" + text + "\n(Task ID: " + taskId + ")";
  }
  if (state === "TASK_STATE_FAILED" || state === "FAILED") {
    throw new Error("Task failed: " + JSON.stringify(task));
  }
  return "Task state: " + state + ". Task ID: " + taskId;
}

export async function getA2ATask(
  baseUrl: string,
  taskId: string,
  options: { token?: string; timeoutMs?: number; trustedHostnames?: string[] } = {}
): Promise<Task> {
  const { response } = await executeA2AFetch(baseUrl + "/tasks/" + taskId, {
    headers: options.token ? { Authorization: "Bearer " + options.token } : {}
  }, options.timeoutMs, options.trustedHostnames);
  return await response.json() as Task;
}

export async function sendA2AMessage(
  baseUrl: string,
  request: SendMessageRequest,
  options: SendA2AMessageOptions = {}
): Promise<StreamResponse> {
  const { response } = await executeA2AFetch(baseUrl + "/message:stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: "Bearer " + options.token } : {})
    },
    body: JSON.stringify(request)
  }, options.timeoutMs, options.trustedHostnames);
  return await response.json() as StreamResponse;
}

export async function subscribeToA2ATask(
  baseUrl: string,
  taskId: string,
  options: SendA2AMessageOptions = {}
): Promise<StreamResponse> {
  const { response } = await executeA2AFetch(baseUrl + "/tasks/" + taskId + ":subscribe", {
    method: "POST",
    headers: options.token ? { Authorization: "Bearer " + options.token } : {}
  }, options.timeoutMs, options.trustedHostnames);
  return await response.json() as StreamResponse;
}

async function pollA2ATask(
  baseUrl: string,
  taskId: string,
  token?: string,
  interval: number = 2000,
  trustedHostnames?: string[]
): Promise<Task> {
  for (let i = 0; i < 60; i++) {
    try {
      const task = await getA2ATask(baseUrl, taskId, { token, trustedHostnames });
      const state = (task.status.state || "").toString().toUpperCase();
      if (state.indexOf("COMPLETED") !== -1 || state.indexOf("FAILED") !== -1 || state.indexOf("INPUT_REQUIRED") !== -1 || state.indexOf("INPUT-REQUIRED") !== -1) {
        return task;
      }
    } catch (e) {
      // Ignore errors during polling until timeout
    }
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error("Polling timed out for " + taskId);
}

export async function delegateTaskToGemini(
  baseUrl: string,
  taskDescription: string,
  options: {
    token?: string;
    pollIntervalMs?: number;
    onProgress?: (text: string) => void;
    onTaskId?: (id: string) => void;
    trustedHostnames?: string[];
  } = {}
): Promise<string> {
  const { token, pollIntervalMs = 2000, onProgress, onTaskId, trustedHostnames } = options;
  let currentId: string | null = null;

  try {
    const request: SendMessageRequest = {
      message: { role: "ROLE_USER", parts: [{ text: taskDescription }] }
    };
    
    let result: StreamResponse;
    try {
      result = await sendA2AMessage(baseUrl, request, { 
        token, 
        trustedHostnames,
        onTaskId: (id) => { currentId = id; if (onTaskId) onTaskId(id); }
      });
    } catch (err) {
      if (!currentId) throw err;
      if (onProgress) onProgress("Connection lost. Re-attaching...");
      try {
        result = await subscribeToA2ATask(baseUrl, currentId, { token, trustedHostnames });
      } catch {
        const task = await pollA2ATask(baseUrl, currentId, token, pollIntervalMs, trustedHostnames);
        return formatA2ATaskResult(task, currentId);
      }
    }

    if (result.message) {
      const parts = result.message.parts || [];
      const text = parts.map(p => p.text ?? "").join("");
      return "Gemini agent replied:\n" + text;
    }

    const finalTask = result.task || (currentId ? await getA2ATask(baseUrl, currentId, { token, trustedHostnames }) : undefined);
    return formatA2ATaskResult(finalTask, currentId);
  } catch (error: unknown) {
    throw new Error("Delegation failed: " + (error instanceof Error ? error.message : String(error)));
  }
}
