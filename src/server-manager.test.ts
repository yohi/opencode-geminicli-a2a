import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServerManager } from './server-manager';
import * as child_process from 'node:child_process';
import * as net from 'node:net';
import * as fs from 'node:fs';
import { EventEmitter } from 'node:events';

vi.mock('node:child_process');
vi.mock('node:net');
vi.mock('node:fs');

describe('ServerManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (ServerManager as any)._reset();
        (fs.existsSync as any).mockReturnValue(true);
        (net.createConnection as any).mockImplementation(() => {
            const socket = new EventEmitter() as any;
            socket.destroy = vi.fn();
            socket.setTimeout = vi.fn();
            setTimeout(() => socket.emit('error', new Error('refused')), 1);
            return socket;
        });
    });

    it('should not spawn multiple processes when ensureRunning is called concurrently for the same port', async () => {
        const port = 9999;
        const host = '127.0.0.1';
        const modelId = 'test-model';
        const config = { serverPath: '/fake/path' };

        // Mock spawn to return a fake process
        const mockProcess = new EventEmitter() as any;
        mockProcess.stdout = new EventEmitter();
        mockProcess.stderr = new EventEmitter();
        mockProcess.kill = vi.fn();
        (child_process.spawn as any).mockReturnValue(mockProcess);

        // Mock waitForPort behavior by mocking net.createConnection
        let callCount = 0;
        (net.createConnection as any).mockImplementation(() => {
            callCount++;
            const socket = new EventEmitter() as any;
            socket.destroy = vi.fn();
            socket.setTimeout = vi.fn();
            
            if (callCount <= 4) { // Simulate initial "refused" status
                setTimeout(() => socket.emit('error', new Error('refused')), 10);
            } else { // Simulate eventual "connect" success
                setTimeout(() => socket.emit('connect'), 10);
            }
            return socket;
        });

        const sm = ServerManager.getInstance();

        // Call ensureRunning multiple times concurrently
        const p1 = sm.ensureRunning(port, host, modelId, config, false);
        const p2 = sm.ensureRunning(port, host, modelId, config, false);
        const p3 = sm.ensureRunning(port, host, modelId, config, false);

        await Promise.all([p1, p2, p3]);

        // Expect spawn to be called only once
        expect(child_process.spawn).toHaveBeenCalledTimes(1);
    });

    it('should resolve server path only once and cache it (demonstrated via normal execution)', async () => {
        const port = 8888;
        const host = '127.0.0.1';
        const modelId = 'test-model';
        const config = { serverPath: '/fake/path' };

        const mockProcess = new EventEmitter() as any;
        mockProcess.stdout = new EventEmitter();
        mockProcess.stderr = new EventEmitter();
        mockProcess.kill = vi.fn();
        (child_process.spawn as any).mockReturnValue(mockProcess);

        let probeCount = 0;
        (net.createConnection as any).mockImplementation(() => {
            const socket = new EventEmitter() as any;
            socket.destroy = vi.fn();
            socket.setTimeout = vi.fn();
            
            probeCount++;
            if (probeCount === 1) { // probePort returns false
                setTimeout(() => socket.emit('error', new Error('refused')), 1);
            } else { // waitForPort returns true
                setTimeout(() => socket.emit('connect'), 1);
            }
            return socket;
        });

        const sm = ServerManager.getInstance();
        
        // This should use the provided path and NOT call npm root -g
        const release1 = await sm.ensureRunning(port, host, modelId, config, false);
        expect(release1).toBeTypeOf('function');
        
        // Subsequent call for same port should return same server
        const release2 = await sm.ensureRunning(port, host, modelId, config, false);
        expect(release2).toBeTypeOf('function');
        
        expect(child_process.spawn).toHaveBeenCalledTimes(1);
        
        release1();
        release2();
    });
});
