import { expect, test } from "bun:test";
import { sendA2AMessage } from "../src/client";

test("sendA2AMessage should send request and parse response", async () => {
  // モックサーバーの設定
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

  const result = await sendA2AMessage(
    `http://localhost:${server.port}`,
    { message: { role: "ROLE_USER", parts: [{text: "hello"}] } }
  );

  expect(result.task?.status.state).toBe("TASK_STATE_COMPLETED");
  expect(result.task?.artifacts?.[0].parts[0].text).toBe("result");
  server.stop();
});
