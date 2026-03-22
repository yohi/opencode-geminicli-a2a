import { A2AJsonRpcResponseSchema } from './src/schemas';
const str = '{"jsonrpc":"2.0","id":"2ddfc3e7-2dcd-4c15-9ee9-d053bcb633c1","result":{"kind":"text-delta","textDelta":"1+2+3+4+5=15です。"}}';
console.log(A2AJsonRpcResponseSchema.safeParse(JSON.parse(str)));
