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
        return Object.keys(endpoint.models);
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
                        return modelEntry ? { endpoint } : undefined;
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
