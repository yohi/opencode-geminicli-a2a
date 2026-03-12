# README Update Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update README.md to reflect new features: internal tool auto-confirmation and dynamic model support.

**Architecture:** Add brief descriptions to the "特徴" (Features) section and create a new "高度な設定・機能" (Advanced Settings/Features) section detailing the auto-confirmation loop and debug logging.

**Tech Stack:** Markdown

---

### Task 1: Update README.md

**Files:**
- Modify: `README.md`

**Step 1: Modify "特徴" (Features) section**

Add the following items to the list under `## 特徴`:

```markdown
- **内部ツールの自動承認とUI非表示制御**: A2Aの内部ツール（`activate_skill`等）をOpenCodeのUIに露出させず、プロバイダー層で自動承認ループを回すことで、シームレスな対話とツール実行の中断エラーを防ぎます。
- **動的モデルのサポート**: 最新のモデルリストを動的に解決・ルーティングする機能を提供します。
```

**Step 2: Add "高度な設定・機能" (Advanced Settings/Features) section**

Insert the following content right before the `## アーキテクチャ` section (or after `## 使い方`):

```markdown
## 高度な設定・機能

### 内部ツールの自動承認ループ
A2Aサーバーが要求する `tool-call-confirmation` などの内部状態に対し、プロバイダーは最大10回のループを回して自動的に確認リクエスト（`buildConfirmationRequest`）を送信します。これにより、OpenCodeのUIが不要なツールコールを受け取って無限ループや「Tool execution aborted」となる事態を防ぎ、内部ツール（例: `activate_skill`）をシームレスに実行させます。

### デバッグログの出力制御
環境変数 `DEBUG_OPENCODE=1` 等を設定して起動することで、プロバイダーからA2Aサーバーへのリクエスト/レスポンスの詳細や、ツールコールの自動承認カウントなどをコンソール（stderrなど）に出力でき、動作のトラブルシューティングに役立てることができます。
```

**Step 3: Verify the changes (formatting check)**

Run a simple formatting check or visually inspect the markdown to ensure it renders correctly.

Run: `npx prettier --check README.md`
Expected: Passes or shows minor formatting differences (we will fix if needed).
*(Note: As there are no tests for a simple README edit, reviewing `git diff` is also sufficient.)*

**Step 4: Commit**

```bash
git add README.md
git commit -m "docs(readme): add new features and advanced settings details"
```
