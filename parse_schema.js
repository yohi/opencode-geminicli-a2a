const fs = require('fs');

const content = fs.readFileSync('notion_diary_combined.md', 'utf8');
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
    const pIdx = jsonStr.indexOf('"parameters"');
    
    if (pIdx === -1) {
        throw new Error('"parameters" not found in jsonStr');
    }
    
    console.log(jsonStr.substring(pIdx, jsonStr.length - 2));
} catch (err) {
    console.error('Error parsing schema:', err.message);
    process.exit(1);
}
