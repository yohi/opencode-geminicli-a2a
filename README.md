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
> プロバイダー（`model` インスタンス）内で `contextId` や `taskId` の状態を保持している関係上、同一インスタンスで並行して `streamText` を呼び出すと状態の競合が発生します。複数並置で会話を続ける場合はそれぞれ別のインスタンスを生成してください。

## アーキテクチャ

詳細なアーキテクチャ設計や通信プロトコルの仕様については、[SPEC.md](./SPEC.md) を参照してください。

## 開発ガイド

### 前提条件
- Node.js (v18 以上)
- npm

### 開発用コマンド
- `npm run dev`: ホットリロードを有効にしてビルドを開始します。
- `npm run build`: プロジェクトをビルドします (CJS/ESM 両対応)。
- `npm run test`: Vitest による全テストを実行します。
- `npm run typecheck`: TypeScript の型チェックを実行します。

