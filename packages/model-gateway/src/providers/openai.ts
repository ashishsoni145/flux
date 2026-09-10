/**
 * FluxIDE Model Gateway — OpenAI Provider Adapter
 *
 * Connects to OpenAI Chat Completions API.
 * Supports GPT-4o, GPT-4o-mini, o1, o3-mini models,
 * function calling / tool execution, and streaming responses.
 */

import type {
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
  ModelEntry,
  ProviderConfig,
  TokenUsage,
  ToolCall,
} from "@fluxide/protocol";
import type { ModelProviderAdapter } from "../provider.js";

export class OpenAIProvider implements ModelProviderAdapter {
  readonly providerId = "openai";
  readonly displayName = "OpenAI";

  private apiKey = "";
  private baseUrl = "https://api.openai.com/v1";

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
        id: "gpt-4o",
        provider: "openai",
        name: "gpt-4o",
        displayName: "GPT-4o",
        capabilities: ["chat", "coding", "reasoning", "tool_use", "vision"],
        maxContextTokens: 128_000,
        maxOutputTokens: 16_384,
        inputCostPer1MTokens: 2.5,
        outputCostPer1MTokens: 10.0,
        supportsStreaming: true,
        supportsToolUse: true,
        supportsVision: true,
        isLocal: false,
      },
      {
        id: "gpt-4o-mini",
        provider: "openai",
        name: "gpt-4o-mini",
        displayName: "GPT-4o Mini",
        capabilities: ["chat", "coding", "tool_use", "fast_completion"],
        maxContextTokens: 128_000,
        maxOutputTokens: 16_384,
        inputCostPer1MTokens: 0.15,
        outputCostPer1MTokens: 0.6,
        supportsStreaming: true,
        supportsToolUse: true,
        supportsVision: true,
        isLocal: false,
      },
      {
        id: "o3-mini",
        provider: "openai",
        name: "o3-mini",
        displayName: "o3-mini",
        capabilities: ["chat", "coding", "reasoning", "tool_use"],
        maxContextTokens: 200_000,
        maxOutputTokens: 100_000,
        inputCostPer1MTokens: 1.1,
        outputCostPer1MTokens: 4.4,
        supportsStreaming: true,
        supportsToolUse: true,
        supportsVision: false,
        isLocal: false,
      },
      {
        id: "o1",
        provider: "openai",
        name: "o1",
        displayName: "o1",
        capabilities: ["chat", "coding", "reasoning", "vision"],
        maxContextTokens: 200_000,
        maxOutputTokens: 100_000,
        inputCostPer1MTokens: 15.0,
        outputCostPer1MTokens: 60.0,
        supportsStreaming: true,
        supportsToolUse: false,
        supportsVision: true,
        isLocal: false,
      },
    ];
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const body = this.buildRequestBody(request, false);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${error}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    return this.parseResponse(data, request.model);
  }

  async *stream(request: CompletionRequest): AsyncIterable<StreamChunk> {
    const body = this.buildRequestBody(request, true);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      yield { type: "error", message: `OpenAI API error ${response.status}: ${error}` };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      yield { type: "error", message: "No response body" };
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";
    const toolCallBuffers = new Map<number, { id: string; name: string; arguments: string }>();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const dataStr = trimmed.slice(6).trim();
        if (dataStr === "[DONE]") {
          // Emit accumulated tool calls if any
          for (const [, call] of toolCallBuffers) {
            try {
              yield {
                type: "tool_call",
                toolCall: {
                  id: call.id,
                  name: call.name,
                  input: JSON.parse(call.arguments || "{}"),
                },
              };
            } catch {
              yield {
                type: "tool_call",
                toolCall: {
                  id: call.id,
                  name: call.name,
                  input: { raw: call.arguments },
                },
              };
            }
          }
          yield { type: "done", stopReason: "end_turn" };
          return;
        }

        try {
          const chunk = JSON.parse(dataStr);
          const choice = chunk.choices?.[0];
          if (!choice) continue;

          const delta = choice.delta;
          if (delta?.content) {
            yield { type: "text_delta", text: delta.content };
          }

          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const index = tc.index ?? 0;
              let existing = toolCallBuffers.get(index);
              if (!existing) {
                existing = { id: tc.id ?? `call_${index}`, name: tc.function?.name ?? "", arguments: "" };
                toolCallBuffers.set(index, existing);
              }
              if (tc.function?.name) existing.name = tc.function.name;
              if (tc.function?.arguments) existing.arguments += tc.function.arguments;
            }
          }

          if (choice.finish_reason) {
            const stopReason = choice.finish_reason === "tool_calls" ? "tool_use" : "end_turn";
            if (choice.finish_reason === "tool_calls") {
              for (const [, call] of toolCallBuffers) {
                try {
                  yield {
                    type: "tool_call",
                    toolCall: {
                      id: call.id,
                      name: call.name,
                      input: JSON.parse(call.arguments || "{}"),
                    },
                  };
                } catch {
                  yield {
                    type: "tool_call",
                    toolCall: {
                      id: call.id,
                      name: call.name,
                      input: { raw: call.arguments },
                    },
                  };
                }
              }
              toolCallBuffers.clear();
            }
            yield { type: "done", stopReason };
            return;
          }
        } catch {
          // ignore chunk parse errors
        }
      }
    }

    yield { type: "done", stopReason: "end_turn" };
  }

  private buildRequestBody(
    request: CompletionRequest,
    stream: boolean
  ): Record<string, unknown> {
    const messages: Array<{ role: string; content: string }> = [];

    if (request.systemPrompt) {
      messages.push({ role: "system", content: request.systemPrompt });
    }

    for (const m of request.messages) {
      if (m.role === "system") {
        messages.push({ role: "system", content: m.content });
      } else if (m.role === "tool") {
        messages.push({ role: "tool", content: m.content });
      } else {
        messages.push({ role: m.role, content: m.content });
      }
    }

    const body: Record<string, unknown> = {
      model: request.model,
      messages,
      stream,
    };

    const isReasoningModel = request.model.startsWith("o1") || request.model.startsWith("o3");
    if (isReasoningModel) {
      if (request.maxTokens) body["max_completion_tokens"] = request.maxTokens;
    } else {
      body["max_tokens"] = request.maxTokens ?? 8192;
      if (request.temperature !== undefined) body["temperature"] = request.temperature;
    }

    if (request.tools && request.tools.length > 0 && !request.model.startsWith("o1-")) {
      body["tools"] = request.tools.map((t) => ({
        type: "function",
        function: {
          name: t.name,
          description: t.description,
          parameters: t.inputSchema,
        },
      }));
    }

    return body;
  }

  private parseResponse(
    data: Record<string, unknown>,
    model: string
  ): CompletionResponse {
    const choices = (data["choices"] as Array<Record<string, unknown>>) ?? [];
    const firstChoice = choices[0] ?? {};
    const message = (firstChoice["message"] as Record<string, unknown>) ?? {};
    const text = (message["content"] as string) ?? "";
    const finishReason = (firstChoice["finish_reason"] as string) ?? "stop";

    const toolCalls: ToolCall[] = [];
    const rawToolCalls = message["tool_calls"] as Array<Record<string, unknown>> | undefined;
    if (rawToolCalls) {
      for (const raw of rawToolCalls) {
        const fn = (raw["function"] as Record<string, unknown>) ?? {};
        let input: Record<string, unknown> = {};
        try {
          input = JSON.parse((fn["arguments"] as string) ?? "{}");
        } catch {
          input = { raw: fn["arguments"] };
        }
        toolCalls.push({
          id: (raw["id"] as string) ?? "",
          name: (fn["name"] as string) ?? "",
          input,
        });
      }
    }

    const usageRaw = (data["usage"] as Record<string, number>) ?? {};
    const inputTokens = usageRaw["prompt_tokens"] ?? 0;
    const outputTokens = usageRaw["completion_tokens"] ?? 0;

    const usage: TokenUsage = {
      promptTokens: inputTokens,
      completionTokens: outputTokens,
      totalTokens: inputTokens + outputTokens,
      estimatedCostUSD: this.estimateCost(model, inputTokens, outputTokens),
    };

    return {
      id: (data["id"] as string) ?? "",
      model,
      text,
      toolCalls,
      stopReason: finishReason === "tool_calls" ? "tool_use" : "end_turn",
      usage,
    };
  }

  private estimateCost(
    model: string,
    promptTokens: number,
    completionTokens: number
  ): number {
    const entry = this.listModels().find((m) => m.id === model);
    if (!entry) return 0;
    return (
      (promptTokens / 1_000_000) * entry.inputCostPer1MTokens +
      (completionTokens / 1_000_000) * entry.outputCostPer1MTokens
    );
  }
}
