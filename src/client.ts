import type { SendMessageRequest, StreamResponse } from "./a2a-types";

export function isValidStreamResponse(obj: any): obj is StreamResponse {
  if (!obj || typeof obj !== "object") return false;

  let hasValidField = false;

  if ("task" in obj) {
    const t = obj.task;
    if (!t || typeof t !== "object" || typeof t.id !== "string" || !t.status || typeof t.status !== "object" || typeof t.status.state !== "string") {
      return false;
    }
    hasValidField = true;
  }

  if ("message" in obj) {
    const m = obj.message;
    if (!m || typeof m !== "object" || typeof m.role !== "string" || !Array.isArray(m.parts)) {
      return false;
    }
    hasValidField = true;
  }

  if ("statusUpdate" in obj) {
    const su = obj.statusUpdate;
    if (!su || typeof su !== "object" || typeof su.taskId !== "string" || !su.status || typeof su.status !== "object" || typeof su.status.state !== "string") {
      return false;
    }
    hasValidField = true;
  }

  if ("artifactUpdate" in obj) {
    const au = obj.artifactUpdate;
    if (!au || typeof au !== "object" || typeof au.taskId !== "string" || !au.artifact || typeof au.artifact !== "object" || typeof au.artifact.artifactId !== "string") {
      return false;
    }
    hasValidField = true;
  }

  return hasValidField;
}

export async function sendA2AMessage(
  baseUrl: string,
  request: SendMessageRequest,
  token?: string
): Promise<StreamResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/a2a+json",
    "A2A-Version": "1.0",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/message:send`, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
      signal: controller.signal,
    });
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error(`A2A Request timeout: Request took longer than 30 seconds`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let errorBody = "";
    try {
      errorBody = await response.text();
    } catch (e) {
      errorBody = "Failed to read response body";
    }
    throw new Error(`A2A Request failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  let data: any;
  try {
    data = await response.json();
  } catch (e) {
    throw new Error("Invalid A2A response: Failed to parse JSON");
  }

  if (!isValidStreamResponse(data)) {
    throw new Error("Invalid A2A response: Missing required fields");
  }

  return data as StreamResponse;
}
