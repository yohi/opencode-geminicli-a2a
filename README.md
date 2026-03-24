# opencode-geminicli-a2a-provider

OpenCode と Gemini CLI を A2A (Agent-to-Agent) プロトコルを介して直接連携させるためのカスタムプロバイダープラグインです。Vercel AI SDK 互換のインターフェースを提供します。

## 特徴

- **ネイティブ A2A サポート**: 中間プロキシサーバーを介さず、Gemini CLI と直接通信します。
- **マルチターン対話とツール対応**: A2A プロトコルの `contextId` と `taskId` を利用してサーバー側でコンテキストをシームレスに維持し、ツールコールの結果を引き継いでタスクを継続できます。
- **マルチモーダルサポート**: 画像やファイルの提供に対応し、A2A の仕様に基づくネイティブなマルチモーダル推論が可能です。
- **動的ルーティングと耐障害性**: 動的なモデルレジストリ、クォータ枯渇などのエラー発生時における別モデルへの自動フォールバック機構、および使用モデルに応じて別々の A2A サーバーへディスパッチするマルチエージェントルーティングをサポートしています。
- **推論パラメータの動的指定**: `generationConfig` (`temperature`, `topP`, `maxOutputTokens`, `stopSequences` 等) をサポートし、リクエスト単位でモデルの挙動を微調整可能です。
- **思考プロセスの可視化**: A2A サーバーからの思考データ（`kind: "data"`）をインターセプトし、AI SDK の `reasoning` パーツとしてフロントエンド側へ表示可能です。
- **スキーマ・ブリッジング (Schema Bridging)**: Gemini モデルの柔軟な（時に不完全な）ツール呼び出しと、OpenCode の厳密なスキーマ要件の間のギャップを自動で埋めます。`filePath` への引数名変換や `description` の自動補完により、ツール実行エラーを劇的に削減します。
- **ハルシネーション（幻覚）保護**: モデルがシェルコマンド内で `task()` などの擬似コードを実行しようとする誤用を自動検知してインターセプトし、安全にガイドします。
- **無限ループの根本解消**: A2A プロトコルの `contextId` を活用した「Stateful Deltas（差分送信）」を採用。履歴の重複や記憶喪失による「同じファイルの再読み込みループ」を構造的に排除しました。
- **AI SDK 互換**: `@ai-sdk/provider` の `LanguageModelV1` インターフェース（`specificationVersion: 'v2'` 対応）を実装しており、`@ai-sdk` とシームレスに統合可能です。
- **堅牢な設計**: スナップショット形式ストリームの自動重複排除や、`ofetch` による自動リトライ機能を内蔵しています。
- **型安全**: `Zod` によるランタイム・スキーマバリデーションを適用しています。
- **内部ツールの自動承認とUI非表示制御**: A2Aの内部ツール（`activate_skill`等）をOpenCodeのUIに露出させず、プロバイダー層で自動承認ループを回すことで、シームレスな対話とツール実行の中断エラーを防ぎます。
- **動的モデルのサポート**: 最新のモデルリストを動的に解決・ルーティングする機能を提供します。
- **LiteLLM プロキシ対応**: LiteLLM 等のプロキシサーバー経由での通信をサポート。モデル名に応じた A2A サーバーへの動的ルーティングや集中管理が可能です。

## OpenCode への導入とセットアップ

本プロバイダーを OpenCode から使用するためには、以下のステップで設定ファイルを更新し、A2A サーバーを起動します。

### 1. OpenCode 設定ファイルの更新

GitHub Packages からパッケージをインストールするため、事前に `~/.npmrc` へ GitHub Packages の認証設定を行ってください。
システムの環境変数を利用して認証トークンを渡すことを推奨します（シェルで `export GITHUB_PACKAGES_TOKEN=あなたのトークン` 等を実行して事前に設定してください）。

> [!CAUTION]
> Personal Access Token (PAT) は機密情報です。`read:packages` スコープを持つトークンを生成し、`.npmrc` に直接記述するのではなく環境変数を参照するように設定してください。また、作成した `.npmrc` ファイル自体のパーミッションも適切に設定してください（例: `chmod 600 ~/.npmrc`）。

