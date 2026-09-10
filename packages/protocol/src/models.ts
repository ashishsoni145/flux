/**
 * @fluxide/protocol — Model Gateway Schema
 *
 * Provider-independent model abstractions, routing config,
 * BYOK vault entries, and streaming message types.
 */

// ─── Model Provider ─────────────────────────────────────────
export type ModelProvider =
  | "anthropic"
  | "openai"
  | "google"
  | "xai"
  | "deepseek"
  | "qwen"
  | "mistral"
  | "openrouter"
  | "ollama"
  | "lmstudio"
  | "custom";

// ─── Model Capability ───────────────────────────────────────
export type ModelCapability =
  | "chat"
  | "reasoning"
  | "coding"
  | "vision"
  | "tool_use"
  | "long_context"
  | "fast_completion";

// ─── Model Entry ────────────────────────────────────────────
export interface ModelEntry {
  readonly id: string;
  readonly provider: ModelProvider;
  readonly name: string;
  readonly displayName: string;
  readonly capabilities: readonly ModelCapability[];
  readonly maxContextTokens: number;
  readonly maxOutputTokens: number;
  readonly inputCostPer1MTokens: number;
  readonly outputCostPer1MTokens: number;
  readonly supportsStreaming: boolean;
  readonly supportsToolUse: boolean;
  readonly supportsVision: boolean;
  readonly isLocal: boolean;
}

// ─── Provider Config (BYOK) ────────────────────────────────
export interface ProviderConfig {
  readonly provider: ModelProvider;
  readonly apiKey?: string;
  readonly baseUrl?: string;
  readonly organizationId?: string;
  readonly projectId?: string;
  readonly isEnabled: boolean;
}

// ─── Routing Rule ───────────────────────────────────────────
export interface ModelRoutingRule {
  readonly taskType: string;
  readonly preferredModel: string;
  readonly fallbackModel?: string;
  readonly maxCostPerRequest?: number;
  readonly requireCapability?: ModelCapability;
}

// ─── Chat Message ───────────────────────────────────────────
export type MessageRole = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  readonly role: MessageRole;
  readonly content: string | MessageContent[];
  readonly name?: string;
  readonly toolCallId?: string;
}

export type MessageContent =
  | { readonly type: "text"; readonly text: string }
  | { readonly type: "image"; readonly url: string; readonly mimeType: string }
  | { readonly type: "tool_use"; readonly id: string; readonly name: string; readonly input: Record<string, unknown> }
  | { readonly type: "tool_result"; readonly toolUseId: string; readonly content: string; readonly isError?: boolean };

// ─── Streaming Chunk ────────────────────────────────────────
export type StreamChunk =
  | { readonly type: "text_delta"; readonly text: string }
  | { readonly type: "thinking_delta"; readonly text: string }
  | { readonly type: "tool_call_start"; readonly id: string; readonly name: string }
  | { readonly type: "tool_call_delta"; readonly id: string; readonly input: string }
  | { readonly type: "tool_call_end"; readonly id: string }
  | { readonly type: "usage"; readonly usage: import("./agents.js").TokenUsage }
  | { readonly type: "error"; readonly message: string }
  | { readonly type: "done"; readonly stopReason: string };

// ─── Completion Request ─────────────────────────────────────
export interface CompletionRequest {
  readonly model: string;
  readonly messages: readonly ChatMessage[];
  readonly tools?: readonly ToolDefinition[];
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly systemPrompt?: string;
  readonly stream?: boolean;
}

// ─── Tool Definition ────────────────────────────────────────
export interface ToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
}

// ─── Completion Response ────────────────────────────────────
export interface CompletionResponse {
  readonly id: string;
  readonly model: string;
  readonly content: string;
  readonly toolCalls?: ToolCall[];
  readonly stopReason: string;
  readonly usage: import("./agents.js").TokenUsage;
}

export interface ToolCall {
  readonly id: string;
  readonly name: string;
  readonly input: Record<string, unknown>;
}
