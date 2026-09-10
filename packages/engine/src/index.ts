/**
 * FluxIDE Engine — Main Entry Point
 *
 * Boots the fluxd daemon:
 * - Initializes the HTTP Web Control Center and WebSocket Server
 * - Registers 18+ built-in engineering tools (fs, git, terminal, brain, memory, security, db, api, health, council)
 * - Configures PermissionGate with safe defaults
 * - Initializes BYOK Encrypted Vault, Project Rules Engine, and Project Brain
 * - Configures Multi-Provider Model Gateway (Anthropic, OpenAI, Gemini, Ollama)
 * - Initializes AI Director, Engineering Council, and TaskEngine with FileMutex
 * - Mounts MCP Client Manager
 * - Boots Autonomous AgentLoop and listens for client connections
 */

import { FluxServer } from "./server.js";
import { ToolRuntime, createBuiltinToolRegistrations } from "./tools.js";
import { PermissionGate } from "./permissions.js";
import { CheckpointManager } from "./checkpoints.js";
import { AgentLoop } from "./agent.js";
import { ProjectBrain } from "./brain.js";
import { MemoryManager } from "./memory.js";
import { ContextEngine } from "./context.js";
import { VerificationEngine } from "./verification.js";
import { EncryptedVault } from "./vault.js";
import { RulesEngine } from "./rules.js";
import { AIDirector } from "./director.js";
import { EngineeringCouncil } from "./council.js";
import { TaskEngine } from "./tasks.js";
import { SecurityEngine } from "./security.js";
import { DatabaseCenter } from "./centers/database.js";
import { ApiCenter } from "./centers/api.js";
import { HealthCenter } from "./centers/health.js";
import { McpManager } from "./mcp.js";
import { AccountingManager } from "./accounting.js";

import {
  ModelRouter,
  AnthropicProvider,
  OpenAIProvider,
  GeminiProvider,
  OllamaProvider,
} from "@fluxide/model-gateway";
import { generateId } from "@fluxide/protocol";
import type { InteractionMode, MemoryScope, BrainQuery } from "@fluxide/protocol";

// ── Tool executor imports ────────────────────────────────────
import {
  fsReadFile,
  fsWriteFile,
  fsPatchFile,
  fsListDir,
  fsSearch,
} from "./tools/filesystem.js";
import { terminalExecute } from "./tools/terminal.js";
import { gitStatus, gitDiff, gitCommit } from "./tools/git.js";

// ─── Configuration ──────────────────────────────────────────
const PORT = parseInt(process.env["FLUX_PORT"] ?? "48100", 10);
const HOST = process.env["FLUX_HOST"] ?? "127.0.0.1";

