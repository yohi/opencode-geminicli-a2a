import { describe, it, expect } from 'vitest';
import { spawnSync } from 'child_process';

describe('gemini tools integration', () => {
    it('should be able to load @google-cloud/vertexai', () => {
        const out = spawnSync('node', [
            '-e',
            `
            try {
                const { VertexAI } = require('@google-cloud/vertexai');
                if (VertexAI) {
                    console.log("VertexAI loaded");
                } else {
                    console.error("VertexAI is undefined");
                    process.exit(1);
                }
            } catch (e) {
                console.error(e.message);
                process.exit(1);
            }
            `
        ]);

        const stdout = out.stdout.toString();
        const stderr = out.stderr.toString();

        expect(out.status).toBe(0);
        expect(stdout).toContain('VertexAI loaded');
        expect(stderr).toBe('');
    });
});
