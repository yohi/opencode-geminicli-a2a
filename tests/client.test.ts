import { expect, test } from "bun:test";
import { sendA2AMessage, subscribeToA2ATask, getA2ATask } from "../src/client";

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
          id: "task-456",
          status: { state: "TASK_STATE_WORKING" }
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
      .rejects.toThrow("A2A GetTask failed: 404 Not Found");
  } finally {
    server.stop();
  }
});

test("sendA2AMessage should ignore non-string taskId in message and not call onTaskId", async () => {
  let taskIdCalled: string | null = null;
  const server = Bun.serve({
    port: 0,
    fetch() {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"message": {"role": "ROLE_AGENT", "parts": [{"text": "hello"}], "taskId": 123}}\n\n'));
          controller.close();
        }
      });
      return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
    },
  });

  try {
    await sendA2AMessage(`http://localhost:${server.port}`, { message: { role: "ROLE_USER", parts: [] } }, {
      onTaskId: (id) => { taskIdCalled = id; }
    });
    expect(taskIdCalled).toBeNull();
  } finally {
    server.stop();
  }
});

test("sendA2AMessage should accept string taskId in message and call onTaskId", async () => {
  let taskIdCalled: string | null = null;
  const server = Bun.serve({
    port: 0,
    fetch() {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"message": {"role": "ROLE_AGENT", "parts": [{"text": "hello"}], "taskId": "task-abc"}}\n\n'));
          controller.close();
        }
      });
      return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
    },
  });

  try {
    await sendA2AMessage(`http://localhost:${server.port}`, { message: { role: "ROLE_USER", parts: [] } }, {
      onTaskId: (id) => { taskIdCalled = id; }
    });
    expect(taskIdCalled).toBe("task-abc");
  } finally {
    server.stop();
  }
});

test("sendA2AMessage should ignore empty or whitespace taskId and call onTaskId only with first real ID", async () => {
  let capturedTaskIds: string[] = [];
  const server = Bun.serve({
    port: 0,
    fetch() {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"statusUpdate": {"taskId": "  ", "status": {"state": "TASK_STATE_WORKING"}}}\n\n'));
          controller.enqueue(new TextEncoder().encode('data: {"statusUpdate": {"taskId": "", "status": {"state": "TASK_STATE_WORKING"}}}\n\n'));
          controller.enqueue(new TextEncoder().encode('data: {"statusUpdate": {"taskId": "task-real", "status": {"state": "TASK_STATE_WORKING"}}}\n\n'));
          controller.enqueue(new TextEncoder().encode('data: {"statusUpdate": {"taskId": "task-ignored", "status": {"state": "TASK_STATE_COMPLETED"}}}\n\n'));
          controller.close();
        }
      });
      return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
    },
  });

  try {
    await sendA2AMessage(`http://localhost:${server.port}`, { message: { role: "ROLE_USER", parts: [] } }, {
      onTaskId: (id) => { capturedTaskIds.push(id); }
    });
    expect(capturedTaskIds).toEqual(["task-real"]);
  } finally {
    server.stop();
  }
});
