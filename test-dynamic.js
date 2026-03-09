import fs from 'fs';
const file = '/home/y_ohi/.opencode/bin/opencode';
// This is a bundled JS file with a binary wrapper (like pkg or bun compile)
const content = fs.readFileSync(file);
const str = content.toString('utf8');
const match = str.match(/Cannot call a class constructor without \|new\|/);
console.log('Match found:', !!match);
