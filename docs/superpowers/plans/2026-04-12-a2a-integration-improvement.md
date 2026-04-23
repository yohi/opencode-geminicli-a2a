# A2A Integration and Agent Execution Infrastructure Improvement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve reliability, data persistence, security, and type safety for A2A integration.

**Architecture:** Refactor the agent executor, A2A client, and AI SDK provider to use task-scoped environment variables, strict stream validation, and comprehensive prompt construction.

**Tech Stack:** TypeScript, Node.js, @ai-sdk/provider, @a2a-js/sdk

---

## Phase 1: Agent Executor Improvements (`docs/patches/executor.ts.fixed`)

### Task 1: Terminal Update Guard

**Files:**
- Modify: `docs/patches/executor.ts.fixed`

- [ ] **Step 1: Implement terminalUpdateSent guard**
Modify the `execute` method to include the flag and use it in both the `all-tools-cancelled` branch and the `finally` block.

```typescript
// docs/patches/executor.ts.fixed
async execute(requestContext: RequestContext, eventBus: ExecutionEventBus): Promise<void> {
  // ... existing setup
  let terminalUpdateSent = false;
  // ...
  if (completedTools.every((tool) => tool.status === 'cancelled')) {
    // ...
    currentTask.setTaskStateAndPublishUpdate('input-required', stateChange, undefined, undefined, true);
    terminalUpdateSent = true;
  }
  // ...
  } finally {
    if (isPrimaryExecution) {
      this.executingTasks.delete(taskId);
      if (!terminalUpdateSent) {
        currentTask.setTaskStateAndPublishUpdate('input-required', { kind: CoderAgentEvent.StateChangeEvent }, undefined, undefined, true);
      }
      // ...
    }
  }
}
```

- [ ] **Step 2: Commit**
```bash
git add docs/patches/executor.ts.fixed
git commit -m "fix(executor): add terminalUpdateSent guard to prevent duplicate status updates"
```

### Task 2: Fix Data Persistence in `toSDKTask()`

**Files:**
- Modify: `docs/patches/executor.ts.fixed`

- [ ] **Step 1: Update toSDKTask to preserve history and artifacts**
Modify the `toSDKTask` method in the `TaskWrapper` class.

```typescript
// docs/patches/executor.ts.fixed
toSDKTask(): SDKTask {
  const sdkTask: SDKTask = {
    id: this.task.id,
    contextId: this.task.contextId,
    kind: 'task',
    status: {
      state: this.task.taskState,
      timestamp: new Date().toISOString(),
    },
    metadata: setPersistedState({}, persistedState),
    history: this.task.history || [], // Preserve history
    artifacts: this.task.artifacts || [], // Preserve artifacts
  };
  // ...
}
```

- [ ] **Step 2: Commit**
```bash
git add docs/patches/executor.ts.fixed
git commit -m "fix(executor): preserve history and artifacts in toSDKTask"
```

### Task 3: Log Sanitization

**Files:**
- Modify: `docs/patches/executor.ts.fixed`

- [ ] **Step 1: Sanitize userMessage and Event logs**
Update `execute` method to redact sensitive data from logs.

```typescript
// docs/patches/executor.ts.fixed
// Replace JSON.stringify(userMessage) with metadata only
logger.info(`[CoderAgentExecutor] userMessage: id=${userMessage.messageId}, taskId=${userMessage.taskId}`);

// Update eventBus.on handler
eventBus.on('event', (event: AgentExecutionEvent) =>
  logger.info('[EventBus event]: type=', event.type, 'timestamp=', (event as any).status?.timestamp),
);
```

- [ ] **Step 2: Commit**
```bash
git add docs/patches/executor.ts.fixed
git commit -m "sec(executor): sanitize logs to prevent sensitive data leakage"
```

## Phase 2: A2A Client Improvements (`src/client.ts`)

### Task 4: Enhanced Stream Validation and Completion

**Files:**
- Modify: `src/client.ts`
- Test: `tests/client.test.ts` (or create new if needed)

- [ ] **Step 1: Strengthen isValidStreamResponse**
Update the function to check for nested field structures.

```typescript
// src/client.ts
export function isValidStreamResponse(obj: unknown): obj is StreamResponse {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, any>;
  if ("artifactUpdate" in o) {
    return !!(o.artifactUpdate?.artifact?.parts && Array.isArray(o.artifactUpdate.artifact.parts));
  }
  if ("statusUpdate" in o) {
    return !!(o.statusUpdate?.status?.state);
  }
  if ("message" in o) {
    return !!(o.message?.parts && Array.isArray(o.message.parts));
  }
  return "task" in o;
}
```

- [ ] **Step 2: Update stream completion and final message emission**
Handle `Unexpected end of stream` and ensure `onProgress` is called for `typedData.message`.

```typescript
// src/client.ts
// Inside onEvent handler for message:
if (typedData.message) {
  if (options?.onProgress && typedData.message.parts) {
    for (const part of typedData.message.parts) {
      if (part.text) options.onProgress(part.text);
    }
  }
  // ...
}

// Inside processStream completion logic:
if (streamError) {
  reject(streamError);
} else if (terminalData) {
  resolve(terminalData);
} else {
  // Reject even if receivedAnyText is true if no terminal event arrived
  reject(new Error("Unexpected end of stream: No terminal event received"));
}
```

- [ ] **Step 3: Normalize status comparisons**
Use `.toLowerCase()` for state checks.

```typescript
// src/client.ts
const state = (statusUpdate.status.state || "").toLowerCase();
if (isFinal || ["task_state_completed", "task_state_failed", "completed", "failed", "input-required"].includes(state)) {
  // ...
}
```

- [ ] **Step 4: Commit**
```bash
git add src/client.ts
git commit -m "fix(client): enhance validation, completion logic, and status normalization"
```

## Phase 3: Provider Integration Improvements (`src/index.ts`)

### Task 5: Comprehensive Prompt Construction

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Update doGenerate and doStream to include all roles**
Refactor prompt building logic.

```typescript
// src/index.ts
const buildPrompt = (prompt: LanguageModelV3CallOptions['prompt']): string => {
  return prompt.map(m => {
    const rolePrefix = m.role.charAt(0).toUpperCase() + m.role.slice(1);
    const content = m.content.map(c => c.type === "text" ? c.text : "").join("");
    return `${rolePrefix}: ${content}`;
  }).join("\n\n");
};

// Use buildPrompt in doGenerate and doStream
const promptText = buildPrompt(params.prompt);
```

- [ ] **Step 2: Commit**
```bash
git add src/index.ts
git commit -m "feat(provider): include all message roles in delegated prompt"
```
