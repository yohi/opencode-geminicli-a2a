# opencode-geminicli-a2a-provider

OpenCode と Gemini CLI を A2A (Agent-to-Agent) プロトコルを介して直接連携させるためのカスタムプロバイダープラグインです。Vercel AI SDK 互換のインターフェースを提供します。

## 特徴

- **ネイティブ A2A サポート**: 中間プロキシサーバーを介さず、Gemini CLI と直接通信します。
- **マルチターン対話とツール対応**: A2A プロトコルの `contextId` と `taskId` を利用してサーバー側でコンテキストをシームレスに維持し、ツールコールの結果を引き継いでタスクを継続できます。
- **思考プロセスの可視化**: A2A サーバーからの思考データ（`kind: "data"`）をインターセプトし、AI SDK の `reasoning` パーツとしてフロントエンド側へ表示可能です。
- **AI SDK 互換**: `@ai-sdk/provider` の `LanguageModelV1` インターフェースを実装しており、`@ai-sdk` とシームレスに統合可能です。
- **堅牢な設計**: スナップショット形式ストリームの自動重複排除や、`ofetch` による自動リトライ機能を内蔵しています。
- **型安全**: `Zod` によるランタイム・スキーマバリデーションを適用しています。

## インストール

```bash
npm install opencode-geminicli-a2a-provider
```

## 設定

環境変数またはコード内での明示的な設定の両方に対応しています。

### 環境変数

- `GEMINI_A2A_PORT`: Gemini CLI A2A サーバーのポート (デフォルト: `41242`)
- `GEMINI_A2A_HOST`: Gemini CLI A2A サーバーのホスト (デフォルト: `127.0.0.1`)
- `GEMINI_A2A_PROTOCOL`: 接続プロトコル (`http` または `https`、デフォルト: `http`)
- `GEMINI_A2A_TOKEN`: 認証用トークン（任意）

### OpenCode での設定例

`opencode.jsonc` に以下の設定を追加することで、プロバイダーの動作をカスタマイズできます。

```jsonc
{
  "a2aProvider": {
    "host": "127.0.0.1",
    "port": 41242,
    "protocol": "http",
    "token": "your-token-here"
  }
}
```

## 使い方

```typescript
import { createGeminiA2AProvider } from 'opencode-geminicli-a2a-provider';
import { streamText } from 'ai';

const geminiA2A = createGeminiA2AProvider({
  port: 41242,
  protocol: 'http'
});

const model = geminiA2A('gemini-2.5-pro');

// AI SDK の streamText を使用してマルチターン対話を実行
async function runConversation() {
  console.log('--- 1ターン目 ---');
  // ※1. 同一のプロバイダー (model) インスタンスを使うことで自動的に 
  //     内部で contextId/taskId が保持され、マルチターンが継続します。
  let { textStream, reasoningStream } = streamText({
    model,
    prompt: 'こんにちは、今日の調子はどうですか？'
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
  console.log('\n');

  console.log('--- 2ターン目 ---');
  // ※3. 同じプロバイダーインスタンス (model) を再利用して 
  //     再度 streamText を呼び出すと、前回の会話コンテキストが継続します。
  ({ textStream, reasoningStream } = streamText({
    model,
    prompt: 'なるほど。それでは、今の話題についてもう少し詳しく教えてください。'
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
  console.log('\n');
}

runConversation().catch(console.error);
```

> [!WARNING]
> プロバイダー（`model` インスタンス）内で `contextId` や `taskId` の状態を保持している関係上、同一インスタンスで並行して `streamText` を呼び出すと状態の競合が発生します。複数セッションを並行実行する場合はそれぞれ別のインスタンスを生成してください。

## 制限事項および残存課題 (Phase 2, Phase 3 調査結果より)

OpenCode との実機統合テストおよび A2A プロセスの互換性調査（Phase 2、Phase 3）において、以下の設計上の判断や制限事項が確認されており、今後の残存課題となっています。

