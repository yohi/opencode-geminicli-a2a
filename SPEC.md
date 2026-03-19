# OpenCode to Gemini CLI A2A Provider Plugin Specification

## 1. Project Overview

本プロジェクトは、ターミナルIDEエージェント「OpenCode」と「Gemini CLI」を、公式のA2A（Agent-to-Agent）プロトコルを介してローカルフェデレーションさせるためのカスタムプロバイダープラグイン（opencode-geminicli-a2a-provider）の開発を目的とする。

中間にOpenAI互換プロキシサーバーを立てるアプローチを排除し、OpenCodeのプラグインAPI（AI SDK互換）内で直接A2Aプロトコルへの変換を行うことで、遅延を最小化した堅牢なローカルプロセス間通信を実現する。

### 1.1 Scope

* OpenCode（Vercel AI SDK仕様）からのLLMリクエストを受け取り、A2Aプロトコルに変換してローカルのGemini CLI（A2Aサーバー）へ送信する。
* Gemini CLIからのストリーミングレスポンス（A2Aフォーマット）を、AI SDKが要求するストリーム形式に変換してOpenCodeへ返す。
* ツール（MCP）の実行要求を中継し、OpenCode側のネイティブなAsk/Allow（承認UI）へ委譲する。
* ネットワークエラーや無応答に対するリトライ・タイムアウト機構を内包する。

## 2. Tech Stack

本プラグインは、OpenCodeの最新版（v0.42.x以上）に互換性を持つよう設計する。

| Category | Technology / Library | Reason / Role |
| :--- | :--- | :--- |
| Language | TypeScript (ESNext) | 型安全性とモダンなJavaScript機能の利用 |
| Provider API | @ai-sdk/provider | OpenCodeが解釈できるカスタムプロバイダーインターフェース（LanguageModelV1等）の実装用 |
| HTTP Client | ofetch | 標準で自動リトライ、タイムアウト、ストリーム処理をサポートする堅牢なFetchラッパー |
| Validation | zod | A2Aサーバーとの通信境界におけるランタイムのペイロードスキーマ検証 |
| Build Tool | tsup または esbuild | 高速なバンドル処理。OpenCodeプラグイン用のCJS/ESM出力 |

## 3. Architecture

### 3.1 Directory Structure

```text
opencode-geminicli-a2a-provider/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts           # プラグインのエントリポイント（Providerファクトリのエクスポート）
│   ├── config.ts          # 設定読み込み・マージロジック
│   ├── provider.ts        # @ai-sdk/provider (LanguageModelV1) の実装クラス
│   ├── a2a-client.ts      # ofetchを用いたGemini CLIとの通信クライアント
│   ├── schemas.ts         # Zodによる型定義・バリデーションスキーマ
│   └── utils/
│       ├── mapper.ts      # AI SDK形式 ↔ A2A形式の双方向データマッパー
│       └── stream.ts      # SSEストリームのJSON-RPCペイロード解析ユーティリティ
```

### 3.2 Data Flow (Mermaid)

```mermaid
sequenceDiagram
    participant User
    participant OpenCode
    participant Plugin as A2A Provider (LanguageModelV1)
    participant GeminiCLI as Gemini CLI (A2A Server)

    User->>OpenCode: プロンプト入力 / ツール実行
    OpenCode->>Plugin: doStream() 呼び出し (AI SDK Format)
    
    rect rgb(240, 248, 255)
        Note over Plugin: 1. AI SDK Prompt -> A2A (JSON-RPC) Mapping
        Note over Plugin: 2. Zod Validation
    end
    
    Plugin->>GeminiCLI: HTTP POST / (JSON-RPC 2.0: message/stream)
    
    rect rgb(255, 240, 245)
        Note over Plugin, GeminiCLI: Resilience Layer<br/>Timeout: 60s, Retry: Max 3 (only before connection established)
    end
    
    GeminiCLI-->>Plugin: SSE Response (data: {JSON-RPC Result})
    
    rect rgb(240, 255, 240)
        Note over Plugin: Response Mapping (A2A StatusUpdate -> AI SDK Stream Parts)
    end
    
    Plugin-->>OpenCode: Yield text-delta / tool-call
    OpenCode-->>User: ターミナルへ出力 / ツール実行承認UI
```

