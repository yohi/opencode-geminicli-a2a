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
    prune?(): void;
}

interface InMemorySessionEntry {
    session: A2ASession;
    lastAccessedAt: number;
}

export class InMemorySessionStore implements SessionStore {
    private sessions = new Map<string, InMemorySessionEntry>();
    private ttlMs?: number;
    private maxEntries?: number;

    constructor(options?: { ttlMs?: number; maxEntries?: number }) {
        this.ttlMs = options?.ttlMs;
        this.maxEntries = options?.maxEntries;
    }

    private isExpired(entry: InMemorySessionEntry): boolean {
        if (this.ttlMs === undefined) return false;
        return Date.now() - entry.lastAccessedAt > this.ttlMs;
    }

    private evictIfNeeded(): void {
        if (this.maxEntries !== undefined && this.sessions.size > this.maxEntries) {
            // Map iteration yields elements in insertion order (oldest first due to LRU logic)
            const oldestKey = this.sessions.keys().next().value;
            if (oldestKey !== undefined) {
                this.sessions.delete(oldestKey);
            }
        }
    }

    get(sessionId: string): A2ASession {
        const entry = this.sessions.get(sessionId);
        if (entry) {
            if (this.isExpired(entry)) {
                this.sessions.delete(sessionId);
                return {};
            }
            entry.lastAccessedAt = Date.now();
            // Re-insert to maintain LRU order
            this.sessions.delete(sessionId);
            this.sessions.set(sessionId, entry);
            return entry.session;
        }
        return {};
    }

    update(sessionId: string, patch: Partial<A2ASession>): void {
        let entry = this.sessions.get(sessionId);

        if (entry && this.isExpired(entry)) {
            this.sessions.delete(sessionId);
            entry = undefined;
        }

        if (entry) {
            entry.session = { ...entry.session, ...patch };
            entry.lastAccessedAt = Date.now();
            // Re-insert to maintain LRU order
            this.sessions.delete(sessionId);
            this.sessions.set(sessionId, entry);
        } else {
            this.sessions.set(sessionId, {
                session: patch,
                lastAccessedAt: Date.now()
            });
            this.evictIfNeeded();
        }
    }

    delete(sessionId: string): void {
        this.sessions.delete(sessionId);
    }

    clear(): void {
        this.sessions.clear();
    }

    prune(): void {
        if (this.ttlMs === undefined) return;
        const now = Date.now();
        for (const [key, entry] of this.sessions.entries()) {
            if (now - entry.lastAccessedAt > this.ttlMs) {
                this.sessions.delete(key);
            }
        }
    }
}
