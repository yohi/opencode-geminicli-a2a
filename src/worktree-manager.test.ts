import { describe, it, expect } from 'vitest';
import { WorktreeManager } from './worktree-manager';

describe('WorktreeManager', () => {
  it('should generate ephemeral worktree path based on PR number', () => {
    const manager = new WorktreeManager('/base/repo');
    const worktreePath = manager.getWorktreePath('pr-123');
    expect(worktreePath).toBe('/base/repo/.gemini/tmp/async-reviews/pr-123/worktree');
  });

  it('should sanitize identifier and prevent path traversal', () => {
    const manager = new WorktreeManager('/base/repo');
    const worktreePath = manager.getWorktreePath('../malicious');
    // ../ should be converted to ___ (sanitized to allow only alphanumerics/dashes/underscores)
    expect(worktreePath).not.toContain('..');
    expect(worktreePath).toBe('/base/repo/.gemini/tmp/async-reviews/___malicious/worktree');
  });

  it('should throw error for empty identifier', () => {
    const manager = new WorktreeManager('/base/repo');
    expect(() => manager.getWorktreePath('')).toThrow('Identifier must be a non-empty string');
  });

  it('should throw error for whitespace-only identifier', () => {
    const manager = new WorktreeManager('/base/repo');
    expect(() => manager.getWorktreePath('   ')).toThrow('Identifier must be a non-empty string');
  });

  it('should throw error for null or undefined identifier', () => {
    const manager = new WorktreeManager('/base/repo');
    // @ts-expect-error testing runtime validation
    expect(() => manager.getWorktreePath(null)).toThrow('Identifier must be a non-empty string');
    // @ts-expect-error testing runtime validation
    expect(() => manager.getWorktreePath(undefined)).toThrow('Identifier must be a non-empty string');
  });

  it('should handle special-character-only identifier by sanitizing it', () => {
    const manager = new WorktreeManager('/base/repo');
    const worktreePath = manager.getWorktreePath('...');
    // "..." becomes "___"
    expect(worktreePath).toBe('/base/repo/.gemini/tmp/async-reviews/___/worktree');
  });
});
