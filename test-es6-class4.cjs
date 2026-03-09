class MyProvider {
  constructor() {
    this.name = 'my-provider';
  }
}

// simulate opencode default behaviour which tries to instantiate plugin export
const p = require('./dist/index.cjs');

console.log('Testing how OpenCode instantiates the plugin...');
// Opencode does something like this internally when `ProviderInitError: Cannot call a class constructor without |new|` occurs:
// It iterates over keys or takes default, and does `plugin()` or `new plugin()` 

// In OpenCode codebase (from standard AI SDK knowledge):
// If the export is a class, it must be instantiated with `new`.
// AI SDK providers are usually factory functions, but some default exports might be classes.

console.log('Is export a class?', p.OpenCodeGeminiA2AProvider.toString().startsWith('class'));