## 4. Features & Requirements

### 4.1 優先順位 (MoSCoW)

* **[Must Have]** `@ai-sdk/provider` パッケージの `LanguageModelV1` インターフェースへの完全準拠。
* **[Must Have]** AI SDKフォーマットから A2A (JSON-RPC 2.0) ペイロードへのマッピング (`mapper.ts`)。
* **[Must Have]** `ofetch` を用いた、SSE形式のストリーミング通信。
* **[Must Have]** Gemini CLI からの `status-update` イベント内の `message.parts` を解析し、AI SDK のストリーム形式へ変換。
* **[Should Have]** `zod` を用いた A2A JSON-RPC レスポンスのバリデーション。
* **[Won't Have]** OpenAI 互換 API エンドポイントの実装。

### 4.2 Configuration Resolution

設定値は以下の優先順位で解決すること（1が最優先）。

1.  **環境変数**: `GEMINI_A2A_PORT`, `GEMINI_A2A_HOST`, `GEMINI_A2A_TOKEN`
2.  **OpenCode設定**: `opencode.jsonc` 内の `a2aProvider` オブジェクト
3.  **デフォルト値**: Host: `127.0.0.1`, Port: `41242`, Token: `undefined`

## 5. Data Structure & Schemas (Zod / TypeScript)

`src/schemas.ts` にて以下の JSON-RPC 準拠スキーマを定義する。

```typescript
import { z } from 'zod';

// 1. Configuration Schema (Stable)
export const ConfigSchema = z.object({
  host: z.string().default('127.0.0.1'),
  port: z.number().int().min(1).max(65535).default(41242),
  token: z.string().optional(),
  protocol: z.enum(['http', 'https']).default('http'),
});

// 2. A2A JSON-RPC Request Schema
export const ToolSchema = z.object({}).passthrough();

export const A2AJsonRpcRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number(), z.null()]),
  method: z.literal('message/stream'),
  params: z.object({
    message: z.object({
      messageId: z.string(),
      role: z.enum(['user', 'assistant']), // 注: 'system' は変換時に 'user' へ統合される
      parts: z.array(z.object({
        kind: z.literal('text'),
        text: z.string()
      })),
    }),
    configuration: z.object({
      blocking: z.boolean().default(false),
      tools: z.array(ToolSchema).optional()
    }).optional(),
    // multi-turn: コンテキスト継続時に使用
    contextId: z.string().optional(),
    // multi-turn: 既存タスクの継続時に使用
    taskId: z.string().optional()
  })
});

// 3. A2A JSON-RPC Response Result Schema
export const A2AResponseResultSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('task'),
    id: z.string(),
    contextId: z.string(),
    status: z.object({ state: z.enum(['submitted', 'queued', 'working', 'stop', 'error', 'input-required', 'completed', 'failed', 'tool_calls', 'cancelled', 'timeout', 'aborted', 'length', 'max_tokens', 'content_filter', 'blocked']) }),
    history: z.array(z.any()).optional(),
    metadata: z.object({
      coderAgent: z.object({
        kind: z.string()
      }).optional()
    }).passthrough().optional(),
    artifacts: z.array(z.any()).optional(),
  }),
  z.object({
    kind: z.literal('status-update'),
    taskId: z.string(),
    contextId: z.string().optional(),
    status: z.object({
      state: z.enum(['submitted', 'queued', 'working', 'stop', 'error', 'input-required', 'completed', 'failed', 'tool_calls', 'cancelled', 'timeout', 'aborted', 'length', 'max_tokens', 'content_filter', 'blocked']),
      message: z.object({
        parts: z.array(z.object({
          kind: z.string(),
          text: z.string().optional(),
          data: z.unknown().optional()
        }))
      }).optional(),
      timestamp: z.string().optional()
    }),
    final: z.boolean().optional(),
    metadata: z.object({
      coderAgent: z.object({
        kind: z.string()
      }).optional()
    }).passthrough().optional(),
    usage: z.object({
      promptTokens: z.number().optional(),
      completionTokens: z.number().optional()
    }).optional(),
  })
]);

// 4. A2A JSON-RPC Response Wrapper
export const ResultResponseSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number(), z.null()]),
  result: A2AResponseResultSchema,
}).passthrough();

export const ErrorResponseSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]).nullable(),
  error: z.object({
    code: z.number(),
    message: z.string(),
    data: z.unknown().optional()
  })
}).passthrough();

export const A2AJsonRpcResponseSchema = z.union([ResultResponseSchema, ErrorResponseSchema]);
```

## 6. API Definition (Resilience Configuration)

* **Endpoint**: `{protocol}://{host}:{port}/` (`{protocol}` は `protocol` 設定に基づき `http` または `https` となる)
* **Protocol**: JSON-RPC 2.0 over HTTP/S (Streaming via SSE)
* **Server Setup**:
    * Gemini CLI A2A サーバーを起動する際は、環境変数 `CODER_AGENT_PORT` を使用してポートを指定してください。
    * 認証情報（API キー等）を付与して起動する必要があります。
    * **起動コマンド例**:
      ```bash
      # API キーを使用する場合
      GEMINI_API_KEY=your_api_key CODER_AGENT_PORT=41242 gemini-cli-a2a-server

      # 内部環境 (CCPA) の場合
      USE_CCPA=true CODER_AGENT_PORT=41242 gemini-cli-a2a-server
      ```
* **Multi-Turn 対話サポート**:
    * **コンテキストの保持**: A2A サーバーは必要に応じて / 存在する場合にレスポンスに `contextId`（`status-update.contextId` は optional）および `task.id` を含めます。プロバイダーはストリーム終了時に存在する `contextId` / `taskId` を記録します（ステートフル）。
    * **Stateful Deltas (差分送信)**: 無限ループとペイロードの肥大化を防ぐため、プロバイダーは 2 回目以降のリクエストにおいて、AI SDK から渡される全履歴のうち **「前回の送信以降に追加された新しいメッセージ（Delta）」のみ** を A2A サーバーへ送信します。
    * **コンテキスト継続**: 2回目以降のリクエストでは、保持している `contextId` を `params.contextId` に付与して送信します。サーバー側はこの ID に基づいて内部で履歴を復元・結合するため、クライアント側で巨大なテキストを再送する必要はありません。
    * **タスクの継続**: 前回のタスクの `finishReason === 'tool-calls'` かつ保持している `taskId` がある場合に、`taskId` を `params.taskId` に付与して A2A サーバーにおける `input-required` 状態のタスクを再開できます。
    * **ツール結果の送信 (AI SDK → A2A)**: ツール実行結果は A2A サーバーが理解可能な形式にテキスト化され、差分として送信されます。その際、サーバー側で履歴が二重化されるのを防ぐため、既にサーバーが把握している `assistant` ロールのメッセージは送信対象から除外されます。

* **Schema Bridging & Argument Normalization (互換性維持)**:
    OpenCode の厳密な Zod スキーマと、Gemini モデルの柔軟な（時に曖昧な）ツール呼び出しの間のギャップを埋めるための自動補完機能を備えます。
    * **引数名の多重化 (Multiplexing)**: `file_path`, `path`, `filePath` の間で引数名が食い違っていてもエラーにならないよう、存在するパス情報をこれらすべてのキーに自動的にコピーして OpenCode へ渡します。`command` と `cmd` についても同様です。
    * **必須項目の自動補完**: OpenCode のツールが `description` を必須としている場合、モデルがそれを省略してもプロバイダー側で `description: "Execute tool via A2A"` を自動付与し、バリデーションエラーを未然に防ぎます。
    * **ハルシネーション・インターセプト**: モデルがシェルコマンド（`bash`）内で `task()` などの擬似コードを実行しようとした場合、プロバイダーがそれを検知してインターセプトし、正しいツールの使用を促すエラーメッセージをモデルへ返します。これにより、セキュリティブロックによるクラッシュとループを回避します。

* **Status Handling**:
    * `status.message.parts` 内の `text` を `text-delta` として扱う。以前は `state === 'working'` 時のみ抽出していましたが、完了時の最終出力を漏らさないよう、現在は状態に関わらずパーツが存在すれば抽出する仕様としています。

| `status.state` | AI SDK `finishReason` |
|---|---|
| `completed`, `stop` | `stop` |
| `input-required`, `tool_calls` | `tool-calls` |
| `failed`, `error` | `error` |
| `length`, `max_tokens` | `length` |
| `content_filter`, `blocked` | `content-filter` |
| その他 (cancelled等) | `other` |

## 7. LLM Guidelines (For AI Developer)

このドキュメントを読み込んだAIアシスタントへ：

* **実装の最初のステップ**: まず `@opencode-ai/plugin` および `@ai-sdk/provider` を参照し、それらが提供する型インターフェース定義を調査してください。OpenCodeがカスタムプロバイダーとして要求する仕様（例: Vercel AI SDK の公式定義に準拠した `LanguageModelV1` インターフェースの `doGenerate` と `doStream` メソッドの実装）を特定することが最優先事項です。
* **アンチパターン**: 調査の結果、OpenCodeのAPIが不明瞭だったとしても、「ローカルにExpressサーバーを立てて `@ai-sdk/openai-compatible` を使うアプローチ」に逃げないでください。本プロジェクトの目的は、A2Aプロトコルをネイティブに喋るカスタムプロバイダークラス（TSプラグイン）を作ることです。
* **エラーハンドリング**: Gemini CLI（ローカルサーバー）は起動していない可能性があります。`a2a-client.ts` における `ofetch` 呼び出し箇所、および初期化部分において、発生したエラーに応じて以下のように具体的なエラー型を明示して伝播させてください：
    * ネットワークエラー、タイムアウト、接続拒否などの `ofetch` 接続エラー時は、OpenCode が提供する `APICallError` などをスローし、内部に原始エラーメッセージ、HTTPステータス、URLを保持させること。
    * レスポンスの構造が想定外の場合（Zodスキーマ検証エラー等）は、`InvalidResponseDataError` などをスローし、レスポンスボディの抜粋など詳細な情報を含めること。

## 8. Known Issues and Future Considerations

### 8.1 CCPA Environment Rate Limits
* **Issue**: `USE_CCPA=true` 環境下で提供される A2A サーバーを使用する場合、プレビュー版モデル (`gemini-3.1-pro-preview`, `gemini-3-flash-preview` 等) のクォータ上限が極めて低く設定されており、「You have exhausted your capacity on this model.」というエラーと共に数時間のレートリミットがかかることが確認されている。
* **Current Mitigation**: ユーザーが手動で設定ファイル (`opencode.jsonc`) から `gemini-2.5-pro` などのクォータが潤沢なモデルへ切り替えることで回避する。
* **Future Work**: HTTP 429 相当のエラーやペイロード内のクォータエラーメッセージを検知した際に、自動的に代替モデル（安定版等）へフォールバックする機構の導入を検討する。

### 8.2 Dynamic Model Switching
* **Status**: **Implemented (Phase 6)**。プロバイダーは毎リクエストの JSON-RPC ペイロードに `params.model` フィールドを付与し、A2A サーバーがリクエスト単位でモデルを動的に切り替えられるよう対応済み。
* **Behavior**: `OpenCodeGeminiA2AProvider` のインスタンス生成時に指定した `modelId`（例: `gemini-2.5-pro`）が、各 A2A リクエストの `params.model` に自動的に含まれる。A2A サーバー側の `modelConfigService.makeResolvedModelConfig` がこのフィールドを参照して、サーバー起動時のデフォルトモデルを上書きする。
* **Request Format**:
  ```json
  {
    "jsonrpc": "2.0",
    "method": "message/stream",
    "params": {
      "message": { "..." },
      "model": "gemini-2.5-pro",
      "contextId": "..."
    }
  }
  ```
* **Generation Configuration**: `generationConfig`（`temperature`, `topP`, `maxOutputTokens` 等）の動的指定を A2A サーバーのリクエストパラメータとしてサポート。
* **Dynamic Model Selection**: リクエスト単位で `model` ID を指定し、サーバー側のデフォルトモデルを上書き可能（Phase 5-C）。
