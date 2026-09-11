import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { AgentLoop } from "../src/agent.js";
import { CheckpointManager } from "../src/checkpoints.js";
import { PermissionGate } from "../src/permissions.js";
import { FluxServer } from "../src/server.js";
import { ToolRuntime } from "../src/tools.js";
import { ModelRouter } from "@fluxide/model-gateway";
import type { CompletionRequest, CompletionResponse, ModelEntry, ProviderConfig, StreamChunk, ToolRegistration, UFPMessage } from "@fluxide/protocol";
import type { ModelProviderAdapter } from "@fluxide/model-gateway";

class RecordingServer extends FluxServer {
  readonly messages: UFPMessage[] = [];

  constructor() {
    super({ port: 0, host: "127.0.0.1" });
  }

  override sendToClient(_clientId: string, message: UFPMessage): void {
    this.messages.push(message);
  }
}

class ToolCallingProvider implements ModelProviderAdapter {
  readonly providerId = "custom";
  readonly displayName = "Test Provider";
  readonly requests: CompletionRequest[] = [];

  configure(_config: ProviderConfig): void {}
  async isAvailable(): Promise<boolean> { return true; }
  listModels(): ModelEntry[] {
    return [{
      id: "test-model", provider: "custom", name: "test-model", displayName: "Test model",
      capabilities: ["chat", "tool_use"], maxContextTokens: 1024, maxOutputTokens: 1024,
      inputCostPer1MTokens: 0, outputCostPer1MTokens: 0, supportsStreaming: true,
      supportsToolUse: true, supportsVision: false, isLocal: true,
    }];
  }
  async complete(_request: CompletionRequest): Promise<CompletionResponse> { throw new Error("not used"); }
  async *stream(request: CompletionRequest): AsyncIterable<StreamChunk> {
    this.requests.push(request);
    if (this.requests.length === 1) {
      yield { type: "tool_call_start", id: "write-1", name: "fs_write_file" };
      yield { type: "tool_call_delta", id: "write-1", input: '{"path":"src/example.ts","content":"export const ok = true;"}' };
      yield { type: "tool_call_end", id: "write-1" };
      yield { type: "done", stopReason: "tool_use" };
      return;
    }
    yield { type: "text_delta", text: "Change applied and verified." };
    yield { type: "done", stopReason: "end_turn" };
  }
}

describe("AgentLoop", () => {
  const workspaces: string[] = [];

  afterEach(async () => {
    await Promise.all(workspaces.splice(0).map((workspace) => rm(workspace, { recursive: true, force: true })));
  });

  it("executes streamed tool calls, snapshots mutations, and returns the tool result to the model", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "flux-agent-loop-"));
    workspaces.push(workspace);
    const provider = new ToolCallingProvider();
    const router = new ModelRouter({ defaultModel: "test-model", rules: [], costSensitivity: "medium" });
    router.registerProvider(provider);
    router.setProviderAvailability("custom", true);

    const gate = new PermissionGate({ defaultPolicy: "deny", rules: [{ scope: "fs:write", policy: "always_allow" }] });
    const runtime = new ToolRuntime(gate);
    const writeTool: ToolRegistration = {
      name: "fs_write_file", category: "filesystem", description: "write", inputSchema: { type: "object" }, requiredScope: "fs:write",
    };
    const writes: Record<string, unknown>[] = [];
    runtime.register(writeTool, async (input) => {
      writes.push(input);
      return "file written";
    });

    const server = new RecordingServer();
    const loop = new AgentLoop(router, runtime, gate, new CheckpointManager(), server);
    await loop.runTurn({ clientId: "client-1", sessionId: "session-1", prompt: "Create the example", workspacePath: workspace });

    expect(writes).toHaveLength(1);
    expect(String(writes[0]?.path)).toContain("src");
    expect(provider.requests).toHaveLength(2);
    expect(provider.requests[1]?.messages.some((message) => message.role === "tool" && message.content === "file written")).toBe(true);
    expect(server.messages.some((message) => message.type === "checkpoint:created")).toBe(true);
    expect(server.messages.some((message) => message.type === "stream:chunk" && (message.payload as StreamChunk).type === "done")).toBe(true);
  });
});
