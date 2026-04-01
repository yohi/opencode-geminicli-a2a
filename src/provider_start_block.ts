            start: (controller) => {
                let textPartCounter = 0;
                let reasoningPartCounter = 0;
                let activeTextId: string | undefined;
                let activeReasoningId: string | undefined;
                let isControllerClosed = false;

                const safeEnqueue = (part: LanguageModelV2StreamPart) => {
                    if (!isControllerClosed) {
                        try {
                            // Ultimate compatibility for OpenCode/Bun consumers:
                            // 1. V2 uses textDelta
                            // 2. Some strict V1 consumers expect a top-level 'delta' string
                            // 3. Others expect 'delta' to be an object with 'content' (evaluating chunk.delta.content)
                            // 4. Yet others expect chunk.delta.length (string has .length)

                            const content = (part as any).textDelta || (part as any).reasoningDelta || "";

                            const compatibilityPart = {
                                ...part,
                                // Satisfy 'expected string, received undefined' for path: ['delta']
                                delta: content,
                                // Satisfy 'evaluating chunk.delta.content'
                                content: content,
                            };

                            controller.enqueue(compatibilityPart as any);
                        } catch (e) {
                            // Controller can be closed by the client (OpenCode) at any time.
                            if (process.env.DEBUG_OPENCODE) {
                                Logger.debug('[Provider] controller closed while enqueuing part');
                            }
                            isControllerClosed = true;
                        }
                    }
                };
                const safeError = (err: any) => {
                    if (!isControllerClosed) {
                        controller.error(err);
                        isControllerClosed = true;
                    }
                };
