# opencode-geminicli-a2a-provider

OpenCode と Gemini CLI を A2A (Agent-to-Agent) プロトコルを介して直接連携させるためのカスタムプロバイダープラグインです。Vercel AI SDK 互換のインターフェースを提供します。

## 特徴

- **ネイティブ A2A サポート**: 中間プロキシサーバーを介さず、Gemini CLI と直接通信します。
- **マルチターン対話とツール対応**: A2A プロトコルの `contextId` と `taskId` を利用してサーバー側でコンテキストをシームレスに維持し、ツールコールの結果を引き継いでタスクを継続できます。
- **思考プロセスの可視化**: A2A サーバーからの思考データ（`kind: "data"`）をインターセプトし、AI SDK の `reasoning` パーツとしてフロントエンド側へ表示可能です。
- **AI SDK 互換**: `@ai-sdk/provider` の `LanguageModelV1` インターフェース（`specificationVersion: 'v2'` 対応）を実装しており、`@ai-sdk` とシームレスに統合可能です。
- **堅牢な設計**: スナップショット形式ストリームの自動重複排除や、`ofetch` による自動リトライ機能を内蔵しています。
- **型安全**: `Zod` によるランタイム・スキーマバリデーションを適用しています。

## OpenCode への導入とセットアップ

本プロバイダーを OpenCode から使用するためには、以下のステップで設定ファイルを更新し、A2A サーバーを起動します。

### 1. OpenCode 設定ファイルの更新

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
      // ローカル利用: file:// プレフィックス付きの絶対パス（ビルド済みエントリポイント）
      // パッケージ公開後: npm パッケージ名（例: "opencode-geminicli-a2a-provider"）
      "npm": "file:///path/to/opencode-geminicli-a2a-provider/dist/index.js",
      "options": {
        "host": "127.0.0.1",
        "port": 41242,
        "protocol": "http"
      },
      "models": {
        "gemini-3.1-pro-preview": {},
        "gemini-3.1-pro-preview-customtools": {},
        "gemini-3-pro-preview": {},
        "gemini-3-flash-preview": {},
        "gemini-2.5-pro": {},
        "gemini-2.5-flash": {},
        "gemini-2.5-flash-lite": {}
      }
    }
  }
}
```

### 2. A2A サーバーの起動 (Gemini CLI)

本プロバイダーから通信を行うためのバックエンドとして、Gemini CLI A2A サーバーを起動しておく必要があります。

1. **パッケージの確認**:
   `@google/gemini-cli-a2a-server` がインストールされていることを確認します（グローバルインストール推奨）。

2. **サーバーの起動**:
   環境変数 `CODER_AGENT_PORT` で設定したポートと一致させ、認証情報（API キー等）を付与して起動します。

   ```bash
   # API キーを使用する場合
   GEMINI_API_KEY=your_api_key CODER_AGENT_PORT=41242 gemini-cli-a2a-server

   # 内部環境 (CCPA) の場合
   USE_CCPA=true CODER_AGENT_PORT=41242 gemini-cli-a2a-server
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
   > npm exec --package=@google/gemini-cli-a2a-server --package=cross-env -- cross-env GEMINI_API_KEY=your_api_key CODER_AGENT_PORT=41242 gemini-cli-a2a-server
   > 
   > # npx を使用する場合
   > npx -p @google/gemini-cli-a2a-server -p cross-env cross-env GEMINI_API_KEY=your_api_key CODER_AGENT_PORT=41242 gemini-cli-a2a-server
   > ```

### 3. 環境変数による設定 (任意)

接続情報は `opencode.jsonc` 内の `provider.opencode-geminicli-a2a.options` ブロック以外にも、以下の環境変数を利用して指定することが可能です（※ `opencode.jsonc` の設定やコード上の設定が指定されていない場合のフォールバックとして機能します）。

- `GEMINI_A2A_PORT`: Gemini CLI A2A サーバーのポート (デフォルト: `41242`)
- `GEMINI_A2A_HOST`: Gemini CLI A2A サーバーのホスト (デフォルト: `127.0.0.1`)
- `GEMINI_A2A_PROTOCOL`: 接続プロトコル (`http` または `https`、デフォルト: `http`)
- `GEMINI_A2A_TOKEN`: 認証用トークン

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
  `USE_CCPA=true` を指定して内部環境向けに A2A サーバーを起動した場合、`gemini-3.1-pro-preview` や `gemini-3-flash-preview` などのプレビューモデルに対するクォータ上限が厳しく設定されており、容易に枯渇して数時間の制限がかかることが確認されています。現状のプロバイダーはこの制限到達時に別モデルへ自動フォールバックする機能を持たないため、利用者が手動で安定版モデル（`gemini-2.5-pro` など）へ設定を切り替える必要があります。

## アーキテクチャ

詳細なアーキテクチャ設計や通信プロトコルの仕様については、[SPEC.md](./SPEC.md) を参照してください。

## 開発ガイド

### ローカルでのビルドと依存関係のバンドルについて

OpenCode の設定ファイル（`opencode.jsonc`）でプロバイダーをローカルパス（`file:///.../dist/index.js`）から直接読み込む場合、OpenCode 側は npm の依存解決を行いません。
そのため、実行時の `Cannot find module` エラーを防ぐ目的で、本プロジェクトの `build` スクリプトは **`@ai-sdk/provider` などの軽量な依存パッケージを含め、すべて1つの `dist/index.js` / `dist/index.cjs` にバンドル** する設定になっています（esbuild の `--external` オプションを外しています）。

