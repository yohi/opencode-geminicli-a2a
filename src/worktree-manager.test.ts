import { describe, it, expect } from 'vitest';
import { WorktreeManager } from './worktree-manager';

describe('WorktreeManager', () => {
  it('should generate ephemeral worktree path based on PR number', () => {
    const manager = new WorktreeManager('/base/repo');
    const path = manager.getWorktreePath('pr-123');
    expect(path).toBe('/base/repo/.gemini/tmp/async-reviews/pr-123/worktree');
  });

  it('should sanitize identifier and prevent path traversal', () => {
    const manager = new WorktreeManager('/base/repo');
    const path = manager.getWorktreePath('../malicious');
    // ../ should be converted to ___ (sanitized to allow only alphanumerics/dashes/underscores)
    expect(path).not.toContain('..');
    expect(path).toBe('/base/repo/.gemini/tmp/async-reviews/___malicious/worktree');
  });

  it('should throw error for empty identifier', () => {
    const manager = new WorktreeManager('/base/repo');
    expect(() => manager.getWorktreePath('')).toThrow('Identifier must be a non-empty string');
  });
});
