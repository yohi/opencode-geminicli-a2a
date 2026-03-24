export class WorkerDispatcher {
  createCommand(modelName: string, prompt: string): string {
    return `gemini --model ${modelName} -p "${prompt}"`;
  }
}
