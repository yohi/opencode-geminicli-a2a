import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InMemorySessionStore, ContextManager } from './session';

describe('InMemorySessionStore', () => {
    let store: InMemorySessionStore;

    beforeEach(() => {
        store = new InMemorySessionStore();
    });

    it('should return undefined for new session', async () => {
        expect(await store.get('session1')).toBeUndefined();
    });

    it('should update and get session data', async () => {
        await store.update('session1', { contextId: 'ctx-123', lastFinishReason: 'stop' });
        expect(await store.get('session1')).toEqual({
            contextId: 'ctx-123',
            lastFinishReason: 'stop'
        });
    });

    it('should partially update session data', async () => {
        await store.update('session2', { contextId: 'ctx-456' });
        await store.update('session2', { taskId: 'task-789' });

        expect(await store.get('session2')).toEqual({
            contextId: 'ctx-456',
            taskId: 'task-789'
        });
    });

    it('should isolate different sessions', async () => {
        await store.update('sessionA', { contextId: 'ctx-A' });
        await store.update('sessionB', { contextId: 'ctx-B' });

        expect((await store.get('sessionA'))?.contextId).toBe('ctx-A');
        expect((await store.get('sessionB'))?.contextId).toBe('ctx-B');
    });

    it('should delete a session', async () => {
        await store.update('session3', { contextId: 'ctx-999' });
        await store.delete('session3');

        expect(await store.get('session3')).toBeUndefined();
    });

    it('should clear all sessions', async () => {
        await store.update('s1', { contextId: 'c1' });
        await store.update('s2', { contextId: 'c2' });

        await store.clear();

        expect(await store.get('s1')).toBeUndefined();
        expect(await store.get('s2')).toBeUndefined();
    });

    it('should reset a session via resetSession', async () => {
        await store.update('session-reset', { contextId: 'ctx-old', taskId: 'task-old', lastFinishReason: 'stop' });
        await store.resetSession('session-reset');

        expect(await store.get('session-reset')).toBeUndefined();
    });

    it('should not affect other sessions when resetting one session', async () => {
        await store.update('keep-me', { contextId: 'ctx-keep' });
        await store.update('reset-me', { contextId: 'ctx-reset' });
        await store.resetSession('reset-me');

        expect(await store.get('keep-me')).toEqual({ contextId: 'ctx-keep' });
        expect(await store.get('reset-me')).toBeUndefined();
    });

    it('should handle resetSession for non-existent session gracefully', async () => {
        // Should not throw
        await expect(store.resetSession('non-existent')).resolves.toBeUndefined();
    });
});

describe('InMemorySessionStore limits and expiration', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('should reject invalid constructor args', () => {
        expect(() => new InMemorySessionStore({ ttlMs: -1 })).toThrow(RangeError);
        expect(() => new InMemorySessionStore({ maxEntries: 0 })).toThrow(RangeError);
        expect(() => new InMemorySessionStore({ maxEntries: 1.5 })).toThrow(RangeError);
    });

    it('should evict oldest session when exceeding maxEntries', async () => {
        const store = new InMemorySessionStore({ maxEntries: 2 });
        await store.update('s1', { contextId: '1' });
        await store.update('s2', { contextId: '2' });
        await store.update('s3', { contextId: '3' }); // should evict s1

        expect(await store.get('s1')).toBeUndefined();
        expect(await store.get('s2')).toBeDefined();
        expect(await store.get('s3')).toBeDefined();
    });

    it('should expire session after ttlMs', async () => {
        const store = new InMemorySessionStore({ ttlMs: 1000 });
        await store.update('s1', { contextId: '1' });

        vi.advanceTimersByTime(500);
        expect(await store.get('s1')).toBeDefined();

        vi.advanceTimersByTime(1001);
        expect(await store.get('s1')).toBeUndefined();
    });

    it('should prune expired sessions', async () => {
        const store = new InMemorySessionStore({ ttlMs: 1000 });
        await store.update('s1', { contextId: '1' });
        await store.update('s2', { contextId: '2' });

        vi.advanceTimersByTime(1500);
        await store.update('s3', { contextId: '3' }); // Not expired

        await store.prune();

        expect(await store.get('s1')).toBeUndefined();
        expect(await store.get('s2')).toBeUndefined();
        expect(await store.get('s3')).toBeDefined();
    });

    it('get() should return a defensive copy', async () => {
        const store = new InMemorySessionStore();
        await store.update('s1', { contextId: '1' });

        const session = await store.get('s1');
        session!.contextId = 'mutated';

        const retrieved = await store.get('s1');
        expect(retrieved?.contextId).toBe('1');
    });
});

describe('ContextManager', () => {
  it('should export and import session context state', () => {
    const manager = new ContextManager();
    const state = { history: [{ role: 'user', content: 'hello' }] };
    const exported = manager.exportContext(state);
    
    const imported = manager.importContext(exported);
    expect(imported.history[0].content).toBe('hello');
  });

  it('should throw error for invalid JSON format', () => {
    const manager = new ContextManager();
    expect(() => manager.importContext('invalid-json')).toThrow('Failed to import context');
  });

  it('should throw error for invalid session state shape', () => {
    const manager = new ContextManager();
    expect(() => manager.importContext('{"foo": "bar"}')).toThrow('Invalid session state format');
  });
});
