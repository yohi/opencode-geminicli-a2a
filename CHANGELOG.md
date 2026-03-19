# Changelog

All notable changes to this project will be documented in this file.

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
