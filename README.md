# opencode-geminicli-a2a-provider

OpenCode to Gemini CLI A2A Provider Plugin. This package provides a custom provider for the Vercel AI SDK that communicates directly with a local Gemini CLI instance using the A2A (Agent-to-Agent) protocol.

## Features

- **Native A2A Support**: Direct communication with Gemini CLI without intermediate proxy servers.
- **AI SDK Compatible**: Implements the `LanguageModelV1` interface for seamless integration with @ai-sdk.
- **Resilient**: Built-in support for retries and timeouts using `ofetch`.
- **Type Safe**: Schema validation with `Zod`.

## Installation

```bash
npm install opencode-geminicli-a2a-provider
```

## Configuration

The provider can be configured via environment variables or explicitly in code.

### Environment Variables

- `GEMINI_A2A_PORT`: Port of the Gemini CLI A2A server (default: `41242`)
- `GEMINI_A2A_HOST`: Host of the Gemini CLI A2A server (default: `127.0.0.1`)
- `GEMINI_A2A_TOKEN`: Optional authorization token.

### OpenCode Configuration

In your `opencode.jsonc`, you can specify the provider settings:

```jsonc
{
  "a2aProvider": {
    "host": "127.0.0.1",
    "port": 41242,
    "token": "your-token-here"
  }
}
```

## Usage

```typescript
import { createGeminiA2AProvider } from 'opencode-geminicli-a2a-provider';

const geminiA2A = createGeminiA2AProvider({
  port: 41242
});

const model = geminiA2A('gemini-2.5-pro');

// Use with AI SDK generateText or streamText
import { generateText } from 'ai';

const { text } = await generateText({
  model,
  prompt: 'Hello, how can you help me today?'
});
```

## Architecture

For detailed architectural decisions and specifications, please refer to [SPEC.md](./SPEC.md).

## Development

### Prerequisites
- Node.js (v18+)
- npm

### Commands
- `npm run dev`: Start development mode with hot reload.
- `npm run build`: Build the project (CJS/ESM).
- `npm run test`: Run tests using Vitest.
- `npm run typecheck`: Run TypeScript type checking.
