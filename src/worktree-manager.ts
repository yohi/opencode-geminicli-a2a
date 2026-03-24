import * as path from 'path';

export class WorktreeManager {
  constructor(private basePath: string) {}

  getWorktreePath(identifier: string): string {
    return path.join(this.basePath, '.gemini/tmp/async-reviews', identifier, 'worktree');
  }
}