```ini
@yohi:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

OpenCode の設定ファイル（通常 `~/.config/opencode/opencode.jsonc`）を編集し、接続設定を追加します。

> [!TIP]
> 必要な設定をすべて含む完全な例は [examples/opencode.jsonc](./examples/opencode.jsonc) を参照してください。

```jsonc
{
  // 1. エージェントが使用するデフォルトモデルを指定
  // フォーマットは 提供元/モデル名 (プロバイダーID/モデルID) です
  "model": "opencode-geminicli-a2a/gemini-3.1-pro-preview",
  "small_model": "opencode-geminicli-a2a/gemini-3-flash-preview",

  // 2. A2A サーバーとの接続設定と、使用可能なモデルの定義
  // ※デフォルト値で機能する場合は options は省略可能ですが、モデルをUIで選択可能にするためには
  //   以下のように models にリストアップする必要があります
  "provider": {
    "opencode-geminicli-a2a": {
      // npm: プロバイダーSDKのロード先を指定します。
      // GitHub Packagesを利用する場合: スコープ付きパッケージ名を指定
      // (ローカル開発時: "file:///path/to/opencode-geminicli-a2a-provider/dist/index.js")
      "npm": "@yohi/opencode-geminicli-a2a-provider",
      "options": {
        "host": "127.0.0.1",
        "port": 41242,
        "protocol": "http"
      },
      "models": {
        // モデルごとに個別の推論パラメータを指定可能 (OpenCode スキーマ準拠)
        "gemini-3.1-pro-preview": {
          "options": {
            "generationConfig": {
              "temperature": 0.2,
              "maxOutputTokens": 8192
            }
          }
        },
        "gemini-3-flash-preview": true, // シンプルな有効化も可能
        "gemini-2.5-pro": {
          "options": {
            "generationConfig": {
              "temperature": 0.7
            }
          }
        }
      },
    },
  },
}
```

### 2. A2A サーバーの起動 (Gemini CLI)

本プロバイダーから通信を行うためのバックエンドとして、Gemini CLI A2A サーバーを起動しておく必要があります。

1. **パッケージの確認**:
   `@google/gemini-cli-a2a-server` がインストールされていることを確認します（グローバルインストール推奨）。

2. **サーバーの起動**:
   環境変数 `CODER_AGENT_PORT` で設定したポートと一致させ、認証情報（API キー等）を付与して起動します。

   ```bash
   # API キーを使用する場合 (デフォルトモデルを 3-flash に指定)
   GEMINI_API_KEY=your_api_key CODER_AGENT_PORT=41242 A2A_GEMINI_MODEL=gemini-3-flash-preview gemini-cli-a2a-server

   # 内部環境 (CCPA) の場合
   USE_CCPA=true CODER_AGENT_PORT=41242 A2A_GEMINI_MODEL=gemini-3-flash-preview gemini-cli-a2a-server
   ```

   > [!IMPORTANT]
   > **Node.js v25 以上を使用している場合**:
   > 拡張子のないコマンド（シンボリックリンク）を実行すると、ESM 判定に失敗して何も表示されずに終了（サイレントエグジット）することがあります。その場合はOSに応じて、実体の `.mjs` ファイルを `node` で直接実行するか、`npx` 等のプラットフォーム非依存な手段をご利用ください。
   >
   > **Unix / Linux / macOS (sh/bash) の場合**
   >
   > ```bash
   > # API キーを使用する場合
   > GEMINI_API_KEY=your_api_key CODER_AGENT_PORT=41242 node $(npm root -g)/@google/gemini-cli-a2a-server/dist/a2a-server.mjs
   >
   > # 内部環境 (CCPA) の場合
   > USE_CCPA=true CODER_AGENT_PORT=41242 node $(npm root -g)/@google/gemini-cli-a2a-server/dist/a2a-server.mjs
   > ```
   >
   > **Windows (cmd.exe) の場合**
   >
   > ```cmd
   > :: API キーを使用する場合
   > set USE_CCPA=
   > set GEMINI_API_KEY=your_api_key
   > set CODER_AGENT_PORT=41242
   > node "%APPDATA%\npm\node_modules\@google\gemini-cli-a2a-server\dist\a2a-server.mjs"
   >
   > :: 内部環境 (CCPA) の場合
   > set GEMINI_API_KEY=
   > set USE_CCPA=true
   > set CODER_AGENT_PORT=41242
   > node "%APPDATA%\npm\node_modules\@google\gemini-cli-a2a-server\dist\a2a-server.mjs"
   > ```
   >
   > **Windows (PowerShell) の場合**
   >
   > ```powershell
   > # API キーを使用する場合
   > Remove-Item Env:USE_CCPA -ErrorAction SilentlyContinue; $env:GEMINI_API_KEY="your_api_key"; $env:CODER_AGENT_PORT="41242"; node "$env:APPDATA\npm\node_modules\@google\gemini-cli-a2a-server\dist\a2a-server.mjs"
   >
   > # 内部環境 (CCPA) の場合
   > Remove-Item Env:GEMINI_API_KEY -ErrorAction SilentlyContinue; $env:USE_CCPA="true"; $env:CODER_AGENT_PORT="41242"; node "$env:APPDATA\npm\node_modules\@google\gemini-cli-a2a-server\dist\a2a-server.mjs"
   > ```
   >
   > **プラットフォーム非依存な実行例 (npx / npm exec を使用)**
   > npx / npm exec 環境でパス解決を委譲する場合。互換性に有利です。
   >
   > ```bash
   > # npm exec を使用する場合
   > npm exec --package=@google/gemini-cli-a2a-server --package=cross-env -- cross-env GEMINI_API_KEY=your_api_key CODER_AGENT_PORT=41242 A2A_GEMINI_MODEL=gemini-3-flash-preview gemini-cli-a2a-server
   >
   > # npx を使用する場合
   > npx -p @google/gemini-cli-a2a-server -p cross-env cross-env GEMINI_API_KEY=your_api_key CODER_AGENT_PORT=41242 A2A_GEMINI_MODEL=gemini-3-flash-preview gemini-cli-a2a-server
   > ```

### 3. 環境変数による設定 (任意)

接続情報は `opencode.jsonc` 内の `provider.opencode-geminicli-a2a.options` ブロック以外にも、以下の環境変数を利用して指定することが可能です（※ `opencode.jsonc` の設定やコード上の設定が指定されていない場合のフォールバックとして機能します）。

- `GEMINI_A2A_PORT`: Gemini CLI A2A サーバーのポート (デフォルト: `41242`)
- `GEMINI_A2A_HOST`: Gemini CLI A2A サーバーのホスト (デフォルト: `127.0.0.1`)
- `GEMINI_A2A_PROTOCOL`: 接続プロトコル (`http` または `https`、デフォルト: `http`)
- `GEMINI_A2A_TOKEN`: 認証用トークン
- `LITELLM_PROXY_URL`: LiteLLM プロキシサーバーの URL (ローカル: `http://localhost:4000` / Devcontainer: `http://litellm:4000`)
- `LITELLM_PROXY_API_KEY`: LiteLLM プロキシサーバーの API キー (Master Key 等)

