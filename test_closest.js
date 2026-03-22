function findClosestMatch(target, candidates) {
    if (!target || !candidates || candidates.length === 0) return null;
    let closest = null;
    let maxSimilarity = 0;
    
    for (const candidate of candidates) {
        // Simple inclusion check
        if (target.includes(candidate) || candidate.includes(target)) {
            const similarity = Math.min(target.length, candidate.length) / Math.max(target.length, candidate.length);
            if (similarity > maxSimilarity) {
                maxSimilarity = similarity;
                closest = candidate;
            }
        }
    }
    return closest;
}

const tools = ['invalid', 'question', 'bash', 'read', 'glob', 'grep', 'edit', 'write', 'task', 'webfetch', 'todowrite', 'skill'];
console.log("activate_skill ->", findClosestMatch('activate_skill', tools));
console.log("docker-mcp-gateway_read_file ->", findClosestMatch('docker-mcp-gateway_read_file', tools));
