const bad = "docker-mcp-gateway_read_file";
const text = "you MUST include it. If it is listed WITHOUT a prefix (e.g., docker-mcp-gateway_read_file), you MUST NOT add one.";
const regex = new RegExp(`\\b${bad}\\b`, 'g');
console.log(text.replace(regex, "read"));
