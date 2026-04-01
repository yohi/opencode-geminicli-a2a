# OpenCode A2A Integration Test Re-execution Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** OpenCode に `opencode-geminicli-a2a-provider` を統合し、Gemini CLI A2A サーバーとの通信を実機で検証する。

**Architecture:** `npm link` によるローカルパッケージの結合と、`opencode.jsonc` の設定更新によるプロバイダーの有効化。

**Tech Stack:** Node.js (v25), npm, OpenCode, Gemini CLI A2A Server.

---

## Tasks

### Task 1: OpenCode へのリンク設定

**Files:**
- Modify: `/home/y_ohi/.opencode/package.json` (via npm link)

**Step 1: Execute npm link in OpenCode project**

Run: `cd /home/y_ohi/.opencode && npm link opencode-geminicli-a2a-provider`
Expected: `added 1 package` またはリンク成功のメッセージ。

**Step 2: Verify the link in node_modules**

Run: `ls -l /home/y_ohi/.opencode/node_modules/opencode-geminicli-a2a-provider`
Expected: シンボリックリンクが現在のプロバイダーディレクトリを指していること。

---

### Task 2: 設定ファイルのバックアップと更新

**Files:**
- Create: `/home/y_ohi/.config/opencode/opencode.jsonc.bak` (Backup)
- Modify: `/home/y_ohi/.config/opencode/opencode.jsonc`

**Step 1: Create backup**

Run: `cp /home/y_ohi/.config/opencode/opencode.jsonc /home/y_ohi/.config/opencode/opencode.jsonc.bak`

**Step 2: Add a2aProvider configuration**

Modify: `/home/y_ohi/.config/opencode/opencode.jsonc`
Action: `provider` セクションの前に `a2aProvider` オブジェクトを追加し、`plugin` セクションに `opencode-geminicli-a2a-provider` を追記。

---

### Task 3: A2A サーバーの状態確認

**Step 1: Verify server process and port**

Run: `ps aux | grep a2a-server && lsof -i :41242`
Expected: PID 1456676 が TCP *:41242 を LISTEN していること。

---

### Task 4: 実機動作確認

**Step 1: Start OpenCode**

Run: `opencode` (インタラクティブモード)

**Step 2: Test Streaming and Reasoning**

Prompt: `こんにちは。Gemini A2A 経由で話していますか？今の時刻を教えてください。`
Verify:
- テキストが逐次表示される（ストリーミング）。
- 思考プロセス（💭 などの表示）が現れる。

**Step 3: Test Tool Call Interception**

Prompt: `カレントディレクトリのファイル一覧を見せてください。`
Verify:
- OpenCode の「Allow tool call?」という承認 UI が表示される。
- 承認後、ツール実行結果が A2A サーバーに送られ、その結果に基づいた回答が返ってくる。