将来的にこのプロバイダーを npm レジストリ（GitHub Packages 等）に公開し、`opencode.jsonc` でパッケージ名として指定する方式へ移行した際は、この「全部入りのビルド」は不要となるため、ビルド設定の見直しを検討してください。

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

## 今後のロードマップ (Future)

現在のプロバイダーは Phase 2 (OpenCode との実機統合) までが完了し、コア機能（チャット、ストリーミング、ツール呼び出し、思考プロセスの可視化）が安定稼働する状態になっています。今後は以下の拡張を予定/検討しています。

### Phase 3: レジストリ統合とデプロイメントの最適化
- **GitHub Packages / npm への公開設定**: CI/CD を整備し、パッケージ公開を自動化。別環境から `opencode.jsonc` でパッケージ名として直接指定可能にする。
- **バンドル依存の段階的解除**: パッケージ公開に伴い、現在の「すべてを1つのファイルにバンドルする」ビルド設定を見直し、標準的な npm 依存関係の形へ移行してプラグインを軽量化。

### Phase 4: A2A 特有の高度なコンテキスト管理
- **Context ID / Task ID の明示的なリセット機能**: OpenCode 側から新規チャットスレッド開始時などに明示的に記憶（コンテキスト）をリセットするシグナルを受け取れるように拡張。
- **マルチモーダル (画像/ファイル) ネイティブ対応**: OpenCode から提供される画像（スクショやUIモック）を A2A の仕様 (`kind: 'image'`, `kind: 'file'`) に適合させてマルチモーダル推論をサポート。

### Phase 5: マルチモデル・動的構成の強化
- **動的モデルリスト取得機能**: `package.json` にハードコードしているモデル一覧を、起動時に A2A サーバーに問い合わせて動的に解決する仕組みを検証。
- **Embedding (埋め込み) モデルのフォールバック**: 今後 OpenCode 側で Embedding が必須となった場合に備え、A2A ではなく通常の Gemini API へ自動フォールバックして処理する中継層の実装。
- **エラー時の自動フォールバック機構**: CCPA環境下におけるプレビューモデルのクォータ枯渇などを検知した際に、一時的に別の安定版モデルへ切り替えてセッションを継続させる耐障害性の向上。
- **モデル別エージェントの複数起動とルーティング機能**: ユーザーが要求するモデル（軽量・高性能など）に応じて、事前に立ち上げておいた別々の A2A サーバー（別ポート）へリクエストを自動で振り分ける「複数エージェント構成」のサポート。これにより、単一サーバーでのモデル固定の制約を回避します。
