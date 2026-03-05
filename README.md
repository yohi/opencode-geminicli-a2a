# opencode-geminicli-a2a-provider

OpenCode と Gemini CLI を A2A (Agent-to-Agent) プロトコルを介して直接連携させるためのカスタムプロバイダープラグインです。Vercel AI SDK 互換のインターフェースを提供します。

## 特徴

- **ネイティブ A2A サポート**: 中間プロキシサーバーを介さず、Gemini CLI と直接通信します。
- **AI SDK 互換**: `@ai-sdk/provider` の `LanguageModelV1` インターフェースを実装しており、`@ai-sdk` とシームレスに統合可能です。
- **堅牢な設計**: `ofetch` による自動リトライとタイムアウト機能を内蔵しています。
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
- `GEMINI_A2A_TOKEN`: 認証用トークン（任意）

### OpenCode での設定例

`opencode.jsonc` に以下の設定を追加することで、プロバイダーの動作をカスタマイズできます。

```jsonc
{
  "a2aProvider": {
    "host": "127.0.0.1",
    "port": 41242,
    "token": "your-token-here"
  }
}
```

## 使い方

```typescript
import { createGeminiA2AProvider } from 'opencode-geminicli-a2a-provider';
import { generateText } from 'ai';

const geminiA2A = createGeminiA2AProvider({
  port: 41242
});

const model = geminiA2A('gemini-2.5-pro');

// AI SDK の generateText や streamText を使用
const { text } = await generateText({
  model,
  prompt: 'こんにちは、今日の調子はどうですか？'
});
```

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

