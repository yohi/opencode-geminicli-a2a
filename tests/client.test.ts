import { expect, test, describe } from "bun:test";
import { sendA2AMessage, subscribeToA2ATask, getA2ATask } from "../src/client";
import { geminiA2aPlugin } from "../src/index";

describe("Client Functionality", () => {
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
      const chunks: string[] = [];
      const result = await sendA2AMessage(
        `http://localhost:${server.port}`,
        { message: { role: "ROLE_USER", parts: [{text: "hello"}] } },
        {
          onProgress: (text) => {
            accumulated += text;
            chunks.push(text);
          }
        }
      );

      expect(result.task?.status.state).toBe("TASK_STATE_COMPLETED");
      expect(accumulated).toBe("chunk1chunk2chunk3");
      expect(chunks).toEqual(["chunk1", "chunk2", "chunk3"]);
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
      await sendA2AMessage(`http://localhost:${server.port}`, { message: { role: "ROLE_USER", parts: [] } }, { token: "secret-token" });
      expect(authHeader).toBe("Bearer secret-token");
    } finally {
      server.stop();
    }
  });

  test("sendA2AMessage sends Authorization header if legacy string token is provided", async () => {
    let authHeader = "";
    const server = Bun.serve({
      port: 0,
      fetch(req) {
        authHeader = req.headers.get("Authorization") || "";
        return new Response(`data: {"message": {"role": "ROLE_AGENT", "parts": [{"text": "ok"}]}}\n\n`, { headers: { "Content-Type": "text/event-stream" } });
      },
    });

    try {
      await sendA2AMessage(`http://localhost:${server.port}`, { message: { role: "ROLE_USER", parts: [] } }, "secret-token-legacy");
      expect(authHeader).toBe("Bearer secret-token-legacy");
    } finally {
      server.stop();
    }
  });

  test("sendA2AMessage throws when stream contains malformed JSON", async () => {
    const server = Bun.serve({
      port: 0,
      fetch() {
        return new Response("data: not a json object\n\n", { status: 200, headers: { "Content-Type": "text/event-stream" } });
      },
    });

    try {
      await expect(sendA2AMessage(`http://localhost:${server.port}`, { message: { role: "ROLE_USER", parts: [] } })).rejects.toThrow(/Failed to parse SSE event data: not a json object/);
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
      await expect(sendA2AMessage(`http://localhost:${server.port}`, { message: { role: "ROLE_USER", parts: [] } }, { timeoutMs: 50 })).rejects.toThrow("A2A Request timeout: Request took longer than 50ms");
    } finally {
      server.stop();
    }
  });

  test("sendA2AMessage throws on timeout during stream reading", async () => {
    const server = Bun.serve({
      port: 0,
      fetch(req) {
        const stream = new ReadableStream({
          start(controller) {
            setTimeout(() => {
              try {
                controller.enqueue(new TextEncoder().encode(`data: {"statusUpdate": {"taskId": "task-1", "status": {"state": "TASK_STATE_WORKING"}}}\n\n`));
                controller.close();
              } catch (e) {}
            }, 100);
          }
        });
        return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
      },
    });

    try {
      await expect(sendA2AMessage(`http://localhost:${server.port}`, { message: { role: "ROLE_USER", parts: [] } }, { timeoutMs: 50 })).rejects.toThrow("A2A Request timeout: Request took longer than 50ms");
    } finally {
      server.stop();
    }
  });

  test("sendA2AMessage should call onTaskId when taskId is first seen", async () => {
    const server = Bun.serve({
      port: 0,
      fetch(req) {
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(`data: {"statusUpdate": {"taskId": "task-abc", "status": {"state": "TASK_STATE_WORKING"}}}\n\n`));
            controller.enqueue(new TextEncoder().encode(`data: {"statusUpdate": {"taskId": "task-abc", "status": {"state": "TASK_STATE_COMPLETED"}}}\n\n`));
            controller.close();
          }
        });
        return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
      },
    });

    try {
      let capturedTaskId = "";
      let callCount = 0;
      await sendA2AMessage(
        `http://localhost:${server.port}`,
        { message: { role: "ROLE_USER", parts: [] } },
        {
          onTaskId: (id) => {
            capturedTaskId = id;
            callCount++;
          }
        }
      );
      expect(capturedTaskId).toBe("task-abc");
      expect(callCount).toBe(1); // Should only be called once
    } finally {
      server.stop();
    }
  });

  test("subscribeToA2ATask should process stream successfully", async () => {
    const server = Bun.serve({
      port: 0,
      fetch(req) {
        if (req.method === "POST" && new URL(req.url).pathname === "/tasks/task-123:subscribe") {
          const stream = new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(`data: {"statusUpdate": {"taskId": "task-123", "status": {"state": "TASK_STATE_COMPLETED"}}}\n\n`));
              controller.close();
            }
          });
          return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
        }
        return new Response("Not Found", { status: 404 });
      },
    });

    try {
      let capturedTaskId = "";
      const result = await subscribeToA2ATask(
        `http://localhost:${server.port}`,
        "task-123",
        {
          onTaskId: (id) => { capturedTaskId = id; }
        }
      );
      expect(result.statusUpdate?.status.state).toBe("TASK_STATE_COMPLETED");
      expect(capturedTaskId).toBe("task-123");
    } finally {
      server.stop();
    }
  });

  test("getA2ATask should fetch task successfully", async () => {
    const server = Bun.serve({
      port: 0,
      fetch(req) {
        if (req.method === "GET" && new URL(req.url).pathname === "/tasks/task-456") {
          return new Response(JSON.stringify({
            task: {
              id: "task-456",
              status: { state: "TASK_STATE_WORKING" }
            }
          }), { headers: { "Content-Type": "application/json" } });
        }
        return new Response("Not Found", { status: 404 });
      },
    });

    try {
      const task = await getA2ATask(`http://localhost:${server.port}`, "task-456");
      expect(task.id).toBe("task-456");
      expect(task.status.state).toBe("TASK_STATE_WORKING");
    } finally {
      server.stop();
    }
  });

  test("getA2ATask should throw on 404 response", async () => {
    const server = Bun.serve({
      port: 0,
      fetch() {
        return new Response("Not Found", { status: 404, statusText: "Not Found" });
      },
    });
    try {
      await expect(getA2ATask(`http://localhost:${server.port}`, "no-such-task"))
        .rejects.toThrow("A2A Fetch Task failed: 404 Not Found");
    } finally {
      server.stop();
    }
  });

  test("geminiA2aPlugin should recover via polling when streaming and subscribe fail", async () => {
    let pollCount = 0;
    const server = Bun.serve({
      port: 0,
      fetch(req) {
        const url = new URL(req.url);
        if (url.pathname === "/message:stream") {
          const stream = new ReadableStream({
            async start(controller) {
              controller.enqueue(new TextEncoder().encode(`data: {"statusUpdate": {"taskId": "task-recovery", "status": {"state": "TASK_STATE_WORKING"}}}\n\n`));
              await new Promise(r => setTimeout(r, 10));
              controller.error(new Error("Streaming connection lost"));
            }
          });
          return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
        }
        if (url.pathname === "/tasks/task-recovery:subscribe") {
          return new Response("Subscribe failed", { status: 500, statusText: "Internal Server Error" });
        }
        if (url.pathname === "/tasks/task-recovery") {
          pollCount++;
          if (pollCount < 3) {
            return new Response(JSON.stringify({
              task: {
                id: "task-recovery",
                status: { state: "TASK_STATE_WORKING" }
              }
            }), { headers: { "Content-Type": "application/json" } });
          } else {
            return new Response(JSON.stringify({
              task: {
                id: "task-recovery",
                status: { state: "TASK_STATE_COMPLETED" },
                artifacts: [{ artifactId: "art-1", parts: [{ text: "Recovered result" }] }]
              }
            }), { headers: { "Content-Type": "application/json" } });
          }
        }
        return new Response("Not Found", { status: 404 });
      },
    });

    try {
      const plugin = await geminiA2aPlugin({}, { baseUrl: `http://localhost:${server.port}`, pollIntervalMs: 1 });
      const result = await plugin.tool.delegate_to_gemini.execute({ taskDescription: "test recovery" });

      expect(pollCount).toBe(3);
      expect(result).toBe("Task completed by Gemini agent. Result:\nRecovered result");
    } finally {
      server.stop();
    }
  });
});

