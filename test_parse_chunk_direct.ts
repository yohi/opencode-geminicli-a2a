import { parseA2AStream } from './src/utils/stream';

async function main() {
    const encoder = new TextEncoder();
    const mockStream = new ReadableStream({
        start(controller) {
            controller.enqueue(encoder.encode('data: {"jsonrpc":"2.0","id":"1","result":{"kind":"task","id":"123","contextId":"123","status":{"state":"input-required"}}}\n\n'));
            controller.close();
        }
    });

    try {
        const generator = parseA2AStream(mockStream);
        for await (const chunk of generator) {
            console.log("Got chunk:", chunk);
        }
        console.log("Done iterating.");
    } catch(e) {
        console.error("Error:", e);
    }
}
main();
