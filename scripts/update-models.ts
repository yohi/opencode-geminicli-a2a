import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const MODELS_URL = 'https://raw.githubusercontent.com/google-gemini/gemini-cli/main/packages/core/src/config/models.ts';

async function fetchModels() {
    console.log(`Fetching models from ${MODELS_URL}...`);
    const res = await fetch(MODELS_URL);
    if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.statusText}`);
    }
    const text = await res.text();

    const modelVarMap = new Map<string, string>();
    // Matches expressions like: export const SOME_MODEL = 'gemini-model-name';
    // including those wrapped to the next line.
    const constRegex = /export\s+const\s+([A-Z0-9_]+)\s*=\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = constRegex.exec(text)) !== null) {
        modelVarMap.set(match[1], match[2]);
    }

    // Finds the VALID_GEMINI_MODELS Set array
    const validModelsRegex = /export\s+const\s+VALID_GEMINI_MODELS\s*=\s*new\s+Set\(\[\s*([\s\S]*?)\s*\]\)/;
    const validMatch = text.match(validModelsRegex);
    if (!validMatch) {
        throw new Error("Could not find VALID_GEMINI_MODELS in the source file.");
    }

    // Extracts the constant names from the Set
    const varNames = validMatch[1].split(',')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('//')); // Ignore comments and empty lines

    const validModels: string[] = [];
    for (const varName of varNames) {
        const val = modelVarMap.get(varName);
        if (val) {
            validModels.push(val);
        } else {
            console.warn(`Warning: Could not find resolved value for constant ${varName}`);
        }
    }

    return validModels;
}

function formatModelName(id: string): string {
    // gemini-3.1-pro-preview-customtools -> Gemini 3.1 Pro Preview Custom Tools (A2A)
    const formatted = id.split('-').map(word => {
        if (word === 'gemini') return 'Gemini';
        if (word === 'pro') return 'Pro';
        if (word === 'flash') return 'Flash';
        if (word === 'lite') return 'Lite';
        if (word === 'preview') return 'Preview';
        if (word === 'customtools') return 'Custom Tools';
        if (word === 'learning') return 'Learning';
        if (word === 'thinking') return 'Thinking';
        return word;
    }).join(' ');

    return `${formatted} (A2A)`;
}

async function updatePackageJson(models: string[]) {
    const pkjPath = path.join(ROOT_DIR, 'package.json');
    const content = await fs.readFile(pkjPath, 'utf8');
    const pkg = JSON.parse(content);

    const newModels = models.map(id => ({
        id,
        name: formatModelName(id)
    }));

    pkg.opencode = pkg.opencode || {};
    pkg.opencode.models = newModels;

    await fs.writeFile(pkjPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`Updated package.json with ${newModels.length} models.`);
}

async function main() {
    try {
        const models = await fetchModels();
        console.log('Detected valid models:', models);
        await updatePackageJson(models);
        console.log('Successfully synchronized models with Gemini CLI.');
    } catch (err) {
        console.error('Error syncing models:', err);
        process.exit(1);
    }
}

main();