describe("SSRF Protection (validateBaseUrl)", () => {
  test("should reject external hostname when trustedHostnames is empty", async () => {
    await expect(sendA2AMessage("https://example.com", { message: { role: "ROLE_USER", parts: [] } }))
      .rejects.toThrow(/is external but no trusted hostnames were provided/);
  });

  test("should reject hostname not in trustedHostnames", async () => {
    await expect(sendA2AMessage("https://malicious.com", { message: { role: "ROLE_USER", parts: [] } }, { trustedHostnames: ["trusted.com"] }))
      .rejects.toThrow(/is not in the trusted allowlist/);
  });

  test("should reject private IP addresses (SSRF targets) via allowlist check", async () => {
    const privateIps = [
      "http://10.0.0.1",
      "http://172.16.0.1",
      "http://192.168.1.1",
      "http://169.254.169.254",
    ];

    for (const url of privateIps) {
      await expect(sendA2AMessage(url, { message: { role: "ROLE_USER", parts: [] } }, { trustedHostnames: ["anything"] }))
        .rejects.toThrow(/is not in the trusted allowlist/);
    }
  });

  test("should accept localhost by default", async () => {
     try {
       await sendA2AMessage("http://localhost:9999", { message: { role: "ROLE_USER", parts: [] } });
     } catch (e: any) {
       expect(e.message).not.toContain("Hostname 'localhost' is external");
     }
  });
});
