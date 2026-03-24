import * as path from 'path';

export class WorktreeManager {
  constructor(private basePath: string) {}

  /**
   * Validate and sanitize identifier to prevent path traversal
   */
  private sanitizeIdentifier(id: string): string {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
        throw new Error('Identifier must be a non-empty string');
    }
    // Only allow alphanumeric, dashes, and underscores
    const sanitized = id.replace(/[^a-zA-Z0-9\-_]/g, '_');
    if (!sanitized) {
        throw new Error('Invalid identifier format');
    }
    return sanitized;
  }

  getWorktreePath(identifier: string): string {
    const sanitizedId = this.sanitizeIdentifier(identifier);
    const targetPath = path.join(this.basePath, '.gemini/tmp/async-reviews', sanitizedId, 'worktree');
    
    // Safety check: ensure the resolved path is still within the intended base directory
    const normalizedBase = path.normalize(path.join(this.basePath, '.gemini/tmp/async-reviews'));
    const normalizedTarget = path.normalize(targetPath);
    
    if (!normalizedTarget.startsWith(normalizedBase)) {
        throw new Error('Invalid worktree path generation');
    }

    return normalizedTarget;
  }
}
