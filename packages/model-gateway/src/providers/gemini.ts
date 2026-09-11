/**
 * FluxIDE Model Gateway — Google Gemini Provider Adapter
 *
 * Connects to Google Generative Language API.
 * Supports Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.0 Flash models,
 * function calling / tool execution, and streaming responses via SSE.
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

export class GeminiProvider implements ModelProviderAdapter {
  readonly providerId = "google";
  readonly displayName = "Google Gemini";

  private apiKey = "";
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta";

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
        id: "gemini-2.5-pro",
        provider: "google",
        name: "gemini-2.5-pro",
        displayName: "Gemini 2.5 Pro",
        capabilities: ["chat", "coding", "reasoning", "tool_use", "vision", "long_context"],
        maxContextTokens: 1_000_000,
        maxOutputTokens: 65_536,
        inputCostPer1MTokens: 1.25,
        outputCostPer1MTokens: 5.0,
        supportsStreaming: true,
        supportsToolUse: true,
        supportsVision: true,
        isLocal: false,
      },
      {
        id: "gemini-2.5-flash",
        provider: "google",
        name: "gemini-2.5-flash",
        displayName: "Gemini 2.5 Flash",
        capabilities: ["chat", "coding", "reasoning", "tool_use", "fast_completion", "vision"],
        maxContextTokens: 1_000_000,
        maxOutputTokens: 65_536,
        inputCostPer1MTokens: 0.15,
        outputCostPer1MTokens: 0.6,
        supportsStreaming: true,
        supportsToolUse: true,
        supportsVision: true,
        isLocal: false,
      },
      {
        id: "gemini-2.0-flash",
        provider: "google",
        name: "gemini-2.0-flash",
        displayName: "Gemini 2.0 Flash",
        capabilities: ["chat", "coding", "tool_use", "fast_completion", "vision"],
        maxContextTokens: 1_000_000,
        maxOutputTokens: 8_192,
        inputCostPer1MTokens: 0.1,
        outputCostPer1MTokens: 0.4,
        supportsStreaming: true,
        supportsToolUse: true,
        supportsVision: true,
        isLocal: false,
      },
    ];
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const url = `${this.baseUrl}/models/${request.model}:generateContent?key=${this.apiKey}`;
    const body = this.buildRequestBody(request);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${error}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    return this.parseResponse(data, request.model);
  }

  async *stream(request: CompletionRequest): AsyncIterable<StreamChunk> {
    const url = `${this.baseUrl}/models/${request.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;
    const body = this.buildRequestBody(request);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      yield { type: "error", message: `Gemini API error ${response.status}: ${error}` };
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
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const dataStr = trimmed.slice(6).trim();
        try {
          const chunk = JSON.parse(dataStr) as Record<string, unknown>;
          const candidates = (chunk["candidates"] as Array<Record<string, unknown>>) ?? [];
          const candidate = candidates[0];
          if (!candidate) continue;

          const content = candidate["content"] as Record<string, unknown> | undefined;
          const parts = (content?.["parts"] as Array<Record<string, unknown>>) ?? [];

          for (const part of parts) {
            if (part["text"]) {
              yield { type: "text_delta", text: part["text"] as string };
            }
            if (part["functionCall"]) {
              const fc = part["functionCall"] as Record<string, unknown>;
              const id = `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
              yield {
                type: "tool_call_start",
                id,
                name: (fc["name"] as string) ?? "",
              };
              yield {
                type: "tool_call_delta",
                id,
                input: JSON.stringify((fc["args"] as Record<string, unknown>) ?? {}),
              };
              yield { type: "tool_call_end", id };
            }
          }

          if (candidate["finishReason"]) {
            const finish = candidate["finishReason"] as string;
            const stopReason = finish === "STOP" ? "end_turn" : "tool_use";
            yield { type: "done", stopReason };
            return;
          }
        } catch {
          // ignore parse errors on partial chunks
        }
      }
    }

    yield { type: "done", stopReason: "end_turn" };
  }

  private buildRequestBody(request: CompletionRequest): Record<string, unknown> {
    const contents: Array<Record<string, unknown>> = [];

    for (const message of request.messages) {
      if (message.role === "system") continue; // system instruction passed separately

      if (message.role === "tool") {
        contents.push({
          role: "user",
          parts: [
            {
              functionResponse: {
                name: message.name ?? message.toolCallId ?? "tool",
                response: { result: this.textContent(message.content) },
              },
            },
          ],
        });
      } else {
        const role = message.role === "assistant" ? "model" : "user";
        const parts = Array.isArray(message.content)
          ? message.content.map((block) => {
              if (block.type === "tool_use") {
                return { functionCall: { name: block.name, args: block.input } };
              }
              return { text: block.type === "text" ? block.text : "" };
            })
          : [{ text: message.content }];
        contents.push({
          role,
          parts,
        });
      }
    }

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: request.maxTokens ?? 8192,
        temperature: request.temperature ?? 0.7,
      },
    };

    if (request.systemPrompt) {
      body["systemInstruction"] = {
        parts: [{ text: request.systemPrompt }],
      };
    }

    if (request.tools && request.tools.length > 0) {
      body["tools"] = [
        {
          functionDeclarations: request.tools.map((t) => ({
            name: t.name,
            description: t.description,
            parameters: t.inputSchema,
          })),
        },
      ];
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
    const candidates = (data["candidates"] as Array<Record<string, unknown>>) ?? [];
    const firstCandidate = candidates[0] ?? {};
    const content = (firstCandidate["content"] as Record<string, unknown>) ?? {};
    const parts = (content["parts"] as Array<Record<string, unknown>>) ?? [];

    let text = "";
    const toolCalls: ToolCall[] = [];

    for (const part of parts) {
      if (part["text"]) {
        text += part["text"] as string;
      }
      if (part["functionCall"]) {
        const fc = part["functionCall"] as Record<string, unknown>;
        toolCalls.push({
          id: `call_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: (fc["name"] as string) ?? "",
          input: (fc["args"] as Record<string, unknown>) ?? {},
        });
      }
    }

    const usageMetadata = (data["usageMetadata"] as Record<string, number>) ?? {};
    const promptTokens = usageMetadata["promptTokenCount"] ?? 0;
    const completionTokens = usageMetadata["candidatesTokenCount"] ?? 0;

    const usage: TokenUsage = {
      inputTokens: promptTokens,
      outputTokens: completionTokens,
      estimatedCostUsd: this.estimateCost(model, promptTokens, completionTokens),
    };

    const finishReason = (firstCandidate["finishReason"] as string) ?? "STOP";

    return {
      id: `gemini_${Date.now()}`,
      model,
      content: text,
      toolCalls,
      stopReason: toolCalls.length > 0 || finishReason === "TOOL_CALL" ? "tool_use" : "end_turn",
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
