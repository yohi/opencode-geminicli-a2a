import { describe, it, expect, beforeEach } from 'vitest';
import { InMemorySessionStore } from './session';

describe('InMemorySessionStore', () => {
    let store: InMemorySessionStore;

    beforeEach(() => {
        store = new InMemorySessionStore();
    });

    it('should return empty object for new session', () => {
        expect(store.get('session1')).toEqual({});
    });

    it('should update and get session data', () => {
        store.update('session1', { contextId: 'ctx-123', lastFinishReason: 'stop' });
        expect(store.get('session1')).toEqual({
            contextId: 'ctx-123',
            lastFinishReason: 'stop'
        });
    });

    it('should partially update session data', () => {
        store.update('session2', { contextId: 'ctx-456' });
        store.update('session2', { taskId: 'task-789' });

        expect(store.get('session2')).toEqual({
            contextId: 'ctx-456',
            taskId: 'task-789'
        });
    });

    it('should isolate different sessions', () => {
        store.update('sessionA', { contextId: 'ctx-A' });
        store.update('sessionB', { contextId: 'ctx-B' });

        expect(store.get('sessionA').contextId).toBe('ctx-A');
        expect(store.get('sessionB').contextId).toBe('ctx-B');
    });

    it('should delete a session', () => {
        store.update('session3', { contextId: 'ctx-999' });
        store.delete('session3');

        // Accessing deleted session creates a new empty one
        expect(store.get('session3')).toEqual({});
    });

    it('should clear all sessions', () => {
        store.update('s1', { contextId: 'c1' });
        store.update('s2', { contextId: 'c2' });

        store.clear();

        expect(store.get('s1')).toEqual({});
        expect(store.get('s2')).toEqual({});
    });
});
