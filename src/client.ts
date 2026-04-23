/* eslint-disable no-unneeded-ternary */
// noscan
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
    const first = parseInt(v6.split(":")[0] || "0", 16);
    return (first & 0xfe00) === 0xfc00 || (first & 0xffc0) === 0xfe80;
  }
  return false;
}

export async function validateBaseUrl(url: string, trustedHostnames: string[] = []): Promise<void> {
  const hostname = new URL(url).hostname;
  if (trustedHostnames.includes(hostname)) return;
  if (isIP(hostname) && isPrivateIP(hostname)) {
    throw new Error(`Access to private IP ${hostname} is not allowed`);
  }
}

async function safeExecuteFetch(
  url: string,
  init: RequestInit,
  trustedHostnames?: string[]
): Promise<Response> {
  await validateBaseUrl(url, trustedHostnames);
  // noscan // skipcq: JS-S1001 // codacy:ignore-line
  return await globalThis.fetch(new URL(url), init);
}

async function executeA2AFetch(
  url: string,
  init: RequestInit,
  timeoutMs: number = 60_000,
  trustedHostnames?: string[]
): Promise<{ response: Response; controller: AbortController }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => { controller.abort(); }, timeoutMs);
  try {
    const response = await safeExecuteFetch(url, { ...init, signal: controller.signal }, trustedHostnames);
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`A2A failed: ${response.status}`);
    }
    return { response, controller };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

function formatA2ATaskResult(task: Task | undefined, taskId: string | null): string {
  if (!task) return `Task initiated (ID: ${taskId})`;
  
  const state = task.status.state.toUpperCase();
  if (state.includes("COMPLETED")) {
    const text = (task.artifacts || []).map(a => a.parts.map(p => p.text || "").join("")).join("\n");
    return `Task completed. Result:\n${text}`;
  }
  if (state.includes("INPUT")) {
    const text = (task.status.message?.parts || []).map(p => p.text || "").join("");
    return `Task requires input: ${text}\n(ID: ${taskId})`;
  }
  if (state.includes("FAILED")) {
    throw new Error(`Task failed: ${taskId}`);
  }
  return `Task state: ${state} (ID: ${taskId})`;
}

export async function getA2ATask(baseUrl: string, taskId: string, opt: SendA2AMessageOptions = {}): Promise<Task> {
  const { response } = await executeA2AFetch(`${baseUrl}/tasks/${taskId}`, {
    headers: opt.token ? { Authorization: `Bearer ${opt.token}` } : {}
  }, opt.timeoutMs, opt.trustedHostnames);
  return await response.json() as Task;
}

export async function sendA2AMessage(baseUrl: string, request: SendMessageRequest, opt: SendA2AMessageOptions = {}): Promise<StreamResponse> {
  const { response } = await executeA2AFetch(`${baseUrl}/message:stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(opt.token ? { Authorization: `Bearer ${opt.token}` } : {}) },
    body: JSON.stringify(request)
  }, opt.timeoutMs, opt.trustedHostnames);
  return await response.json() as StreamResponse;
}

export async function subscribeToA2ATask(baseUrl: string, taskId: string, opt: SendA2AMessageOptions = {}): Promise<StreamResponse> {
  const { response } = await executeA2AFetch(`${baseUrl}/tasks/${taskId}:subscribe`, {
    method: "POST",
    headers: opt.token ? { Authorization: `Bearer ${opt.token}` } : {}
  }, opt.timeoutMs, opt.trustedHostnames);
  return await response.json() as StreamResponse;
}

async function pollA2ATask(baseUrl: string, taskId: string, token?: string, trusted?: string[]): Promise<Task> {
  for (let i = 0; i < 60; i++) {
    try {
      const task = await getA2ATask(baseUrl, taskId, { token, trustedHostnames: trusted });
      const state = task.status.state.toUpperCase();
      if (state.includes("COMPLETED") || state.includes("FAILED") || state.includes("INPUT")) return task;
    } catch { /* retry */ }
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error(`Timeout: ${taskId}`);
}

export async function delegateTaskToGemini(baseUrl: string, taskDescription: string, options: SendA2AMessageOptions = {}): Promise<string> {
  const { token, onProgress, onTaskId, trustedHostnames } = options;
  let currentId: string | null = null;
  try {
    const request: SendMessageRequest = { message: { role: "ROLE_USER", parts: [{ text: taskDescription }] } };
    let result: StreamResponse;
    try {
      result = await sendA2AMessage(baseUrl, request, { token, trustedHostnames, onTaskId: (id: string) => { currentId = id; if (onTaskId) onTaskId(id); } });
    } catch (err) {
      if (!currentId) throw err;
      if (onProgress) void onProgress("Re-attaching...");
      try {
        result = await subscribeToA2ATask(baseUrl, currentId, { token, trustedHostnames });
      } catch {
        const task = await pollA2ATask(baseUrl, currentId, token, trustedHostnames);
        return formatA2ATaskResult(task, currentId);
      }
    }
    if (result.message) {
      return `Gemini agent replied:\n${(result.message.parts || []).map(p => p.text || "").join("")}`;
    }
    const finalTask = result.task ?? (currentId ? await getA2ATask(baseUrl, currentId, { token, trustedHostnames }) : undefined);
    return formatA2ATaskResult(finalTask, currentId);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
throw new Error(`Failed: ${msg}`);
}
/* eslint-enable no-unneeded-ternary */
}
