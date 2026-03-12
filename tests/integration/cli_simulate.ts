import { createGeminiA2AProvider } from '../../src/index';

async function main() {
    const provider = createGeminiA2AProvider();
    const model = provider('gemini-2.5-pro');

    console.log("--- Turn 1 ---");
    let result1 = await model.doGenerate({
        inputFormat: 'messages',
        mode: { type: 'regular' },
        prompt: [{ role: 'user', content: [{ type: 'text', text: '1+2+3+4+5は？' }] }]
    });
    
    console.log("Result 1 Finish Reason:", result1.finishReason);

    console.log("--- Turn 2 ---");
    let result2 = await model.doGenerate({
        inputFormat: 'messages',
        mode: { type: 'regular' },
        prompt: [
            { role: 'user', content: [{ type: 'text', text: '1+2+3+4+5は？' }] },
            { role: 'assistant', content: [{ type: 'text', text: '15です' }] },
            { role: 'user', content: [{ type: 'text', text: 'さらに10足して' }] }
        ]
    });

    console.log("Result 2 Finish Reason:", result2.finishReason);
}

main().catch(console.error);
