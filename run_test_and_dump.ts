import { config } from 'dotenv';
config();
import { generateText } from 'ai';
import { createGeminiA2AProvider } from './src/index';

const geminiCliA2A = createGeminiA2AProvider();

async function main() {
    console.log("Starting simulation...");
    const model = geminiCliA2A('gemini-2.5-pro');
    
    try {
        const { text } = await generateText({
            model: model,
            prompt: "1+2+3+4+5は？"
        });
        console.log("Response:", text);
    } catch (e) {
        console.error("Error:", e);
    }
}
main();
