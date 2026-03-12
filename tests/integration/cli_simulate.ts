import assert from 'node:assert';
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
    assert.strictEqual(result1.finishReason, 'stop', 'Turn 1 should finish with "stop"');

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
    assert.strictEqual(result2.finishReason, 'stop', 'Turn 2 should finish with "stop"');
    
    const outputText = result2.text || '';
    console.log("Result 2 Text:", outputText);
    assert.ok(outputText.includes('25'), 'Result 2 text should contain "25"');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
