const bad = "docker-mcp-gateway_read_file";
const regex = new RegExp(`\\b${bad}\\b`, 'g');
const text = "Use the docker-mcp-gateway_read_file tool.";
console.log("Match?", regex.test(text));
console.log("Replaced:", text.replace(regex, "read"));
