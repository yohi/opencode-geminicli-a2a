# Integration Test and SPEC Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** SPEC.mdの内容を最新のコードと同期させ、ローカル環境のOpenCodeアプリとA2Aプロバイダーを統合・テストする手順を確立・実行する。

**Architecture:** SPEC.mdはZodスキーマの修正と設計変更を反映。統合テストは `npm run build` を経て、ローカルリンクを用いて動作確認環境を構築する。

**Tech Stack:** Markdown, npm link

---

### Task 1: SPEC.md とコードの乖離是正

**Files:**
- Modify: `SPEC.md`

**Step 1: SPEC.mdの Zod スキーマ定義部分を更新**

SPEC.md の「5. Data Structure & Schemas」内の `A2AJsonRpcResponseSchema` (`status.state`, `usage`, `metadata` などの最新フィールド対応) と、スナップショット重複排除および `reasoning` マッピングの仕様の記載を追加する。

**Step 2: 変更の確認とコミット**

```bash
git add SPEC.md
git commit -m "docs(spec): 最新の実装に合わせてスキーマ定義と動作仕様を更新"
```

### Task 2: OpenCode への統合テスト準備 (npm link)

**Files:**
- None (Environment setup)

**Step 1: プラグインをビルドしてグローバルリンク作成**

```bash
npm run build
npm link
```

**Step 2: (ユーザー手動手順の提示) OpenCode側での設定方法**

OpenCode 側で `opencode.jsonc` を修正し、`npm link opencode-geminicli-a2a-provider` を実行して結合する手順を README 等に追記、もしくはターミナル上に提示して手動実行を促す。
