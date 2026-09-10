/**
 * FluxIDE Model Gateway — Provider Interface
 *
 * Abstract base for all AI model providers.
 * Each provider (Anthropic, OpenAI, Google, etc.) implements this.
 */

import type {
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
  ModelEntry,
  ProviderConfig,
} from "@fluxide/protocol";

/**
 * Every AI provider must implement this interface.
 */
export interface ModelProviderAdapter {
  /** Provider identifier */
  readonly providerId: string;

  /** Human-readable provider name */
  readonly displayName: string;

  /** Initialize with configuration (API keys, base URLs, etc.) */
  configure(config: ProviderConfig): void;

  /** Check if the provider is configured and reachable */
  isAvailable(): Promise<boolean>;

  /** List available models from this provider */
  listModels(): ModelEntry[];

  /** Send a completion request and get a full response */
  complete(request: CompletionRequest): Promise<CompletionResponse>;

  /** Send a completion request and get a streaming response */
  stream(
    request: CompletionRequest
  ): AsyncIterable<StreamChunk>;
}
