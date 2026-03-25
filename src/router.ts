import type { AgentEndpoint, ModelConfig } from './schemas';

export interface MultiAgentRouter {
    /**
     * 指定されたモデルIDに対応するエージェントエンドポイントとモデル設定を解決する
     * 該当がない場合は undefined を返す
     */
    resolve(modelId: string): { endpoint: AgentEndpoint; config?: ModelConfig; actualModelId: string } | undefined;

    /**
     * 登録されているすべてのエージェントを返す
     */
    getEndpoints(): AgentEndpoint[];
}

export class DefaultMultiAgentRouter implements MultiAgentRouter {
    private endpoints: AgentEndpoint[];

    constructor(endpoints: AgentEndpoint[]) {
        const keys = new Set<string>();
        const modelToEndpoints = new Map<string, AgentEndpoint[]>();

        for (const endpoint of endpoints) {
            if (endpoint.key) {
                if (keys.has(endpoint.key)) {
                    throw new Error(`Duplicate agent key '${endpoint.key}' found`);
                }
                keys.add(endpoint.key);
            }

            const modelIds = this.getModelIds(endpoint);
            for (const modelId of modelIds) {
                if (!modelToEndpoints.has(modelId)) {
                    modelToEndpoints.set(modelId, []);
                }
                modelToEndpoints.get(modelId)!.push(endpoint);
            }
        }

        // Validate that duplicated modelIds are only allowed on endpoints with unique keys
        for (const [modelId, matchingEndpoints] of modelToEndpoints.entries()) {
            if (matchingEndpoints.length > 1) {
                for (const endpoint of matchingEndpoints) {
                    if (!endpoint.key) {
                        throw new Error(`Model ID '${modelId}' is duplicated across multiple endpoints, but at least one endpoint lacks a unique 'key'. Ambiguous endpoints must have unique keys to be resolvable.`);
                    }
                }
            }
        }

        this.endpoints = [...endpoints];
    }

    private getModelIds(endpoint: AgentEndpoint): string[] {
        if (Array.isArray(endpoint.models)) {
            return endpoint.models;
        }
        return Object.entries(endpoint.models)
            .filter(([_, value]) => value !== false)
            .map(([key]) => key);
    }

    resolve(modelId: string): { endpoint: AgentEndpoint; config?: ModelConfig; actualModelId: string } | undefined {
        // 1. Try explicit targeting: "agentKey:modelId"
        const colonIndex = modelId.indexOf(':');
        if (colonIndex !== -1) {
            const agentKey = modelId.substring(0, colonIndex);
            const realModelId = modelId.substring(colonIndex + 1);
            const endpoint = this.endpoints.find(e => e.key === agentKey);
            if (!endpoint) {
                throw new Error(`Agent key '${agentKey}' not found`);
            }
            const modelIds = this.getModelIds(endpoint);
            if (!modelIds.includes(realModelId)) {
                throw new Error(`Model '${realModelId}' not found on agent '${agentKey}'`);
            }
            if (Array.isArray(endpoint.models)) {
                return { endpoint, actualModelId: realModelId };
            } else {
                const modelEntry = endpoint.models[realModelId];
                if (typeof modelEntry === 'object') {
                    return { endpoint, config: modelEntry, actualModelId: realModelId };
                }
                return { endpoint, actualModelId: realModelId };
            }
        }

        // 2. Fallback to standard resolution (find all matching agents)
        const matches: Array<{ endpoint: AgentEndpoint; config?: ModelConfig }> = [];
        for (const endpoint of this.endpoints) {
            if (Array.isArray(endpoint.models)) {
                if (endpoint.models.includes(modelId)) {
                    matches.push({ endpoint });
                }
            } else {
                const modelEntry = endpoint.models[modelId];
                if (modelEntry !== undefined) {
                    if (typeof modelEntry === 'boolean') {
                        if (modelEntry === true) {
                            matches.push({ endpoint });
                        }
                        // If modelEntry is false, continue
                    } else {
                        matches.push({ endpoint, config: modelEntry });
                    }
                }
            }
        }

        if (matches.length > 1) {
            const identities = matches.map(m => m.endpoint.key || 'anonymous').join(', ');
            throw new Error(`Ambiguous model ID '${modelId}' found in multiple endpoints: ${identities}. Please use 'agentKey:modelId' syntax.`);
        }

        if (matches.length === 1) {
            return { ...matches[0], actualModelId: modelId };
        }

        return undefined;
    }

    getEndpoints(): AgentEndpoint[] {
        return [...this.endpoints];
    }
}

export const MODEL_PRO = 'gemini-1.5-pro';
export const MODEL_FLASH = 'gemini-1.5-flash';
export const MODEL_AUTO = 'auto';

export interface TaskRequirements {
  complexity: 'low' | 'medium' | 'high' | 'auto';
}

export class DynamicModelRouter {
  selectModel(req: TaskRequirements): string {
    // We strictly respect Flash to avoid quota issues on Pro models
    if (req.complexity === 'high') {
      return MODEL_PRO;
    }
    if (req.complexity === 'auto') {
      return MODEL_AUTO;
    }
    return MODEL_FLASH;
  }
}
