const fs = require('fs');

const FILENAME = 'notion_diary_combined.md';

let content;
try {
    content = fs.readFileSync(FILENAME, 'utf8');
} catch (err) {
    console.error(`Failed to read file "${FILENAME}": ${err.message}`);
    process.exit(1);
}

const lines = content.split('\n');

// Find the latest occurrence (search from the end)
const schemaLine = lines.reverse().find(l => l.includes('bash tool schema:'));

if (!schemaLine) {
    console.error('No "bash tool schema:" line found in file.');
    process.exit(1);
}

try {
    const parts = schemaLine.split('bash tool schema: ');
    if (parts.length < 2) {
        throw new Error('Malformed schema line: could not extract JSON part.');
    }
    
    const jsonStr = parts[1].trim();
    let parsed;
    try {
        parsed = JSON.parse(jsonStr);
    } catch (e) {
        throw new Error(`Invalid JSON in schema line: ${e.message}\nLine: ${schemaLine}`);
    }

    if (!parsed.parameters) {
        throw new Error('Property "parameters" not found in parsed JSON.');
    }
    
    console.log(JSON.stringify(parsed.parameters, null, 2));
} catch (err) {
    console.error('Error parsing schema:', err.message);
    process.exit(1);
}
