# A2A Dynamic Model Support Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement dynamic model switching and background worker dispatching for Agent-to-Agent (A2A) interactions in the opencode-geminicli-a2a project.

**Architecture:** Introduce `DynamicModelRouter` for selecting optimal models based on task complexity. Implement `SessionStore`/`ContextManager` to serialize/deserialize session state during model transitions. Create `WorkerDispatcher` to offload tasks to headless Gemini CLI workers (`gemini -p`) running in background shell commands, utilizing ephemeral git worktrees for isolated execution.

**Tech Stack:** TypeScript, Node.js, Gemini CLI (v0.35.0 base), Jest/Vitest

---

### Task 1: Implement DynamicModelRouter

**Files:**
- Create/Modify: `src/router.ts`
- Modify: `src/router.test.ts`

**Step 1: Write the failing test**

```typescript
// src/router.test.ts
import { DynamicModelRouter } from './router';

describe('DynamicModelRouter', () => {
  it('should select a flash model for low complexity tasks', () => {
    const router = new DynamicModelRouter();
    const model = router.selectModel({ complexity: 'low' });
    expect(model).toContain('flash');
  });

  it('should select a pro model for high complexity tasks', () => {
    const router = new DynamicModelRouter();
    const model = router.selectModel({ complexity: 'high' });
    expect(model).toContain('pro');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/router.test.ts`
Expected: FAIL (DynamicModelRouter is not defined)

**Step 3: Write minimal implementation**

```typescript
// src/router.ts
export interface TaskRequirements {
  complexity: 'low' | 'medium' | 'high';
}

export class DynamicModelRouter {
  selectModel(req: TaskRequirements): string {
    if (req.complexity === 'high') {
      return 'gemini-1.5-pro';
    }
    return 'gemini-1.5-flash';
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/router.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/router.ts src/router.test.ts
git commit -m "feat: implement DynamicModelRouter for A2A model selection"
```

### Task 2: Develop A2A ContextManager

**Files:**
- Modify: `src/session.ts`
- Modify: `src/session.test.ts`

**Step 1: Write the failing test**

```typescript
// src/session.test.ts
import { Session, ContextManager } from './session';

describe('ContextManager', () => {
  it('should export and import session context state', () => {
    const manager = new ContextManager();
    const state = { history: [{ role: 'user', content: 'hello' }] };
    const exported = manager.exportContext(state);
    
    const imported = manager.importContext(exported);
    expect(imported.history[0].content).toBe('hello');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/session.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/session.ts
export interface SessionState {
  history: Array<{ role: string, content: string }>;
}

export class ContextManager {
  exportContext(state: SessionState): string {
    return JSON.stringify(state);
  }

  importContext(serialized: string): SessionState {
    return JSON.parse(serialized);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/session.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/session.ts src/session.test.ts
git commit -m "feat: implement ContextManager for serializing A2A session state"
```

### Task 3: Implement Headless WorkerDispatcher

**Files:**
- Create: `src/worker-dispatcher.ts`
- Create: `src/worker-dispatcher.test.ts`

**Step 1: Write the failing test**

```typescript
// src/worker-dispatcher.test.ts
import { WorkerDispatcher } from './worker-dispatcher';

describe('WorkerDispatcher', () => {
  it('should format headless gemini command correctly', () => {
    const dispatcher = new WorkerDispatcher();
    const cmd = dispatcher.createCommand('gemini-1.5-pro', 'Do the task');
    expect(cmd).toContain('gemini -p "Do the task"');
    expect(cmd).toContain('--model gemini-1.5-pro');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/worker-dispatcher.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/worker-dispatcher.ts
export class WorkerDispatcher {
  createCommand(modelName: string, prompt: string): string {
    return `gemini --model ${modelName} -p "${prompt}"`;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/worker-dispatcher.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/worker-dispatcher.ts src/worker-dispatcher.test.ts
git commit -m "feat: create WorkerDispatcher to build headless commands"
```

### Task 4: Implement Ephemeral Worktree Manager

**Files:**
- Create: `src/worktree-manager.ts`
- Create: `src/worktree-manager.test.ts`

**Step 1: Write the failing test**

```typescript
// src/worktree-manager.test.ts
import { WorktreeManager } from './worktree-manager';

describe('WorktreeManager', () => {
  it('should generate ephemeral worktree path based on PR number', () => {
    const manager = new WorktreeManager('/base/repo');
    const path = manager.getWorktreePath('pr-123');
    expect(path).toBe('/base/repo/.gemini/tmp/async-reviews/pr-123/worktree');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/worktree-manager.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/worktree-manager.ts
import * as path from 'path';

export class WorktreeManager {
  constructor(private basePath: string) {}

  getWorktreePath(identifier: string): string {
    return path.join(this.basePath, '.gemini/tmp/async-reviews', identifier, 'worktree');
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/worktree-manager.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/worktree-manager.ts src/worktree-manager.test.ts
git commit -m "feat: add WorktreeManager for ephemeral git workspaces"
```

### Task 5: Verify Devcontainer CI Pipeline

**Files:**
- Modify: `.github/workflows/publish.yml` (or create `.github/workflows/ci.yml`)

**Step 1: Write the CI workflow update**

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and test in Devcontainer
        uses: devcontainers/ci@v0.3
        with:
          runCmd: npm ci && npm run lint && npm run test
```

**Step 2: Commit**

```bash
git add .github/workflows/
git commit -m "chore: ensure CI pipeline runs tests inside devcontainer"
```