> **A2Aサーバー側の制御（参考）**  
> `gemini-cli-a2a-server` デーモンはデフォルトで一番高度なモデル（`gemini-3.1-pro-preview` 等）にフォールバック・上書きする仕様になっています。OpenCode 側での指定モデルを尊重させたり、軽量モデルを利用したりするためには、A2Aサーバー起動時に環境変数 `A2A_GEMINI_MODEL=gemini-3-flash-preview` 等を必ず指定してください。

## 使い方

```typescript
import { createGeminiA2AProvider } from "@yohi/opencode-geminicli-a2a-provider";
import { streamText } from "ai";

const geminiA2A = createGeminiA2AProvider({
  port: 41242,
  protocol: "http",
});

const model = geminiA2A("gemini-2.5-pro");

// ルーターを使用したマルチエージェント構成や、フォールバック構成にすることも可能です
// 詳しくは `createProviderRouter` やフォールバックオプションを参照してください。
// 参照: SPEC.md の「8.2 Multiple Agents Routing (Provider Level)」セクション

// AI SDK の streamText を使用してマルチターン対話を実行
async function runConversation() {
  console.log("--- 1ターン目 ---");
  // ※1. 同一のプロバイダー (model) インスタンスを使うことで自動的に
  //     内部で contextId/taskId が保持され、マルチターンが継続します。
  let { textStream, reasoningStream } = streamText({
    model,
    prompt: "こんにちは、今日の調子はどうですか？",
  });

  // ※2. reasoningStream と textStream を並行消費して順序問題を回避
  await Promise.all([
    (async () => {
      for await (const reasoning of reasoningStream) {
        process.stdout.write(`💭 ${reasoning}`);
      }
    })(),
    (async () => {
      for await (const textDelta of textStream) {
        process.stdout.write(textDelta);
      }
    })(),
  ]);
  console.log("\n");

  console.log("--- 2ターン目 ---");
  // ※3. 同じプロバイダーインスタンス (model) を再利用して
  //     再度 streamText を呼び出すと、前回の会話コンテキストが継続します。
  ({ textStream, reasoningStream } = streamText({
    model,
    prompt:
      "なるほど。それでは、今の話題についてもう少し詳しく教えてください。",
  }));

  await Promise.all([
    (async () => {
      for await (const reasoning of reasoningStream) {
        process.stdout.write(`💭 ${reasoning}`);
      }
    })(),
    (async () => {
      for await (const textDelta of textStream) {
        process.stdout.write(textDelta);
      }
    })(),
  ]);
  console.log("\n");
}

runConversation().catch(console.error);
```

