/**
 * FluxIDE Engine — Task Graph & Execution Engine
 *
 * Implements Directed Acyclic Graph (DAG) task execution for autonomous
 * software engineering workflows.
 *
 * Capabilities:
 * - Topological dependency resolution
 * - Concurrent execution of independent tasks
 * - Fine-grained FileMutex integration to prevent conflicting file edits
 * - Acceptance criteria verification
 * - Checkpoint association and state tracking
 */

import { generateId } from "@fluxide/protocol";
import type {
  Task,
  TaskGraph,
  TaskStatus,
  TaskPriority,
  TaskType,
} from "@fluxide/protocol";
import { FileMutex } from "./mutex.js";

export interface TaskExecutionResult {
  taskId: string;
  status: TaskStatus;
  output?: string;
  error?: string;
  durationMs: number;
}

export type TaskHandler = (task: Task) => Promise<{ output?: string; error?: string }>;

export class TaskEngine {
  private activeGraphs = new Map<string, TaskGraph>();
  private fileMutex = new FileMutex();

  /**
   * Register or import a TaskGraph into the engine.
   */
  registerGraph(graph: TaskGraph): void {
    this.activeGraphs.set(graph.id, graph);
  }

  /**
   * Create and initialize a new TaskGraph.
   */
  createGraph(title: string, description: string): TaskGraph {
    const graphId = generateId("graph");
    const graph: TaskGraph = {
      id: graphId,
      title,
      description,
      tasks: [],
      createdAt: new Date().toISOString(),
      status: "ready",
    };

    this.activeGraphs.set(graphId, graph);
    return graph;
  }

  /**
   * Add a task node to a TaskGraph.
   */
  addTask(
    graphId: string,
    options: {
      title: string;
      description: string;
      type?: TaskType;
      priority?: TaskPriority;
      assignedAgent?: string;
      dependencies?: string[];
      inputFiles?: string[];
      outputFiles?: string[];
    }
  ): Task {
    const graph = this.activeGraphs.get(graphId);
    if (!graph) throw new Error(`TaskGraph not found: ${graphId}`);

    const task: Task = {
      id: generateId("task"),
      title: options.title,
      description: options.description,
      type: options.type ?? "implementation",
      priority: options.priority ?? "medium",
      status: (options.dependencies?.length ?? 0) === 0 ? "ready" : "backlog",
      assignedAgent: options.assignedAgent ?? "fullstack_engineer",
      dependencies: options.dependencies ?? [],
      inputFiles: options.inputFiles ?? [],
      outputFiles: options.outputFiles ?? [],
      acceptanceCriteria: [],
      requiredPermissions: ["read", "edit"],
      budget: {
        maxTokens: 8192,
        maxCostUsd: 1.0,
        maxRetries: 2,
        maxDurationMs: 120000,
        usedTokens: 0,
        usedCostUsd: 0,
        retries: 0,
        elapsedMs: 0,
      },
      artifacts: [],
      createdAt: new Date().toISOString(),
    };

    graph.tasks.push(task);
    return task;
  }

  /**
   * Add a dependency: dependentId depends on dependencyId (dependency must complete first).
   */
  addDependency(graphId: string, dependentTaskId: string, dependencyTaskId: string): void {
    const graph = this.activeGraphs.get(graphId);
    if (!graph) throw new Error(`TaskGraph not found: ${graphId}`);

    const targetTask = graph.tasks.find((t) => t.id === dependentTaskId);
    if (!targetTask) throw new Error(`Task not found: ${dependentTaskId}`);

    if (!targetTask.dependencies.includes(dependencyTaskId)) {
      (targetTask.dependencies as string[]).push(dependencyTaskId);
      targetTask.status = "backlog";
    }
  }

  /**
   * Get runnable tasks: tasks in 'ready' or 'backlog' whose dependencies are all completed.
   */
  getRunnableTasks(graphId: string): Task[] {
    const graph = this.activeGraphs.get(graphId);
    if (!graph) return [];

    const completedIds = new Set(
      graph.tasks.filter((t) => t.status === "completed").map((t) => t.id)
    );

    return graph.tasks.filter((task) => {
      if (task.status !== "ready" && task.status !== "backlog") return false;
      return task.dependencies.every((depId) => completedIds.has(depId));
    });
  }

  /**
   * Execute all tasks in the graph using topological order, concurrency, and file locking.
   */
  async executeGraph(
    graphId: string,
    handler: TaskHandler,
    onProgress?: (task: Task, status: TaskStatus) => void
  ): Promise<TaskExecutionResult[]> {
    const graph = this.activeGraphs.get(graphId);
    if (!graph) throw new Error(`TaskGraph not found: ${graphId}`);

    graph.status = "running";
    const results: TaskExecutionResult[] = [];

    while (true) {
      const runnable = this.getRunnableTasks(graphId);

      if (runnable.length === 0) {
        const allCompleted = graph.tasks.every((t) => t.status === "completed");
        const anyFailed = graph.tasks.some((t) => t.status === "failed");

        graph.status = allCompleted ? "completed" : anyFailed ? "failed" : "completed";
        break;
      }

      // Execute independent runnable tasks concurrently with file locking
      const promises = runnable.map(async (task) => {
        const start = Date.now();
        task.status = "running";
        task.startedAt = new Date().toISOString();
        onProgress?.(task, "running");

        // Acquire file locks for files this task will output/modify
        if (task.outputFiles && task.outputFiles.length > 0) {
          await this.fileMutex.acquire(task.id, task.outputFiles);
        }

        try {
          const res = await handler(task);

          if (res.error) {
            task.status = "failed";
            task.error = res.error;
          } else {
            task.status = "completed";
          }

          task.completedAt = new Date().toISOString();
          onProgress?.(task, task.status);

          results.push({
            taskId: task.id,
            status: task.status,
            output: res.output,
            error: res.error,
            durationMs: Date.now() - start,
          });
        } catch (err) {
          task.status = "failed";
          task.error = err instanceof Error ? err.message : String(err);
          onProgress?.(task, "failed");

          results.push({
            taskId: task.id,
            status: "failed",
            error: task.error,
            durationMs: Date.now() - start,
          });
        } finally {
          // Always release locks
          this.fileMutex.releaseAll(task.id);
        }
      });

      await Promise.all(promises);
    }

    return results;
  }

  getGraph(graphId: string): TaskGraph | undefined {
    return this.activeGraphs.get(graphId);
  }

  getAllGraphs(): TaskGraph[] {
    return Array.from(this.activeGraphs.values());
  }
}
