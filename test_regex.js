const toolMapping = {
    'docker-mcp-gateway_read_file': 'read',
    'read_file': 'read',
    'docker-mcp-gateway_directory_tree': 'glob',
    'list_directory': 'glob'
};
const keys = Object.keys(toolMapping).sort((a, b) => b.length - a.length);
let text = "Use docker-mcp-gateway_read_file to read the file.";
console.log("Original:", text);
for (const bad of keys) {
    const good = toolMapping[bad];
    if (bad === good) continue;
    try {
        const regex = new RegExp(`\\b${bad}\\b`, 'g');
        text = text.replace(regex, good);
    } catch(e) { console.error(e); }
}
console.log("Replaced:", text);
