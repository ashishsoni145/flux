/**
 * FluxIDE Engine — AI Director
 *
 * Top-level orchestration engine that decomposes high-level user intent
 * into a structured Directed Acyclic Graph (DAG) of tasks, assigning
 * specialized engineering personas, models, budgets, and verification gates.
 */

import { generateId } from "@fluxide/protocol";
import type {
  Task,
  TaskGraph,
  TaskType,
  TaskPriority,
  AgentRole,
} from "@fluxide/protocol";
import { getPersona } from "./agents/personas.js";
import type { ProjectBrain } from "./brain.js";
import type { ContextEngine } from "./context.js";
import type { TaskEngine } from "./tasks.js";

export interface DecompositionPlan {
  intent: string;
  category: "feature" | "refactor" | "bugfix" | "investigation" | "security" | "documentation";
  summary: string;
  graph: TaskGraph;
}

export class AIDirector {
  constructor(
    private readonly brain?: ProjectBrain,
    private readonly contextEngine?: ContextEngine,
    private readonly taskEngine?: TaskEngine
  ) {}

  /**
   * Analyze high-level user intent and decompose into an optimized task graph.
   */
  async plan(intent: string, workspacePath = process.cwd()): Promise<DecompositionPlan> {
    const category = this.categorizeIntent(intent);
    const graphId = generateId("graph");

    const tasks: Task[] = [];
    const now = new Date().toISOString();

    // Strategy 1: Bugfix / Debugging
    if (category === "bugfix") {
      const researchTask: Task = {
        id: generateId("task_research"),
        title: "Reproduce and isolate root cause",
        description: `Investigate root cause of reported issue: "${intent}". Inspect logs, relevant files, and test reproduction.`,
        type: "research",
        priority: "high",
        status: "ready",
        assignedAgent: "researcher",
        dependencies: [],
        inputFiles: [],
        outputFiles: [],
        acceptanceCriteria: [
          {
            id: generateId("crit"),
            description: "Root cause diagnosed with clear evidence.",
            type: "manual",
            satisfied: false,
          },
        ],
        requiredPermissions: ["read"],
        budget: {
          maxTokens: 4096,
          maxCostUsd: 0.3,
          maxRetries: 2,
          maxDurationMs: 60000,
          usedTokens: 0,
          usedCostUsd: 0,
          retries: 0,
          elapsedMs: 0,
        },
        artifacts: [],
        createdAt: now,
      };

      const fixTask: Task = {
        id: generateId("task_fix"),
        title: "Implement targeted fix",
        description: "Apply minimal, idiomatic code correction without introducing regressions.",
        type: "implementation",
        priority: "high",
        status: "backlog",
        assignedAgent: "fullstack_engineer",
        dependencies: [researchTask.id],
        inputFiles: [],
        outputFiles: [],
        acceptanceCriteria: [
          {
            id: generateId("crit"),
            description: "Issue resolved and existing test suite passes.",
            type: "automated",
            verificationCommand: "npm test",
            satisfied: false,
          },
        ],
        requiredPermissions: ["read", "edit"],
        budget: {
          maxTokens: 8192,
          maxCostUsd: 0.6,
          maxRetries: 2,
          maxDurationMs: 120000,
          usedTokens: 0,
          usedCostUsd: 0,
          retries: 0,
          elapsedMs: 0,
        },
        artifacts: [],
        createdAt: now,
      };

      const verifyTask: Task = {
        id: generateId("task_verify"),
        title: "Verify fix and add regression test",
        description: "Add automated test case preventing regression, and run full test suite.",
        type: "testing",
        priority: "high",
        status: "backlog",
        assignedAgent: "qa_engineer",
        dependencies: [fixTask.id],
        inputFiles: [],
        outputFiles: [],
        acceptanceCriteria: [
          {
            id: generateId("crit"),
            description: "New regression test passes cleanly.",
            type: "automated",
            satisfied: false,
          },
        ],
        requiredPermissions: ["read", "edit", "execute"],
        budget: {
          maxTokens: 4096,
          maxCostUsd: 0.4,
          maxRetries: 2,
          maxDurationMs: 60000,
          usedTokens: 0,
          usedCostUsd: 0,
          retries: 0,
          elapsedMs: 0,
        },
        artifacts: [],
        createdAt: now,
      };

      tasks.push(researchTask, fixTask, verifyTask);
    }
    // Strategy 2: Refactoring / Architectural Change
    else if (category === "refactor" || category === "security") {
      const archTask: Task = {
        id: generateId("task_arch"),
        title: "Architectural design & risk analysis",
        description: `Analyze current implementation, map dependencies, and design refactoring strategy for: "${intent}".`,
        type: "architecture",
        priority: "high",
        status: "ready",
        assignedAgent: "architect",
        dependencies: [],
        inputFiles: [],
        outputFiles: [],
        acceptanceCriteria: [
          {
            id: generateId("crit"),
            description: "Refactoring spec and interface preservation verified.",
            type: "manual",
            satisfied: false,
          },
        ],
        requiredPermissions: ["read"],
        budget: {
          maxTokens: 6144,
          maxCostUsd: 0.5,
          maxRetries: 1,
          maxDurationMs: 90000,
          usedTokens: 0,
          usedCostUsd: 0,
          retries: 0,
          elapsedMs: 0,
        },
        artifacts: [],
        createdAt: now,
      };

      const implTask: Task = {
        id: generateId("task_impl"),
        title: "Execute refactoring",
        description: "Apply refactoring preserving API contracts and backwards compatibility.",
        type: "implementation",
        priority: "high",
        status: "backlog",
        assignedAgent: "backend_engineer",
        dependencies: [archTask.id],
        inputFiles: [],
        outputFiles: [],
        acceptanceCriteria: [
          {
            id: generateId("crit"),
            description: "Typechecks pass with 0 errors.",
            type: "automated",
            verificationCommand: "npm run typecheck",
            satisfied: false,
          },
        ],
        requiredPermissions: ["read", "edit"],
        budget: {
          maxTokens: 8192,
          maxCostUsd: 1.0,
          maxRetries: 2,
          maxDurationMs: 180000,
          usedTokens: 0,
          usedCostUsd: 0,
          retries: 0,
          elapsedMs: 0,
        },
        artifacts: [],
        createdAt: now,
      };

      const reviewTask: Task = {
        id: generateId("task_review"),
        title: "Security & code review",
        description: "Audit diff for security issues, regressions, and conformance.",
        type: "review",
        priority: "high",
        status: "backlog",
        assignedAgent: "security_engineer",
        dependencies: [implTask.id],
        inputFiles: [],
        outputFiles: [],
        acceptanceCriteria: [
          {
            id: generateId("crit"),
            description: "Code review approved without critical findings.",
            type: "manual",
            satisfied: false,
          },
        ],
        requiredPermissions: ["read"],
        budget: {
          maxTokens: 4096,
          maxCostUsd: 0.4,
          maxRetries: 1,
          maxDurationMs: 60000,
          usedTokens: 0,
          usedCostUsd: 0,
          retries: 0,
          elapsedMs: 0,
        },
        artifacts: [],
        createdAt: now,
      };

      tasks.push(archTask, implTask, reviewTask);
    }
    // Strategy 3: General Feature or Complex Build
    else {
      const specTask: Task = {
        id: generateId("task_spec"),
        title: "Feature Specification & Interface Design",
        description: `Define requirements, interface contracts, and module boundaries for: "${intent}".`,
        type: "architecture",
        priority: "high",
        status: "ready",
        assignedAgent: "architect",
        dependencies: [],
        inputFiles: [],
        outputFiles: [],
        acceptanceCriteria: [
          {
            id: generateId("crit"),
            description: "Detailed spec and component interfaces defined.",
            type: "manual",
            satisfied: false,
          },
        ],
        requiredPermissions: ["read"],
        budget: {
          maxTokens: 6144,
          maxCostUsd: 0.5,
          maxRetries: 1,
          maxDurationMs: 90000,
          usedTokens: 0,
          usedCostUsd: 0,
          retries: 0,
          elapsedMs: 0,
        },
        artifacts: [],
        createdAt: now,
      };

      const backendTask: Task = {
        id: generateId("task_backend"),
        title: "Core Service & Engine Implementation",
        description: "Implement data structures, state machines, and business logic.",
        type: "implementation",
        priority: "medium",
        status: "backlog",
        assignedAgent: "backend_engineer",
        dependencies: [specTask.id],
        inputFiles: [],
        outputFiles: [],
        acceptanceCriteria: [
          {
            id: generateId("crit"),
            description: "Backend builds and functions as specified.",
            type: "automated",
            satisfied: false,
          },
        ],
        requiredPermissions: ["read", "edit"],
        budget: {
          maxTokens: 8192,
          maxCostUsd: 1.0,
          maxRetries: 2,
          maxDurationMs: 180000,
          usedTokens: 0,
          usedCostUsd: 0,
          retries: 0,
          elapsedMs: 0,
        },
        artifacts: [],
        createdAt: now,
      };

      const frontendTask: Task = {
        id: generateId("task_frontend"),
        title: "UI / CLI Interface Integration",
        description: "Connect user interface affordances, views, and commands.",
        type: "implementation",
        priority: "medium",
        status: "backlog",
        assignedAgent: "frontend_engineer",
        dependencies: [specTask.id], // Independent from backend if interfaces are defined!
        inputFiles: [],
        outputFiles: [],
        acceptanceCriteria: [
          {
            id: generateId("crit"),
            description: "UI or CLI components render cleanly.",
            type: "automated",
            satisfied: false,
          },
        ],
        requiredPermissions: ["read", "edit"],
        budget: {
          maxTokens: 8192,
          maxCostUsd: 1.0,
          maxRetries: 2,
          maxDurationMs: 180000,
          usedTokens: 0,
          usedCostUsd: 0,
          retries: 0,
          elapsedMs: 0,
        },
        artifacts: [],
        createdAt: now,
      };

      const verifyTask: Task = {
        id: generateId("task_verify"),
        title: "Integration Verification & Test Coverage",
        description: "Verify full integration, run test suite, and produce Proof of Completion.",
        type: "testing",
        priority: "high",
        status: "backlog",
        assignedAgent: "qa_engineer",
        dependencies: [backendTask.id, frontendTask.id],
        inputFiles: [],
        outputFiles: [],
        acceptanceCriteria: [
          {
            id: generateId("crit"),
            description: "All automated test suites and build checks pass.",
            type: "automated",
            verificationCommand: "npm test",
            satisfied: false,
          },
        ],
        requiredPermissions: ["read", "edit", "execute"],
        budget: {
          maxTokens: 6144,
          maxCostUsd: 0.6,
          maxRetries: 2,
          maxDurationMs: 90000,
          usedTokens: 0,
          usedCostUsd: 0,
          retries: 0,
          elapsedMs: 0,
        },
        artifacts: [],
        createdAt: now,
      };

      tasks.push(specTask, backendTask, frontendTask, verifyTask);
    }

    const graph: TaskGraph = {
      id: graphId,
      title: `Plan: ${intent.slice(0, 60)}`,
      description: intent,
      tasks,
      createdAt: now,
      status: "ready",
    };

    return {
      intent,
      category,
      summary: `Decomposed into ${tasks.length} tasks across specialized personas (${tasks.map((t) => t.assignedAgent).join(", ")}).`,
      graph,
    };
  }

  private categorizeIntent(
    intent: string
  ): "feature" | "refactor" | "bugfix" | "investigation" | "security" | "documentation" {
    const lower = intent.toLowerCase();
    if (lower.includes("fix") || lower.includes("bug") || lower.includes("error") || lower.includes("fail")) {
      return "bugfix";
    }
    if (lower.includes("refactor") || lower.includes("clean") || lower.includes("rewrite") || lower.includes("migrate")) {
      return "refactor";
    }
    if (lower.includes("security") || lower.includes("vulnerability") || lower.includes("audit") || lower.includes("cve")) {
      return "security";
    }
    if (lower.includes("why") || lower.includes("explain") || lower.includes("where") || lower.includes("how")) {
      return "investigation";
    }
    if (lower.includes("doc") || lower.includes("readme") || lower.includes("comment")) {
      return "documentation";
    }
    return "feature";
  }
}