- **Embeddings（テキスト埋め込み）非対応**:
  現在のプロバイダーは `@ai-sdk/provider` の `ProviderV1` に準拠した構造を持っていますが、A2A の特性上テキスト埋め込みモデル（`textEmbeddingModel`）はサポートしていません。誤用を防ぐため、呼び出した場合はランタイムで明示的なエラー (`textEmbeddingModel is not supported`) がスローされます。
- **設定値の上書き（オーバーライド）の優先順位**:
  モデルを生成・呼び出しする際に `settings` で動的に上書きすることが可能です。設定の優先順位は「`languageModel(modelId, settings)` や `a2a(modelId, settings)` > `createGeminiA2AProvider(options)` > 環境変数 (`GEMINI_A2A_*`) 」です。環境変数による上書きは最も優先順位が低いため、意図せぬ動作を防ぐために留意してください。
- **ポート番号と動的割り当て環境での注意**:
  ポート番号の上限（65535）を超える指定（加算など）を行うと、Zod のバリデーションにより実行時例外が発生します。動的にポートを取り回す環境では限界値や特権ポートを避けるよう注意が必要です。
- **マニフェストにおけるサポートモデルの限定**:
  プロバイダー関数は本来すべての `modelId` を受け入れますが、現状の OpenCode プラグインマニフェスト（`package.json`）では MVP 版として `gemini-2.5-pro`、`gemini-2.5-flash`、`gemini-1.5-pro` など数種類のモデルのみが UI のリストにエクスポートされています。モデル選択の完全な網羅性向上が今後の課題です。
- **直接呼び出し構文の後方互換性維持**:
  `const model = a2a('gemini-2.5-pro')` のような旧来の呼び出し手法は、互換性維持のためテストでカバレッジを担保しつつ引き続きサポートされていますが、将来的に `languageModel()` への完全移行を視野に検討する必要があります。

## アーキテクチャ

詳細なアーキテクチャ設計や通信プロトコルの仕様については、[SPEC.md](./SPEC.md) を参照してください。

## 開発ガイド

### 前提条件

- Node.js (v20 以上)
- npm

リポジトリをクローンした後、まず依存関係をインストールしてください：

```bash
npm install
```

### A2A サーバーの起動 (Gemini CLI)

本プロバイダーと通信するための Gemini CLI A2A サーバーを以下の手順で起動します。

1. **パッケージの確認**:
   `@google/gemini-cli-a2a-server` がインストールされていることを確認します。

2. **サーバーの起動**:
   環境変数 `CODER_AGENT_PORT` でポートを指定し、認証情報（API キー等）を付与して起動します。

   ```bash
   # API キーを使用する場合
   GEMINI_API_KEY=your_api_key CODER_AGENT_PORT=41242 gemini-cli-a2a-server

   # 内部環境 (CCPA) の場合
   USE_CCPA=true CODER_AGENT_PORT=41242 gemini-cli-a2a-server
   ```

   > [!IMPORTANT]
   > **Node.js v25 以上を使用している場合**:
   > 拡張子のないコマンド（シンボリックリンク）を実行すると、ESM 判定に失敗して何も表示されずに終了（サイレントエグジット）することがあります。その場合は、以下のように実体の `.mjs` ファイルを `node` で直接実行してください。
   >
   > ```bash
   > # クロスプラットフォームな環境の例 (Homebrew/macOS, nvm, local installs 等)
   > USE_CCPA=true GEMINI_API_KEY=your_api_key CODER_AGENT_PORT=41242 node $(npm root -g)/@google/gemini-cli-a2a-server/dist/a2a-server.mjs
   > ```

### 開発用コマンド

- `npm run dev`: ホットリロードを有効にしてビルドを開始します。
- `npm run build`: プロジェクトをビルドします (CJS/ESM 両対応)。
- `npm run test`: Vitest による全テストを実行します。
- `npm run typecheck`: TypeScript の型チェックを実行します。
