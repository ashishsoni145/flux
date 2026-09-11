/**
 * FluxIDE Model Gateway — Ollama / Local Provider Adapter
 *
 * Connects to local Ollama instance via OpenAI-compatible endpoints.
 * Supports local models like DeepSeek-R1, Qwen2.5-Coder, Llama 3.3,
 * tool execution, and local-first zero-cost development.
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

export class OllamaProvider implements ModelProviderAdapter {
  readonly providerId = "ollama";
  readonly displayName = "Ollama (Local)";

  private baseUrl = "http://127.0.0.1:11434/v1";

  configure(config: ProviderConfig): void {
    if (config.baseUrl) this.baseUrl = config.baseUrl;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const rootUrl = this.baseUrl.replace(/\/v1\/?$/, "");
      const res = await fetch(`${rootUrl}/api/version`, { signal: AbortSignal.timeout(1500) });
      return res.ok;
    } catch {
      return false;
    }
  }

  listModels(): ModelEntry[] {
    return [
      {
        id: "deepseek-r1",
        provider: "ollama",
        name: "deepseek-r1",
        displayName: "DeepSeek R1 (Local)",
        capabilities: ["chat", "coding", "reasoning", "tool_use"],
        maxContextTokens: 64_000,
        maxOutputTokens: 8_192,
        inputCostPer1MTokens: 0.0,
        outputCostPer1MTokens: 0.0,
        supportsStreaming: true,
        supportsToolUse: true,
        supportsVision: false,
        isLocal: true,
      },
      {
        id: "qwen2.5-coder",
        provider: "ollama",
        name: "qwen2.5-coder",
        displayName: "Qwen 2.5 Coder (Local)",
        capabilities: ["chat", "coding", "tool_use", "fast_completion"],
        maxContextTokens: 32_000,
        maxOutputTokens: 8_192,
        inputCostPer1MTokens: 0.0,
        outputCostPer1MTokens: 0.0,
        supportsStreaming: true,
        supportsToolUse: true,
        supportsVision: false,
        isLocal: true,
      },
      {
        id: "llama3.3",
        provider: "ollama",
        name: "llama3.3",
        displayName: "Llama 3.3 (Local)",
        capabilities: ["chat", "coding", "tool_use"],
        maxContextTokens: 128_000,
        maxOutputTokens: 8_192,
        inputCostPer1MTokens: 0.0,
        outputCostPer1MTokens: 0.0,
        supportsStreaming: true,
        supportsToolUse: true,
        supportsVision: false,
        isLocal: true,
      },
    ];
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const body = this.buildRequestBody(request, false);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error ${response.status}: ${error}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    return this.parseResponse(data, request.model);
  }

  async *stream(request: CompletionRequest): AsyncIterable<StreamChunk> {
    const body = this.buildRequestBody(request, true);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      yield { type: "error", message: `Ollama API error ${response.status}: ${error}` };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      yield { type: "error", message: "No response body from Ollama" };
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
          for (const [, call] of toolCallBuffers) {
              yield {
                type: "tool_call_start",
                id: call.id,
                name: call.name,
              };
              yield {
                type: "tool_call_delta",
                id: call.id,
                input: call.arguments || "{}",
              };
              yield {
                type: "tool_call_end",
                id: call.id,
              };
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
                yield { type: "tool_call_start", id: call.id, name: call.name };
                yield { type: "tool_call_delta", id: call.id, input: call.arguments || "{}" };
                yield { type: "tool_call_end", id: call.id };
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
    const messages: Array<Record<string, unknown>> = [];

    if (request.systemPrompt) {
      messages.push({ role: "system", content: request.systemPrompt });
    }

    for (const message of request.messages) {
      if (message.role === "tool") {
        messages.push({
          role: "tool",
          tool_call_id: message.toolCallId,
          content: this.textContent(message.content),
        });
        continue;
      }

      if (message.role === "assistant" && Array.isArray(message.content)) {
        const text = message.content
          .filter((block) => block.type === "text")
          .map((block) => block.text)
          .join("");
        const toolCalls = message.content
          .filter((block) => block.type === "tool_use")
          .map((block) => ({
            id: block.id,
            type: "function",
            function: { name: block.name, arguments: JSON.stringify(block.input) },
          }));
        messages.push({
          role: "assistant",
          content: text || null,
          ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
        });
        continue;
      }

      messages.push({ role: message.role, content: this.textContent(message.content) });
    }

    const body: Record<string, unknown> = {
      model: request.model,
      messages,
      stream,
      options: {
        num_predict: request.maxTokens ?? 4096,
        temperature: request.temperature ?? 0.7,
      },
    };

    if (request.tools && request.tools.length > 0) {
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

  private textContent(content: CompletionRequest["messages"][number]["content"]): string {
    if (typeof content === "string") return content;
    return content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
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
      inputTokens,
      outputTokens,
      estimatedCostUsd: 0.0, // Local models are 100% free
    };

    return {
      id: (data["id"] as string) ?? `ollama_${Date.now()}`,
      model,
      content: text,
      toolCalls,
      stopReason: finishReason === "tool_calls" ? "tool_use" : "end_turn",
      usage,
    };
  }
}
