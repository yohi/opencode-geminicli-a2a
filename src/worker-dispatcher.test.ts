import { describe, it, expect } from 'vitest';
import { WorkerDispatcher } from './worker-dispatcher';

describe('WorkerDispatcher', () => {
  it('should format headless gemini command correctly', () => {
    const dispatcher = new WorkerDispatcher();
    const cmd = dispatcher.createCommand('gemini-1.5-pro', 'Do the task');
    // Updated expectation to match new flag order
    expect(cmd).toBe('gemini -p "Do the task" --model gemini-1.5-pro');
  });

  it('should escape shell special characters in prompt', () => {
    const dispatcher = new WorkerDispatcher();
    const cmd = dispatcher.createCommand('pro', 'hello"; rm -rf /; echo "');
    // Check that quotes and backslashes are escaped
    expect(cmd).toContain('gemini -p "hello\\"; rm -rf /; echo \\"" --model pro');
  });
});
