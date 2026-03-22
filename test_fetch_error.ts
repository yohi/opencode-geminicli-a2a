import { config } from 'dotenv';
config();
import { generateText } from 'ai';
import { createGeminiA2AProvider } from './src/index';

const geminiCliA2A = createGeminiA2AProvider();
const model = geminiCliA2A('gemini-3.1-pro-preview'); // Match the model that returned the quota error

async function main() {
    try {
        const { text } = await generateText({
            model: model,
            prompt: "1+2+3+4+5は？"
        });
        console.log("Response:", text);
    } catch (e) {
        console.error("Caught Error:", e);
    }
}
main();
