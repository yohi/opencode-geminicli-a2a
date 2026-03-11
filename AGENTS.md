# AGENTS.md - Context for AI Engineers

This project is a custom AI SDK provider that connects OpenCode to a local Gemini CLI A2A server.

## System Context
You are working on `opencode-geminicli-a2a-provider`. This is a plugin designed to be loaded by OpenCode to enable Agent-to-Agent communication with a Gemini CLI instance running locally.

## Core Directives
<instructions>
1. **Source of Truth**: Always refer to [SPEC.md](./SPEC.md) for architectural decisions, data structures, and communication protocols.
2. **No Proxy Servers**: Do NOT implement intermediate Express or Hono proxy servers. The provider must implement the `LanguageModelV1` interface and communicate directly using `ofetch`.
3. **AI SDK Compliance**: Ensure all implementations follow the Vercel AI SDK specification.
4. **Resilience**: Use `ofetch` with the configured retry and timeout logic as specified in the SPEC.
5. **Type Safety**: All communication payloads must be validated using Zod schemas defined in `src/schemas.ts`.
</instructions>

## Current State
- **Phase**: コアプロバイダーロジックに加え、動的モデルレジストリ、エラー時の自動フォールバック機構、マルチエージェントルーティング、およびネイティブマルチモーダル対応 (Phase 5) が実装完了し、安定稼働しています。
- **Testing**: Core tests are green. The framework for streaming and tool calling is in place.

## Action Guidelines
<instructions>
- When adding features, prioritize maintaining the direct A2A mapping.
- If OpenCode API definitions are unclear, investigate `@ai-sdk/provider` interfaces first.
- Refer to [SPEC.md](./SPEC.md) for project-specific architecture and the [dotfiles-guidelines persona definitions](file:///home/y_ohi/dotfiles/components/dotfiles-ai/agent-skills/dotfiles-guidelines/SKILL.md) for expert role guidance (e.g., @architect, @developer).
- When modifying fallback or routing logic, do NOT break the existing dynamic design (e.g., `StaticModelRegistry`, `DefaultMultiAgentRouter`, `isQuotaError`).
</instructions>
