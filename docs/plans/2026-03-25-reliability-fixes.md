# Reliability Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve reliability of provider tests, auto-confirm logic, process termination, and tool-choice mapping.

**Architecture:** Surgical fixes to `OpenCodeGeminiA2AProvider`, `ServerManager`, and `mapper.ts` to improve error handling, lifecycle management, and data consistency.

**Tech Stack:** TypeScript, Vitest, Node.js child_process.

---

### Task 1: Fix Stream Read Error Handling in Tests

**Files:**
- Modify: `src/provider.test.ts`

**Step 1: Update `catch` block in '課題2' test**

Around line 335 (in original file, line 38 in current read):
```typescript
            } catch (e: any) {
                console.error('Error during stream read:', e);
                throw e; // Add this
            }
```

**Step 2: Update `catch` block in '課題3' test**

Around line 393 (in original file, line 105 in current read):
```typescript
            } catch (e: any) {
                console.error('Error during stream read:', e);
                throw e; // Add this
            }
```

**Step 3: Run tests to verify they still pass (or fail correctly if there's an issue)**

Run: `npx vitest src/provider.test.ts`
Expected: PASS (if no errors occur during stream)

**Step 4: Commit**

```bash
git add src/provider.test.ts
git commit -m "test: rethrow errors in stream read loops"
```

---

### Task 2: Fix Lingering Timeout and Error Propagation in `Promise.race`

**Files:**
- Modify: `src/provider.test.ts`

**Step 1: Refactor `Promise.race` with `clearTimeout` and error rethrowing**

Around line 315-337 (original file):
```typescript
            let timeoutHandle: any;
            const timeout = new Promise<never>((_, reject) => 
                timeoutHandle = setTimeout(() => reject(new Error('HANG DETECTED')), 5000)
            );
            
            try {
                await Promise.race([
                    (async () => {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            parts.push(value);
                        }
                    })(),
                    timeout,
                ]);
            } catch (e: any) {
                if (e.message === 'HANG DETECTED') {
                    throw e;
                }
                // Rethrow other errors too instead of just expecting not 'HANG DETECTED'
                throw e; 
            } finally {
                clearTimeout(timeoutHandle);
            }
```

**Step 2: Run tests to verify stability**

Run: `npx vitest src/provider.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/provider.test.ts
git commit -m "test: cleanup timeout and propagate errors in Promise.race"
```

---

### Task 3: Refactor `isAutoConfirmTarget` Logic

**Files:**
- Modify: `src/provider.ts`

**Step 1: Define background agent tool names**

Add to `src/provider.ts` (if not exists) or use literals:
```typescript
const BACKGROUND_TOOLS = ['codebase_investigator', 'generalist'];
```

**Step 2: Rewrite `isAutoConfirmTarget`**

```typescript
function isAutoConfirmTarget(
    part: ExtendedFinishPart | undefined, 
    textPartCounter: number = 0, 
    autoConfirmCount: number = 0,
    maxAutoConfirm: number = 5
): boolean {
    if (!part) return false;
    if (autoConfirmCount >= maxAutoConfirm) return false;

    const internalToolNames = part.internalToolNames || [];
    const hasMetaTool = internalToolNames.some(name => META_TOOLS.includes(name));
    if (hasMetaTool) return false;

    const isBackgroundTool = internalToolNames.some(name => BACKGROUND_TOOLS.includes(name));
    const hasSpoken = textPartCounter > 0;

    if (part.coderAgentKind === 'tool-call-confirmation') {
        return part.inputRequired === true && part.hasExposedTools !== true;
    }

    if (isBackgroundTool) {
        return part.inputRequired === true && part.hasExposedTools !== true;
    }

    const isInternalRecall = part.coderAgentKind === 'internal-tool-call';
    if (isInternalRecall) {
        return !hasSpoken && part.inputRequired === true && part.hasExposedTools !== true;
    }

    return false;
}
```

**Step 3: Update `OpenCodeGeminiA2AProvider` to pass `maxAutoConfirm`**

Modify call sites of `isAutoConfirmTarget`.

**Step 4: Run tests**

Run: `npx vitest src/provider.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/provider.ts
git commit -m "refactor: improve isAutoConfirmTarget logic"
```

---

### Task 4: Implement `disposeAndWait` in `ServerManager`

**Files:**
- Modify: `src/server-manager.ts`

**Step 1: Add `disposeAndWait` method to `ServerManager`**

```typescript
    async disposeAndWait(timeoutMs: number = 5000): Promise<void> {
        const servers = Array.from(this.servers.values());
        this.dispose();

        const waitPromises = servers.map(server => {
            if (!server.process || server.process.killed) return Promise.resolve();
            return new Promise<void>((resolve) => {
                server.process?.once('exit', () => resolve());
                server.process?.once('error', () => resolve());
            });
        });

        const timeoutPromise = new Promise<void>((resolve) => {
            setTimeout(() => {
                Logger.warn(`[ServerManager] disposeAndWait timed out after ${timeoutMs}ms`);
                resolve();
            }, timeoutMs);
        });

        await Promise.race([Promise.all(waitPromises), timeoutPromise]);
    }
```

**Step 2: Update error handlers to await `disposeAndWait`**

```typescript
        const uncaughtHandler = async (err: Error) => {
            Logger.error('[ServerManager] Uncaught exception:', err);
            this.cleanupAndExit('SIGERROR' as any); // Use custom signal or just cleanup
            await this.disposeAndWait();
            process.exit(1);
        };
        const unhandledHandler = async (reason: any) => {
            Logger.error('[ServerManager] Unhandled rejection:', reason);
            this.cleanupAndExit('SIGERROR' as any);
            await this.disposeAndWait();
            process.exit(1);
        };
```
Note: Ensure `cleanupAndExit` and handlers handle `async`.

**Step 3: Run tests**

Run: `npx vitest src/server-manager.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add src/server-manager.ts
git commit -m "feat: implement disposeAndWait for graceful shutdown"
```

---

### Task 5: Apply `toolMapping` to `toolChoice` in `mapper.ts`

**Files:**
- Modify: `src/utils/mapper.ts`

**Step 1: Update `buildRequest` in `src/utils/mapper.ts`**

Around line 428-433:
```typescript
            configuration: {
                blocking: false,
                ...(mappedTools && mappedTools.length > 0 ? { tools: mappedTools } : {}),
                ...(toolChoice ? { 
                    toolChoice: (typeof toolChoice === 'string' && toolMapping?.[toolChoice]) 
                        ? toolMapping[toolChoice] 
                        : toolChoice 
                } : {}),
            },
```

**Step 2: Run tests**

Run: `npx vitest src/utils/mapper.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/utils/mapper.ts
git commit -m "fix: apply toolMapping to toolChoice"
```
