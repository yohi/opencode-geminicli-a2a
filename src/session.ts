export interface A2ASession {
    contextId?: string;
    taskId?: string;
    lastFinishReason?: string;
}

export interface SessionStore {
    get(sessionId: string): A2ASession;
    update(sessionId: string, patch: Partial<A2ASession>): void;
    delete(sessionId: string): void;
    clear(): void;
}

export class InMemorySessionStore implements SessionStore {
    private sessions = new Map<string, A2ASession>();

    get(sessionId: string): A2ASession {
        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, {});
        }
        return this.sessions.get(sessionId)!;
    }

    update(sessionId: string, patch: Partial<A2ASession>): void {
        const current = this.get(sessionId);
        this.sessions.set(sessionId, { ...current, ...patch });
    }

    delete(sessionId: string): void {
        this.sessions.delete(sessionId);
    }

    clear(): void {
        this.sessions.clear();
    }
}
