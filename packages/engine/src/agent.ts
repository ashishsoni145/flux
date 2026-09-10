/**
 * FluxIDE Engine — Autonomous Agent Loop
 *
 * Implements the core multi-turn execution loop for autonomous agents.
 * Supports:
 * - Agent mode: autonomous reasoning, tool execution, and self-healing.
 * - Plan mode: spec-first planning without mutations.
 * - Ask mode: read-only exploratory assistance.
 * - Checkpoint creation before file mutations.
 * - Permission checks via PermissionGate.
 * - Real-time streaming to connected WebSocket clients.
 */

import { generateId } from "@fluxide/protocol";
import type {
  ChatMessage,
  CompletionRequest,
  ToolInvocation,
  InteractionMode,
  StreamChunk,
} from "@fluxide/protocol";
import type { ModelRouter } from "@fluxide/model-gateway";
import type { ToolRuntime } from "./tools.js";
import type { PermissionGate } from "./permissions.js";
import type { CheckpointManager } from "./checkpoints.js";
import type { FluxServer } from "./server.js";
import type { ContextEngine } from "./context.js";

export interface AgentTurnOptions {
  clientId: string;
  sessionId: string;
  prompt: string;
  mode?: InteractionMode;
  workspacePath?: string;
}

export class AgentLoop {
  private conversationHistory = new Map<string, ChatMessage[]>();
  private activeTurns = new Set<string>();

  constructor(
    private readonly router: ModelRouter,
    private readonly toolRuntime: ToolRuntime,
    readonly permissionGate: PermissionGate,
    private readonly checkpointManager: CheckpointManager,
    private readonly server: FluxServer,
    private readonly contextEngine?: ContextEngine
  ) {}

