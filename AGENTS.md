# AGENTS.md - Context for AI Engineers

This project is a custom AI SDK provider that connects OpenCode to a local Gemini CLI A2A server.

## System Context
You are working on `opencode-geminicli-a2a-provider`. This is a plugin designed to be loaded by OpenCode to enable Agent-to-Agent communication with a Gemini CLI instance running locally.

## Core Directives
<instructions>
1. **Source of Truth**: Always refer to [SPEC.md](./SPEC.md) for architectural decisions, data structures, and communication protocols.
2. **Stateful Deltas**: Every request must favor sending ONLY new messages (deltas) if a `contextId` is present, relying on A2A server-side history to prevent infinite loops and payload bloat.
3. **Schema Bridging**: Maintain the argument normalization logic in `mapper.ts`. Ensure `filePath` is prioritized for OpenCode tools, and `description` is always provided to satisfy strict Zod schemas.
4. **Resilience**: Use `ofetch` with the configured retry and timeout logic as specified in the SPEC.
5. **Type Safety**: All communication payloads must be validated using Zod schemas defined in `src/schemas.ts`.
</instructions>

## Current State
- **Phase**: Core provider logic is stabilized. **Stateful Deltas** and **Schema Bridging** (Phase 7) are implemented to resolve infinite loops and strict argument schema errors in OpenCode.
- **Testing**: Comprehensive test suite (160+ tests) is green, covering mapping, streaming, and error fallbacks.

## Action Guidelines
<instructions>
- When adding features, prioritize maintaining the direct A2A mapping.
- If OpenCode API definitions are unclear, investigate `@ai-sdk/provider` interfaces first.
- Refer to [SPEC.md](./SPEC.md) for project-specific architecture and the [dotfiles-guidelines persona definitions](file:///home/y_ohi/dotfiles/components/dotfiles-ai/agent-skills/dotfiles-guidelines/SKILL.md) for expert role guidance (e.g., @architect, @developer).
- When modifying fallback or routing logic, do NOT break the existing flexible design (e.g., `StaticModelRegistry`, `DefaultMultiAgentRouter`, `isQuotaError`).
</instructions>
