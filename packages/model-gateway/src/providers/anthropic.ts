/**
 * FluxIDE Model Gateway — Anthropic Provider Adapter
 *
 * Connects to the Anthropic Messages API for Claude models.
 */

import type {
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
  ModelEntry,
  ProviderConfig,
  TokenUsage,
} from "@fluxide/protocol";
import type { ModelProviderAdapter } from "./provider.js";

export class AnthropicProvider implements ModelProviderAdapter {
  readonly providerId = "anthropic";
  readonly displayName = "Anthropic";

  private apiKey = "";
  private baseUrl = "https://api.anthropic.com";

  configure(config: ProviderConfig): void {
    this.apiKey = config.apiKey ?? "";
    if (config.baseUrl) this.baseUrl = config.baseUrl;
  }

  async isAvailable(): Promise<boolean> {
    return this.apiKey.length > 0;
  }

  listModels(): ModelEntry[] {
    return [
      {
        id: "claude-sonnet-4-20250514",
        provider: "anthropic",
        name: "claude-sonnet-4-20250514",
        displayName: "Claude Sonnet 4",
        capabilities: ["chat", "coding", "reasoning", "tool_use", "vision"],
        maxContextTokens: 200_000,
        maxOutputTokens: 16_384,
        inputCostPer1MTokens: 3.0,
        outputCostPer1MTokens: 15.0,
        supportsStreaming: true,
        supportsToolUse: true,
        supportsVision: true,
        isLocal: false,
      },
      {
        id: "claude-opus-4-20250514",
        provider: "anthropic",
        name: "claude-opus-4-20250514",
        displayName: "Claude Opus 4",
        capabilities: ["chat", "coding", "reasoning", "tool_use", "vision", "long_context"],
        maxContextTokens: 200_000,
        maxOutputTokens: 32_768,
        inputCostPer1MTokens: 15.0,
        outputCostPer1MTokens: 75.0,
        supportsStreaming: true,
        supportsToolUse: true,
        supportsVision: true,
        isLocal: false,
      },
      {
        id: "claude-3-5-haiku-20241022",
        provider: "anthropic",
        name: "claude-3-5-haiku-20241022",
        displayName: "Claude 3.5 Haiku",
        capabilities: ["chat", "coding", "tool_use", "fast_completion"],
        maxContextTokens: 200_000,
        maxOutputTokens: 8_192,
        inputCostPer1MTokens: 0.8,
        outputCostPer1MTokens: 4.0,
        supportsStreaming: true,
        supportsToolUse: true,
        supportsVision: false,
        isLocal: false,
      },
    ];
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const body = this.buildRequestBody(request);

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${error}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    return this.parseResponse(data, request.model);
  }

  async *stream(request: CompletionRequest): AsyncIterable<StreamChunk> {
    const body = this.buildRequestBody(request);

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ ...body, stream: true }),
    });

    if (!response.ok) {
      const error = await response.text();
      yield { type: "error", message: `Anthropic API error ${response.status}: ${error}` };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      yield { type: "error", message: "No response body" };
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            yield { type: "done", stopReason: "end_turn" };
            return;
          }

          try {
            const event = JSON.parse(data) as Record<string, unknown>;
            const chunks = this.parseStreamEvent(event);
            for (const chunk of chunks) {
              yield chunk;
            }
          } catch {
            // Skip unparseable lines
          }
        }
      }
    }

    yield { type: "done", stopReason: "end_turn" };
  }

  private buildRequestBody(
    request: CompletionRequest
  ): Record<string, unknown> {
    const messages = request.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "tool" ? "user" : m.role,
        content: m.content,
      }));

    const body: Record<string, unknown> = {
      model: request.model,
      messages,
      max_tokens: request.maxTokens ?? 8192,
    };

    if (request.systemPrompt) {
      body["system"] = request.systemPrompt;
    }

    if (request.temperature !== undefined) {
      body["temperature"] = request.temperature;
    }

    if (request.tools && request.tools.length > 0) {
      body["tools"] = request.tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema,
      }));
    }

    return body;
  }

  private parseResponse(
    data: Record<string, unknown>,
    model: string
  ): CompletionResponse {
    const content = data["content"] as Array<Record<string, unknown>> | undefined;
    const usage = data["usage"] as Record<string, number> | undefined;

    let textContent = "";
    const toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];

    if (content) {
      for (const block of content) {
        if (block["type"] === "text") {
          textContent += block["text"] as string;
        } else if (block["type"] === "tool_use") {
          toolCalls.push({
            id: block["id"] as string,
            name: block["name"] as string,
            input: block["input"] as Record<string, unknown>,
          });
        }
      }
    }

    const tokenUsage: TokenUsage = {
      inputTokens: usage?.["input_tokens"] ?? 0,
      outputTokens: usage?.["output_tokens"] ?? 0,
      cacheReadTokens: usage?.["cache_read_input_tokens"],
      cacheWriteTokens: usage?.["cache_creation_input_tokens"],
      estimatedCostUsd: 0, // Calculated by gateway
    };

    return {
      id: data["id"] as string,
      model,
      content: textContent,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      stopReason: (data["stop_reason"] as string) ?? "end_turn",
      usage: tokenUsage,
    };
  }

  private parseStreamEvent(
    event: Record<string, unknown>
  ): StreamChunk[] {
    const type = event["type"] as string;
    const chunks: StreamChunk[] = [];

    switch (type) {
      case "content_block_delta": {
        const delta = event["delta"] as Record<string, unknown> | undefined;
        if (delta?.["type"] === "text_delta") {
          chunks.push({
            type: "text_delta",
            text: delta["text"] as string,
          });
        } else if (delta?.["type"] === "thinking_delta") {
          chunks.push({
            type: "thinking_delta",
            text: delta["thinking"] as string,
          });
        } else if (delta?.["type"] === "input_json_delta") {
          chunks.push({
            type: "tool_call_delta",
            id: "",
            input: delta["partial_json"] as string,
          });
        }
        break;
      }
      case "content_block_start": {
        const contentBlock = event["content_block"] as Record<string, unknown> | undefined;
        if (contentBlock?.["type"] === "tool_use") {
          chunks.push({
            type: "tool_call_start",
            id: contentBlock["id"] as string,
            name: contentBlock["name"] as string,
          });
        }
        break;
      }
      case "content_block_stop": {
        // Could emit tool_call_end if tracking
        break;
      }
      case "message_delta": {
        const usage = event["usage"] as Record<string, number> | undefined;
        if (usage) {
          chunks.push({
            type: "usage",
            usage: {
              inputTokens: usage["input_tokens"] ?? 0,
              outputTokens: usage["output_tokens"] ?? 0,
              estimatedCostUsd: 0,
            },
          });
        }
        break;
      }
      case "message_stop": {
        chunks.push({ type: "done", stopReason: "end_turn" });
        break;
      }
    }

    return chunks;
  }
}
