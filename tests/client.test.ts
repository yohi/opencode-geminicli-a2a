import { expect, test } from "bun:test";
import { sendA2AMessage } from "../src/client";

test("sendA2AMessage should parse SSE stream and trigger onProgress for multiple parts", async () => {
  const server = Bun.serve({
    port: 0,
    fetch(req) {
      if (req.method === "POST" && new URL(req.url).pathname === "/message:stream") {
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(`data: {"statusUpdate": {"taskId": "task-1", "status": {"state": "TASK_STATE_WORKING"}}}\n\n`));
            controller.enqueue(new TextEncoder().encode(`data: {"artifactUpdate": {"taskId": "task-1", "artifact": {"artifactId": "art-1", "parts": [{"text": "chunk1"}, {"text": "chunk2"}]}}}\n\n`));
            controller.enqueue(new TextEncoder().encode(`data: {"artifactUpdate": {"taskId": "task-1", "artifact": {"artifactId": "art-1", "parts": [{"text": "chunk3"}]}}}\n\n`));
            controller.enqueue(new TextEncoder().encode(`data: {"task": {"id": "task-1", "status": {"state": "TASK_STATE_COMPLETED"}}}\n\n`));
            controller.close();
          }
        });
        return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
      }
      return new Response("Not Found", { status: 404 });
    },
  });

  try {
    let accumulated = "";
    const result = await sendA2AMessage(
      `http://localhost:${server.port}`,
      { message: { role: "ROLE_USER", parts: [{text: "hello"}] } },
      undefined,
      (text) => { accumulated += text; }
    );

    expect(result.task?.status.state).toBe("TASK_STATE_COMPLETED");
    expect(accumulated).toBe("chunk1chunk2chunk3");
  } finally {
    server.stop();
  }
});

test("sendA2AMessage should resolve on statusUpdate terminal state", async () => {
  const server = Bun.serve({
    port: 0,
    fetch(req) {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`data: {"statusUpdate": {"taskId": "task-1", "status": {"state": "TASK_STATE_COMPLETED"}}}\n\n`));
          controller.close();
        }
      });
      return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
    },
  });

  try {
    const result = await sendA2AMessage(`http://localhost:${server.port}`, { message: { role: "ROLE_USER", parts: [] } });
    expect(result.statusUpdate?.status.state).toBe("TASK_STATE_COMPLETED");
  } finally {
    server.stop();
  }
});

test("sendA2AMessage handles server 500 error", async () => {
  const server = Bun.serve({
    port: 0,
    fetch() {
      return new Response("Internal Server Error", { status: 500, statusText: "Internal Server Error" });
    },
  });

  try {
    await expect(sendA2AMessage(`http://localhost:${server.port}`, { message: { role: "ROLE_USER", parts: [] } })).rejects.toThrow("A2A Request failed: 500 Internal Server Error - Internal Server Error");
  } finally {
    server.stop();
  }
});

test("sendA2AMessage sends Authorization header if token is provided", async () => {
  let authHeader = "";
  const server = Bun.serve({
    port: 0,
    fetch(req) {
      authHeader = req.headers.get("Authorization") || "";
      return new Response(`data: {"message": {"role": "ROLE_AGENT", "parts": [{"text": "ok"}]}}\n\n`, { headers: { "Content-Type": "text/event-stream" } });
    },
  });

  try {
    await sendA2AMessage(`http://localhost:${server.port}`, { message: { role: "ROLE_USER", parts: [] } }, "secret-token");
    expect(authHeader).toBe("Bearer secret-token");
  } finally {
    server.stop();
  }
});

test("sendA2AMessage throws on invalid JSON response", async () => {
  const server = Bun.serve({
    port: 0,
    fetch() {
      return new Response("data: not a json object\n\n", { status: 200, headers: { "Content-Type": "text/event-stream" } });
    },
  });

  try {
    // We now ignore invalid JSON parts. If only invalid parts exist, the stream ends without a terminal event.
    await expect(sendA2AMessage(`http://localhost:${server.port}`, { message: { role: "ROLE_USER", parts: [] } })).rejects.toThrow("Stream ended without a terminal task event");
  } finally {
    server.stop();
  }
});

test("sendA2AMessage throws on timeout with custom message", async () => {
  const server = Bun.serve({
    port: 0,
    fetch() {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(new Response("Delayed response", { status: 200 }));
        }, 100);
      });
    },
  });

  try {
    await expect(sendA2AMessage(`http://localhost:${server.port}`, { message: { role: "ROLE_USER", parts: [] } }, undefined, undefined, 50)).rejects.toThrow("A2A Request timeout: Request took longer than 50ms");
  } finally {
    server.stop();
  }
});
