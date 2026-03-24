export class WorkerDispatcher {
  /**
   * Escape special shell characters to prevent injection
   */
  private escapeShell(str: string): string {
    // Escapes backslashes, double quotes, backticks, dollar signs and newlines
    return str.replace(/[\\"`$\n]/g, '\\$&');
  }

  createCommand(modelName: string, prompt: string): string {
    const escapedModel = this.escapeShell(modelName);
    const escapedPrompt = this.escapeShell(prompt);
    // Reordered to have -p right after gemini as per the plan's expectation
    return `gemini -p "${escapedPrompt}" --model ${escapedModel}`;
  }
}