### generationConfig のスコープと優先順位

本プロバイダーでは、モデルの挙動を微調整する `generationConfig` (`temperature`, `topP`, `maxOutputTokens`, `stopSequences` 等) を以下の 3 つのレベルで柔軟に設定可能です。

1.  **プロバイダーレベル (Provider Defaults)**:
    `createGeminiA2AProvider({ generationConfig: { ... } })` の初期化時、または `opencode.jsonc` の `provider` オプションとして指定する共通のデフォルト設定です。
2.  **モデルレベル (Model Config)**:
    `opencode.jsonc` の `models` セクションにおいて、モデルごとに個別に定義する設定です。
3.  **リクエストレベル (Request Overrides)**:
    AI SDK の `streamText` や `generateText` を呼び出す際に、引数として直接渡す設定です。

#### 優先順位（衝突ルール）

設定が衝突した場合、以下の順序で優先（上書き）されます：

**リクエストレベル (最優先)** > **モデルレベル** > **プロバイダーレベル** > **A2A サーバー / モデルの規定値**

#### 設定と上書きの例

プロバイダー全体で低い温度感 (`temperature: 0.1`) をデフォルトとしつつ、特定のリクエストで高い温度感 (`temperature: 0.9`) を指定してクリエイティブな回答を得る例：

```typescript
import { createGeminiA2AProvider } from "@yohi/opencode-geminicli-a2a-provider";
import { streamText } from "ai";

// 1. プロバイダーレベルでデフォルト値を設定
const geminiA2A = createGeminiA2AProvider({
  generationConfig: {
    temperature: 0.1,      // デフォルトは堅実な回答
    maxOutputTokens: 2048,
  }
});

const model = geminiA2A("gemini-2.5-pro");

// 2. リクエストレベルで個別に上書き
const { textStream } = streamText({
  model,
  prompt: "独創的な物語を書いてください。",
  temperature: 0.9,       // プロバイダーの 0.1 を 0.9 で上書き
  maxTokens: 4096,        // maxOutputTokens を 4096 で上書き
});
```

> [!TIP]
> `opencode.jsonc` でのモデルごとの設定例については、[examples/opencode.jsonc](./examples/opencode.jsonc) を参照してください。

> [!WARNING]
> プロバイダー（`model` インスタンス）内で `contextId` や `taskId` の状態を保持している関係上、同一インスタンスで並行して `streamText` を呼び出すと状態の競合が発生します。複数セッションを並行実行する場合はそれぞれ別のインスタンスを生成してください。
>
> また、デフォルトで利用される `sharedSessionStore` (および `InMemorySessionStore`) はプロセス内シングルトンです。サーバレスやマルチプロセス環境ではプロセス間で状態を共有できないため、外部セッションストアを使用する必要があります。その場合、プロバイダーの初期化時に `createGeminiA2AProvider({ sessionStore: myRedisStore })` のように設定を渡してください。

## 制限事項および残存課題 (Phase 2: OpenCode統合テスト・Phase 3: A2A互換性調査 より)

