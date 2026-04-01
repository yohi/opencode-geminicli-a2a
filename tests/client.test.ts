import { expect, test } from "bun:test";
import { sendA2AMessage } from "../src/client";

test("sendA2AMessage should send request and parse response", async () => {
  const server = Bun.serve({
    port: 0,
    fetch(req) {
      if (req.method === "POST" && new URL(req.url).pathname === "/message:send") {
        return new Response(JSON.stringify({
          task: { id: "task-1", status: { state: "TASK_STATE_COMPLETED" }, artifacts: [{ artifactId: "art-1", parts: [{text: "result"}] }] }
        }), { headers: { "Content-Type": "application/a2a+json" } });
      }
      return new Response("Not Found", { status: 404 });
    },
  });

  try {
    const result = await sendA2AMessage(
      `http://localhost:${server.port}`,
      { message: { role: "ROLE_USER", parts: [{text: "hello"}] } }
    );

    expect(result.task?.status.state).toBe("TASK_STATE_COMPLETED");
    expect(result.task?.artifacts?.[0].parts[0].text).toBe("result");
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
      return new Response(JSON.stringify({ message: { role: "ROLE_AGENT", parts: [{text: "ok"}] } }), { headers: { "Content-Type": "application/a2a+json" } });
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
      return new Response("not a json object", { status: 200, headers: { "Content-Type": "application/a2a+json" } });
    },
  });

  try {
    await expect(sendA2AMessage(`http://localhost:${server.port}`, { message: { role: "ROLE_USER", parts: [] } })).rejects.toThrow("Invalid A2A response: Failed to parse JSON");
  } finally {
    server.stop();
  }
});