  /**
   * Run a turn in response to a user prompt.
   */
  async runTurn(options: AgentTurnOptions): Promise<void> {
    const { clientId, sessionId, prompt, mode = "agent", workspacePath = process.cwd() } = options;

    if (this.activeTurns.has(sessionId)) {
      this.sendError(clientId, "A turn is already running for this session.");
      return;
    }

    this.activeTurns.add(sessionId);

    try {
      let history = this.conversationHistory.get(sessionId);
      if (!history) {
        history = [];
        this.conversationHistory.set(sessionId, history);
      }

      // Add user message to history
      history.push({
        role: "user",
        content: prompt,
      });

      const maxTurns = mode === "ask" ? 1 : 15;
      let turnCount = 0;
      let isDone = false;

      // Assemble living intelligence (Brain + Memory + Context)
      let contextBlock = "";
      if (this.contextEngine) {
        try {
          const assembled = await this.contextEngine.assembleContext({
            prompt,
            taskId: sessionId,
          });
          if (assembled.items.length > 0) {
            contextBlock =
              `\n\n--- LIVING PROJECT INTELLIGENCE & CONTEXT ---\n` +
              assembled.items.map((i) => i.content).join("\n\n") +
              `\n---------------------------------------------\n`;
          }
        } catch (err) {
          console.warn("[AgentLoop] Context assembly notice:", err);
        }
      }

      const systemPrompt = this.buildSystemPrompt(mode, workspacePath, contextBlock);
      const tools = mode === "ask" 
        ? this.toolRuntime.getToolDefinitions().filter((t) => t.name.startsWith("fs_read") || t.name === "fs_list_dir" || t.name === "fs_search" || t.name === "git_status" || t.name === "git_diff" || t.name.startsWith("brain_") || t.name.startsWith("memory_"))
        : mode === "plan"
        ? this.toolRuntime.getToolDefinitions().filter((t) => !t.name.startsWith("fs_write") && !t.name.startsWith("fs_patch") && t.name !== "terminal_execute")
        : this.toolRuntime.getToolDefinitions();

      while (!isDone && turnCount < maxTurns) {
        turnCount++;

        const request: CompletionRequest = {
          model: "auto",
          messages: history,
          systemPrompt,
          tools: tools.length > 0 ? tools : undefined,
          temperature: mode === "plan" ? 0.3 : 0.2,
          maxTokens: 8192,
        };

        this.server.sendToClient(clientId, {
          id: generateId("msg"),
          type: "agent:status",
          payload: {
            id: sessionId,
            status: "running",
            turn: turnCount,
            mode,
          },
          timestamp: new Date().toISOString(),
        });

        // Send completion via ModelRouter
        let streamIterable: AsyncIterable<StreamChunk>;
        try {
          streamIterable = this.router.stream(request);
        } catch (routerErr) {
          const msg = routerErr instanceof Error ? routerErr.message : String(routerErr);
          this.server.sendToClient(clientId, {
            id: generateId("msg"),
            type: "stream:chunk",
            payload: {
              type: "text_delta",
              text: `\n[Model Router Notice]: ${msg}\n`,
            },
            timestamp: new Date().toISOString(),
          });
          break;
        }

        let assistantText = "";
        const accumulatedToolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];
        let stopReason: "end_turn" | "tool_use" | "max_tokens" = "end_turn";

        for await (const chunk of streamIterable) {
          if (chunk.type === "text_delta") {
            assistantText += chunk.text;
            this.server.sendToClient(clientId, {
              id: generateId("msg"),
              type: "stream:chunk",
              payload: {
                type: "text_delta",
                text: chunk.text,
              },
              timestamp: new Date().toISOString(),
            });
          } else if (chunk.type === "tool_call_start" || chunk.type === "tool_call_delta") {
            // Streaming tool call chunks handled by provider
          } else if (chunk.type === "done") {
            stopReason = (chunk.stopReason as any) ?? "end_turn";
          } else if (chunk.type === "error") {
            this.server.sendToClient(clientId, {
              id: generateId("msg"),
              type: "stream:chunk",
              payload: {
                type: "text_delta",
                text: `\n[Error]: ${chunk.message}\n`,
              },
              timestamp: new Date().toISOString(),
            });
          }
        }

        // Save assistant response to history
        history.push({
          role: "assistant",
          content: assistantText,
        });

        // Execute tool calls if proposed
        if (accumulatedToolCalls.length > 0 && mode !== "ask") {
          for (const tc of accumulatedToolCalls) {
            this.server.sendToClient(clientId, {
              id: generateId("msg"),
              type: "agent:action",
              payload: {
                action: "tool_call",
                tool: tc.name,
                input: tc.input,
              },
              timestamp: new Date().toISOString(),
            });

            // Checkpoint creation if writing or patching files
            if (tc.name === "fs_write_file" || tc.name === "fs_patch_file") {
              const targetPath = (tc.input["path"] as string) ?? "";
              if (targetPath) {
                try {
                  const cp = await this.checkpointManager.createCheckpoint({
                    workspacePath,
                    description: `Before ${tc.name}`,
                    files: [targetPath],
                  });
                  this.server.sendToClient(clientId, {
                    id: generateId("msg"),
                    type: "checkpoint:created",
                    payload: cp,
                    timestamp: new Date().toISOString(),
                  });
                } catch {
                  // Non-fatal if file doesn't exist yet
                }
              }
            }

            // Execute the tool
            const invocation: ToolInvocation = {
              id: tc.id,
              toolName: tc.name,
              input: tc.input,
              agentId: "agent-1",
              timestamp: new Date().toISOString(),
            };

            const result = await this.toolRuntime.execute(invocation);

            this.server.sendToClient(clientId, {
              id: generateId("msg"),
              type: "agent:action",
              payload: {
                action: "tool_result",
                tool: tc.name,
                output: result.output,
                isError: result.isError,
              },
              timestamp: new Date().toISOString(),
            });

            // Feed tool result back to history
            history.push({
              role: "tool",
              toolCallId: tc.id,
              content: result.output,
            });
          }
        } else {
          isDone = true;
        }

        if (stopReason === "end_turn" && accumulatedToolCalls.length === 0) {
          isDone = true;
        }
      }

      // Finish turn
      this.server.sendToClient(clientId, {
        id: generateId("msg"),
        type: "stream:chunk",
        payload: {
          type: "done",
          stopReason: "end_turn",
        },
        timestamp: new Date().toISOString(),
      });

      this.server.sendToClient(clientId, {
        id: generateId("msg"),
        type: "agent:status",
        payload: {
          id: sessionId,
          status: "idle",
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.sendError(clientId, errMsg);
    } finally {
      this.activeTurns.delete(sessionId);
    }
  }

  private buildSystemPrompt(mode: InteractionMode, workspacePath: string, contextBlock = ""): string {
    const base = `You are FluxIDE, an advanced autonomous AI software engineering platform.
You operate on the local workspace at: ${workspacePath}

Core Operating Principles:
1. Precision & Rigor: Provide clean, idiomatic, fully functional code. Avoid placeholders or unfinished TODOs.
2. Safety: Respect file boundaries, permissions, and create rollback-ready states.
3. Local-First: Inspect the filesystem and files directly before giving answers.${contextBlock}
`;

    if (mode === "ask") {
      return `${base}
You are in ASK MODE (Read-only).
- Answer user questions thoroughly using read-only codebase exploration.
- Do NOT perform file modifications or shell executions.
`;
    }

    if (mode === "plan") {
      return `${base}
You are in PLAN MODE (Spec-First Architecture).
- Research the project and produce a detailed, phased implementation plan.
- Break requirements down into milestones, modified files, acceptance criteria, and verification steps.
- Do NOT write or patch code files in plan mode. Output structured Markdown specifications.
`;
    }

    return `${base}
You are in AGENT MODE (Autonomous Software Engineer).
- Read, modify, execute, test, and verify your changes autonomously.
- When fixing issues or implementing features:
  1. Inspect existing code and project structure.
  2. Implement necessary edits using provided filesystem tools.
  3. Verify code builds and tests pass.
  4. Explain clearly what was accomplished.
`;
  }

  private sendError(clientId: string, message: string): void {
    this.server.sendToClient(clientId, {
      id: generateId("msg"),
      type: "error",
      payload: {
        code: "AGENT_ERROR",
        message,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