OpenCode との実機統合テストおよび A2A プロセスの互換性調査において、以下の設計上の判断や制限事項が確認されており、今後の残存課題となっています。

- **Embeddings（テキスト埋め込み）非対応**:
  現在のプロバイダーは `@ai-sdk/provider` の `ProviderV1` に準拠した構造を持っていますが、A2A の特性上テキスト埋め込みモデル（`textEmbeddingModel`）はサポートしていません。誤用を防ぐため、呼び出した場合はランタイムで明示的なエラー (`textEmbeddingModel is not supported`) がスローされます。
- **設定値の上書き（オーバーライド）の優先順位**:
  一般的な「環境変数が最優先でコード側を上書きする」慣習とは異なり、本プロバイダーでは**コード・設定ファイルレベルの指定が常に環境変数をオーバーライド**する設計となっています。これはデプロイ環境等での予期せぬ環境変数によって、明示的に行われた指定が意図せず変更されるのを防ぐためです。
  設定の最終的な優先順位は以下のように評価されます：
  `geminiA2A(modelId, settings)` (前述の例で `createGeminiA2AProvider()` が返す関数) > `opencode.jsonc` の `provider` 指定等 (`createGeminiA2AProvider(options)` に渡る値) > 環境変数 (`GEMINI_A2A_*`)
  デプロイ環境で環境変数による一時的な動作の変更を期待する場合は、コード側（`settings`）や設定ファイル側（`opencode.jsonc`等）での上書き指定を省略（`undefined` に）する必要があります。
- **ポート番号と動的割り当て環境での注意**:
  ポート番号の上限（65535）を超える指定（加算など）を行うと、Zod のバリデーションにより実行時例外が発生します。動的にポートを取り回す環境では限界値や特権ポートを避けるよう注意が必要です。
- **マニフェストにおけるサポートモデルの限定**:
  プロバイダー関数は本来すべての `modelId` を受け入れますが、現状の OpenCode プラグインマニフェスト（`package.json` の `opencode.models`）では特定のモデルのみが UI のリストにエクスポートされています。最新のサポートモデル一覧については、`package.json` または同期スクリプト (`scripts/update-models.ts`) を参照してください。モデル選択の完全な網羅性向上が今後の課題です。
- **直接呼び出し構文の後方互換性維持**:
  `const model = geminiA2A('gemini-2.5-pro')` のようなプロバイダー関数を直接呼び出す手法は、互換性維持のため引き続きサポートされていますが、AI SDK の標準的な手法であるレジストリ経由（`languageModel('opencode-geminicli-a2a:gemini-2.5-pro')`）などへの完全移行も視野に検討する必要があります。
- **CCPA環境下のクォータ制限 (Rate Limit)**:
  `USE_CCPA=true` を指定して内部環境向けに A2A サーバーを起動した場合、`gemini-3.1-pro-preview` や `gemini-3-flash-preview` などのプレビューモデルに対するクォータ上限が厳しく設定されており、容易に枯渇して数時間の制限がかかることが確認されています。**自動フォールバック機能**はデフォルトで無効になっており、明示的な設定がない場合はそのままエラーが発生します。あらかじめ `opencode.jsonc` 等でフォールバック設定を有効にして安定版モデル（`gemini-2.5-pro` など）への自動切り替えを指定するか、状況に応じて手動でモデルを変更する運用が必要になります。

## 高度な設定・機能

### 内部ツールの自動承認ループ

A2Aサーバーが要求する `tool-call-confirmation` などの内部状態に対し、プロバイダーは最大10回のループを回して自動的に確認リクエスト（`buildConfirmationRequest`）を送信します。これにより、OpenCodeのUIが不要なツールコールを受け取って無限ループや「Tool execution aborted」となる事態を防ぎ、内部ツール（例: `activate_skill`）をシームレスに実行させます。

### デバッグログの出力制御

環境変数 `DEBUG_OPENCODE=1` 等を設定して起動することで、プロバイダーからA2Aサーバーへのリクエスト/レスポンスの詳細や、ツールコールの自動承認カウントなどをコンソール（stderrなど）に出力でき、動作のトラブルシューティングに役立てることができます。

## アーキテクチャ

詳細なアーキテクチャ設計や通信プロトコルの仕様については、[SPEC.md](./SPEC.md) を参照してください。

