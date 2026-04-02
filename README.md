# OpenCode Gemini CLI A2A Plugin (v2)

This plugin enables OpenCode to delegate complex tasks to the Gemini CLI agent using the standard [Agent2Agent (A2A) Protocol](https://a2a-protocol.org/).

Currently, this is a minimal proof-of-concept (PoC) implementation that connects to an A2A server (e.g., `gemini-cli a2a-server`) via HTTP/REST.

## Architecture

*   **A2A Client Tool**: Exposes a `delegate_to_gemini` tool to the OpenCode agent.
*   **Protocol Binding**: Uses the standard A2A HTTP/REST streaming binding (`POST /message:stream`).
*   **Data Model**: Strictly adheres to the A2A specification (e.g., `SendMessageRequest`, `Task`, `Artifact`, `StreamResponse`, `TaskStatusUpdateEvent`).
*   **Real-time Progress**: Parses Server-Sent Events (SSE) from the stream to provide immediate feedback to the user via the `onProgress` callback.

## Setup

1.  Ensure you have an A2A server running (e.g., Gemini CLI listening on `http://localhost:8080`).
2.  Install dependencies:
    ```bash
    bun install
    ```
3.  Build the plugin (type check):
    ```bash
    bun run tsc --noEmit
    ```

## Implementation Roadmap

### 1. [COMPLETED] Streaming Support (Server-Sent Events: SSE)
*   **Accomplished:** Switched to the `POST /message:stream` endpoint and implemented real-time event parsing using `eventsource-parser`. Progress and artifacts are surfaced to the CLI as they arrive.

### 2. Task Polling & Continuation [High Priority]
*   **Current State:** Successfully handles `TASK_STATE_WORKING` and waits for a terminal state (`COMPLETED` or `FAILED`) within the stream.
*   **Next Steps:**
    *   Implement fallback polling using `GET /tasks/{id}` for environments where long-lived HTTP streams are unstable or restricted.
    *   Handle task re-attachment (subscribing to an existing task) using `POST /tasks/{id}:subscribe`.

### 3. Human-in-the-Loop (Input/Auth Required) [High Priority]
*   **Current State:** Cannot handle requests for clarification or authorization from the A2A server.
*   **Next Steps:**
    *   Detect and handle `TASK_STATE_INPUT_REQUIRED` and `TASK_STATE_AUTH_REQUIRED` states.
    *   Prompt the OpenCode user for input/authorization via the plugin's UI components.
    *   Send follow-up messages using the same `taskId` and `contextId` to continue the interaction.

### 4. Dynamic Tool Registration via Agent Discovery [Medium Priority]
*   **Current State:** Hardcodes a single, generic `delegate_to_gemini` tool.
*   **Next Steps:**
    *   Fetch the `/.well-known/agent-card.json` from the Gemini CLI A2A server during plugin initialization.
    *   Dynamically register OpenCode tools based on the specific `skills` declared in the Agent Card. This allows the OpenCode agent to understand exactly *when* and *what* tasks to delegate.

### 5. Multimodal Support (Files & Images) [Low-Medium Priority]
*   **Current State:** Supports only plain text (`text` parts).
*   **Next Steps:**
    *   Support `image` and `file` parts in the A2A data model.
    *   Allow the OpenCode agent to read local workspace files and send them to the A2A server (via base64 or URIs).
    *   Handle saving file `Artifact`s returned by the server back to the local file system.

### 6. Local Server Process Management [Low Priority]
*   **Current State:** Assumes the A2A server is already running externally.
*   **Next Steps:**
    *   Reintroduce a `ServerManager` to automatically spawn the `gemini-cli a2a-server` process in the background when the plugin loads, and gracefully terminate it when the plugin unloads (if a remote URL is not configured).
