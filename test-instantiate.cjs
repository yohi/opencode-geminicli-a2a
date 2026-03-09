const p = require('./dist/index.cjs');

console.log('Testing what happens when calling OpenCodeGeminiA2AProvider without new');
try {
  p.OpenCodeGeminiA2AProvider('some-model');
} catch (e) {
  console.log('Error:', e.message);
}

console.log('Testing what happens when OpenCode expects default export to be an object instead of function');
console.log('default type:', typeof p.default);

console.log('Testing keys on provider:');
console.log('keys:', Object.keys(p.provider));
