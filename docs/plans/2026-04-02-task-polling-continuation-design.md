# Task Polling & Continuation Design

## Goal
Implement robust task continuation and fallback polling for the OpenCode Gemini CLI A2A Plugin to handle unstable long-lived HTTP streams.
This addresses "2. Task Polling & Continuation [High Priority]" from the roadmap.

## Requirements
1. If the initial `POST /message:stream` drops before a terminal state (`TASK_STATE_COMPLETED` or `TASK_STATE_FAILED`), we must recover.
2. Recovery mechanism 1 (Re-attachment): `POST /tasks/{taskId}:subscribe`.
3. Recovery mechanism 2 (Fallback Polling): `GET /tasks/{taskId}` for environments where streaming is strictly restricted or unstable.

## Analysis & Current State
Currently `sendA2AMessage` in `src/client.ts` opens a stream and waits for a terminal task state. If an error occurs (e.g., AbortError/Timeout or stream interruption), the promise rejects.
The problem is that the stream might drop *after* the server has started the task and assigned a `taskId`. In the current implementation, if the stream drops, we lose track of the task completely because the `taskId` isn't bubbled up until the very end, or it throws an error.

To recover, we need to extract the `taskId` as soon as it is available (e.g., via the first `statusUpdate` or `task` event).

## Proposed Architecture
1. **Capture `taskId` early:**
   - Add an `onTaskId?: (taskId: string) => void` callback to `SendA2AMessageOptions`.
   - Modify `sendA2AMessage` (and `subscribeToA2ATask`) to call this callback exactly once when a `taskId` is first detected from the Server-Sent Events.

2. **New Functions in `src/client.ts`:**
   - `getA2ATask(baseUrl: string, taskId: string, options?: { token?: string }): Promise<Task>`
     Sends `GET /tasks/{taskId}` and returns the task object.
   - `subscribeToA2ATask(baseUrl: string, taskId: string, options?: SendA2AMessageOptions): Promise<StreamResponse>`
     Sends `POST /tasks/{taskId}:subscribe` (SSE) and processes it identically to `sendA2AMessage`.

3. **Fallback/Retry Logic in `execute` (in `src/index.ts`):**
   - The plugin's `delegate_to_gemini` tool will maintain a `currentTaskId`.
   - It will pass `onTaskId: (id) => currentTaskId = id`.
   - If `sendA2AMessage` throws (e.g., network error or timeout) and we have a `currentTaskId`:
     - **Attempt Subscribe:** We try to `subscribeToA2ATask`. If that works and streams to completion, great.
     - **Attempt Polling:** If `subscribe` fails (e.g., stream gets aborted immediately due to network proxy not supporting SSE), we fallback to polling:
       - Loop `getA2ATask` every 2000ms until `task.status.state` is `TASK_STATE_COMPLETED` or `TASK_STATE_FAILED`.
       - Polling will not trigger `onProgress` for intermediate text chunks easily without fetching artifacts, so it acts as a robust degraded experience.

## Interface Changes
`src/a2a-types.ts`:
- No new types needed.

`src/client.ts`:
- Update `SendA2AMessageOptions` interface.
- Implement and export `getA2ATask`.
- Implement and export `subscribeToA2ATask`.

## Test Strategy
- Add unit tests for `getA2ATask` mocking the HTTP GET.
- Add unit tests for `subscribeToA2ATask` mocking the HTTP POST SSE.
- Add unit tests for `onTaskId` callback in `sendA2AMessage` and verify it triggers on first `statusUpdate` or `artifactUpdate`.
