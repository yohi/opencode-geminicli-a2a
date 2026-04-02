# Task Polling & Continuation Implementation Plan

## Phase 1: Client Utilities (TDD)
1. **Update Options**: Add `onTaskId?: (taskId: string) => void` to `SendA2AMessageOptions` in `src/client.ts`.
2. **Implement `onTaskId`**: Modify `sendA2AMessage` to invoke `onTaskId` exactly once when `taskId` is first seen (from `statusUpdate`, `artifactUpdate`, or `task`). Add tests to verify this behavior.
3. **Implement `getA2ATask`**:
   - Write a test in `tests/client.test.ts` for a successful `GET /tasks/{taskId}` request returning a `Task`.
   - Implement `getA2ATask` in `src/client.ts`.
4. **Implement `subscribeToA2ATask`**:
   - Write a test in `tests/client.test.ts` for a successful `POST /tasks/{taskId}:subscribe` request that streams events.
   - Implement `subscribeToA2ATask` in `src/client.ts` (this will share much of its stream parsing logic with `sendA2AMessage`, so consider refactoring the parser into a shared helper function `processA2AStream`).

## Phase 2: Plugin Integration
1. **Modify `delegate_to_gemini` Tool**: Update the `execute` method in `src/index.ts` to manage the task execution lifecycle.
2. **Implement Retry & Polling Loop**:
   - Initialize `let currentTaskId: string | null = null`.
   - Call `sendA2AMessage` with `onTaskId: (id) => currentTaskId = id`.
   - If `sendA2AMessage` throws an error and `currentTaskId` is set:
     - Output: `Connection lost. Attempting to re-attach to task...`
     - Try `subscribeToA2ATask(baseUrl, currentTaskId, ...)`.
     - If `subscribeToA2ATask` throws:
       - Output: `Streaming failed. Falling back to polling...`
       - Implement a while-loop calling `getA2ATask(baseUrl, currentTaskId)` every 2000ms until the state is terminal (`TASK_STATE_COMPLETED` or `TASK_STATE_FAILED`).
3. **Handle Completion**: Ensure the final state (from stream or polling) extracts the artifacts and formats the final result for the agent appropriately.

## Phase 3: Verification
1. Run `bun run tsc --noEmit` to verify type safety.
2. Run `bun test` to ensure all unit tests pass.
3. Ensure no regressions in the existing stream handling behavior.
