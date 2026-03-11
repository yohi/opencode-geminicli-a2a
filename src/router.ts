import type { AgentEndpoint } from './schemas';

export interface MultiAgentRouter {
    /**
     * 指定されたモデルIDに対応するエージェントエンドポイントを解決する
     * 該当がない場合は undefined を返す
     */
    resolve(modelId: string): AgentEndpoint | undefined;

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
            for (const modelId of endpoint.models) {
                if (modelToEndpoint.has(modelId)) {
                    const conflictingIdentity = modelToEndpoint.get(modelId);
                    throw new Error(`Duplicate model ID '${modelId}' found in endpoints '${conflictingIdentity}' and '${identity}'`);
                }
                modelToEndpoint.set(modelId, identity);
            }
        }
        this.endpoints = [...endpoints];
    }

    resolve(modelId: string): AgentEndpoint | undefined {
        for (const endpoint of this.endpoints) {
            if (endpoint.models.includes(modelId)) {
                return endpoint;
            }
        }
        return undefined;
    }

    getEndpoints(): AgentEndpoint[] {
        return [...this.endpoints];
    }
}
