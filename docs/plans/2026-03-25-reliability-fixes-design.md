# Reliability Fixes Design

## 1. Background & Goals
This design addresses several reliability and correctness issues identified in the current codebase:
- Test instability due to unhandled stream errors and lingering timeouts.
- Inconsistent auto-confirm logic for tool calls, especially with meta-tools and background agents.
- Potential race conditions during process termination where child processes might not be fully cleaned up before the parent exits.
- Mismatched tool names in `toolChoice` mapping.

## 2. Proposed Changes

### 2.1. Test Reliability (`src/provider.test.ts`)
- **Stream Read Catch**: Ensure all `catch` blocks in stream reading loops rethrow the error after logging. This prevents tests from proceeding with incomplete data and falsely passing.
- **Timeout Cleanup**: Store the `timeoutHandle` from `setTimeout` in `Promise.race` blocks. Use a `finally` block to call `clearTimeout(timeoutHandle)`.
- **Error Propagation**: Rethrow any exceptions caught during the `Promise.race` to ensure the test framework captures failures accurately.

### 2.2. Auto-Confirm Logic (`src/provider.ts`)
- **Refactor `isAutoConfirmTarget`**:
    1.  Add `autoConfirmCount` check against a threshold (to be passed from `OpenCodeGeminiA2AProvider` settings).
    2.  Prioritize `META_TOOLS` check: if any tool in `internalToolNames` is a meta-tool, return `false` immediately.
    3.  Inspect `internalToolNames` for background agent identifiers (e.g., `codebase_investigator`, `generalist`) instead of relying solely on `coderAgentKind`.
    4.  Apply meta-tool guards before early returns in all branches.

### 2.3. Process Termination (`src/server-manager.ts`)
- **`disposeAndWait(timeoutMs)`**: Implement this method in `ServerManager` to:
    1.  Call `this.dispose()`.
    2.  Wait for all child processes to emit 'exit' or 'error' events.
    3.  Enforce a timeout (default 5000ms) to prevent hanging.
- **Handler Updates**: Update `uncaughtHandler` and `unhandledHandler` to await `disposeAndWait()` before calling `process.exit(1)`.

### 2.4. Tool Choice Mapping (`src/utils/mapper.ts`)
- **`buildRequest`**: Apply `toolMapping` to `toolChoice` if it is a string representing a tool name.
- **Logic**: `mappedToolChoice = (typeof toolChoice === 'string' && toolMapping?.[toolChoice]) ? toolMapping[toolChoice] : toolChoice`.

## 3. Verification Plan
- Run `npm test src/provider.test.ts` to ensure stream tests are stable.
- Run `npm test src/provider.ts` (if applicable) or integration tests to verify auto-confirm behavior.
- Run `npm test src/server-manager.test.ts` to verify process cleanup.
- Run `npm test src/utils/mapper.test.ts` to verify `toolChoice` mapping.
