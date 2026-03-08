# Changelog

All notable changes to this project will be documented in this file.

## [0.1.2] - 2026-03-08

### Changed

- **BREAKING CHANGE**: 設定の優先順位を「環境変数 > オプション」から「オプション > 環境変数」に逆転しました。これにより、コード上から渡されたオプション（設定）が環境変数を上書きし、指定された場合はオプションが優先されるようになります。
- `languageModel` に渡される `settings` に含まれる `undefined` な値が、ベースとなる `options` を意図せず上書きしないよう修正しました。
