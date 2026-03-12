import { createGeminiA2AProvider } from '../../src/index';

async function main() {
    const provider = createGeminiA2AProvider();
    const model = provider('gemini-2.5-pro');

    let result = await model.doGenerate({
        inputFormat: 'messages',
        mode: { type: 'regular' },
        prompt: [
            { role: 'user', content: [{ type: 'text', text: '1+2+3+4+5は？' }] },
            { role: 'assistant', content: [{ type: 'text', text: '15です' }] },
            { role: 'user', content: [{ type: 'text', text: 'さらに10足して' }] },
            { role: 'assistant', content: [{ type: 'tool-call', toolCallId: 'call_1', toolName: 'add', args: { a: 15, b: 10 } }] },
            { role: 'tool', content: [{ type: 'tool-result', toolCallId: 'call_1', toolName: 'add', result: '25' }] }
        ]
    });

    console.log("Result Text:", result.text);
}

main().catch(console.error);
