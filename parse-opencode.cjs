const fs = require('fs');

const content = fs.readFileSync('/home/y_ohi/.opencode/bin/opencode', 'latin1'); 

const target = "class constructor";
let idx = content.indexOf(target);
while (idx !== -1) {
  const start = Math.max(0, idx - 200);
  const end = Math.min(content.length, idx + 200);
  console.log('--- Match at', idx, '---');
  console.log(content.substring(start, end));
  idx = content.indexOf(target, idx + 1);
}