// ─── Boot Sequence ──────────────────────────────────────────
async function boot(): Promise<void> {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║                                           ║
  ║        ⚡ F L U X I D E   v0.1.0 ⚡       ║
  ║                                           ║
  ║   AI Software Engineering Platform        ║
  ║   Core Daemon (fluxd)                     ║
  ║                                           ║
  ╚═══════════════════════════════════════════╝
  `);

  const workspacePath = process.cwd();

  // 1. Initialize permission gate
  const permissionGate = new PermissionGate({
    defaultPolicy: "ask",
    rules: [
      { scope: "fs:read", policy: "always_allow" },
      { scope: "git:read", policy: "always_allow" },
      { scope: "fs:write", policy: "ask" },
      { scope: "shell:execute", policy: "ask" },
      { scope: "git:write", policy: "ask" },
      { scope: "git:destructive", policy: "deny" },
      { scope: "db:destructive", policy: "deny" },
      { scope: "deploy:production", policy: "deny" },
    ],
  });

  if (process.env["FLUX_AUTO_APPROVE"] === "true") {
    permissionGate.setApprovalCallback(async () => true);
  }

  // 2. Initialize living intelligence, security, and rule systems
  const vault = new EncryptedVault(workspacePath);
  const rulesEngine = new RulesEngine(workspacePath);
  const brain = new ProjectBrain({ workspacePath });
  const memory = new MemoryManager({ workspacePath });
  const contextEngine = new ContextEngine({ workspacePath, brain, memory });
  const verificationEngine = new VerificationEngine({ workspacePath });
  const securityEngine = new SecurityEngine(workspacePath);
  const databaseCenter = new DatabaseCenter(workspacePath);
  const apiCenter = new ApiCenter(workspacePath);
  const healthCenter = new HealthCenter(workspacePath, securityEngine, verificationEngine);
  const taskEngine = new TaskEngine();
  const council = new EngineeringCouncil();
  const director = new AIDirector(brain, contextEngine, taskEngine);
  const accounting = new AccountingManager(workspacePath);

  await brain.initialize();
  await memory.initialize();
  await rulesEngine.loadRules();

  // 3. Initialize tool runtime
  const toolRuntime = new ToolRuntime(permissionGate);
  const mcpManager = new McpManager(workspacePath, toolRuntime);

  // Register built-in tool executors
  const registrations = createBuiltinToolRegistrations();
  const executors: Record<string, (input: Record<string, unknown>) => Promise<string>> = {
    fs_read_file: fsReadFile,
    fs_write_file: async (input) => {
      const violations = rulesEngine.validateContent(
        (input["path"] as string) ?? "",
        (input["content"] as string) ?? ""
      );
      const errors = violations.filter((v) => v.severity === "error");
      if (errors.length > 0) {
        throw new Error(`Rules Engine blocked write: ${errors.map((e) => e.message).join("; ")}`);
      }
      return fsWriteFile(input);
    },
    fs_patch_file: fsPatchFile,
    fs_list_dir: fsListDir,
    fs_search: fsSearch,
    terminal_execute: async (input) => {
      const cmd = (input["command"] as string) ?? "";
      const violations = rulesEngine.validateCommand(cmd);
      const errors = violations.filter((v) => v.severity === "error");
      if (errors.length > 0) {
        throw new Error(`Rules Engine blocked command: ${errors.map((e) => e.message).join("; ")}`);
      }
      return terminalExecute(input);
    },
    git_status: gitStatus,
    git_diff: gitDiff,
    git_commit: gitCommit,
    brain_query: async (input) => {
      const res = await brain.query({
        query: (input["query"] as string) ?? "",
        type: (input["type"] as any) ?? "search",
        limit: (input["limit"] as number) ?? 10,
      });
      return JSON.stringify(res, null, 2);
    },
    brain_index: async () => {
      await brain.indexWorkspace();
      return "✅ Project Brain successfully re-indexed.";
    },
    memory_store: async (input) => {
      const entry = await memory.set(
        (input["scope"] as MemoryScope) ?? "project",
        input["key"] as string,
        input["content"] as string,
        { tags: input["tags"] as string[] }
      );
      return `Stored memory [${entry.scope}]: ${entry.key}`;
    },
    memory_retrieve: async (input) => {
      const list = await memory.query({
        search: input["search"] as string,
        scope: input["scope"] as MemoryScope,
        tags: input["tags"] as string[],
      });
      return JSON.stringify(list, null, 2);
    },
    workspace_verify: async (input) => {
      const res = await verificationEngine.verifyWorkspace({
        customCommand: input["customCommand"] as string,
      });
      return JSON.stringify(res, null, 2);
    },
  };

  for (const reg of registrations) {
    const executor = executors[reg.name];
    if (executor) {
      toolRuntime.register(reg, executor);
    }
  }

  // Register extended tools (security, database, api, council, health)
  toolRuntime.register(
    {
      name: "security_scan",
      category: "security",
      description: "Run SAST vulnerability and secret leak analysis across the codebase.",
      parameters: { type: "object", properties: { maxFiles: { type: "number" } } },
      requiredScope: "fs:read",
    },
    async (input) => {
      const report = await securityEngine.scanWorkspace({ maxFiles: input["maxFiles"] as number });
      return JSON.stringify(report, null, 2);
    }
  );

  toolRuntime.register(
    {
      name: "db_query",
      category: "database",
      description: "Execute a SQL query with safety interception against destructive statements.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" }, allowDestructive: { type: "boolean" } },
        required: ["query"],
      },
      requiredScope: "db:execute",
    },
    async (input) => {
      const res = await databaseCenter.executeQuery(input["query"] as string, {
        allowDestructive: input["allowDestructive"] as boolean,
      });
      return JSON.stringify(res, null, 2);
    }
  );

  toolRuntime.register(
    {
      name: "api_test",
      category: "api",
      description: "Test an HTTP / REST endpoint with status, headers, latency, and response validation.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string" },
          method: { type: "string" },
          headers: { type: "object" },
          body: { type: "object" },
        },
        required: ["url"],
      },
      requiredScope: "network:fetch",
    },
    async (input) => {
      const res = await apiCenter.testEndpoint(input["url"] as string, {
        method: input["method"] as string,
        headers: input["headers"] as any,
        body: input["body"],
      });
      return JSON.stringify(res, null, 2);
    }
  );

  toolRuntime.register(
    {
      name: "health_check",
      category: "custom",
      description: "Compute evidence-based project health score across Security, Testing, Architecture, Docs, and Debt.",
      parameters: { type: "object", properties: {} },
      requiredScope: "fs:read",
    },
    async () => {
      const rep = await healthCenter.computeHealth();
      return JSON.stringify(rep, null, 2);
    }
  );

  toolRuntime.register(
    {
      name: "council_deliberate",
      category: "custom",
      description: "Convene Engineering Council (Architect, Security, Performance) to debate architectural options and synthesize a verdict.",
      parameters: {
        type: "object",
        properties: { problem: { type: "string" }, context: { type: "string" } },
        required: ["problem"],
      },
      requiredScope: "fs:read",
    },
    async (input) => {
      const delib = await council.deliberate(input["problem"] as string, input["context"] as string);
      return JSON.stringify(delib, null, 2);
    }
  );

  console.log(`🔧 Registered ${toolRuntime.getToolDefinitions().length} built-in tools`);

  // 4. Initialize Model Router and Providers (Vault-aware)
  const router = new ModelRouter();

  const anthropicKey = vault.getKey("anthropic") ?? process.env["ANTHROPIC_API_KEY"] ?? "";
  const anthropic = new AnthropicProvider();
  anthropic.configure({ apiKey: anthropicKey });
  router.registerProvider(anthropic);

  const openaiKey = vault.getKey("openai") ?? process.env["OPENAI_API_KEY"] ?? "";
  const openai = new OpenAIProvider();
  openai.configure({ apiKey: openaiKey });
  router.registerProvider(openai);

  const geminiKey = vault.getKey("gemini") ?? process.env["GEMINI_API_KEY"] ?? process.env["GOOGLE_API_KEY"] ?? "";
  const gemini = new GeminiProvider();
  gemini.configure({ apiKey: geminiKey });
  router.registerProvider(gemini);

  const ollamaEndpoint = vault.getEndpoint("ollama") ?? process.env["OLLAMA_HOST"] ?? "http://127.0.0.1:11434/v1";
  const ollama = new OllamaProvider();
  ollama.configure({ baseUrl: ollamaEndpoint });
  router.registerProvider(ollama);

  const availableProviders = [];
  if (await anthropic.isAvailable()) availableProviders.push("Anthropic");
  if (await openai.isAvailable()) availableProviders.push("OpenAI");
  if (await gemini.isAvailable()) availableProviders.push("Gemini");
  if (await ollama.isAvailable()) availableProviders.push("Ollama");

  console.log(
    `🧠 Configured Model Gateway: ${availableProviders.length > 0 ? availableProviders.join(", ") : "Ollama/Local ready (API keys optional)"}`
  );

  // 5. Initialize Checkpoint Manager & Server
  const checkpointManager = new CheckpointManager();
  const server = new FluxServer({ port: PORT, host: HOST });

  // 6. Initialize Agent Loop
  const agentLoop = new AgentLoop(
    router,
    toolRuntime,
    permissionGate,
    checkpointManager,
    server,
    contextEngine
  );

  // ── Register message handlers ─────────────────────────────

  server.onMessage("session:start", async (clientId, message) => {
    const payload = (message.payload as Record<string, unknown>) ?? {};
    const mode = (payload["mode"] as InteractionMode) ?? "agent";
    console.log(`🚀 Session started by ${clientId} in [${mode}] mode`);

    server.sendToClient(clientId, {
      id: generateId("msg"),
      type: "agent:status",
      payload: {
        id: generateId("session"),
        agentConfig: {
          id: "default",
          name: "FluxIDE Autonomous Assistant",
          role: "fullstack_engineer" as const,
          description: "FluxIDE core engineering agent",
          instructions: "",
          model: "auto",
          tools: toolRuntime.getToolDefinitions().map((t) => t.name),
          skills: [],
          permissions: [],
          maxTokensPerTurn: 8192,
          maxCostPerTask: 1.0,
          toolTimeoutMs: 30000,
          allowedPaths: ["**"],
        },
        status: "idle" as const,
        actions: [],
        filesRead: [],
        filesModified: [],
        commandsExecuted: [],
        startedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  });

  server.onMessage("user:prompt", async (clientId, message) => {
    const payload = (message.payload as { content?: string; mode?: InteractionMode; sessionId?: string; workspacePath?: string }) ?? {};
    const prompt = payload.content ?? "";
    const sessionId = payload.sessionId ?? "default_session";
    const mode = payload.mode ?? "agent";

    console.log(`💬 [${mode}] Prompt from ${clientId}: ${prompt.slice(0, 80)}`);

    await agentLoop.runTurn({
      clientId,
      sessionId,
      prompt,
      mode,
      workspacePath: payload.workspacePath ?? process.cwd(),
    });
  });

  server.onMessage("director:plan", async (clientId, message) => {
    const payload = (message.payload as { intent?: string }) ?? {};
    const plan = await director.plan(payload.intent ?? "");
    server.sendToClient(clientId, {
      id: generateId("msg"),
      type: "agent:action",
      payload: { action: "director_plan", plan },
      timestamp: new Date().toISOString(),
    });
  });

  server.onMessage("council:deliberate", async (clientId, message) => {
    const payload = (message.payload as { problem?: string }) ?? {};
    const delib = await council.deliberate(payload.problem ?? "Architectural decision");
    server.sendToClient(clientId, {
      id: generateId("msg"),
      type: "agent:action",
      payload: { action: "council_verdict", deliberation: delib },
      timestamp: new Date().toISOString(),
    });
  });

  server.onMessage("checkpoint:rollback", async (clientId, message) => {
    const payload = (message.payload as { checkpointId?: string }) ?? {};
    if (!payload.checkpointId) return;

    try {
      await checkpointManager.rollback(payload.checkpointId);
      server.sendToClient(clientId, {
        id: generateId("msg"),
        type: "checkpoint:restored",
        payload: { checkpointId: payload.checkpointId, success: true },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      server.sendToClient(clientId, {
        id: generateId("msg"),
        type: "error",
        payload: {
          code: "ROLLBACK_ERROR",
          message: err instanceof Error ? err.message : String(err),
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  server.onMessage("tools:list", async (clientId) => {
    server.sendToClient(clientId, {
      id: generateId("msg"),
      type: "tools:registered",
      payload: { tools: toolRuntime.getToolDefinitions() },
      timestamp: new Date().toISOString(),
    });
  });

  server.onMessage("status:get", async (clientId) => {
    server.sendToClient(clientId, {
      id: generateId("msg"),
      type: "agent:status",
      payload: {
        status: "healthy",
        uptime: process.uptime(),
        toolsCount: toolRuntime.getToolDefinitions().length,
        providers: availableProviders,
        workspacePath,
      },
      timestamp: new Date().toISOString(),
    });
  });

  server.onMessage("brain:query", async (clientId, message) => {
    const payload = (message.payload as BrainQuery) ?? { query: "" };
    const result = await brain.query(payload);
    server.sendToClient(clientId, {
      id: generateId("msg"),
      type: "brain:result",
      payload: result,
      timestamp: new Date().toISOString(),
    });
  });

  server.onMessage("memory:query", async (clientId, message) => {
    const payload = (message.payload as { search?: string; scope?: MemoryScope }) ?? {};
    const memories = await memory.query(payload);
    server.sendToClient(clientId, {
      id: generateId("msg"),
      type: "memory:result",
      payload: { memories },
      timestamp: new Date().toISOString(),
    });
  });

  server.onMessage("health:get", async (clientId) => {
    const report = await healthCenter.computeHealth();
    server.sendToClient(clientId, {
      id: generateId("msg"),
      type: "agent:action",
      payload: { action: "health_report", report },
      timestamp: new Date().toISOString(),
    });
  });

  await server.start();

  // ── Graceful shutdown ─────────────────────────────────────
  const shutdown = async (): Promise<void> => {
    console.log("\n🛑 Shutting down fluxd daemon...");
    mcpManager.shutdown();
    await server.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

// ─── Run ────────────────────────────────────────────────────
boot().catch((error) => {
  console.error("💥 Failed to start fluxd:", error);
  process.exit(1);
});

// ─── Exports ────────────────────────────────────────────────
export { FluxServer } from "./server.js";
export { ToolRuntime, createBuiltinToolRegistrations } from "./tools.js";
export { PermissionGate } from "./permissions.js";
export { CheckpointManager } from "./checkpoints.js";
export { AgentLoop } from "./agent.js";
export { ProjectBrain } from "./brain.js";
export { MemoryManager } from "./memory.js";
export { ContextEngine } from "./context.js";
export { VerificationEngine } from "./verification.js";
export { EncryptedVault } from "./vault.js";
export { RulesEngine } from "./rules.js";
export { AIDirector } from "./director.js";
export { EngineeringCouncil } from "./council.js";
export { TaskEngine } from "./tasks.js";
export { SecurityEngine } from "./security.js";
export { DatabaseCenter } from "./centers/database.js";
export { ApiCenter } from "./centers/api.js";
export { HealthCenter } from "./centers/health.js";
export { McpManager } from "./mcp.js";
export { AccountingManager } from "./accounting.js";
export { FileMutex } from "./mutex.js";
export { BUILTIN_PERSONAS, getPersona } from "./agents/personas.js";
