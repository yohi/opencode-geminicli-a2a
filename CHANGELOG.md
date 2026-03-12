# Changelog

All notable changes to this project will be documented in this file.

## 1.0.0 (2026-03-12)


### ⚠ BREAKING CHANGES

* **router:** モデルID重複時にルーター初期化でエラーを発生
* **ci:** GitHub Packages 認証を環境変数経由にし、配布方法を明確化
* **provider:** v2仕様導入とプロバイダー初期化/エクスポートの刷新
* ofetch通信におけるリトライ・冪等性・エラーハンドリング仕様の更新

### Features

* `createGeminiA2AProvider` の互換性確認テストを追加し、設定テストのコメントの誤字を修正 ([95cdfd7](https://github.com/yohi/opencode-geminicli-a2a/commit/95cdfd7b1d3a0fadf94eb8a93b53c345dbf82dab))
* `opencode.jsonc` のサンプルを追加し、READMEを更新しました。 ([daceb0a](https://github.com/yohi/opencode-geminicli-a2a/commit/daceb0ade69e3191e9651b8eeddded84847d4c39))
* `textEmbeddingModel`の未サポートを明示的に定義し、プロバイダーの基本機能テストを追加 ([512d957](https://github.com/yohi/opencode-geminicli-a2a/commit/512d957673adec6fe51ac747aded7d08035722ad))
* **a2a-client:** HTTPS対応と安全なトークン認証を追加 ([0499092](https://github.com/yohi/opencode-geminicli-a2a/commit/049909287816425a7c317dce640d551b4d056cee))
* **a2a-client:** JSON-RPC 2.0 サポートの追加とAPIエンドポイント/プロトコル設定の更新 ([d5fc9ed](https://github.com/yohi/opencode-geminicli-a2a/commit/d5fc9ed378576aadefdf50ca7dedfb5b82dcc746))
* **a2a-client:** デバッグログの条件付き出力を追加 ([a4f0d12](https://github.com/yohi/opencode-geminicli-a2a/commit/a4f0d12d4612ab7ca7e6ede0cfe139f6a426d8fc))
* **a2a-client:** プロトコル設定追加と接続堅牢性向上 ([28a5e49](https://github.com/yohi/opencode-geminicli-a2a/commit/28a5e4907379c6925398dea10c5712568afd9d0f))
* **a2a:** A2A JSON-RPCのToolスキーマとレスポンスのトークン使用量サポートを追加 ([757444c](https://github.com/yohi/opencode-geminicli-a2a/commit/757444c644996b3b03aeff92bdf82fe50103b96d))
* **a2a:** A2Aサーバーからのツール実行要求 (kind: data) のマッピングを実装 ([f08f98f](https://github.com/yohi/opencode-geminicli-a2a/commit/f08f98fd088a2185f19000485ad4e34e4e8159ae))
* **a2a:** A2AリクエストスキーマにidempotencyKeyを追加 ([e95cef4](https://github.com/yohi/opencode-geminicli-a2a/commit/e95cef450d83b062dd6399afc4b911a98f80c42d))
* **a2a:** JSON RPC A2A 応答スキーマとエラーハンドリングを強化 ([a582898](https://github.com/yohi/opencode-geminicli-a2a/commit/a58289830a4840dfcea0b224ad9e3c57da9d898f))
* **a2a:** スナップショット重複排除と思考プロセス表示を実装 ([d46e12f](https://github.com/yohi/opencode-geminicli-a2a/commit/d46e12f53e3c93ef8becd6fde43b2f3e7ba2846c))
* **a2a:** プロトコル設定を追加し、プロンプトマッピングとスキーマを改善 ([a5049f5](https://github.com/yohi/opencode-geminicli-a2a/commit/a5049f59f8a75c431d1f35858bbbe06ac9be5438))
* A2AリクエストにおけるgenerationConfigの動的指定をサポート ([0ab4edb](https://github.com/yohi/opencode-geminicli-a2a/commit/0ab4edbeacef66f38ac4b52918395a29121d4351))
* **a2a:** 固定遅延リトライと設定読み込み/スキーマを改善 ([3b0a7b7](https://github.com/yohi/opencode-geminicli-a2a/commit/3b0a7b79a35a01d6cb30127c9fe4ae1843fe1bda))
* Add a new compatibility test script and improve invalid port testing in provider integration. ([f27935e](https://github.com/yohi/opencode-geminicli-a2a/commit/f27935eda01a2395c440a5f8b699a24078c1246b))
* Add A2A multimodal parts mapping (Image, File) ([ba487e4](https://github.com/yohi/opencode-geminicli-a2a/commit/ba487e4103754adf9a6f71391f3a78ec20059183))
* Add ArrayBuffer support for image and file parts and tighten schema validation to require actual content (bytes or URI). ([38b77f8](https://github.com/yohi/opencode-geminicli-a2a/commit/38b77f82df0c34ad28f2e6df0b038daee64f056d))
* Add protocol configuration and sanitize provider options, bumping version to 0.1.2. ([687facc](https://github.com/yohi/opencode-geminicli-a2a/commit/687faccfb499d7887b09a2d6c3977ef1704bd6c6))
* **ci:** GitHub Packages 認証を環境変数経由にし、配布方法を明確化 ([346aaa9](https://github.com/yohi/opencode-geminicli-a2a/commit/346aaa92a794451a0b1eee8c4af6cda11d81dafa))
* **config:** A2Aプロトコル設定の追加とエージェント指示の更新 ([746b7c0](https://github.com/yohi/opencode-geminicli-a2a/commit/746b7c0b89a049f4793c1d58ba9187fca534487e))
* **config:** generationConfig スキーマ追加とモデル設定の柔軟化 ([08feaec](https://github.com/yohi/opencode-geminicli-a2a/commit/08feaecf57473533534850e93947d64287ab2880))
* **config:** カスタムモデル設定を環境変数またはファイルから読み込めるようにする ([2ba4079](https://github.com/yohi/opencode-geminicli-a2a/commit/2ba40798d3aa310de31877d0d8a833b05ab82b7d))
* Enhance `update-models` script to fetch models from a specified Git ref, improve model constant parsing, and update `package.json` by direct string replacement. ([5a980fd](https://github.com/yohi/opencode-geminicli-a2a/commit/5a980fd428b90ef99262ad23bceafe07889656dd))
* Enhance data URI parsing to support percent-encoded non-base64 data and refine tool call ID generation for improved deduplication within message snapshots. ([d3d1324](https://github.com/yohi/opencode-geminicli-a2a/commit/d3d1324f0a82311c9dd3570648ae85e859a942c0))
* Enhance model update script to remove block comments, capitalize model names, and inject models into `opencode` if the models array is missing. ([e8afc5f](https://github.com/yohi/opencode-geminicli-a2a/commit/e8afc5fc6df682eeb837c9d6038f71442215e9c5))
* **fallback:** add quota error detection and fallback resolution ([270c1b6](https://github.com/yohi/opencode-geminicli-a2a/commit/270c1b6f0f1544a0fc336e98e85b5463ed25d3b4))
* Gemini 2.5 Flashと1.5 Proモデルを追加し、プロバイダーオプションのオーバーライドとAI SDK互換性に関する新しいテストを含めました。 ([b7e84ae](https://github.com/yohi/opencode-geminicli-a2a/commit/b7e84aee49b8954f357a1752afde8983c0f7aad7))
* Implement AI SDK ProviderV1 compatibility, introduce direct call syntax for the Gemini A2A provider, and add corresponding tests. ([4e3cf38](https://github.com/yohi/opencode-geminicli-a2a/commit/4e3cf38cc3ef152183ef384388e26b2d6ad9cfea))
* implement core schemas, config, a2a client and mapper ([a0fed30](https://github.com/yohi/opencode-geminicli-a2a/commit/a0fed3057fe08ac3f57bd4b79aaaf0e52135efd7))
* implement Phase 3 with GitHub Packages and Actions ([883a6ec](https://github.com/yohi/opencode-geminicli-a2a/commit/883a6ec2d4f1d5591b81be26e81d780b76317f4d))
* implement provider, exports, and e2e integration tests ([57006e6](https://github.com/yohi/opencode-geminicli-a2a/commit/57006e6f074e45a21c64bbd1addcc28b55a64fd6))
* improve error handling by throwing an error for unresolved model constants and add logic to inject models into an empty `opencode` configuration. ([a358452](https://github.com/yohi/opencode-geminicli-a2a/commit/a358452516b2b89b44f49db005540826da47c9a0))
* InMemorySessionStoreにTTLとLRUによるセッション管理機能を追加し、providerでのsessionIdのバリデーションとセッション更新ロジックを改善しました。 ([25fb488](https://github.com/yohi/opencode-geminicli-a2a/commit/25fb488888ca09da5b2d1c40411a75bd3bd84c40))
* Integrate with OpenCode plugin and provider SDK ([b45088b](https://github.com/yohi/opencode-geminicli-a2a/commit/b45088b320ea39ccbc12c85e4de83b40e1782821))
* JSON-RPC 2.0準拠のA2A通信プロトコルへの刷新 ([773c259](https://github.com/yohi/opencode-geminicli-a2a/commit/773c25996311400db0f6164fee376219e81c237a))
* **mapper:** contextId/taskId 対応とツール結果テキスト化を追加 ([6887e66](https://github.com/yohi/opencode-geminicli-a2a/commit/6887e66e23e52c2998b9a8aede7169782cc1d445))
* **mapper:** tool call サポートを追加し、関連テストと例を更新 ([a795db4](https://github.com/yohi/opencode-geminicli-a2a/commit/a795db4f678400a32a33a07f1bc53c69149842cf))
* OpenCodeGeminiA2AProviderにセッション管理機能を追加し、マルチターン状態を分離することで並行リクエストを可能にしました。 ([10679fc](https://github.com/yohi/opencode-geminicli-a2a/commit/10679fc6a2dfd21ec637c8e56365bcd979f5c94a))
* OpenCodeスキーマに準拠したモデルごとのgenerationConfig指定をサポート ([e2ae4ab](https://github.com/yohi/opencode-geminicli-a2a/commit/e2ae4ab0016ffd258269a2789d47d0d550ad754c))
* percent-encoded data URIの堅牢なパースを実装し、isThoughtData型ガードを改善しました。` ([f64d391](https://github.com/yohi/opencode-geminicli-a2a/commit/f64d391ec55f5c2c9f0351e54105c1515969bf2e))
* Phase 4 A2A 特有の高度なコンテキスト管理とマルチモーダル対応の実装 ([6e29e21](https://github.com/yohi/opencode-geminicli-a2a/commit/6e29e2118ec505e1d78dadaab99c25199111b3d5))
* **provider:** a2aプロバイダーの堅牢性向上とデバッグログ強化 ([d98274f](https://github.com/yohi/opencode-geminicli-a2a/commit/d98274f6dffe327ad86ed8a3957840397d770b7f))
* **provider:** A2Aプロバイダーの機能強化、エラーハンドリング、ストリーム処理の改善 ([6b281c6](https://github.com/yohi/opencode-geminicli-a2a/commit/6b281c64da490ee59b55767f789ac57978538665))
* **provider:** A2Aリクエストでの動的モデル指定とサーバー自動起動を実装 ([599840a](https://github.com/yohi/opencode-geminicli-a2a/commit/599840a7169718a16dc3aa4bf5635964a14efd88))
* **provider:** CCPAレート制限とマルチエージェントルーティングに関する仕様・ドキュメント追加 ([9b05f3a](https://github.com/yohi/opencode-geminicli-a2a/commit/9b05f3a2508d310db5d254b39094f8774b8224bd))
* **provider:** CLIセッションID自動生成とRPCエラーハンドリング改善 ([826c970](https://github.com/yohi/opencode-geminicli-a2a/commit/826c97093f53e80fc6f24af4e49df78a9e21dfbe))
* **provider:** contextId/taskId を保持しマルチターン対話をサポート ([3f7b0fb](https://github.com/yohi/opencode-geminicli-a2a/commit/3f7b0fb63eb1795e4edd659cd5e719b43718c78a))
* **provider:** E2E機能の実装と依存関係の更新 ([cb6335b](https://github.com/yohi/opencode-geminicli-a2a/commit/cb6335bbdcb6ec71dd3e95cfc4c617841b123b5c))
* **provider:** Gemini CLIのプロバイダー設定とモデルリストを更新 ([6488557](https://github.com/yohi/opencode-geminicli-a2a/commit/6488557a0158227ce8849d0fc7c1d85d13fdb5f2))
* **provider:** integrate dynamic registry, multi-agent router, and automated fallback logic ([090c677](https://github.com/yohi/opencode-geminicli-a2a/commit/090c677dbb40aec8580c11f28435b400a58805a6))
* **provider:** v2仕様導入とプロバイダー初期化/エクスポートの刷新 ([4d9e8ef](https://github.com/yohi/opencode-geminicli-a2a/commit/4d9e8efe3a391ff7d28b137b596ae9a52606dd13))
* **provider:** ストリームエラー時のフォールバック処理を実装 ([309cf84](https://github.com/yohi/opencode-geminicli-a2a/commit/309cf8471cab3d01b17d0bac720a8e4bbf8f7ae4))
* **provider:** セッションストアの管理とコンテキストリセットの改善 ([6236624](https://github.com/yohi/opencode-geminicli-a2a/commit/6236624a582c5264235c246a2bc63d70247c823a))
* **provider:** セットアップ手順の簡素化とv2互換性の追加 ([235ccc0](https://github.com/yohi/opencode-geminicli-a2a/commit/235ccc0849031a6614811b0db9868f3531ebf0da))
* **provider:** プロバイダーの GitHub Packages 公開設定を整備 ([b319427](https://github.com/yohi/opencode-geminicli-a2a/commit/b31942709aa75b7d5604a83010f1ead8ab57966b))
* **provider:** 内部ツールの自動承認とOpenCodeへの露出制御 ([39d4f60](https://github.com/yohi/opencode-geminicli-a2a/commit/39d4f60b1c4c5e306dd247857bb1d746b1d7a8b9))
* **registry:** add dynamic model resolution support ([31d0b43](https://github.com/yohi/opencode-geminicli-a2a/commit/31d0b4311186731a1269a265b6b3190aab791aa0))
* Reset per-task deduplication state on task ID change and improve data URI parsing and byte presence checks. ([31487a9](https://github.com/yohi/opencode-geminicli-a2a/commit/31487a956ac234c86b036c709cf92c6b55221145))
* **router:** add multi-agent routing logic ([2992c08](https://github.com/yohi/opencode-geminicli-a2a/commit/2992c0800a511ebc1b2694b447192b056bc26f0f))
* **router:** モデルID重複時にルーター初期化でエラーを発生 ([0b00089](https://github.com/yohi/opencode-geminicli-a2a/commit/0b00089999b8f679240e579da40356b3afc5a5f8))
* **schemas:** リクエストパラメータに contextId と taskId を追加 ([b01cb64](https://github.com/yohi/opencode-geminicli-a2a/commit/b01cb64237953c91ffd3b5ca51dfa9efb6d0d6be))
* **spec:** A2Aプロバイダープラグインの仕様書を作成 ([698a4d8](https://github.com/yohi/opencode-geminicli-a2a/commit/698a4d8ce134949eb62a669839fec53c7cc6e4ad))
* **spec:** AI SDK連携とデータフロー詳細化 ([fd3d2c2](https://github.com/yohi/opencode-geminicli-a2a/commit/fd3d2c277d193c0479e135eafac860daf27bc32b))
* **spec:** idempotencyKeyをoptionalに変更 ([6ef7de6](https://github.com/yohi/opencode-geminicli-a2a/commit/6ef7de6d92595390a2e8ddd15c8864de62f98c51))
* **spec:** ofetchリトライ条件、idempotency key、ツールコールスキーマ更新 ([7169d7b](https://github.com/yohi/opencode-geminicli-a2a/commit/7169d7b92ac76b5e51c83a5e8df1ca3eb22a95dc))
* **utils:** A2Aプロンプトマッパーで最新ユーザーメッセージの選択とトークン使用量のマッピングを改善 ([a1390c0](https://github.com/yohi/opencode-geminicli-a2a/commit/a1390c08a096e050e44afe8f2e1463d474151921))
* **utils:** ツールコールのサポートを追加し、テストを記述 ([a2dbb3b](https://github.com/yohi/opencode-geminicli-a2a/commit/a2dbb3bcd7b00694bb17e7298d9d2c1e40de4c56))
* **utils:** 思考プロセスとツールリクエストのデータマッピングを改善 ([bb7aca2](https://github.com/yohi/opencode-geminicli-a2a/commit/bb7aca29dacf77eb6632ac9012c203033d111219))
* Validate base64 strings in file part data and add tests for invalid inputs. ([2f25dcb](https://github.com/yohi/opencode-geminicli-a2a/commit/2f25dcbd25a6c2e4d2c3f9e65d9b353663f835c3))
* スキーマにタスク状態の定義を追加し、テスト接続の出力表示を改善 ([3ae253d](https://github.com/yohi/opencode-geminicli-a2a/commit/3ae253dfa0711e2c70bb61dd9a8f84b6019f705c))
* セッションストアを非同期化し、InMemorySessionStoreにTTLとLRU機能を追加しました。 ([2f0bbe8](https://github.com/yohi/opencode-geminicli-a2a/commit/2f0bbe829c38e277ca1ba159e4a6a85468d5e764))
* ファイル名にpart.filenameを使用し、未指定時は'file'をデフォルトとするように変更 ([f997a94](https://github.com/yohi/opencode-geminicli-a2a/commit/f997a94f656ea8da7e2d99b1943fbed18c76d4c8))
* マルチモーダルコンテンツのスキーマ検証を追加し、画像とファイルの多様な入力形式に対応するマッピングロジックを改善し、関連するテストケースを ([317456c](https://github.com/yohi/opencode-geminicli-a2a/commit/317456c6a54a5b9ca30daeeac986dab0a59f5cee))
* マルチモーダルパートのバイナリデータとURIの処理を共通化し、多様なデータ形式に対応するとともに、ファイルスキーマから冗長な`bytes`フィールドを削除しました。 ([2f63f0c](https://github.com/yohi/opencode-geminicli-a2a/commit/2f63f0ceba1567824610052da35e2c5926ec8b29))


### Bug Fixes

* **a2a:** A2Aレスポンスのマッピングと入力バリデーションを改善 ([a8850d2](https://github.com/yohi/opencode-geminicli-a2a/commit/a8850d28d4af5edfdd32ef9c80d32ed5dc6159ec))
* **a2a:** A2Aレスポンスのマッピング改善、ステータスとトークン使用量の正確な処理 ([3d25790](https://github.com/yohi/opencode-geminicli-a2a/commit/3d257903f181fa9fa4eb319624168a5cc1230589))
* **a2a:** セキュアでない接続でのトークン送信エラー処理とデータマッパーの改善 ([52b776f](https://github.com/yohi/opencode-geminicli-a2a/commit/52b776f93e4cb5f4525368be034a29c453fdc5e5))
* add 'submitted' and 'queued' to STATUS_STATES schema ([749068a](https://github.com/yohi/opencode-geminicli-a2a/commit/749068a7605c553f44c9f6c3f47b07f24852ba68))
* adjust retry count and fix reasoning output format ([a8981af](https://github.com/yohi/opencode-geminicli-a2a/commit/a8981af93dce296ab59c1d782de97c42ac6123be))
* DEBUG_OPENCODEが無効な場合のログ出力を抑制 ([5942443](https://github.com/yohi/opencode-geminicli-a2a/commit/594244341c0ab4a59865cd1e2f212040bfed9866))
* **fallback:** エラー判定の正規化とベンダーコード設定機能の追加、および重複モデルのフォールバック防止 ([5dec817](https://github.com/yohi/opencode-geminicli-a2a/commit/5dec817bef0b41f4f9f86809abf7741f339b704b))
* **fallback:** クォータエラー判定のJSON-RPCコードチェックを厳格化し、パターン処理を修正 ([35f3d5a](https://github.com/yohi/opencode-geminicli-a2a/commit/35f3d5a077fc4a097f59cfb2c447a819ca8450c0))
* **fallback:** クォータエラー検知ロジックのテストとリセット処理の改善 ([1592e25](https://github.com/yohi/opencode-geminicli-a2a/commit/1592e253aa13806584ce8cdc47caff1196943113))
* **fallback:** フォールバックモデル選択ロジックを改善し、レジストリの存在しないモデルをスキップするようにした ([1353977](https://github.com/yohi/opencode-geminicli-a2a/commit/1353977fb79aad870cf241ce969fb7a0fdfa068f))
* Idempotency-Key 未提供時の振る舞いを修正し、スキーマを更新 ([29540bc](https://github.com/yohi/opencode-geminicli-a2a/commit/29540bc32c6e0696632c12fb261993168464d804))
* **mapper:** ツールID不在時のツールコール重複排除 ([bafb627](https://github.com/yohi/opencode-geminicli-a2a/commit/bafb6272ce4bbb1b04c0b5f5c9ec80ba100b892c))
* **network:** リトライ処理におけるidempotencyKeyの必須化と接続確立前への限定 ([3e48eb5](https://github.com/yohi/opencode-geminicli-a2a/commit/3e48eb59427f7bcbccb5098e3d463b3f45f0acef))
* ofetch通信におけるリトライ・冪等性・エラーハンドリング仕様の更新 ([263b8c2](https://github.com/yohi/opencode-geminicli-a2a/commit/263b8c282f1f6a96858363cc4152ad2cd7f2d9a5))
* OpenCodeバリデーションエラーを修正し、generationConfigのマージロジックを改善 ([ec1f21e](https://github.com/yohi/opencode-geminicli-a2a/commit/ec1f21eecf2f862c638e7f8cbba79bc54268f9a8))
* Prioritize explicit configuration options over environment variables and update configuration tests, adding a new test for provider compatibility. ([cb1a3cd](https://github.com/yohi/opencode-geminicli-a2a/commit/cb1a3cd61d26fc18b54231002f8787e5178ecb19))
* **provider:** doStreamのマルチターン状態競合を修正 ([38df183](https://github.com/yohi/opencode-geminicli-a2a/commit/38df183d01b48403c62e89cd924b08e7daec68af))
* **provider:** Providerの初期化ガードとモデルパースの堅牢性向上 ([0e09a9a](https://github.com/yohi/opencode-geminicli-a2a/commit/0e09a9a7c0cde4b1836644c128dcec5fbd6952a0))
* **provider:** suppress tool-call parts for internal A2A tool confirmations ([622c9ca](https://github.com/yohi/opencode-geminicli-a2a/commit/622c9ca7ee01b5c68f843b95a5bdddf9285279ab))
* **provider:** コードレビューの残件（フォールバックとオプション永続化）に対応 ([a5187de](https://github.com/yohi/opencode-geminicli-a2a/commit/a5187de25effac548fc5c9f1c1f3f93ebeccf788))
* **provider:** フォールバックプロバイダーのセッションストア伝達とデバッグログを修正 ([bba7166](https://github.com/yohi/opencode-geminicli-a2a/commit/bba71668f831dbe3b547565ab735560c205938ab))
* **schemas:** JSON-RPCレスポンスがresultとerrorを同時に持たないようにスキーマを修正 ([00e12b3](https://github.com/yohi/opencode-geminicli-a2a/commit/00e12b3197f3cb1b748425fc016af6ffae98e1f6))
* **schemas:** JSON-RPCレスポンススキーマにresultとerrorの相互排他性を追加 ([4ac1380](https://github.com/yohi/opencode-geminicli-a2a/commit/4ac1380f8794cd4042b3672ba36ea4ec989a6457))
* **schemas:** RPC レスポンススキーマの `id`, `result`, `error` フィールドを調整 ([25408a2](https://github.com/yohi/opencode-geminicli-a2a/commit/25408a254968c6476410472d86566beb8c7d7588))
* **schemas:** ポート範囲とJSON-RPC IDバリデーションを強化 ([b7c8a55](https://github.com/yohi/opencode-geminicli-a2a/commit/b7c8a553a42026ded30020a1c520024ddd824b07))
* use node instead of process.execPath for spawn to prevent Extension Host path bugs ([2ea36a9](https://github.com/yohi/opencode-geminicli-a2a/commit/2ea36a9d9370867d7059b15a6c37468d58d2eaba))
* コンテンツパートのスキーマ検証を明示的にし、変換時のnullチェックを追加して堅牢性を向上 ([e161e7c](https://github.com/yohi/opencode-geminicli-a2a/commit/e161e7c12df4e5fdd9c45f1c645172347a1bdad1))
* データURIのパース処理を堅牢化し、複数テキストパートの差分抽出を正しく重複排除するよう修正 ([d2b4231](https://github.com/yohi/opencode-geminicli-a2a/commit/d2b423135ac6f30d09124c69e1f588d91c37b2aa))
* 統合テストのサーバーリスンプロミスにエラーハンドリングを追加し、堅牢性を向上 ([1b38e6c](https://github.com/yohi/opencode-geminicli-a2a/commit/1b38e6cf0509c7ef5bfdf9008676ebaee257d76b))

## [0.1.2] - 2026-03-08

### Changed

- **BREAKING CHANGE**: 設定の優先順位を「環境変数 > オプション」から「オプション > 環境変数」に逆転しました。これにより、コード上から渡されたオプション（設定）が環境変数を上書きし、指定された場合はオプションが優先されるようになります。
- `languageModel` に渡される `settings` に含まれる `undefined` な値が、ベースとなる `options` を意図せず上書きしないよう修正しました。
