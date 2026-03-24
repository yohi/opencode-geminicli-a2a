import { describe, it, expect, vi, beforeEach } from 'vitest';
import EventEmitter from 'node:events';
import { createConnection } from 'node:net';
import { spawn, exec } from 'node:child_process';
import { existsSync } from 'node:fs';
import { ServerManager } from './server-manager';

vi.mock('node:net', () => ({
    createConnection: vi.fn(),
}));

vi.mock('node:child_process', () => ({
    spawn: vi.fn(),
    exec: vi.fn(),
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
        ServerManager._reset();
        // デフォルトでは existsSync は全て true を返す
        vi.mocked(existsSync).mockReturnValue(true);

        // デフォルトの exec モック（npm root -g のシミュレーション）
        vi.mocked(exec).mockImplementation(((cmd: string, opts: any, cb: any) => {
            const callback = typeof opts === 'function' ? opts : cb;
            process.nextTick(() => {
                callback(null, '/fake/npm/root\n', '');
            });
        }) as any);
    });

    it('should not spawn multiple processes and should respect reference counting when called concurrently', async () => {
        const port = 9999;
        const host = '127.0.0.1';
        const modelId = 'test-model';
        const config = { serverPath: undefined }; // 自動検出ルートを通す

        const mockProcess = new EventEmitter() as any;
        mockProcess.stdout = new EventEmitter();
        mockProcess.stderr = new EventEmitter();
        mockProcess.kill = vi.fn();
        vi.mocked(spawn).mockReturnValue(mockProcess as any);

        let connCount = 0;
        vi.mocked(createConnection).mockImplementation(() => {
            connCount++;
            const socket = new EventEmitter() as any;
            socket.destroy = vi.fn();
            socket.setTimeout = vi.fn();
            if (connCount === 1) {
                setTimeout(() => socket.emit('error', new Error('refused')), 1);
            } else {
                setTimeout(() => socket.emit('connect'), 1);
            }
            return socket as any;
        });

        const sm = ServerManager.getInstance();

        const [release1, release2, release3] = await Promise.all([
            sm.ensureRunning(port, host, modelId, config, false),
            sm.ensureRunning(port, host, modelId, config, false),
            sm.ensureRunning(port, host, modelId, config, false)
        ]);

        expect(spawn).toHaveBeenCalledTimes(1);
        expect(exec).toHaveBeenCalledTimes(1); // キャッシュにより1回のみ

        await release1();
        expect(mockProcess.kill).not.toHaveBeenCalled();

        await release2();
        expect(mockProcess.kill).not.toHaveBeenCalled();

        await release3();
        expect(mockProcess.kill).toHaveBeenCalledTimes(1);
    });

    it('should be a singleton and support resetting', async () => {
        const sm1 = ServerManager.getInstance();
        const sm2 = ServerManager.getInstance();
        expect(sm1).toBe(sm2);
        
        ServerManager._reset();
        const sm3 = ServerManager.getInstance();
        expect(sm3).not.toBe(sm1);
    });

    it('should resolve server path via npm root -g only once and cache it, then clear on reset', async () => {
        const port = 11111;
        const host = '127.0.0.1';
        const modelId = 'test-model';
        const config = { serverPath: undefined };

        const mockProcess = new EventEmitter() as any;
        mockProcess.stdout = new EventEmitter();
        mockProcess.stderr = new EventEmitter();
        mockProcess.kill = vi.fn();
        vi.mocked(spawn).mockReturnValue(mockProcess as any);

        let probeCount = 0;
        vi.mocked(createConnection).mockImplementation(() => {
            probeCount++;
            const socket = new EventEmitter() as any;
            socket.destroy = vi.fn();
            socket.setTimeout = vi.fn();
            if (probeCount % 2 === 1) {
                setTimeout(() => socket.emit('error', new Error('refused')), 1);
            } else {
                setTimeout(() => socket.emit('connect'), 1);
            }
            return socket as any;
        });

        const sm = ServerManager.getInstance();

        // 1回目の呼び出し: exec が呼ばれる
        await sm.ensureRunning(port, host, modelId, config, false);
        expect(exec).toHaveBeenCalledTimes(1);

        // 2回目の呼び出し (別ポート): キャッシュされているので exec は呼ばれない
        probeCount = 0;
        await sm.ensureRunning(port + 1, host, modelId, config, false);
        expect(exec).toHaveBeenCalledTimes(1);

        // リセット
        ServerManager._reset();
        const smNew = ServerManager.getInstance();

        // 3回目の呼び出し: リセット後なので再び exec が呼ばれる
        probeCount = 0;
        await smNew.ensureRunning(port + 2, host, modelId, config, false);
        expect(exec).toHaveBeenCalledTimes(2);
    });
});
