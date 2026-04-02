# A2A Streaming Support Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Switch the A2A client from polling `/message:send` to parsing a Server-Sent Events (SSE) stream from `/message:stream` using `eventsource-parser`.

**Architecture:** We will update `sendA2AMessage` in `src/client.ts` to connect to `/message:stream` and read the `response.body` stream. We'll use `eventsource-parser` to parse chunks. As we receive events (`statusUpdate`, `artifactUpdate`), we will invoke an `onProgress` callback. We will return the accumulated result when the `task` event with a terminal state is received. We'll update `src/index.ts` to provide the callback and print real-time updates.

**Tech Stack:** TypeScript, Bun (for testing), `eventsource-parser`

---

## Tasks

### Task 1: Add `eventsource-parser` dependency

**Files:**
- Modify: `package.json`

**Step 1: Install dependency**

Run: `bun add eventsource-parser`
Expected: `package.json` and `bun.lock` are updated.

**Step 2: Commit**

```bash
git add package.json bun.lock
git commit -m "build: add eventsource-parser dependency"
```

---

### Task 2: Update `client.test.ts` with SSE Mock and failing test

**Files:**
- Modify: `tests/client.test.ts`
- Modify: `src/client.ts` (to add optional `onProgress` callback signature)

**Step 1: Update signature in `src/client.ts`**

Add an `onProgress` callback parameter to `sendA2AMessage`:

```typescript
export async function sendA2AMessage(
  baseUrl: string,
  request: SendMessageRequest,
  token?: string,
  onProgress?: (text: string) => void
): Promise<StreamResponse> {
```

**Step 2: Write failing test in `tests/client.test.ts`**

Update the first test to simulate an SSE stream on `/message:stream` instead of a single JSON on `/message:send`.

```typescript
test("sendA2AMessage should parse SSE stream and trigger onProgress", async () => {
  const server = Bun.serve({
    port: 0,
    fetch(req) {
      if (req.method === "POST" && new URL(req.url).pathname === "/message:stream") {
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(`data: {"statusUpdate": {"taskId": "task-1", "status": {"state": "TASK_STATE_WORKING"}}}\n\n`));
            controller.enqueue(new TextEncoder().encode(`data: {"artifactUpdate": {"taskId": "task-1", "artifact": {"artifactId": "art-1", "parts": [{"text": "chunk1"}]}}}\n\n`));
            controller.enqueue(new TextEncoder().encode(`data: {"artifactUpdate": {"taskId": "task-1", "artifact": {"artifactId": "art-1", "parts": [{"text": "chunk2"}]}}}\n\n`));
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
    expect(accumulated).toBe("chunk1chunk2");
  } finally {
    server.stop();
  }
});
```

**Step 3: Fix other tests in `tests/client.test.ts`**

Ensure other tests use `/message:stream` and return valid SSE text (not bare JSON) so they don't break unexpectedly if we assume standard format.
For example, the auth test needs to respond with:
`data: {"message": {"role": "ROLE_AGENT", "parts": [{"text": "ok"}]}}\n\n`
Wait, for this step, just run the tests to verify the new test fails.

Run: `bun test tests/client.test.ts`
Expected: FAIL (because `src/client.ts` still points to `/message:send` and expects pure JSON).

**Step 4: Commit**

```bash
git add tests/client.test.ts src/client.ts
git commit -m "test: add SSE stream test case"
```

---

### Task 3: Implement SSE Stream Parsing in `client.ts`

**Files:**
- Modify: `src/client.ts`

**Step 1: Write the minimal implementation**

Update `sendA2AMessage` to:
1. Fetch from `/message:stream`.
2. Ensure `response.body` exists.
3. Import `createParser` from `eventsource-parser`.
4. Read the stream using an async iterator on the body.
5. Feed chunks into the parser.
6. When `event.data` is parsed, check `isValidStreamResponse(data)`.
7. Call `onProgress` if `artifactUpdate` has text.
8. Resolve and return the final `Task` if `task` with terminal state arrives.

*(Implementation details will be handled during execution. Need to use `for await (const chunk of response.body)` and decode it.)*

**Step 2: Run test to verify it passes**

Run: `bun test tests/client.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/client.ts
git commit -m "feat: implement SSE streaming using eventsource-parser"
```

---

### Task 4: Integrate Progress Reporting in `index.ts`

**Files:**
- Modify: `src/index.ts`

**Step 1: Write the failing test or verify manually**

Currently there are no unit tests for `src/index.ts` mentioned. Assuming no test exists, we just write the implementation.

**Step 2: Write minimal implementation**

Update `execute({ taskDescription })`:
Pass the `onProgress` callback to `sendA2AMessage`.
In `onProgress`, use `process.stdout.write(text)` to output the text to the CLI.

```typescript
            const response = await sendA2AMessage(
              baseUrl,
              {
                message: {
                  role: "ROLE_USER",
                  parts: [{ text: taskDescription }]
                }
              },
              token,
              (text) => {
                process.stdout.write(text);
              }
            );

            // Accumulation happens in client.ts, but `execute` needs to return the full text.
            // Actually, we should accumulate it here or let `client.ts` return it.
            // If `client.ts` doesn't build the full artifact automatically, `execute` does it based on `response.task.artifacts`.
```

**Step 3: Run typescript check to verify it passes**

Run: `bun run tsc --noEmit`
Expected: PASS

**Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: surface real-time A2A progress to stdout"
```
