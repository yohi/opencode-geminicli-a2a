#!/bin/bash
TARGET="node_modules/@google/gemini-cli-a2a-server/dist/a2a-server.mjs"

if [ ! -f "$TARGET" ]; then
    echo "Error: Target file $TARGET not found."
    exit 1
fi

echo "Applying strict and safe patches to $TARGET..."

node -e "
const fs = require('fs');
let content = fs.readFileSync('$TARGET', 'utf8');

const INTERNAL_SKILLS = ['activate_skill','load_skill','search_skills','search_skills_by_id','search_skills_by_name','sequentialthinking','save_memory','cli_help','read','glob','grep','pwd','ls','cat'];
const SKILLS_JSON = JSON.stringify(INTERNAL_SKILLS);

// --- 1. OverrideStrategy ---
const STRATEGY_ORIG = 'async route(context2, config3, _baseLlmClient, _localLiteRtLmClient) {';
if (content.includes(STRATEGY_ORIG) && !content.includes('return null; // PATCHED')) {
    content = content.replace(STRATEGY_ORIG, STRATEGY_ORIG + ' return null; // PATCHED ');
    console.log('[Strategy.patch] Applied.');
}

// --- 2. PolicyEngine ---
const POLICY_ORIG = 'debugLogger.debug(\`[PolicyEngine.check] NO MATCH - using default decision: \${this.defaultDecision}\`);';
if (content.includes(POLICY_ORIG) && !content.includes('INTERNAL_SKILL_TOOLS')) {
    const POLICY_PATCH = \`const INTERNAL_SKILL_TOOLS = \${SKILLS_JSON}; if (decision === void 0 && toolName && INTERNAL_SKILL_TOOLS.includes(toolName)) { console.log('[PolicyEngine.patch] Auto-approving:', toolName); decision = PolicyDecision.ALLOW; }\`;
    content = content.replace(POLICY_ORIG, POLICY_ORIG + ' ' + POLICY_PATCH);
    console.log('[PolicyEngine.patch] Applied.');
}

// --- 3. Scheduler (確認プロンプト回避) ---
// ピンポイントで、特定の構造のみを置換します
const SCHEDULER_ORIG = 'confirmed: false,\\n            requiresUserConfirmation: true';
const SCHEDULER_REPL = \`confirmed: \${SKILLS_JSON}.includes(request.toolCall?.name), requiresUserConfirmation: !\${SKILLS_JSON}.includes(request.toolCall?.name)\`;
if (content.includes(SCHEDULER_ORIG)) {
    content = content.replace(new RegExp(SCHEDULER_ORIG.replace(/[.*+?^\${}()|[\\]\\\\\/]/g, '\\\\$&'), 'g'), SCHEDULER_REPL);
    console.log('[Scheduler.patch] Applied.');
} else if (content.includes('requiresUserConfirmation: !')) {
    console.log('[Scheduler.patch] Already applied or different version.');
}

// --- 4. Auth (ヘッドレスモード) ---
const AUTH_PATTERN = /if \\(authType === AuthType2\\.LOGIN_WITH_GOOGLE && headless && !isCloudShell && !useComputeAdc\\) \\{[\\s\\S]*?throw new FatalAuthenticationError\\([\\s\\S]*?LOGIN_WITH_GOOGLE[\\s\\S]*?\\);\\s*\\}/;
const AUTH_REPL = \`if (authType === AuthType2.LOGIN_WITH_GOOGLE && headless && !isCloudShell && !useComputeAdc) {
    console.log('[Auth.patch] Headless: attempting silent refresh...');
    try {
      await config3.refreshAuth(AuthType2.LOGIN_WITH_GOOGLE);
      console.log('[Auth.patch] Silent refresh OK.');
    } catch (e) {
      throw new FatalAuthenticationError(\"Interactive terminal required for LOGIN_WITH_GOOGLE. Run in an interactive terminal or set GEMINI_CLI_USE_COMPUTE_ADC=true to use Application Default Credentials.\");
    }
  }\`;

if (content.match(AUTH_PATTERN)) {
    content = content.replace(AUTH_PATTERN, AUTH_REPL);
    console.log('[Auth.patch] Applied.');
} else if (content.includes('[Auth.patch]')) {
    console.log('[Auth.patch] Already applied.');
}

fs.writeFileSync('$TARGET', content, 'utf8');
"

echo "Patching process completed."
