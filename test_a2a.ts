import { A2AClient } from './src/a2a-client';
import { parseA2AStream } from './src/utils/stream';
import { resolveConfig } from './src/config';

async function main() {
    const config = resolveConfig();
    const client = new A2AClient({
        protocol: config.protocol,
        token: config.token
    });
    
    console.log("Sending request...");
    const res = await client.chatStream({
        request: {
            jsonrpc: "2.0",
            id: "1",
            method: "message/stream",
            params: {
                message: { parts: [{ kind: 'text', text: '[USER]\nhello' }] },
                model: 'gemini-2.5-flash'
            }
        }
    });

    const parser = parseA2AStream(res.stream);
    for await (const chunk of parser) {
        if ('result' in chunk) {
            console.log(JSON.stringify(chunk.result));
        } else if ('status' in chunk) {
            console.log("Status:", chunk.status);
        }
    }
}
main().catch(console.error);
