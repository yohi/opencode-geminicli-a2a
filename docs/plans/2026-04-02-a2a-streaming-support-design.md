# A2A Streaming Support Design (SSE)

## Overview
This document outlines the design for implementing Server-Sent Events (SSE) streaming support in the OpenCode Gemini CLI A2A plugin. This fulfills the "1. Streaming Support" objective in the Future Implementation Roadmap.

## Architecture & Endpoint
- **Endpoint**: The plugin will switch from calling the `POST /message:send` endpoint to the `POST /message:stream` endpoint.
- **Protocol**: The server responds with an SSE stream containing A2A events: `task` (TaskStatusUpdate), `statusUpdate`, `artifactUpdate`, and `message`.

## Parsing Approach
- **Dependency**: Introduce the `eventsource-parser` library.
- **Processing**: The native `fetch` API will be used. The `response.body` (a `ReadableStream`) will be read chunk by chunk using a `TextDecoderStream` or manual decoding. These chunks are fed into `eventsource-parser`, which robustly handles chunk boundaries and emits parsed JSON events.

## State Management and Progress Updates
- **`statusUpdate` events**:
  - Detects transitions like `TASK_STATE_WORKING`.
  - Can log status updates to inform the user that the task is actively being processed.
- **`artifactUpdate` events**:
  - Accumulates text parts (`artifact.parts`) in memory.
  - As partial texts arrive, the plugin can use `context.metadata()` or `process.stdout.write` to provide real-time visual progress updates to the OpenCode UI, improving UX for long-running tasks.
- **`task` events (Completion)**:
  - The stream is considered complete when a `Task` object with `status.state === "TASK_STATE_COMPLETED"` or `"TASK_STATE_FAILED"` is received.
  - Upon completion, the `execute` Promise resolves, returning the fully accumulated text result back to the OpenCode agent.

## Error Handling
- Timeout logic will be adjusted if necessary, though SSE streams may inherently run longer than 30 seconds. A longer or configurable timeout might be needed.
- Network errors or invalid JSON within the SSE stream will throw an error and reject the `execute` Promise.

## Future Considerations (Out of Scope for this step)
- Polling for `TASK_STATE_WORKING` continuation if the connection drops.
- Human-in-the-loop interactions (`TASK_STATE_INPUT_REQUIRED`).
