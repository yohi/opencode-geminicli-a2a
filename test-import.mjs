import plugin from './dist/index.cjs';
console.log('default import:', plugin);
import * as pluginStar from './dist/index.cjs';
console.log('star import:', pluginStar);
