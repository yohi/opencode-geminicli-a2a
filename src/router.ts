import type { AgentEndpoint, ModelConfig } from './schemas';

export interface MultiAgentRouter {
    /**
     * 指定されたモデルIDに対応するエージェントエンドポイントとモデル設定を解決する
     * 該当がない場合は undefined を返す
     */
    resolve(modelId: string): { endpoint: AgentEndpoint; config?: ModelConfig } | undefined;

    /**
     * 登録されているすべてのエージェントを返す
     */
    getEndpoints(): AgentEndpoint[];
}

export class DefaultMultiAgentRouter implements MultiAgentRouter {
    private endpoints: AgentEndpoint[];

    constructor(endpoints: AgentEndpoint[]) {
        const modelToEndpoint = new Map<string, string>();
        for (let i = 0; i < endpoints.length; i++) {
            const endpoint = endpoints[i];
            const identity = endpoint.key || `index ${i}`;
            const modelIds = this.getModelIds(endpoint);
            for (const modelId of modelIds) {
                if (modelToEndpoint.has(modelId)) {
                    const conflictingIdentity = modelToEndpoint.get(modelId);
                    throw new Error(`Duplicate model ID '${modelId}' found in endpoints '${conflictingIdentity}' and '${identity}'`);
                }
                modelToEndpoint.set(modelId, identity);
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

    resolve(modelId: string): { endpoint: AgentEndpoint; config?: ModelConfig } | undefined {
        for (const endpoint of this.endpoints) {
            if (Array.isArray(endpoint.models)) {
                if (endpoint.models.includes(modelId)) {
                    return { endpoint };
                }
            } else {
                const modelEntry = endpoint.models[modelId];
                if (modelEntry !== undefined) {
                    if (typeof modelEntry === 'boolean') {
                        if (modelEntry === true) {
                            return { endpoint };
                        }
                        // If modelEntry is false, continue to next endpoint
                        continue;
                    }
                    return { endpoint, config: modelEntry };
                }
            }
        }
        return undefined;
    }

    getEndpoints(): AgentEndpoint[] {
        return [...this.endpoints];
    }
}

export const MODEL_PRO = 'gemini-1.5-pro';
export const MODEL_FLASH = 'gemini-1.5-flash';

export interface TaskRequirements {
  complexity: 'low' | 'medium' | 'high';
}

export class DynamicModelRouter {
  selectModel(req: TaskRequirements): string {
    if (req.complexity === 'high') {
      return MODEL_PRO;
    }
    if (req.complexity === 'medium') {
      return MODEL_FLASH; // Explicitly map 'medium' to Flash for clarity
    }
    return MODEL_FLASH;
  }
}
