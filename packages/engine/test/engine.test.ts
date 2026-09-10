import { describe, it, expect, beforeEach } from "vitest";
import { MemoryManager } from "../src/memory.js";
import { ProjectBrain } from "../src/brain.js";
import { ContextEngine } from "../src/context.js";
import { TaskEngine } from "../src/tasks.js";
import { FileMutex } from "../src/mutex.js";
import { PermissionGate } from "../src/permissions.js";
import { EncryptedVault } from "../src/vault.js";
import { RulesEngine } from "../src/rules.js";
import { AIDirector } from "../src/director.js";
import { EngineeringCouncil } from "../src/council.js";
import { SecurityEngine } from "../src/security.js";
import { DatabaseCenter } from "../src/centers/database.js";
import { HealthCenter } from "../src/centers/health.js";
import { BUILTIN_PERSONAS, getPersona } from "../src/agents/personas.js";

describe("FluxIDE Engine Subsystems", () => {
  const testWorkspace = process.cwd();

  describe("1. Specialized Engineering Personas", () => {
    it("should define all 16 canonical engineering personas", () => {
      const roles = [
        "director",
        "product_manager",
        "researcher",
        "architect",
        "frontend_engineer",
        "backend_engineer",
        "fullstack_engineer",
        "mobile_engineer",
        "database_engineer",
        "ui_ux_designer",
        "qa_engineer",
        "security_engineer",
        "performance_engineer",
        "devops_engineer",
        "documentation_engineer",
        "code_reviewer",
        "release_manager",
      ] as const;

      for (const role of roles) {
        const persona = getPersona(role);
        expect(persona).toBeDefined();
        expect(persona.role).toBe(role);
        expect(persona.instructions.length).toBeGreaterThan(20);
        expect(persona.tools.length).toBeGreaterThan(0);
      }
    });
  });

  describe("2. MemoryManager (3-Tier Hierarchy)", () => {
    let memory: MemoryManager;

    beforeEach(async () => {
      memory = new MemoryManager({ workspacePath: testWorkspace });
      await memory.initialize();
    });

    it("should set, retrieve, and filter memories by scope and tags", async () => {
      await memory.set("project", "architecture_style", "Event-driven microservices", {
        tags: ["architecture", "backend"],
      });

      const results = await memory.query({ scope: "project", search: "microservices" });
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].content).toContain("Event-driven");

      const tagResults = await memory.query({ tags: ["architecture"] });
      expect(tagResults.length).toBeGreaterThan(0);
    });
  });

  describe("3. ProjectBrain & Knowledge Graph", () => {
    it("should query the project brain and return relevant symbols", async () => {
      const brain = new ProjectBrain({ workspacePath: testWorkspace });
      await brain.initialize();

      const queryRes = await brain.query({ query: "engine", type: "search", limit: 5 });
      expect(queryRes).toBeDefined();
      expect(queryRes.nodes).toBeInstanceOf(Array);
    });
  });

  describe("4. ContextEngine", () => {
    it("should assemble living context within token budget", async () => {
      const brain = new ProjectBrain({ workspacePath: testWorkspace });
      const memory = new MemoryManager({ workspacePath: testWorkspace });
      await memory.initialize();

      const contextEngine = new ContextEngine({
        workspacePath: testWorkspace,
        brain,
        memory,
      });

      const ctx = await contextEngine.assembleContext({
        prompt: "Refactor task engine to support parallel file locks",
        maxTokens: 2000,
      });

      expect(ctx).toBeDefined();
      expect(ctx.totalTokens).toBeLessThanOrEqual(2500);
      expect(ctx.items).toBeInstanceOf(Array);
    });
  });

  describe("5. TaskEngine & FileMutex", () => {
    it("should execute task DAG with topological order and file locking", async () => {
      const engine = new TaskEngine();
      const graph = engine.createGraph("Build Feature", "Test DAG execution");

      const taskA = engine.addTask(graph.id, {
        title: "Task A",
        description: "Write schema",
        outputFiles: ["schema.ts"],
      });

      const taskB = engine.addTask(graph.id, {
        title: "Task B",
        description: "Write server",
        dependencies: [taskA.id],
        outputFiles: ["server.ts"],
      });

      const executionOrder: string[] = [];

      const results = await engine.executeGraph(graph.id, async (t) => {
        executionOrder.push(t.title);
        return { output: `Completed ${t.title}` };
      });

      expect(results.length).toBe(2);
      expect(executionOrder).toEqual(["Task A", "Task B"]);
      expect(graph.status).toBe("completed");
    });

    it("should lock and release files using FileMutex", async () => {
      const mutex = new FileMutex();

      await mutex.acquire("task-1", ["src/index.ts"]);
      expect(mutex.isLocked("src/index.ts")).toBe(true);
      expect(mutex.getLockHolder("src/index.ts")).toBe("task-1");

      mutex.releaseAll("task-1");
      expect(mutex.isLocked("src/index.ts")).toBe(false);
    });
  });

  describe("6. BYOK Encrypted Vault", () => {
    it("should encrypt, decrypt, and manage API keys", async () => {
      const vault = new EncryptedVault(testWorkspace);
      const testPass = "super_secret_master_password_123";

      await vault.initialize(testPass);
      vault.setKey("anthropic", "sk-ant-test-key-xyz", testPass);
      vault.setEndpoint("ollama", "http://localhost:11434/v1", testPass);

      expect(vault.getKey("anthropic")).toBe("sk-ant-test-key-xyz");
      expect(vault.getEndpoint("ollama")).toBe("http://localhost:11434/v1");

      // Verify unlocking
      const unlocked = await vault.unlock(testPass);
      expect(unlocked).toBe(true);
    });
  });

  describe("7. Project Rules Engine", () => {
    it("should detect prohibited secrets and destructive shell commands", async () => {
      const rules = new RulesEngine(testWorkspace);
      await rules.loadRules();

      const secretViolations = rules.validateContent(
        "test.ts",
        'const key = "AIzaSyD-1234567890abcdef1234567890abcde";'
      );
      expect(secretViolations.length).toBeGreaterThan(0);
      expect(secretViolations[0].ruleId).toBe("rule_no_hardcoded_secrets");

      const cmdViolations = rules.validateCommand("rm -rf /");
      expect(cmdViolations.length).toBeGreaterThan(0);
      expect(cmdViolations[0].ruleId).toBe("rule_no_destructive_commands");
    });
  });

  describe("8. AI Director", () => {
    it("should categorize intent and produce an executable DAG task graph", async () => {
      const director = new AIDirector();
      const plan = await director.plan("Fix memory leak in websocket event listeners");

      expect(plan.category).toBe("bugfix");
      expect(plan.graph.tasks.length).toBeGreaterThanOrEqual(3);
      expect(plan.graph.tasks[0].assignedAgent).toBe("researcher");
      expect(plan.graph.tasks[1].assignedAgent).toBe("fullstack_engineer");
      expect(plan.graph.tasks[2].assignedAgent).toBe("qa_engineer");
    });
  });

  describe("9. Engineering Council", () => {
    it("should convene multi-perspective debate and synthesize a verdict", async () => {
      const council = new EngineeringCouncil();
      const delib = await council.deliberate(
        "Should we switch from in-memory index to embedded SQLite?"
      );

      expect(delib.opinions.length).toBe(3);
      expect(delib.consensusVerdict.recommendedApproach).toBeDefined();
      expect(delib.consensusVerdict.tradeoffs.length).toBeGreaterThan(0);
    });
  });

  describe("10. Security & Database Centers", () => {
    it("should block destructive database statements without explicit authorization", async () => {
      const db = new DatabaseCenter(testWorkspace);

      const safeResult = await db.executeQuery("SELECT * FROM users WHERE id = 1");
      expect(safeResult.isDestructive).toBe(false);
      expect(safeResult.error).toBeUndefined();

      const destructiveResult = await db.executeQuery("DROP TABLE users");
      expect(destructiveResult.isDestructive).toBe(true);
      expect(destructiveResult.error).toContain("BLOCKED");
    });

    it("should compute multi-factor evidence-based health report", async () => {
      const security = new SecurityEngine(testWorkspace);
      const health = new HealthCenter(testWorkspace, security);

      const rep = await health.computeHealth();
      expect(rep.overallScore).toBeGreaterThan(0);
      expect(rep.metrics.security).toBeDefined();
      expect(rep.metrics.architecture).toBeDefined();
      expect(rep.metrics.documentation).toBeDefined();
    });
  });
});
