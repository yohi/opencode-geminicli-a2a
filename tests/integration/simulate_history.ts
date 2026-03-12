import { createGeminiA2AProvider } from '../../src/index';

async function main() {
    const provider = createGeminiA2AProvider();
    const model = provider('gemini-2.5-pro');

    let result2 = await model.doGenerate({
        inputFormat: 'messages',
        mode: { type: 'regular' },
        prompt: [
            { role: 'user', content: [{ type: 'text', text: '1+2+3+4+5は？' }] },
            { role: 'assistant', content: [{ type: 'text', text: '15です' }] },
            { role: 'user', content: [{ type: 'text', text: 'さらに10足して' }] }
        ]
    });

    console.log("Result 2 Text:", result2.text);
}

main().catch(console.error);
