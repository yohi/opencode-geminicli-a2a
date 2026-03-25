#!/bin/bash
TARGET="node_modules/@google/gemini-cli-a2a-server/dist/a2a-server.mjs"

if [ ! -f "$TARGET" ]; then
    echo "Error: Target file $TARGET not found."
    exit 1
fi

echo "Applying patches to $TARGET..."

# 1. OverrideStrategy の無力化 (Routing bypassed... を出さないようにする)
# route() メソッドの冒頭で return null; させる
sed -i 's/async route(context2, config3, _baseLlmClient, _localLiteRtLmClient) {/async route(context2, config3, _baseLlmClient, _localLiteRtLmClient) { return null; /' "$TARGET"

# 2. 念のため getBestAvailableModel 的なロジックも Flash を返すように誘導する (もし存在すれば)
# ここでは一旦 OverrideStrategy の無効化だけで様子を見ます

echo "Patch applied successfully."
