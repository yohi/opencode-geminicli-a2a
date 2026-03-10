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
        this.endpoints = endpoints;
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
        return this.endpoints;
    }
}
