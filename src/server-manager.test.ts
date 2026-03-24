import { describe, it, expect, vi, beforeEach } from 'vitest';
import EventEmitter from 'node:events';
import { createConnection } from 'node:net';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { ServerManager } from './server-manager';

vi.mock('node:net', () => ({
    createConnection: vi.fn(),
}));

vi.mock('node:child_process', () => ({
    spawn: vi.fn(),
    exec: vi.fn((cmd, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        callback(null, '/fake/global/node_modules\n', '');
    }),
}));

vi.mock('node:fs', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:fs')>();
    return {
        ...actual,
        existsSync: vi.fn(),
    };
});

describe('ServerManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (ServerManager as any).instance = undefined;
        vi.mocked(existsSync).mockReturnValue(true);
    });

    it('should be a singleton and support resetting', async () => {
        const sm1 = ServerManager.getInstance();
        const sm2 = ServerManager.getInstance();
        expect(sm1).toBe(sm2);
        
        ServerManager._reset();
        const sm3 = ServerManager.getInstance();
        expect(sm3).not.toBe(sm1);
    });

    it('should provide release function when ensureRunning is called', async () => {
        const port = 9999;
        const host = '127.0.0.1';
        const modelId = 'test-model';
        const config = { serverPath: '/fake/path' };

        const mockProcess = new EventEmitter() as any;
        mockProcess.stdout = new EventEmitter();
        mockProcess.stderr = new EventEmitter();
        mockProcess.kill = vi.fn();
        vi.mocked(spawn).mockReturnValue(mockProcess as any);

        vi.mocked(createConnection).mockImplementation(() => {
            const socket = new EventEmitter() as any;
            socket.destroy = vi.fn();
            socket.setTimeout = vi.fn();
            setTimeout(() => socket.emit('connect'), 1);
            return socket as any;
        });

        const sm = ServerManager.getInstance();
        const release = await sm.ensureRunning(port, host, modelId, config, false);
        expect(release).toBeTypeOf('function');
        await release();
    });
});
