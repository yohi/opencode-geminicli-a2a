# OpenCode Gemini CLI A2A Plugin (v2)

This plugin enables OpenCode to delegate complex tasks to the Gemini CLI agent using the standard [Agent2Agent (A2A) Protocol](https://a2a-protocol.org/).

Currently, this is a minimal proof-of-concept (PoC) implementation that connects to an A2A server (e.g., `gemini-cli a2a-server`) via HTTP/REST.

## Architecture

*   **A2A Client Tool**: Exposes a `delegate_to_gemini` tool to the OpenCode agent.
*   **Protocol Binding**: Uses the standard A2A HTTP/REST binding (`POST /message:send`).
*   **Data Model**: Strictly adheres to the A2A specification (e.g., `SendMessageRequest`, `Task`, `Artifact`, `StreamResponse`).

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

## Future Implementation Roadmap

To fully realize the potential of the A2A protocol and make this plugin production-ready, the following features should be implemented progressively:

### 1. Streaming Support (Server-Sent Events: SSE) [High Priority]
*   **Current State:** Uses a single `fetch` request expecting an immediate `TASK_STATE_COMPLETED` response.
*   **Next Steps:**
    *   Switch to the `POST /message:stream` endpoint.
    *   Parse the Server-Sent Events (SSE) stream.
    *   Handle `TaskStatusUpdateEvent` and `TaskArtifactUpdateEvent` to provide real-time progress updates (e.g., streaming text, progress bars) to the OpenCode UI.

### 2. Task Polling & Continuation [High Priority]
*   **Current State:** Fails if the server returns a state other than `COMPLETED`.
*   **Next Steps:**
    *   Handle the `TASK_STATE_WORKING` state.
    *   Implement polling using `GET /tasks/{id}` or establish a stream using `POST /tasks/{id}:subscribe` to monitor long-running tasks without timing out.

### 3. Human-in-the-Loop (Input/Auth Required) [Medium Priority]
*   **Current State:** Cannot handle requests for clarification or authorization from the A2A server.
*   **Next Steps:**
    *   Handle `TASK_STATE_INPUT_REQUIRED` and `TASK_STATE_AUTH_REQUIRED` states.
    *   Prompt the OpenCode user for input/authorization.
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
