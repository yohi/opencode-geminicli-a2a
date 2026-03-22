import { geminiCliA2A } from './src/index';
import { generateText } from 'ai';

async function main() {
    console.log("Starting...");
    try {
        const result = await generateText({
            model: geminiCliA2A('gemini-2.5-flash'),
            prompt: 'hello',
        });
        console.log("Result:", result.text);
    } catch(e) {
        console.error("Error:", e);
    }
}
main();
