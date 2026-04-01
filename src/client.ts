import type { SendMessageRequest, StreamResponse } from "./a2a-types";

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

  const response = await fetch(`${baseUrl}/message:send`, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`A2A Request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as StreamResponse;
}
