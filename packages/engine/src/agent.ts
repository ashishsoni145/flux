/** Shared Desktop/CLI agent loop: plan, execute approved tools, and prove mutations. */
import { isAbsolute, relative, resolve, sep } from "node:path";
import { generateId } from "@fluxide/protocol";
import type { AgentAction, ChatMessage, CompletionRequest, InteractionMode, ProofOfCompletion, StreamChunk, ToolInvocation, VerificationCheck } from "@fluxide/protocol";
import type { ModelRouter } from "@fluxide/model-gateway";
import type { ToolRuntime } from "./tools.js";
import type { PermissionGate } from "./permissions.js";
import type { CheckpointManager } from "./checkpoints.js";
import type { FluxServer } from "./server.js";
import type { ContextEngine } from "./context.js";
import type { VerificationEngine } from "./verification.js";
import type { AccountingManager } from "./accounting.js";

export interface AgentTurnOptions {
  clientId: string;
  sessionId: string;
  prompt: string;
  mode?: InteractionMode;
  workspacePath?: string;
}

export interface AgentLoopServices {
  readonly verification?: VerificationEngine;
  readonly accounting?: AccountingManager;
}

interface BufferedToolCall { id: string; name: string; input: string; }
const WRITE_TOOLS = new Set(["fs_write_file", "fs_patch_file"]);

export class AgentLoop {
  private conversationHistory = new Map<string, ChatMessage[]>();
  private activeTurns = new Set<string>();

  constructor(
    private readonly router: ModelRouter,
    private readonly toolRuntime: ToolRuntime,
    readonly permissionGate: PermissionGate,
    private readonly checkpointManager: CheckpointManager,
    private readonly server: FluxServer,
    private readonly contextEngine?: ContextEngine,
    private readonly services: AgentLoopServices = {}
  ) {}

  async runTurn(options: AgentTurnOptions): Promise<void> {
    const { clientId, sessionId, prompt, mode = "agent", workspacePath = process.cwd() } = options;
    if (!prompt.trim()) return this.sendError(clientId, "A task description is required.");
    if (this.activeTurns.has(sessionId)) return this.sendError(clientId, "A turn is already running for this session.");

    const actions: AgentAction[] = [];
    const modifiedFiles = new Set<string>();
    let succeeded = false;
    this.activeTurns.add(sessionId);
    try {
      const history = this.conversationHistory.get(sessionId) ?? [];
      this.conversationHistory.set(sessionId, history);
      history.push({ role: "user", content: prompt });
      const root = resolve(workspacePath);
      const context = await this.getContext(prompt, sessionId, clientId, actions);
      const tools = this.toolsForMode(mode);
      let complete = false;

      for (let turn = 1; turn <= (mode === "ask" ? 1 : 15) && !complete; turn += 1) {
        this.send(clientId, "agent:status", {
          id: sessionId, status: "thinking", actions, filesRead: [], filesModified: [...modifiedFiles],
          commandsExecuted: [], startedAt: new Date().toISOString(), agentConfig: this.agentConfig(tools),
        });
        const request: CompletionRequest = {
          model: "auto", messages: history, systemPrompt: this.buildSystemPrompt(mode, root, context),
          tools: tools.length ? tools : undefined, temperature: mode === "plan" ? 0.3 : 0.2, maxTokens: 8192,
        };
        const calls = new Map<string, BufferedToolCall>();
        let text = "";
        try {
          for await (const chunk of this.router.stream(request)) {
            if (chunk.type === "text_delta") { text += chunk.text; this.stream(clientId, chunk); }
            else if (chunk.type === "thinking_delta") this.stream(clientId, chunk);
            else if (chunk.type === "tool_call_start") { calls.set(chunk.id, { id: chunk.id, name: chunk.name, input: "" }); this.stream(clientId, chunk); }
            else if (chunk.type === "tool_call_delta") { const call = calls.get(chunk.id) ?? (calls.size === 1 ? [...calls.values()][0] : undefined); if (call) call.input += chunk.input; this.stream(clientId, chunk); }
            else if (chunk.type === "tool_call_end") this.stream(clientId, chunk);
            else if (chunk.type === "usage") {
              const usage = this.services.accounting?.recordUsage(sessionId, request.model, chunk.usage.inputTokens, chunk.usage.outputTokens) ?? chunk.usage;
              this.action(clientId, actions, "message", "Recorded model usage.", { model: request.model }, usage);
              this.stream(clientId, { type: "usage", usage });
            } else if (chunk.type === "error") {
              this.stream(clientId, chunk);
              this.action(clientId, actions, "error", "Model provider returned an error.", { message: chunk.message });
            }
          }
        } catch (error) {
          this.action(clientId, actions, "error", "Model request failed.", { message: this.message(error) });
          throw error;
        }

        const toolCalls = this.parseToolCalls(calls, clientId, actions);
        history.push({
          role: "assistant",
          content: toolCalls.length === 0 ? text : [
            ...(text ? [{ type: "text" as const, text }] : []),
            ...toolCalls.map((call) => ({ type: "tool_use" as const, id: call.id, name: call.name, input: call.input })),
          ],
        });
        if (toolCalls.length === 0) { complete = true; continue; }

        for (const call of toolCalls) {
          const input = this.normalizeInput(call.input, root);
          this.action(clientId, actions, "tool_call", `Requested ${call.name}.`, { tool: call.name, input });
          if (WRITE_TOOLS.has(call.name) && typeof input.path === "string") {
            const checkpoint = await this.checkpointManager.createCheckpoint({
              workspacePath: root, taskId: sessionId, agentId: clientId, files: [input.path],
              description: `Before ${call.name}: ${relative(root, input.path)}`,
            });
            this.send(clientId, "checkpoint:created", checkpoint);
            this.action(clientId, actions, "checkpoint", `Created checkpoint for ${relative(root, input.path)}.`, { checkpointId: checkpoint.id });
          }
          const result = await this.toolRuntime.execute({ id: call.id, toolName: call.name, input, agentId: clientId, timestamp: new Date().toISOString() } satisfies ToolInvocation);
          this.action(clientId, actions, "tool_result", result.isError ? `${call.name} failed.` : `${call.name} completed.`, { tool: call.name, output: result.output, isError: result.isError }, undefined, result.durationMs);
          if (!result.isError && WRITE_TOOLS.has(call.name) && typeof input.path === "string") modifiedFiles.add(input.path);
          history.push({ role: "tool", toolCallId: call.id, name: call.name, content: result.output });
        }
      }

      if (mode === "agent" && modifiedFiles.size) {
        const proof = await this.verifyAndProve(clientId, sessionId, root, modifiedFiles, actions);
        if (proof) this.send(clientId, "poc:generated", proof);
      }
      succeeded = true;
      this.stream(clientId, { type: "done", stopReason: "end_turn" });
    } catch (error) {
      this.sendError(clientId, this.message(error));
    } finally {
      this.activeTurns.delete(sessionId);
      this.send(clientId, "agent:status", {
        id: sessionId, status: succeeded ? "completed" : "failed", actions, filesRead: [], filesModified: [...modifiedFiles],
        commandsExecuted: [], startedAt: new Date().toISOString(), completedAt: new Date().toISOString(), agentConfig: this.agentConfig(this.toolsForMode(mode)),
      });
    }
  }

