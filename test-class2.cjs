const plugin = require('./dist/index.cjs');

console.log("Keys in plugin:", Object.keys(plugin));
for (const key of Object.keys(plugin)) {
  const v = plugin[key];
  if (typeof v === 'function' && v.prototype) {
    console.log(key, "is a function/class");
    if (v.toString().startsWith('class ')) {
      console.log("  -> is ES6 class:", key);
    }
  }
}
