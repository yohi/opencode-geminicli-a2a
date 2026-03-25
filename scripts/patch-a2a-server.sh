#!/bin/bash
TARGET="node_modules/@google/gemini-cli-a2a-server/dist/a2a-server.mjs"
PATCH_SCRIPT="$(dirname "$0")/_patch-helper.mjs"

if [ ! -f "$TARGET" ]; then
    echo "Error: Target file $TARGET not found."
    exit 1
fi

echo "Applying patches to $TARGET..."

# 1. OverrideStrategy の無力化 (Routing bypassed... を出さないようにする)
sed -i '/OverrideStrategy = class {/,/async route(context/ s/async route(context2, config3, _baseLlmClient, _localLiteRtLmClient) {/async route(context2, config3, _baseLlmClient, _localLiteRtLmClient) { return null; /' "$TARGET"

# 2. Add debug logging to routing
sed -i 's/const decision = await router.route(routingContext);/console.log("[A2ADebug] routingContext:", JSON.stringify({ requestedModel: routingContext.requestedModel }, null, 2)); const decision = await router.route(routingContext); console.log("[A2ADebug] decision from router.route:", decision);/g' "$TARGET"

# 3. Add logging to ModelRouterService.route
sed -i 's/decision = await this.strategy.route(context2, this.config, this.config.getBaseLlmClient(), this.config.getLocalLiteRtLmClient());/console.log("[A2ADebug] ModelRouterService processing context with strategy:", this.strategy?.name); decision = await this.strategy.route(context2, this.config, this.config.getBaseLlmClient(), this.config.getLocalLiteRtLmClient());/g' "$TARGET"

# 4. [重要] PolicyEngine: activate_skill 等の内部スキルツールを ALLOW に強制する
INTERNAL_TOOLS_PATCH='const INTERNAL_SKILL_TOOLS = ["activate_skill","load_skill","search_skills","search_skills_by_id","search_skills_by_name","sequentialthinking","save_memory","cli_help"]; if (decision === void 0 \&\& toolName \&\& INTERNAL_SKILL_TOOLS.includes(toolName)) { console.log("[PolicyEngine.patch] Auto-approving internal skill tool:", toolName); decision = PolicyDecision.ALLOW; }'

sed -i "s|debugLogger.debug(\`\[PolicyEngine.check\] NO MATCH - using default decision: \${this.defaultDecision}\`);|debugLogger.debug(\`[PolicyEngine.check] NO MATCH - using default decision: \${this.defaultDecision}\`); ${INTERNAL_TOOLS_PATCH}|g" "$TARGET"

# 5. [最重要] Scheduler.setupMessageBusListener: activate_skill 等を自動承認する
#
# 問題: PolicyEngine が ALLOW を返しても、listenerCount > 0 のためリスナーに転送される。
# Scheduler のリスナーが requiresUserConfirmation: true を返して確認ダイアログが表示される。
# 解決: Scheduler のリスナーで内部スキルツールを検出し confirmed: true を返す。
node -e "
const fs = require('fs');
const content = fs.readFileSync('$TARGET', 'utf8');
const INTERNAL_SKILLS = ['activate_skill','load_skill','search_skills','search_skills_by_id','search_skills_by_name','sequentialthinking','save_memory','cli_help'];
const ORIG = \`          await messageBus.publish({
            type: MessageBusType.TOOL_CONFIRMATION_RESPONSE,
            correlationId: request.correlationId,
            confirmed: false,
            requiresUserConfirmation: true
          });\`;
const INTERNAL_TOOLS_JSON = JSON.stringify(INTERNAL_SKILLS);
const REPL = \`          const _PATCH_INTERNAL = \${INTERNAL_TOOLS_JSON}; if (request.toolCall && _PATCH_INTERNAL.includes(request.toolCall.name)) { console.log('[Scheduler.patch] Auto-confirming skill tool:', request.toolCall.name); await messageBus.publish({ type: MessageBusType.TOOL_CONFIRMATION_RESPONSE, correlationId: request.correlationId, confirmed: true, requiresUserConfirmation: false }); } else { await messageBus.publish({ type: MessageBusType.TOOL_CONFIRMATION_RESPONSE, correlationId: request.correlationId, confirmed: false, requiresUserConfirmation: true }); }\`;

if (content.includes(ORIG)) {
  fs.writeFileSync('$TARGET', content.replace(ORIG, REPL), 'utf8');
  console.log('[Scheduler.patch] Patched successfully.');
} else if (content.includes('[Scheduler.patch]')) {
  console.log('[Scheduler.patch] Already patched, skipping.');
} else {
  console.log('[Scheduler.patch] ERROR: Target pattern not found!');
  process.exit(1);
}
"

# 6. [認証] headless モードでの LOGIN_WITH_GOOGLE: サイレントリフレッシュにフォールバック
# 問題: USE_CCPA + headless + !isCloudShell + !useComputeAdc → throw
# 修正: oauth_creds.json の refresh token でサイレントリフレッシュを試みる
node -e "
const fs = require('fs');
const content = fs.readFileSync('$TARGET', 'utf8');
const ORIG = \"      } else {\\n        throw new FatalAuthenticationError(\\n          \\\`Interactive terminal required for LOGIN_WITH_GOOGLE. Run in an interactive terminal or set GEMINI_CLI_USE_COMPUTE_ADC=true to use Application Default Credentials.\\\`\\n        );\\n      }\"; 
const REPL = \"      } else {\\n        console.log('[Auth.patch] Headless: attempting silent refresh...');\\n        try {\\n          await config3.refreshAuth(AuthType2.LOGIN_WITH_GOOGLE);\\n          console.log('[Auth.patch] Silent refresh OK.');\\n        } catch (oauthError) {\\n          throw new FatalAuthenticationError(\\n            \\\`Interactive terminal required for LOGIN_WITH_GOOGLE. Run in an interactive terminal or set GEMINI_CLI_USE_COMPUTE_ADC=true to use Application Default Credentials.\\\`\\n          );\\n        }\\n      }\";
if (content.includes(ORIG)) { fs.writeFileSync('$TARGET', content.replace(ORIG, REPL), 'utf8'); console.log('[Auth.patch] Applied.'); }
else if (content.includes('[Auth.patch]')) { console.log('[Auth.patch] Already applied.'); }
else { console.log('[Auth.patch] ERROR: pattern not found'); process.exit(1); }
"

echo "All patches applied successfully."
