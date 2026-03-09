const path = require('path');
const fs = require('fs');

const pluginPath = path.resolve('./dist/index.cjs');
const plugin = require(pluginPath);
console.log('Plugin keys:', Object.keys(plugin));

// 実際の OpenCode のプロバイダーロードに近い処理をシミュレート
function loadProvider(pluginModule) {
    // 1. デフォルトエクスポートをチェック
    if (pluginModule.default && typeof pluginModule.default === 'function') {
        return { source: 'default', provider: pluginModule.default };
    }
    // 2. キャメルケースIDをチェック
    const camelId = 'opencodeGeminicliA2a';
    if (pluginModule[camelId]) {
        return { source: 'camelId', provider: pluginModule[camelId] };
    }
    // 3. 'provider' をチェック
    if (pluginModule.provider) {
         return { source: 'provider', provider: pluginModule.provider };
    }
    return null;
}

const loaded = loadProvider(plugin);
console.log('Loaded provider:', loaded);
if (loaded && loaded.provider) {
    try {
        const model = typeof loaded.provider.languageModel === 'function' 
            ? loaded.provider.languageModel('gemini-2.5-pro') 
            : loaded.provider('gemini-2.5-pro');
        console.log('Model created successfully:', model.modelId);
    } catch (e) {
        console.error('Error creating model:', e);
    }
}