  private async getContext(prompt: string, taskId: string, clientId: string, actions: AgentAction[]): Promise<string> {
    if (!this.contextEngine) return "";
    try {
      const assembled = await this.contextEngine.assembleContext({ prompt, taskId });
      if (!assembled.items.length) return "";
      this.action(clientId, actions, "think", "Retrieved ranked project context.", {
        items: assembled.items.length, estimatedTokens: assembled.totalTokens,
      });
      return `\n--- LIVING PROJECT INTELLIGENCE & CONTEXT ---\n${assembled.items.map((item) => item.content).join("\n\n")}\n---------------------------------------------\n`;
    } catch (error) {
      this.action(clientId, actions, "error", "Project context retrieval was unavailable.", { message: this.message(error) });
      return "";
    }
  }

  private toolsForMode(mode: InteractionMode) {
    const tools = this.toolRuntime.getToolDefinitions();
    if (mode === "ask") {
      return tools.filter((tool) => tool.name.startsWith("fs_read") || tool.name === "fs_list_dir" || tool.name === "fs_search" || tool.name === "git_status" || tool.name === "git_diff" || tool.name.startsWith("brain_") || tool.name.startsWith("memory_"));
    }
    if (mode === "plan") return tools.filter((tool) => !WRITE_TOOLS.has(tool.name) && tool.name !== "terminal_execute");
    return tools;
  }

