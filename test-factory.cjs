const plugin = require('./dist/index.cjs');

try {
  // OpenCodeはこれをどう呼び出しているか
  console.log("type of default:", typeof plugin.default);
  const provider = plugin.default;
  if (provider.prototype && provider.prototype.constructor) {
     console.log("Seems like a class", provider.toString().substring(0, 50));
  }
} catch (e) {
  console.error(e.message);
}
