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
import type { InteractionMode, MemoryScope, BrainQuery, PermissionScope, PermissionResponse } from "@fluxide/protocol";

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
import {
  browserNavigate,
  browserInspectDom,
  browserScreenshot,
  browserClick,
  browserType,
} from "./tools/browser.js";

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
    permissionGate.setApprovalCallback(async () => "allow_session");
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
    browser_navigate: async (input) => browserNavigate(input as any),
    browser_inspect_dom: async (input) => browserInspectDom(input as any),
    browser_screenshot: async (input) => browserScreenshot(input as any),
    browser_click: async (input) => browserClick(input as any),
    browser_type: async (input) => browserType(input as any),
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
      inputSchema: { type: "object", properties: { maxFiles: { type: "number" } } },
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
      inputSchema: {
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
      inputSchema: {
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
      inputSchema: { type: "object", properties: {} },
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
      inputSchema: {
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
  anthropic.configure({ apiKey: anthropicKey, provider: "anthropic", isEnabled: true });
  router.registerProvider(anthropic);

  const openaiKey = vault.getKey("openai") ?? process.env["OPENAI_API_KEY"] ?? "";
  const openai = new OpenAIProvider();
  openai.configure({ apiKey: openaiKey, provider: "openai", isEnabled: true });
  router.registerProvider(openai);

  const geminiKey = vault.getKey("gemini") ?? process.env["GEMINI_API_KEY"] ?? process.env["GOOGLE_API_KEY"] ?? "";
  const gemini = new GeminiProvider();
  gemini.configure({ apiKey: geminiKey, provider: "google", isEnabled: true });
  router.registerProvider(gemini);

  const ollamaEndpoint = vault.getEndpoint("ollama") ?? process.env["OLLAMA_HOST"] ?? "http://127.0.0.1:11434/v1";
  const ollama = new OllamaProvider();
  ollama.configure({ baseUrl: ollamaEndpoint, provider: "ollama", isEnabled: true });
  router.registerProvider(ollama);

  const availableProviders: string[] = [];
  const anthropicAvailable = await anthropic.isAvailable();
  const openaiAvailable = await openai.isAvailable();
  const geminiAvailable = await gemini.isAvailable();
  const ollamaAvailable = await ollama.isAvailable();
  router.setProviderAvailability("anthropic", anthropicAvailable);
  router.setProviderAvailability("openai", openaiAvailable);
  router.setProviderAvailability("google", geminiAvailable);
  router.setProviderAvailability("ollama", ollamaAvailable);

  if (anthropicAvailable) availableProviders.push("Anthropic");
  if (openaiAvailable) availableProviders.push("OpenAI");
  if (geminiAvailable) availableProviders.push("Gemini");
  if (ollamaAvailable) availableProviders.push("Ollama");

  console.log(
    `🧠 Configured Model Gateway: ${availableProviders.length > 0 ? availableProviders.join(", ") : "Ollama/Local ready (API keys optional)"}`
  );

  // 5. Initialize Checkpoint Manager & Server
  const checkpointManager = new CheckpointManager();
  const server = new FluxServer({ port: PORT, host: HOST });
  const clientSessions = new Map<string, { id: string; mode: InteractionMode }>();
  const pendingApprovals = new Map<
    string,
    { resolve: (decision: "allow_once" | "allow_session" | "allow_project" | "allow_always" | "deny") => void; timeout: ReturnType<typeof setTimeout> }
  >();

  if (process.env["FLUX_AUTO_APPROVE"] !== "true") {
    permissionGate.setApprovalCallback(async (scope, clientId, toolName, details) => {
      const requestId = generateId("permission");
      server.sendToClient(clientId, {
        id: generateId("msg"),
        type: "permission:request",
        payload: {
          id: requestId,
          scope: scope as PermissionScope,
          agentId: clientId,
          taskId: clientSessions.get(clientId)?.id ?? "unknown",
          description: `Allow FluxIDE to run ${toolName}?`,
          details,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
      return new Promise((resolveApproval) => {
        const timeout = setTimeout(() => {
          pendingApprovals.delete(requestId);
          resolveApproval("deny");
        }, 120_000);
        pendingApprovals.set(requestId, { resolve: resolveApproval, timeout });
      });
    });
  }

  // 6. Initialize Agent Loop
  const agentLoop = new AgentLoop(
    router,
    toolRuntime,
    permissionGate,
    checkpointManager,
    server,
    contextEngine,
    {
      verification: verificationEngine,
      accounting,
    }
  );

  // ── Register message handlers ─────────────────────────────

  server.onMessage("session:start", async (clientId, message) => {
    const payload = (message.payload as unknown as Record<string, unknown>) ?? {};
    const mode = (payload["mode"] as InteractionMode) ?? "agent";
    console.log(`🚀 Session started by ${clientId} in [${mode}] mode`);

    const sessionId = generateId("session");
    clientSessions.set(clientId, { id: sessionId, mode });
    server.sendToClient(clientId, {
      id: generateId("msg"),
      type: "agent:status",
      payload: {
        id: sessionId,
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
    const clientSession = clientSessions.get(clientId);
    const sessionId = payload.sessionId ?? clientSession?.id ?? generateId("session");
    const mode = payload.mode ?? clientSession?.mode ?? "agent";
    clientSessions.set(clientId, { id: sessionId, mode });

    console.log(`💬 [${mode}] Prompt from ${clientId}: ${prompt.slice(0, 80)}`);

    await agentLoop.runTurn({
      clientId,
      sessionId,
      prompt,
      mode,
      // The daemon owns the active workspace. Clients cannot redirect an
      // autonomous agent to an arbitrary filesystem path.
      workspacePath,
    });
  });

  server.onMessage("permission:respond", async (_clientId, message) => {
    const payload = message.payload as PermissionResponse;
    const pending = pendingApprovals.get(payload.requestId);
    if (!pending) return;
    clearTimeout(pending.timeout);
    pendingApprovals.delete(payload.requestId);
    pending.resolve(payload.decision);
  });

  server.onMessage("vault:configure", async (clientId, message) => {
    const payload = message.payload as {
      passphrase?: string;
      keys?: { anthropic?: string; openai?: string; gemini?: string };
      ollamaEndpoint?: string;
    };
    const passphrase = payload.passphrase?.trim();
    if (!passphrase) {
      server.sendToClient(clientId, {
        id: generateId("msg"), type: "error",
        payload: { code: "VAULT_PASSPHRASE_REQUIRED", message: "A local vault passphrase is required to save BYOK credentials." },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const unlocked = vault.exists() ? await vault.unlock(passphrase) : (await vault.initialize(passphrase), true);
    if (!unlocked) {
      server.sendToClient(clientId, {
        id: generateId("msg"), type: "error",
        payload: { code: "VAULT_UNLOCK_FAILED", message: "Could not unlock the local BYOK vault." },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (payload.keys?.anthropic?.trim()) {
      await vault.setKey("anthropic", payload.keys.anthropic.trim(), passphrase);
      anthropic.configure({ apiKey: vault.getKey("anthropic"), provider: "anthropic", isEnabled: true });
      router.setProviderAvailability("anthropic", await anthropic.isAvailable());
    }
    if (payload.keys?.openai?.trim()) {
      await vault.setKey("openai", payload.keys.openai.trim(), passphrase);
      openai.configure({ apiKey: vault.getKey("openai"), provider: "openai", isEnabled: true });
      router.setProviderAvailability("openai", await openai.isAvailable());
    }
    if (payload.keys?.gemini?.trim()) {
      await vault.setKey("gemini", payload.keys.gemini.trim(), passphrase);
      gemini.configure({ apiKey: vault.getKey("gemini"), provider: "google", isEnabled: true });
      router.setProviderAvailability("google", await gemini.isAvailable());
    }
    if (payload.ollamaEndpoint?.trim()) {
      await vault.setEndpoint("ollama", payload.ollamaEndpoint.trim(), passphrase);
      ollama.configure({ baseUrl: vault.getEndpoint("ollama"), provider: "ollama", isEnabled: true });
      router.setProviderAvailability("ollama", await ollama.isAvailable());
    }

    server.sendToClient(clientId, {
      id: generateId("msg"), type: "agent:action",
      payload: {
        id: generateId("action"), timestamp: new Date().toISOString(), type: "message",
        summary: "BYOK settings were encrypted in the local vault.",
      },
      timestamp: new Date().toISOString(),
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
      await checkpointManager.rollback(payload.checkpointId, workspacePath);
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
    const payload = (message.payload as unknown as BrainQuery) ?? { type: "search", query: "" };
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
export { SupabaseRepository } from "./supabase.js";