  private parseToolCalls(calls: ReadonlyMap<string, BufferedToolCall>, clientId: string, actions: AgentAction[]): Array<{ id: string; name: string; input: Record<string, unknown> }> {
    const parsed: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];
    for (const call of calls.values()) {
      if (!call.name) {
        this.action(clientId, actions, "error", "Ignored a malformed tool call without a name.");
        continue;
      }
      try {
        const input: unknown = JSON.parse(call.input || "{}");
        if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("tool arguments must be a JSON object");
        parsed.push({ id: call.id, name: call.name, input: input as Record<string, unknown> });
      } catch (error) {
        this.action(clientId, actions, "error", `Ignored malformed arguments for ${call.name}.`, { message: this.message(error) });
      }
    }
    return parsed;
  }

  private normalizeInput(input: Record<string, unknown>, root: string): Record<string, unknown> {
    const normalized = { ...input };
    for (const key of ["path", "cwd"] as const) {
      const value = normalized[key];
      if (typeof value !== "string" || !value) continue;
      const candidate = resolve(root, value);
      const fromRoot = relative(root, candidate);
      if (fromRoot === "" || fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) {
        throw new Error(`${key} must remain inside the active workspace.`);
      }
      normalized[key] = candidate;
    }
    return normalized;
  }

  private async verifyAndProve(clientId: string, taskId: string, root: string, modifiedFiles: ReadonlySet<string>, actions: AgentAction[]): Promise<ProofOfCompletion | undefined> {
    if (!this.services.verification) return undefined;
    const invocation: ToolInvocation = {
      id: generateId("verify"), toolName: "workspace_verify", input: { strategies: ["typecheck", "test"] }, agentId: clientId, timestamp: new Date().toISOString(),
    };
    const result = await this.toolRuntime.execute(invocation);
    this.action(clientId, actions, "tool_result", result.isError ? "Automated verification could not run." : "Automated verification completed.", { tool: "workspace_verify", output: result.output, isError: result.isError }, undefined, result.durationMs);

    let checks: VerificationCheck[] = [];
    try {
      const parsed: unknown = JSON.parse(result.output);
      if (parsed && typeof parsed === "object" && Array.isArray((parsed as { checks?: unknown }).checks)) {
        checks = (parsed as { checks: VerificationCheck[] }).checks;
      }
    } catch {
      checks = [{ name: "automated_verify", category: "unit_test", status: "failed", evidence: result.output, durationMs: result.durationMs }];
    }
    if (result.isError && checks.length === 0) {
      checks = [{ name: "automated_verify", category: "unit_test", status: "failed", evidence: result.output, durationMs: result.durationMs }];
    }
    const proof = this.services.verification.createProof({
      taskId,
      requirementsMet: ["Approved file changes were applied."],
      filesModified: [...modifiedFiles].map((path) => relative(root, path)),
      checks,
    });
    this.action(clientId, actions, "message", proof.verified ? "Generated verified Proof of Work." : "Generated Proof of Work with unresolved verification risks.", { proofId: proof.id, verified: proof.verified });
    return proof;
  }

  private buildSystemPrompt(mode: InteractionMode, workspacePath: string, context: string): string {
    const base = `You are FluxIDE, an autonomous software-engineering agent operating in ${workspacePath}.
Use workspace-relative paths only. Inspect before changing, make the smallest safe change, and explain verified evidence.${context}`;
    if (mode === "ask") return `${base}\nASK MODE: use only read-only tools and do not modify files or execute commands.`;
    if (mode === "plan") return `${base}\nPLAN MODE: produce a structured plan and do not modify files or execute commands.`;
    return `${base}\nAGENT MODE: plan, use approved tools, run verification after changes, and report remaining risks honestly.`;
  }

  private agentConfig(tools: ReturnType<ToolRuntime["getToolDefinitions"]>) {
    return {
      id: "fluxide-agent", name: "FluxIDE Autonomous Assistant", role: "fullstack_engineer" as const,
      description: "Shared Desktop and CLI engineering agent", instructions: "Controlled, verification-first workflow.", model: "auto",
      tools: tools.map((tool) => tool.name), skills: [], permissions: [], maxTokensPerTurn: 8192, maxCostPerTask: 1, toolTimeoutMs: 30000, allowedPaths: ["**"],
    };
  }

  private action(clientId: string, actions: AgentAction[], type: AgentAction["type"], summary: string, details?: Record<string, unknown>, tokenUsage?: AgentAction["tokenUsage"], durationMs?: number): void {
    const entry: AgentAction = { id: generateId("action"), timestamp: new Date().toISOString(), type, summary, ...(details ? { details } : {}), ...(tokenUsage ? { tokenUsage } : {}), ...(durationMs === undefined ? {} : { durationMs }) };
    actions.push(entry);
    this.services.accounting?.logAudit(entry, { agentRole: "fullstack_engineer" });
    this.send(clientId, "agent:action", entry);
  }

  private stream(clientId: string, payload: StreamChunk): void { this.send(clientId, "stream:chunk", payload); }
  private send(clientId: string, type: string, payload: unknown): void { this.server.sendToClient(clientId, { id: generateId("msg"), type, payload, timestamp: new Date().toISOString() }); }
  private sendError(clientId: string, message: string): void { this.send(clientId, "error", { code: "AGENT_ERROR", message }); }
  private message(error: unknown): string { return error instanceof Error ? error.message : String(error); }
}
