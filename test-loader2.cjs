const path = require('path');

const pluginPath = path.resolve('./dist/index.cjs');
const plugin = require(pluginPath);

// let's see how standard AI SDK handles a provider instance.
console.log('Is opencodeGeminicliA2a function?', typeof plugin.opencodeGeminicliA2a === 'function');
console.log('opencodeGeminicliA2a properties:', Object.keys(plugin.opencodeGeminicliA2a));
console.log('Can call languageModel?', typeof plugin.opencodeGeminicliA2a.languageModel === 'function');
