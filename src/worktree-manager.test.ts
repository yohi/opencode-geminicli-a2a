import { describe, it, expect } from 'vitest';
import { WorktreeManager } from './worktree-manager';

describe('WorktreeManager', () => {
  it('should generate ephemeral worktree path based on PR number', () => {
    const manager = new WorktreeManager('/base/repo');
    const path = manager.getWorktreePath('pr-123');
    expect(path).toBe('/base/repo/.gemini/tmp/async-reviews/pr-123/worktree');
  });
});