## 開発ガイド

### ローカルでのビルドと依存関係のバンドルについて

OpenCode の設定ファイル（`opencode.jsonc`）でプロバイダーをローカルパス（`file:///.../dist/index.js`）から直接読み込む場合、OpenCode 側は npm の依存解決を行いません。
そのため、実行時の `Cannot find module` エラーを防ぐ目的で、本プロジェクトの `build` スクリプトは **`@ai-sdk/provider` などの軽量な依存パッケージを含め、すべて1つの `dist/index.js` / `dist/index.cjs` にバンドル** する設定になっています（esbuild の `--external` オプションを外しています）。

現在は GitHub Packages にパッケージ（`@yohi/opencode-geminicli-a2a-provider`）としての公開設定を整備済みであり、リリース作成後に `opencode.jsonc` でのパッケージ名指定による導入方式へ移行可能になります（Phase 3）。それに伴い、今後はこの「全部入りのビルド」設定を見直し、標準的な npm 依存関係の形へ移行してプラグインを軽量化することを検討しています。

### 前提条件

- Node.js (v20 以上)
- npm

リポジトリをクローンした後、まず依存関係をインストールしてください：

```bash
npm install
```

### 開発用コマンド

- `npm run dev`: ホットリロードを有効にしてビルドを開始します。
- `npm run build`: プロジェクトをビルドします (CJS/ESM 両対応)。
- `npm run test`: Vitest による全テストを実行します。
- `npm run typecheck`: TypeScript の型チェックを実行します。

### 開発環境 (Devcontainer)

VS Code や DevPod を使用している場合、専用の Devcontainer 環境を利用可能です。

- **前提条件**: Docker, VS Code, [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) 拡張機能
- **構成ファイル**: `.devcontainer/devcontainer.json`, `.devcontainer/docker-compose.yml`, `.devcontainer/litellm-config.yaml`

1. プロジェクトを VS Code で開き、コマンドパレットから `Dev Containers: Reopen in Container` を選択します。
2. コンテナ起動時に、サイドカーサービスとして **LiteLLM プロキシ** が自動的に立ち上がります。
3. `LITELLM_PROXY_URL=http://litellm:4000` を通じて、LiteLLM 経由で A2A サーバーへのルーティングテストなどが即座に実施可能です。

> **Linux ユーザーへの注意**: コンテナ内から `host.docker.internal` が解決できない場合は、`.devcontainer/docker-compose.yml` の `app` サービスに `extra_hosts: ["host.docker.internal:host-gateway"]` を追加してください。

## 実装済みのコア機能 (Phase 1〜7)

現在までの開発において、以下の主要な機能が安定稼働する状態になっています。

- コア機能（チャット、ストリーミング、ツール呼び出し、思考プロセスの可視化）
- デプロイメントの最適化（GitHub Packages 公開設定済み）
- A2A ネイティブな状態管理（contextId による差分送信、Stateful Deltas）
- スキーマ・ブリッジング（OpenCode ツール引数の自動正規化と補完）
- ハルシネーションインターセプト（不正なシェルコマンドの自動修正）
- マルチモーダル (画像/ファイル) ネイティブ対応
- マルチモデル・動的構成の強化（動的モデルリスト取得）
- エラー時の自動フォールバック機構（クォータ制限到達時などの耐障害性）
- 複数エージェントルーティング機能
- LiteLLM プロキシ経由の通信と API キー認証のサポート
- Devcontainer による標準化された開発環境の提供

## 今後のロードマップ (Future)

今後は以下の拡張・最適化を予定/検討しています。

- **バンドル依存の段階的解除**: 現在の「すべてを1つのファイルにバンドルする」ビルド設定を見直し、標準的な npm 依存関係（例: `@ai-sdk/provider` の外部化）の形へ移行してプラグインをさらに軽量化します。
- **Embedding (埋め込み) モデルのフォールバック**: 今後 OpenCode 側で Embedding が必須となった場合に備え、A2A ではなく通常の Gemini API へ自動フォールバックして処理する別系統の中継層の実装。
- **モデル選択の完全網羅とUI対応の改善**: UIのリストにエクスポートされる情報を、A2A サーバーから動的取得した全リストと完全に同期・統合する仕組みの確立。
