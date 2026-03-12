import { spawnSync } from 'child_process';
const out = spawnSync('node', [
  '-e',
  `
  const { VertexAI } = require('@google-cloud/vertexai');
  console.log("VertexAI loaded");
  `
]);
console.log(out.stdout.toString(), out.stderr.toString());
