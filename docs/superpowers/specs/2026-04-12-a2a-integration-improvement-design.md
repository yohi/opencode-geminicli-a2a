# A2A Integration and Agent Execution Infrastructure Improvement Design

## 1. Overview
This document outlines improvements to the Gemini CLI's A2A (Agent-to-Agent) integration and the core agent execution logic. The goal is to enhance reliability, data persistence, security, and type safety across the system.

## 2. Goals
- Eliminate redundant terminal status updates in the agent executor.
- Ensure task history and artifacts are preserved during task serialization.
- Sanitize logs to prevent leaking sensitive information (prompts, code).
- Isolate task-specific environment variables to prevent race conditions during concurrent execution.
- Strengthen stream response validation and completion logic in the A2A client.
- Improve conversation context by including all message roles in the model prompt.

## 3. Design Specifications

### 3.1. Agent Executor (`docs/patches/executor.ts.fixed`)

#### 3.1.1. Terminal Update Guard
Introduce a `terminalUpdateSent` flag within the `execute` method's scope.
- **Logic**: 
  - Initialize `terminalUpdateSent = false`.
  - Set `terminalUpdateSent = true` immediately after calling `currentTask.setTaskStateAndPublishUpdate(...)` in the `all-tools-cancelled` branch.
  - In the common epilogue (finally block), wrap the call to `currentTask.setTaskStateAndPublishUpdate(...)` with an `if (!terminalUpdateSent)` check.
- **Benefit**: Prevents duplicate `final: true` events from being sent to the client.

#### 3.1.2. Data Persistence in `toSDKTask()`
Modify the `toSDKTask()` method to correctly map existing task data.
- **Change**: Replace `history: []` and `artifacts: []` with `history: this.task.history` and `artifacts: this.task.artifacts`.
- **Benefit**: Preserves persisted task results, allowing for consistent task re-attachment and retrieval.

#### 3.1.3. Log Sanitization
Refactor logging to avoid sensitive data exposure.
- **userMessage Logging**: Log only `taskId` and `messageId` instead of the full `userMessage` object.
- **Event Logging**: Update the `eventBus.on('event', ...)` handler to log only `event.type` and relevant metadata (e.g., `timestamp`), redacting the full event body which may contain code or prompts.
- **Benefit**: Increases security by preventing sensitive user data from being written to plain-text logs.

#### 3.1.4. Task-Scoped Configuration (`getConfig`)
Eliminate global state mutations in the configuration loading process.
- **Refactoring**: 
  - Update `loadEnvironment()` (or equivalent) to return an environment object instead of mutating `process.env`.
  - Pass the resolved workspace-specific `env` object explicitly to `loadConfig(...)`.
- **Benefit**: Prevents race conditions when multiple tasks are being created or reconstructed concurrently.

### 3.2. A2A Client (`src/client.ts`)

#### 3.2.1. Strict Stream Completion Logic
Ensure the client correctly handles unexpected stream endings.
- **Change**: If the stream ends without a formal terminal event (`task`, `statusUpdate`, or `message`), reject the promise with an `Unexpected end of stream` error, even if `receivedAnyText` is true.
- **Benefit**: Prevents partial or corrupted outputs from being treated as successful completions.

#### 3.2.2. Final Content Emission
Ensure all received content is forwarded to the user before closing.
- **Change**: When a `typedData.message` terminal event is received, iterate through its `parts` and invoke the `onProgress` callback for each part before calling `controller.abort()`.
- **Benefit**: Guarantees that the final bits of text-delta are visible to the user.

#### 3.2.3. Enhanced `isValidStreamResponse` Validation
Perform deep structure checks on incoming SSE events.
- **Validation Rules**:
  - `artifactUpdate`: Ensure `artifact.parts` exists and is an array.
  - `statusUpdate`: Ensure `status.state` is a valid string/enum.
  - `message`: Ensure `parts` exist and are valid.
- **Benefit**: Prevents `TypeError` in downstream logic due to malformed server responses.

#### 3.2.4. Status Normalization (Case-Insensitive)
Normalize status string comparisons.
- **Change**: Use `.toLowerCase()` when comparing status states (e.g., `TASK_STATE_COMPLETED` vs `completed`).
- **Benefit**: Robustly handles variations in status casing between different A2A protocol versions or implementations.

### 3.3. Provider Integration (`src/index.ts`)

#### 3.3.1. Comprehensive Prompt Construction
Include all conversation roles in the delegated prompt.
- **Logic**: Iterate over `params.prompt`, concatenating content parts from `system`, `assistant`, and `user` messages.
- **Format**: Prefix each message with its role (e.g., `System: ...`, `Assistant: ...`, `User: ...`) to preserve conversation context for the backend agent.
- **Benefit**: Significantly improves the quality of multi-turn conversations and adherence to system instructions.

## 4. Testing Strategy
- **Unit Tests**: Add tests for `isValidStreamResponse` with various malformed payloads.
- **Integration Tests**: Verify that multiple concurrent `getConfig` calls resolve correctly without clobbering each other.
- **Manual Verification**: Confirm that the final message parts are correctly displayed in the CLI output.
