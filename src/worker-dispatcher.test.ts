import { describe, it, expect } from 'vitest';
import { WorkerDispatcher } from './worker-dispatcher';

describe('WorkerDispatcher', () => {
  it('should format headless gemini command correctly', () => {
    const dispatcher = new WorkerDispatcher();
    const cmd = dispatcher.createCommand('gemini-1.5-pro', 'Do the task');
    expect(cmd).toContain('gemini --model gemini-1.5-pro -p "Do the task"');
  });
});
