# Changelog

All notable changes to this project will be documented in this file.

## 1.0.0 (2026-03-24)


### ⚠ BREAKING CHANGES

* **router:** モデルID重複時にルーター初期化でエラーを発生
* **ci:** GitHub Packages 認証を環境変数経由にし、配布方法を明確化
* **provider:** v2仕様導入とプロバイダー初期化/エクスポートの刷新
* ofetch通信におけるリトライ・冪等性・エラーハンドリング仕様の更新

### Features

* `createGeminiA2AProvider` の互換性確認テストを追加し、設定テストのコメントの誤字を修正 ([f6ab825](https://github.com/yohi/opencode-geminicli-a2a/commit/f6ab825da5af7422df3e2689eae44d5d1fac80f9))
* `opencode.jsonc` のサンプルを追加し、READMEを更新しました。 ([db2ad04](https://github.com/yohi/opencode-geminicli-a2a/commit/db2ad04ad8d91639f1b8c6ded4f233532cbd3b39))
* `textEmbeddingModel`の未サポートを明示的に定義し、プロバイダーの基本機能テストを追加 ([8b57bde](https://github.com/yohi/opencode-geminicli-a2a/commit/8b57bdea2fb5ada94dc7eb6d279a5397f875f095))
* **a2a-client:** HTTPS対応と安全なトークン認証を追加 ([c959a77](https://github.com/yohi/opencode-geminicli-a2a/commit/c959a77de1fe548ba0879bf1884149a49fafcfad))
* **a2a-client:** JSON-RPC 2.0 サポートの追加とAPIエンドポイント/プロトコル設定の更新 ([1086465](https://github.com/yohi/opencode-geminicli-a2a/commit/10864651c9688be0b4d39320ca990fd63238342d))
* **a2a-client:** デバッグログの条件付き出力を追加 ([fcd9e56](https://github.com/yohi/opencode-geminicli-a2a/commit/fcd9e569cff2a7c61d3af31bb922ab37e911a6e9))
* **a2a-client:** プロトコル設定追加と接続堅牢性向上 ([d0f332f](https://github.com/yohi/opencode-geminicli-a2a/commit/d0f332fd725c3f1241c923ae34ce334a4fa4e1d3))
* **a2a:** A2A JSON-RPCのToolスキーマとレスポンスのトークン使用量サポートを追加 ([d8664a7](https://github.com/yohi/opencode-geminicli-a2a/commit/d8664a7259c29ad433677b11c831832e4b31a8d9))
* **a2a:** A2Aサーバーからのツール実行要求 (kind: data) のマッピングを実装 ([77bcf2d](https://github.com/yohi/opencode-geminicli-a2a/commit/77bcf2d9534f7fb164e9d48a6fed4655ff4dc1af))
* **a2a:** A2AリクエストスキーマにidempotencyKeyを追加 ([33181ea](https://github.com/yohi/opencode-geminicli-a2a/commit/33181ea2b678b157a455861522452e3b84add0a3))
* **a2a:** JSON RPC A2A 応答スキーマとエラーハンドリングを強化 ([c8a700f](https://github.com/yohi/opencode-geminicli-a2a/commit/c8a700f99be8d18b288d4b1549580a839a531eea))
* **a2a:** スナップショット重複排除と思考プロセス表示を実装 ([873b2b7](https://github.com/yohi/opencode-geminicli-a2a/commit/873b2b73c24016055428421bb2310eb3263090e9))
* A2Aプロトコルのステートフル差分送信(Stateful Deltas)とスキーマ補完(Schema Bridging)を実装 ([3c803c9](https://github.com/yohi/opencode-geminicli-a2a/commit/3c803c931c84e66d8bce2ca5f7b35caedd27f7c8))
* **a2a:** プロトコル設定を追加し、プロンプトマッピングとスキーマを改善 ([94b0e1d](https://github.com/yohi/opencode-geminicli-a2a/commit/94b0e1d2b486872c4237eef495fff125182653d2))
* A2AリクエストにおけるgenerationConfigの動的指定をサポート ([7e975a7](https://github.com/yohi/opencode-geminicli-a2a/commit/7e975a78b07e2e03dada3d88d0f192be11f218e8))
* **a2a:** 固定遅延リトライと設定読み込み/スキーマを改善 ([f1e54cc](https://github.com/yohi/opencode-geminicli-a2a/commit/f1e54ccbdc959b64e49b55e67f361434598ed40c))
* Add a new compatibility test script and improve invalid port testing in provider integration. ([a1cee86](https://github.com/yohi/opencode-geminicli-a2a/commit/a1cee86e43d2f8ac75bac33f0c5037a8f4d8c248))
* Add A2A multimodal parts mapping (Image, File) ([e15914d](https://github.com/yohi/opencode-geminicli-a2a/commit/e15914dcc701117e6d7951b0a6f4ff972217e757))
* Add ArrayBuffer support for image and file parts and tighten schema validation to require actual content (bytes or URI). ([34fcab6](https://github.com/yohi/opencode-geminicli-a2a/commit/34fcab6c98e4422068e05c861b17bce3754bc558))
* add LiteLLMProxyConfigSchema to schemas ([1ba232d](https://github.com/yohi/opencode-geminicli-a2a/commit/1ba232dfcea9d0a1ce4c6f46eafdf6f3de5c47a6))
* Add protocol configuration and sanitize provider options, bumping version to 0.1.2. ([83ea86f](https://github.com/yohi/opencode-geminicli-a2a/commit/83ea86ff3fa02a657797ba30dcfe48da215e8b75))
* add WorktreeManager for ephemeral git workspaces ([ba1746e](https://github.com/yohi/opencode-geminicli-a2a/commit/ba1746e9459dedc67db65c4eaf83483656fc3116))
* **ci:** GitHub Packages 認証を環境変数経由にし、配布方法を明確化 ([26043d1](https://github.com/yohi/opencode-geminicli-a2a/commit/26043d1e8d0577fceb4361359b86d1b835ffd166))
* complete A2A dynamic model support tasks ([4c05c06](https://github.com/yohi/opencode-geminicli-a2a/commit/4c05c067273be61e490a8db61740a0723dbddc92))
* **config:** A2Aプロトコル設定の追加とエージェント指示の更新 ([ebab509](https://github.com/yohi/opencode-geminicli-a2a/commit/ebab509a3cf71f4ed4f860c7f2a42b9ae191def6))
* **config:** generationConfig スキーマ追加とモデル設定の柔軟化 ([ad145ad](https://github.com/yohi/opencode-geminicli-a2a/commit/ad145adf051598f72f4209053c975eaf197b15fb))
* **config:** カスタムモデル設定を環境変数またはファイルから読み込めるようにする ([80a1f91](https://github.com/yohi/opencode-geminicli-a2a/commit/80a1f91b1db0674430f6413a3a10d122565eadd0))
* create WorkerDispatcher to build headless commands ([a466eb8](https://github.com/yohi/opencode-geminicli-a2a/commit/a466eb8a7b22dbfb9742e1f7c53dd0570468abf7))
* Enhance `update-models` script to fetch models from a specified Git ref, improve model constant parsing, and update `package.json` by direct string replacement. ([c99d2d1](https://github.com/yohi/opencode-geminicli-a2a/commit/c99d2d17f0c585a2142678150ba7e088b59517e8))
* Enhance data URI parsing to support percent-encoded non-base64 data and refine tool call ID generation for improved deduplication within message snapshots. ([cb0949f](https://github.com/yohi/opencode-geminicli-a2a/commit/cb0949f2f269114232b586f67fe21c86c4aff754))
* Enhance model update script to remove block comments, capitalize model names, and inject models into `opencode` if the models array is missing. ([c7b9847](https://github.com/yohi/opencode-geminicli-a2a/commit/c7b9847e51326e3394b41d61c1a41daf79f04ec0))
* **fallback:** add quota error detection and fallback resolution ([e905da9](https://github.com/yohi/opencode-geminicli-a2a/commit/e905da9018c0f8484c33647b5ed148bbe9c64e0b))
* Gemini 2.5 Flashと1.5 Proモデルを追加し、プロバイダーオプションのオーバーライドとAI SDK互換性に関する新しいテストを含めました。 ([106164a](https://github.com/yohi/opencode-geminicli-a2a/commit/106164a694ec4d9eb8a93906671dd2ed64c97b52))
* **gemini:** Geminiの自動承認機能の有効化とテスト追加 ([371cffb](https://github.com/yohi/opencode-geminicli-a2a/commit/371cffbccbaed67d2101e9bccc40f49ed6ea99ad))
* Implement AI SDK ProviderV1 compatibility, introduce direct call syntax for the Gemini A2A provider, and add corresponding tests. ([aa31d0c](https://github.com/yohi/opencode-geminicli-a2a/commit/aa31d0c4ceb32633c048efde62b4c1f9a6a9e99e))
* implement ContextManager for serializing A2A session state ([ae397b2](https://github.com/yohi/opencode-geminicli-a2a/commit/ae397b28f0810807f348b8e5fff322ee10089919))
* implement core schemas, config, a2a client and mapper ([f737a61](https://github.com/yohi/opencode-geminicli-a2a/commit/f737a618a533e9454bd8d241a5c7bc1779780019))
* implement disposeAndWait for graceful shutdown ([1135ea4](https://github.com/yohi/opencode-geminicli-a2a/commit/1135ea48209c64f37cc7c08125f08c902989ccec))
* implement DynamicModelRouter for A2A model selection ([b28c0e2](https://github.com/yohi/opencode-geminicli-a2a/commit/b28c0e2d53466dfa7c43f32dacd086352593c868))
* implement Phase 3 with GitHub Packages and Actions ([05806b4](https://github.com/yohi/opencode-geminicli-a2a/commit/05806b46cbb35557fc85502a48ed7536f5b58226))
* implement provider, exports, and e2e integration tests ([20cce73](https://github.com/yohi/opencode-geminicli-a2a/commit/20cce73f20badd1ed3b5a552f77f39f8f23450ed))
* improve error handling by throwing an error for unresolved model constants and add logic to inject models into an empty `opencode` configuration. ([f21bb45](https://github.com/yohi/opencode-geminicli-a2a/commit/f21bb459b41176bcc54d910c3f2610f2e9d22c5f))
* InMemorySessionStoreにTTLとLRUによるセッション管理機能を追加し、providerでのsessionIdのバリデーションとセッション更新ロジックを改善しました。 ([cfc6b08](https://github.com/yohi/opencode-geminicli-a2a/commit/cfc6b08ba05e7e1cfd86104270a72d7e522b83c8))
* Integrate with OpenCode plugin and provider SDK ([cc3f1a2](https://github.com/yohi/opencode-geminicli-a2a/commit/cc3f1a22b5f058d8895764896a75cf7967e304de))
* JSON-RPC 2.0準拠のA2A通信プロトコルへの刷新 ([aaf578a](https://github.com/yohi/opencode-geminicli-a2a/commit/aaf578acc7ab49c5307ee3022e61f2fcf9632b6b))
* LiteLLMプロキシ、hotReload、サーバークリーンアップ機能の復元 ([d0d158a](https://github.com/yohi/opencode-geminicli-a2a/commit/d0d158a07da492e316765d6bb4632e0e717f5422))
* **mapper:** contextId/taskId 対応とツール結果テキスト化を追加 ([5b84116](https://github.com/yohi/opencode-geminicli-a2a/commit/5b84116465824e3005336d4064e83354432985e3))
* **mapper:** tool call サポートを追加し、関連テストと例を更新 ([927ddd7](https://github.com/yohi/opencode-geminicli-a2a/commit/927ddd7180f5a618684f0612bc0d4cfd69ee78de))
* OpenCodeGeminiA2AProviderにセッション管理機能を追加し、マルチターン状態を分離することで並行リクエストを可能にしました。 ([1453f7c](https://github.com/yohi/opencode-geminicli-a2a/commit/1453f7c26b061ecf93022be372be603e893e53b1))
* OpenCodeスキーマに準拠したモデルごとのgenerationConfig指定をサポート ([ef03b01](https://github.com/yohi/opencode-geminicli-a2a/commit/ef03b010440b83ed17e104bcf6ad16f61db888c6))
* percent-encoded data URIの堅牢なパースを実装し、isThoughtData型ガードを改善しました。` ([6684f6c](https://github.com/yohi/opencode-geminicli-a2a/commit/6684f6c96a513806f70d74778b4ae1ff994befcd))
* Phase 4 A2A 特有の高度なコンテキスト管理とマルチモーダル対応の実装 ([af5be7d](https://github.com/yohi/opencode-geminicli-a2a/commit/af5be7d288077c570fe6fea3f3e1ae4fef1a4b2e))
* **provider:** a2aプロバイダーの堅牢性向上とデバッグログ強化 ([4bf1454](https://github.com/yohi/opencode-geminicli-a2a/commit/4bf14545f0eb6861f19de2154c105e03907870ec))
* **provider:** A2Aプロバイダーの機能強化、エラーハンドリング、ストリーム処理の改善 ([479ab6b](https://github.com/yohi/opencode-geminicli-a2a/commit/479ab6b94110bfa82324e55f2ca3d81d49f276c0))
* **provider:** A2Aリクエストでの動的モデル指定とサーバー自動起動を実装 ([6afdb98](https://github.com/yohi/opencode-geminicli-a2a/commit/6afdb9895f9ae38e620e30e7b8512ac90907fd25))
* **provider:** CCPAレート制限とマルチエージェントルーティングに関する仕様・ドキュメント追加 ([cb73ea5](https://github.com/yohi/opencode-geminicli-a2a/commit/cb73ea5c90adbbe1e36e6dcfb4bb4524191b6463))
* **provider:** CLIセッションID自動生成とRPCエラーハンドリング改善 ([0363c5e](https://github.com/yohi/opencode-geminicli-a2a/commit/0363c5ef138b6a8be642f32383d2bd5684609cac))
* **provider:** contextId/taskId を保持しマルチターン対話をサポート ([78c6128](https://github.com/yohi/opencode-geminicli-a2a/commit/78c61282fd0a272ab7aa0e2271f9d1698320ec8a))
* **provider:** E2E機能の実装と依存関係の更新 ([d061d52](https://github.com/yohi/opencode-geminicli-a2a/commit/d061d52c3b0d3676631eb29c4002623ad42ee030))
* **provider:** Gemini CLIのプロバイダー設定とモデルリストを更新 ([5647757](https://github.com/yohi/opencode-geminicli-a2a/commit/56477570fc6b5932b3225487871dc21005327ec9))
* **provider:** integrate dynamic registry, multi-agent router, and automated fallback logic ([6ea8a98](https://github.com/yohi/opencode-geminicli-a2a/commit/6ea8a983a1caff27e3563f18395e31345f3df25b))
* **provider:** v2仕様導入とプロバイダー初期化/エクスポートの刷新 ([7b2053c](https://github.com/yohi/opencode-geminicli-a2a/commit/7b2053cc0ba9945492666d1e0961d06383c332a8))
* **provider:** ストリームエラー時のフォールバック処理を実装 ([99a2e6d](https://github.com/yohi/opencode-geminicli-a2a/commit/99a2e6d3a989564f1f77a97d7fb8b8ae73c09f39))
* **provider:** セッションストアの管理とコンテキストリセットの改善 ([af85a9d](https://github.com/yohi/opencode-geminicli-a2a/commit/af85a9d41ee939c363be783731657ad7fc293fe7))
* **provider:** セットアップ手順の簡素化とv2互換性の追加 ([bc26bf7](https://github.com/yohi/opencode-geminicli-a2a/commit/bc26bf7f20cac426c7d091b3ada02da04fdfafaf))
* **provider:** プロバイダーの GitHub Packages 公開設定を整備 ([1461f99](https://github.com/yohi/opencode-geminicli-a2a/commit/1461f990724f0603123d0166215c93f43c77592d))
* **provider:** 内部ツールの自動承認とOpenCodeへの露出制御 ([28aec71](https://github.com/yohi/opencode-geminicli-a2a/commit/28aec71f05de37fb8e48cbcf708d65967324999f))
* **provider:** 実行タイムアウトの追加とフォールバックリトライロジックの強化 ([c735feb](https://github.com/yohi/opencode-geminicli-a2a/commit/c735febabc9e3154141a217b877ecadd5d488b30))
* **registry:** add dynamic model resolution support ([022ceb7](https://github.com/yohi/opencode-geminicli-a2a/commit/022ceb7d64bd62668de8719a2723b8113143c5a8))
* Reset per-task deduplication state on task ID change and improve data URI parsing and byte presence checks. ([c6d6b04](https://github.com/yohi/opencode-geminicli-a2a/commit/c6d6b0475a394a53d915e1d33e705cf960b6ea67))
* resolve litellmProxy config and options ([8fbb70c](https://github.com/yohi/opencode-geminicli-a2a/commit/8fbb70c317896bf76ccda0064c6a44ccbdcf5842))
* route requests through LiteLLM proxy if config is present ([81dda28](https://github.com/yohi/opencode-geminicli-a2a/commit/81dda2845ad551536b1378432746a5761f6944c0))
* **router:** add multi-agent routing logic ([00ba783](https://github.com/yohi/opencode-geminicli-a2a/commit/00ba783adf9991fd9a3388bf97174f004b0ca2e2))
* **router:** モデルID重複時にルーター初期化でエラーを発生 ([0bb53ea](https://github.com/yohi/opencode-geminicli-a2a/commit/0bb53ea210588345037db609f3b628f2ec9e8dc0))
* **schemas:** リクエストパラメータに contextId と taskId を追加 ([6ca413e](https://github.com/yohi/opencode-geminicli-a2a/commit/6ca413ec6621d98616743c3c83df4f95343956e5))
* **spec:** A2Aプロバイダープラグインの仕様書を作成 ([d512aca](https://github.com/yohi/opencode-geminicli-a2a/commit/d512aca13c8aad37a0d968f34062e58a89d0d22a))
* **spec:** AI SDK連携とデータフロー詳細化 ([1e2c8ad](https://github.com/yohi/opencode-geminicli-a2a/commit/1e2c8ad07a96a041f1838ffed885fb816c45ed68))
* **spec:** idempotencyKeyをoptionalに変更 ([f5c8cf9](https://github.com/yohi/opencode-geminicli-a2a/commit/f5c8cf98c047a8e3ec7a54f7bfb05d966d982192))
* **spec:** ofetchリトライ条件、idempotency key、ツールコールスキーマ更新 ([52a4513](https://github.com/yohi/opencode-geminicli-a2a/commit/52a4513899d2a509a73a9cac1edd3427bdb115c1))
* support dynamic model selection ('auto') and explicit agent targeting ('agent:model') ([980fbfe](https://github.com/yohi/opencode-geminicli-a2a/commit/980fbfe0024df29f809b83931ecf138dd7e8de5e))
* **utils:** A2Aプロンプトマッパーで最新ユーザーメッセージの選択とトークン使用量のマッピングを改善 ([bc0fd74](https://github.com/yohi/opencode-geminicli-a2a/commit/bc0fd74eb747370f1fa1eb42d14a4e46b80b0e94))
* **utils:** ツールコールのサポートを追加し、テストを記述 ([2eb244f](https://github.com/yohi/opencode-geminicli-a2a/commit/2eb244fc36e192d681de90555c7ea3b29e7baf85))
* **utils:** 思考プロセスとツールリクエストのデータマッピングを改善 ([7f1c50a](https://github.com/yohi/opencode-geminicli-a2a/commit/7f1c50a48a984a91bf79579c9164798435a105a5))
* Validate base64 strings in file part data and add tests for invalid inputs. ([89f0a59](https://github.com/yohi/opencode-geminicli-a2a/commit/89f0a59222b3b94e202ff8f3c15eead1be6f17a6))
* サーバー管理の堅牢化、外部設定ファイルの監視、および可観測性の向上を実装 ([b5556bc](https://github.com/yohi/opencode-geminicli-a2a/commit/b5556bce66c14ce109355ac9a5d817a830ceb2c6))
* スキーマにタスク状態の定義を追加し、テスト接続の出力表示を改善 ([4ece066](https://github.com/yohi/opencode-geminicli-a2a/commit/4ece066626f2fc9f143b0873af891897475ba305))
* セッションストアを非同期化し、InMemorySessionStoreにTTLとLRU機能を追加しました。 ([2f96e2f](https://github.com/yohi/opencode-geminicli-a2a/commit/2f96e2f2f3f5648f69c9f4eb3f2edb5496b1ae97))
* ファイル名にpart.filenameを使用し、未指定時は'file'をデフォルトとするように変更 ([68a9b1e](https://github.com/yohi/opencode-geminicli-a2a/commit/68a9b1e0ce3fda7d3a53a810cd8689da5a5d347d))
* マルチモーダルコンテンツのスキーマ検証を追加し、画像とファイルの多様な入力形式に対応するマッピングロジックを改善し、関連するテストケースを ([549ae9f](https://github.com/yohi/opencode-geminicli-a2a/commit/549ae9f99534383fa2dcc1df82b1954e0327d9a3))
* マルチモーダルパートのバイナリデータとURIの処理を共通化し、多様なデータ形式に対応するとともに、ファイルスキーマから冗長な`bytes`フィールドを削除しました。 ([7390eae](https://github.com/yohi/opencode-geminicli-a2a/commit/7390eae8204b907de1932220b057022f4083ee1b))
* 初期プロジェクト構造のセットアップと A2A プロバイダーの実装 ([3679e8e](https://github.com/yohi/opencode-geminicli-a2a/commit/3679e8e4a1e2a6dafeba3c3c76442f86e7160789))


### Bug Fixes

* **a2a-client:** ネットワークリクエストと設定のデフォルトマッピングを改善 ([a6aefd2](https://github.com/yohi/opencode-geminicli-a2a/commit/a6aefd29b5ad0c56c8bfea785219254aeb18ad9d))
* **a2a:** A2Aレスポンスのマッピングと入力バリデーションを改善 ([5d5dd35](https://github.com/yohi/opencode-geminicli-a2a/commit/5d5dd352a5e2fbf3329af2799baf21c6c5dc41a2))
* **a2a:** A2Aレスポンスのマッピング改善、ステータスとトークン使用量の正確な処理 ([f9cd8b6](https://github.com/yohi/opencode-geminicli-a2a/commit/f9cd8b682385381d70584ec901094bfd5283c94b))
* **a2a:** セキュアでない接続でのトークン送信エラー処理とデータマッパーの改善 ([0ca8851](https://github.com/yohi/opencode-geminicli-a2a/commit/0ca8851271e1bce9ab8171cb9e2173d401292c2e))
* A2Aプロトコルでのマルチターン時のコンテキスト重複送信を修正 ([3d33ed8](https://github.com/yohi/opencode-geminicli-a2a/commit/3d33ed8da50f335e120ab821a29da753beb5a362))
* AbortSignalのメモリリーク解消、ServerManagerのハング防止および終了待機の追加 ([b8aaaa4](https://github.com/yohi/opencode-geminicli-a2a/commit/b8aaaa4a785abd9636e2fde3662520057c984853))
* add 'submitted' and 'queued' to STATUS_STATES schema ([ce79921](https://github.com/yohi/opencode-geminicli-a2a/commit/ce799212e9cb4ad2393c3e95fc7b537913628410))
* add missing actualModelId assertions in router tests ([9a34e41](https://github.com/yohi/opencode-geminicli-a2a/commit/9a34e414231da4201611479735851a8c33e94647))
* address code review comments (security, error handling, and refactoring) ([8ffd99d](https://github.com/yohi/opencode-geminicli-a2a/commit/8ffd99d945b058e609529e5ab967ba7c8a4e61b5))
* address code review comments for targeted model routing and ambiguity detection ([b008c65](https://github.com/yohi/opencode-geminicli-a2a/commit/b008c65b9951dc734caa28c5095d976fab6267fb))
* address code review findings for LiteLLM proxy and Devcontainer ([955864e](https://github.com/yohi/opencode-geminicli-a2a/commit/955864e9e8748cd042e64edb76d0885912998575))
* address code review regarding token leak and env reproducibility ([edad3f2](https://github.com/yohi/opencode-geminicli-a2a/commit/edad3f24196202160fc0de88cb0dc50a1420680b))
* adjust retry count and fix reasoning output format ([bdac9e5](https://github.com/yohi/opencode-geminicli-a2a/commit/bdac9e50f3907f9d9c1fa329aac67ec0c3849c68))
* apply toolMapping to toolChoice ([3e89667](https://github.com/yohi/opencode-geminicli-a2a/commit/3e89667fa11a5beec8084a120b92b5edb1843601))
* DEBUG_OPENCODEが無効な場合のログ出力を抑制 ([53776cc](https://github.com/yohi/opencode-geminicli-a2a/commit/53776cc2adde9facf35d2b5ebbca256a72537822))
* enhance type safety and validation based on second set of review comments ([05b8a83](https://github.com/yohi/opencode-geminicli-a2a/commit/05b8a83280648c97d6e2ff746c35ff6c797431f7))
* **fallback:** エラー判定の正規化とベンダーコード設定機能の追加、および重複モデルのフォールバック防止 ([08dec04](https://github.com/yohi/opencode-geminicli-a2a/commit/08dec04c5b4aef02007c6349724426645fac59c9))
* **fallback:** クォータエラー判定のJSON-RPCコードチェックを厳格化し、パターン処理を修正 ([b4fa365](https://github.com/yohi/opencode-geminicli-a2a/commit/b4fa36527616dda6c6a31f22e86df58d9fc8188b))
* **fallback:** クォータエラー検知ロジックのテストとリセット処理の改善 ([9ef9f2a](https://github.com/yohi/opencode-geminicli-a2a/commit/9ef9f2a7c80f5d6b0907f092d1f83cb1750adea7))
* **fallback:** フォールバックモデル選択ロジックを改善し、レジストリの存在しないモデルをスキップするようにした ([5dca968](https://github.com/yohi/opencode-geminicli-a2a/commit/5dca968ee1cd345fb6b7e34b90bfd04b8c0c4505))
* Idempotency-Key 未提供時の振る舞いを修正し、スキーマを更新 ([a4a2a59](https://github.com/yohi/opencode-geminicli-a2a/commit/a4a2a59458a78057ebc4d5722beef3f46748e519))
* **mapper:** expose repeated internal meta-tools to OpenCode to break loops ([6f7d361](https://github.com/yohi/opencode-geminicli-a2a/commit/6f7d361f75a5489a657995b725483a3aafe823f2))
* **mapper:** intercept and rewrite tool hallucinations to safe bash calls to prevent doom_loop ([92ab20c](https://github.com/yohi/opencode-geminicli-a2a/commit/92ab20ccb81d29b3cf4d9e1cf885adf41f6af2a9))
* **mapper:** track tool call frequency for hallucinated/invalid tools to prevent retry loops ([2d5b472](https://github.com/yohi/opencode-geminicli-a2a/commit/2d5b472633a2686f05f82588ca65936d09582694))
* **mapper:** ツールID不在時のツールコール重複排除 ([cee7079](https://github.com/yohi/opencode-geminicli-a2a/commit/cee70791b2744ac70906037194e720351df8d8b4))
* **mapper:** 重複検知時のメッセージで上書き前のツール名を表示するように修正 ([c63e1fa](https://github.com/yohi/opencode-geminicli-a2a/commit/c63e1fa9d187134882d9d9579a65c66904a05aa3))
* **network:** リトライ処理におけるidempotencyKeyの必須化と接続確立前への限定 ([c7b3a54](https://github.com/yohi/opencode-geminicli-a2a/commit/c7b3a54a1aecf43b13af8533271d36124ded87c5))
* ofetch通信におけるリトライ・冪等性・エラーハンドリング仕様の更新 ([6f380dc](https://github.com/yohi/opencode-geminicli-a2a/commit/6f380dc07cd9154c6ae53bf0da764f4cdb775f6b))
* OpenCodeバリデーションエラーを修正し、generationConfigのマージロジックを改善 ([39673b2](https://github.com/yohi/opencode-geminicli-a2a/commit/39673b2714e3c036ba738bb4774fe5f0a8ab8d16))
* Prioritize explicit configuration options over environment variables and update configuration tests, adding a new test for provider compatibility. ([65d63d7](https://github.com/yohi/opencode-geminicli-a2a/commit/65d63d77a4ee57e0da0edbe3d3d2cb9186a4481c))
* **provider,server-manager,mapper:** コードレビュー指摘に基づく信頼性とAI SDK互換性の向上 ([ffbc325](https://github.com/yohi/opencode-geminicli-a2a/commit/ffbc325617750abdec0e3632ac8c17836a55fd69))
* **provider:** address review comments and nitpicks ([0bd83db](https://github.com/yohi/opencode-geminicli-a2a/commit/0bd83db37d28a82c30b69a8d4d3f58015ed53d4a))
* **provider:** doStreamのマルチターン状態競合を修正 ([9386ef6](https://github.com/yohi/opencode-geminicli-a2a/commit/9386ef67ce2285afc514d6c82264753cd7a4bc6e))
* **provider:** limit auto-confirm for meta-tools like activate_skill to break loops ([9e461a2](https://github.com/yohi/opencode-geminicli-a2a/commit/9e461a2958d4b98e65c537ac048b6af062958dff))
* **provider:** OpenCodeでのツール実行が中断される問題を修正 (AI SDK V3互換性の向上) ([e2bded4](https://github.com/yohi/opencode-geminicli-a2a/commit/e2bded497aadf18faf581f1494a67ac241cc95d7))
* **provider:** Providerの初期化ガードとモデルパースの堅牢性向上 ([13df249](https://github.com/yohi/opencode-geminicli-a2a/commit/13df249e8c32f687ac4c572f71d16d1fdefe5859))
* **provider:** redirect internal loop tools to bash fallback for explicit AI correction ([768629b](https://github.com/yohi/opencode-geminicli-a2a/commit/768629b7b1426cb291c59f37215f2e21e2606024))
* **provider:** refine auto-confirm logic to allow turn completion after greetings ([af2d098](https://github.com/yohi/opencode-geminicli-a2a/commit/af2d098363015af03fd7780b9e0852a801b78973))
* **provider:** reset toolCall frequency on a new user turn to prevent cross-turn loop detection ([563a25d](https://github.com/yohi/opencode-geminicli-a2a/commit/563a25d18d00ae6e6c5e2d59a83fcb9e9aa1971a))
* **provider:** resolve AI SDK v2 upgrade test failures and mapping bugs ([5d37cc7](https://github.com/yohi/opencode-geminicli-a2a/commit/5d37cc734281167c911c7940f5995f506cacc91c))
* **provider:** resolve TypeError chunk.delta.length during loop interrupt ([2b9406e](https://github.com/yohi/opencode-geminicli-a2a/commit/2b9406e937195ec67f8e0f2c623766f6d649fd35))
* **provider:** revert tool-call stream parts to tool-input-start/delta/end for OpenCode compatibility ([520e74e](https://github.com/yohi/opencode-geminicli-a2a/commit/520e74ef6cbc379cc938ef885f3301efcb1f5f5a))
* **provider:** send Cancel to A2A server when interrupting infinite loop to prevent hang ([af95e5b](https://github.com/yohi/opencode-geminicli-a2a/commit/af95e5b3d24b5dfc4a6387238cf19f9c7ab31567))
* **provider:** stop blindly auto-confirming all internal tools when A2A server expects human input ([7c41aca](https://github.com/yohi/opencode-geminicli-a2a/commit/7c41aca9d1a49bb8e3a8a7f4df929d3e8cba8f12))
* **provider:** suppress tool-call parts for internal A2A tool confirmations ([85d1abf](https://github.com/yohi/opencode-geminicli-a2a/commit/85d1abf2946bd86e0148d93c3e0d653e5cc914ff))
* **provider:** コードレビューの残件（フォールバックとオプション永続化）に対応 ([6c7aec5](https://github.com/yohi/opencode-geminicli-a2a/commit/6c7aec5065db4d9402255c0f680d786a7e66a13c))
* **provider:** フォールバックプロバイダーのセッションストア伝達とデバッグログを修正 ([66ba3ee](https://github.com/yohi/opencode-geminicli-a2a/commit/66ba3ee8c2cd73bc8b9ed741d7f497295f6a21c2))
* **provider:** 内部ツールのループ制御バグを修正 ([78bf4f7](https://github.com/yohi/opencode-geminicli-a2a/commit/78bf4f706023dffa29051f3b5b6a5a58117731a1))
* refine router initialization validation to ensure ambiguous model IDs are resolvable ([a4d3712](https://github.com/yohi/opencode-geminicli-a2a/commit/a4d3712ddbb0544f3a915a9e31977c7651a6e8f1))
* remove large temporary file and update .gitignore ([6b21c38](https://github.com/yohi/opencode-geminicli-a2a/commit/6b21c3815f4c1b9a033fec1442a9ae2a9e812707))
* **schemas:** JSON-RPCレスポンスがresultとerrorを同時に持たないようにスキーマを修正 ([107e56b](https://github.com/yohi/opencode-geminicli-a2a/commit/107e56b762301bd8f9a83b43bcd658d22ed09a13))
* **schemas:** JSON-RPCレスポンススキーマにresultとerrorの相互排他性を追加 ([d88365d](https://github.com/yohi/opencode-geminicli-a2a/commit/d88365d8249e502834dbc79ebe19d1dd4d18502f))
* **schemas:** RPC レスポンススキーマの `id`, `result`, `error` フィールドを調整 ([24b9bd7](https://github.com/yohi/opencode-geminicli-a2a/commit/24b9bd74706f31707ebbe5e836e433ea9dda9403))
* **schemas:** ポート範囲とJSON-RPC IDバリデーションを強化 ([f2c5c71](https://github.com/yohi/opencode-geminicli-a2a/commit/f2c5c718e953246255c2e4121a122ac7b9765448))
* **server-manager:** remove global uncaughtException handler to prevent host crash ([247b3da](https://github.com/yohi/opencode-geminicli-a2a/commit/247b3da84405937e7fceffa77b868db665b637ed))
* **test:** update test expectations for V2 stream format and usage tokens ([e5a1d59](https://github.com/yohi/opencode-geminicli-a2a/commit/e5a1d59df3569e3114b8438c53a311611d7b46a1))
* throw explicit errors for unknown targeted agents or models and add coverage tests ([f275e28](https://github.com/yohi/opencode-geminicli-a2a/commit/f275e28b31530e60a3fcb830cbffa4e7c183c5c6))
* use node instead of process.execPath for spawn to prevent Extension Host path bugs ([05a06fd](https://github.com/yohi/opencode-geminicli-a2a/commit/05a06fdeddb62c2c3d2135557506fb97783d719d))
* コードレビュー指摘に基づくサーバー管理の信頼性向上と型定義の強化 ([062604f](https://github.com/yohi/opencode-geminicli-a2a/commit/062604fa16abaa20cc89e45c74f969c2b22c16f9))
* コードレビュー指摘事項の修正（タイマーリーク、クォータエラー設定、タイムアウト延長等） ([8f08762](https://github.com/yohi/opencode-geminicli-a2a/commit/8f0876276259c7e699dc6594059376b295b681df))
* コンテンツパートのスキーマ検証を明示的にし、変換時のnullチェックを追加して堅牢性を向上 ([2940ded](https://github.com/yohi/opencode-geminicli-a2a/commit/2940ded42d0dd26a4dc870416a31ef4d9aaf1742))
* サーバー管理のシャットダウン同期の改善とProviderの型安全性の向上 ([4581af6](https://github.com/yohi/opencode-geminicli-a2a/commit/4581af67c5869c0bd740f302756a8ff493f56aac))
* サーバー管理のレースコンディション解消とメモリリーク対策、および安全性の向上 ([63909f5](https://github.com/yohi/opencode-geminicli-a2a/commit/63909f5f5f88647c6c11be8bd81a10c117d6c1d9))
* データURIのパース処理を堅牢化し、複数テキストパートの差分抽出を正しく重複排除するよう修正 ([aa7c40d](https://github.com/yohi/opencode-geminicli-a2a/commit/aa7c40df209a380017067ae41e7243fdb91fb35a))
* プロバイダーのエージェント設定参照、セッション継承、およびサーバーマネージャーのプロセス管理を改善 ([4d1aaff](https://github.com/yohi/opencode-geminicli-a2a/commit/4d1aaff94bcf23bc56ae5507d20f45417eb26233))
* 思考プロセスの判定精度向上、シェルインジェクション対策、および環境パスの拡充 ([27a1f44](https://github.com/yohi/opencode-geminicli-a2a/commit/27a1f442e79ab2e7be8900b065b99d8f002e9dc9))
* 統合テストのサーバーリスンプロミスにエラーハンドリングを追加し、堅牢性を向上 ([dbf539b](https://github.com/yohi/opencode-geminicli-a2a/commit/dbf539b96d0a0b8b83e00a4b4d83a54bc5fb5b99))

## [0.1.3] - 2026-03-19

### Added

- **Stateful Deltas**: `contextId` を活用し、最新のメッセージ（差分）のみを送信するようアーキテクチャを刷新しました。これにより、履歴の重複による無限ループと `413 Payload Too Large` エラーを解消しました。
- **Schema Bridging**: Gemini モデルのルーズなツール呼び出しを OpenCode の厳密なスキーマに適合させる自動正規化機能を追加しました。
    - `file_path`, `path`, `filePath` の自動多重化。
    - `description` 引数の自動補完。
- **Hallucination Protection**: シェルコマンド内での `task()` 実行など、モデルの誤用を自動検知して正しいツール使用へ誘導するインターセプト機能を追加しました。
- **Text Extraction Improvements**: 最終レスポンスのテキストが漏れるのを防ぐため、ステータスに関わらずパーツを抽出するように改善しました。

### Changed

- ログのノイズを減らすため、正常な動作としての正規化やリライトに関するログレベルを `WARN` から `INFO` へ引き下げました。

## [0.1.2] - 2026-03-08

### Changed

- **BREAKING CHANGE**: 設定の優先順位を「環境変数 > オプション」から「オプション > 環境変数」に逆転しました。これにより、コード上から渡されたオプション（設定）が環境変数を上書きし、指定された場合はオプションが優先されるようになります。
- `languageModel` に渡される `settings` に含まれる `undefined` な値が、ベースとなる `options` を意図せず上書きしないよう修正しました。
