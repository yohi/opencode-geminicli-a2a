FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends git curl && rm -rf /var/lib/apt/lists/*
WORKDIR /workspace
RUN chown -R node:node /workspace
USER node
