import { createGeminiA2AProvider } from '../src/index';

/**
 * 疎通確認用スクリプト
 * 
 * 実行方法:
 * npx tsx examples/test-connection.ts [model-id] [prompt]
 * 
 * 事前に Gemini CLI を A2A モードで起動しておく必要があります:
 * gemini-cli --a2a --port 41242
 */
async function main() {
    const modelId = process.argv[2] || 'gemini-2.0-flash';
    const promptText = process.argv[3] || 'こんにちは！自己紹介をお願いします。';

    const a2a = createGeminiA2AProvider();
    const model = a2a(modelId);

    console.log(`Connecting to A2A server...`);
    console.log(`Model: ${modelId}`);
    console.log(`Prompt: "${promptText}"`);
    console.log(`Host: ${process.env.GEMINI_A2A_HOST || '127.0.0.1'}`);
    console.log(`Port: ${process.env.GEMINI_A2A_PORT || '41242'}\n`);

    try {
        const { stream } = await model.doStream({
            inputFormat: 'prompt',
            mode: { type: 'regular' },
            prompt: [
                { role: 'user', content: [{ type: 'text', text: promptText }] }
            ],
            providerMetadata: {
                opencode: { idempotencyKey: `test-${Date.now()}` }
            }
        });

        const reader = stream.getReader();
        process.stdout.write('Assistant: ');

        let isReasoning = false;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            if (value.type === 'text-delta') {
                if (isReasoning) {
                    process.stdout.write('\n\nAssistant: ');
                    isReasoning = false;
                }
                process.stdout.write(value.textDelta);
            } else if (value.type === 'reasoning') {
                if (!isReasoning) {
                    process.stdout.write('\n💭 Thinking:\n');
                    isReasoning = true;
                }
                process.stdout.write(`${value.textDelta}\n`);
            } else if (value.type === 'tool-call') {
                console.log(`\n[Tool Call Requested] ${value.toolName}(${value.args})`);
            } else if (value.type === 'finish') {
                console.log(`\n\nFinished with reason: ${value.finishReason}`);
            }
        }
    } catch (error) {
        console.error('\nError connecting to A2A server:');
        if (error instanceof Error) {
            console.error(error.message);
            // AI SDK の APICallError の場合は詳細を表示
            if ('url' in error) console.error(`URL: ${(error as any).url}`);
            if ('statusCode' in error) console.error(`Status: ${(error as any).statusCode}`);
            if ('responseBody' in error && (error as any).responseBody) {
                console.error(`Response: ${(error as any).responseBody}`);
            }
        } else {
            console.error(error);
        }

        console.log('\nヒント: Gemini CLI が A2A モードで正常に起動しているか確認してください。');
        console.log('コマンド例: gemini-cli --a2a --port 41242');
        process.exit(1);
    }
}

main().catch((err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
});
