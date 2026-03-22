import fetch from 'node-fetch';
import { parseA2AStream } from './src/utils/stream';

async function main() {
    const res = await fetch('http://127.0.0.1:41242/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "jsonrpc": "2.0",
          "id": "1",
          "method": "message/stream",
          "params": {
            "message": {
              "messageId": "1",
              "role": "user",
              "parts": [
                {
                  "kind": "text",
                  "text": "1+2+3+4+5は？"
                }
              ]
            },
            "configuration": {
              "blocking": false
            },
            "model": "gemini-2.5-pro"
          }
        })
    });
    
    console.log("Status:", res.status);
    const body = res.body;
    body.on('data', chunk => {
        console.log("RAW CHUNK:", chunk.toString());
    });
    body.on('end', () => console.log("Stream ended."));
}
main().catch(console.error);
