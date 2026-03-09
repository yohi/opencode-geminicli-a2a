const fs = require('fs');

const content = fs.readFileSync('/home/y_ohi/.opencode/bin/opencode', 'latin1'); 

const target = "Cannot call a class constructor without |new|";
let idx = content.indexOf(target);
if (idx !== -1) {
  // Let's print out the exact Javascript around this error in the JavascriptCore/JSC runtime binary. 
  // Wait, if it's "Cannot call a class constructor without |new|", this is a standard V8/JSC error message for: `Class()` instead of `new Class()`.
}
