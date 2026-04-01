import { createParser } from "eventsource-parser";
import type { SendMessageRequest, StreamResponse } from "./a2a-types";

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

export async function sendA2AMessage(
  baseUrl: string,
  request: SendMessageRequest,
  token?: string,
  onProgress?: (text: string) => void,
  timeoutMs: number = 120_000
): Promise<StreamResponse> {
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
      } catch (e) {
        errorBody = "Failed to read response body";
      }
      throw new Error(`A2A Request failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    return await new Promise<StreamResponse>((resolve, reject) => {
      let resolved = false;

      const parser = createParser({
        onEvent(event) {
          try {
            const data = JSON.parse(event.data);
            if (!isValidStreamResponse(data)) {
              return;
            }

            if (data.artifactUpdate && onProgress) {
              const parts = data.artifactUpdate.artifact.parts;
              if (Array.isArray(parts)) {
                for (const part of parts) {
                  if (part.text) {
                    onProgress(part.text);
                  }
                }
              }
            }

            if (data.statusUpdate?.status) {
              const state = data.statusUpdate.status.state;
              if (state === "TASK_STATE_COMPLETED" || state === "TASK_STATE_FAILED") {
                if (!resolved) {
                  resolved = true;
                  controller.abort();
                  resolve(data);
                }
              }
            }

            if (data.task?.status) {
              const state = data.task.status.state;
              if (state === "TASK_STATE_COMPLETED" || state === "TASK_STATE_FAILED") {
                if (!resolved) {
                  resolved = true;
                  controller.abort();
                  resolve(data);
                }
              }
            } else if (data.message) {
              if (!resolved) {
                resolved = true;
                controller.abort();
                resolve(data);
              }
            }
          } catch (e) {
            if (process.env.NODE_ENV !== "production") {
              console.debug("Failed to parse SSE event data:", event.data, e);
            }
          }
        }
      });

      const processStream = async () => {
        try {
          const decoder = new TextDecoder();
          for await (const chunk of response.body as any) {
            if (resolved) break;
            parser.feed(decoder.decode(chunk, { stream: true }));
          }
          // Final flush
          if (!resolved) {
            parser.feed(decoder.decode());
          }
        } catch (e: any) {
          if (!resolved) {
            if (e.name !== "AbortError") {
              resolved = true;
              reject(e);
            }
          }
        }
      };

      processStream().then(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error("Stream ended without a terminal task event"));
        }
      });
    });

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
