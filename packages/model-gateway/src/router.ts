/**
 * FluxIDE Model Gateway — Intelligent Router
 *
 * Selects the optimal model for each task based on:
 * difficulty, cost, latency, capabilities, and user preference.
 */

import type {
  ModelEntry,
  ModelCapability,
  ModelRoutingRule,
  CompletionRequest,
} from "@fluxide/protocol";
import type { ModelProviderAdapter } from "./provider.js";

export interface RouterConfig {
  readonly defaultModel: string;
  readonly rules: ModelRoutingRule[];
  readonly costSensitivity: "low" | "medium" | "high";
}

const DEFAULT_ROUTER_CONFIG: RouterConfig = {
  defaultModel: "qwen2.5-coder",
  rules: [],
  costSensitivity: "medium",
};

export class ModelRouter {
  private providers = new Map<string, ModelProviderAdapter>();
  private modelRegistry = new Map<string, ModelEntry>();
  private config: RouterConfig;

  constructor(config: RouterConfig = DEFAULT_ROUTER_CONFIG) {
    this.config = config;
  }

  /**
   * Register a provider adapter.
   */
  registerProvider(provider: ModelProviderAdapter): void {
    this.providers.set(provider.providerId, provider);
    for (const model of provider.listModels()) {
      this.modelRegistry.set(model.id, model);
    }
  }

  /**
   * Get the provider for a given model ID.
   */
  getProviderForModel(modelId: string): ModelProviderAdapter | undefined {
    const entry = this.modelRegistry.get(modelId);
    if (!entry) return undefined;
    return this.providers.get(entry.provider);
  }

  /**
   * Select the best model for a task type.
   */
  selectModel(taskType: string, requiredCapabilities?: ModelCapability[]): string {
    // Check user-defined routing rules first
    const rule = this.config.rules.find((r) => r.taskType === taskType);
    if (rule) {
      const model = this.modelRegistry.get(rule.preferredModel);
      if (model) return model.id;
      // Try fallback
      if (rule.fallbackModel) {
        const fallback = this.modelRegistry.get(rule.fallbackModel);
        if (fallback) return fallback.id;
      }
    }

    // Auto-select based on capabilities and cost
    if (requiredCapabilities && requiredCapabilities.length > 0) {
      const candidates = Array.from(this.modelRegistry.values()).filter(
        (m) =>
          requiredCapabilities.every((cap) => m.capabilities.includes(cap))
      );

      if (candidates.length > 0) {
        // Sort by cost (ascending) if cost-sensitive
        if (this.config.costSensitivity === "high") {
          candidates.sort(
            (a, b) => a.outputCostPer1MTokens - b.outputCostPer1MTokens
          );
        }
        const selected = candidates[0];
        if (selected) return selected.id;
      }
    }

    return this.config.defaultModel;
  }

  /**
   * List all available models across providers.
   */
  listAllModels(): ModelEntry[] {
    return Array.from(this.modelRegistry.values());
  }

  /** Route a non-streaming completion to its registered provider. */
  async complete(request: CompletionRequest) {
    const { provider, request: routedRequest } = this.resolveRequest(request);
    return provider.complete(routedRequest);
  }

  /** Route a streaming completion to its registered provider. */
  stream(request: CompletionRequest) {
    const { provider, request: routedRequest } = this.resolveRequest(request);
    return provider.stream(routedRequest);
  }

  /**
   * Estimate cost for a request.
   */
  estimateCost(
    modelId: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const model = this.modelRegistry.get(modelId);
    if (!model) return 0;

    const inputCost = (inputTokens / 1_000_000) * model.inputCostPer1MTokens;
    const outputCost =
      (outputTokens / 1_000_000) * model.outputCostPer1MTokens;
    return inputCost + outputCost;
  }

  private resolveRequest(request: CompletionRequest): {
    provider: ModelProviderAdapter;
    request: CompletionRequest;
  } {
    const modelId = request.model === "auto"
      ? this.selectModel("coding", ["chat"])
      : request.model;
    const provider = this.getProviderForModel(modelId);

    if (!provider) {
      throw new Error(`No registered provider is available for model "${modelId}".`);
    }

    return {
      provider,
      request: { ...request, model: modelId },
    };
  }
}
