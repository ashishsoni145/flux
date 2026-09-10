/**
 * FluxIDE Engine — Project Brain (Knowledge Graph Engine)
 *
 * The living intelligence layer that models the project as an interconnected
 * system of files, symbols, functions, classes, dependencies, and requirements.
 *
 * Supports:
 * - Direct workspace indexing (files, imports, exports, symbols)
 * - Seamless integration with Graphify knowledge graphs (graphify-out/graph.json)
 * - Impact analysis (transitive dependencies and callers)
 * - Relevance scoring for intelligent Context Engine inclusion
 */

import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative, extname, basename } from "node:path";
import { generateId } from "@fluxide/protocol";
import type {
  BrainNode,
  BrainEdge,
  BrainNodeType,
  BrainEdgeType,
  BrainQuery,
  BrainQueryResult,
} from "@fluxide/protocol";

export interface ProjectBrainOptions {
  workspacePath: string;
}

export class ProjectBrain {
  private workspacePath: string;
  private nodes = new Map<string, BrainNode>();
  private edges: BrainEdge[] = [];
  private brainFile: string;

  // Inverted index for fast symbol search
  private symbolIndex = new Map<string, Set<string>>(); // symbolName -> Set<nodeId>

  constructor(options: ProjectBrainOptions) {
    this.workspacePath = options.workspacePath;
    this.brainFile = join(this.workspacePath, ".flux", "project-brain.json");
  }

  /**
   * Initialize and load persisted brain data or Graphify output.
   */
  async initialize(): Promise<void> {
    // 1. Try loading cached Flux brain
    if (existsSync(this.brainFile)) {
      try {
        const raw = await readFile(this.brainFile, "utf-8");
        const data = JSON.parse(raw) as { nodes: BrainNode[]; edges: BrainEdge[] };
        this.nodes.clear();
        this.edges = data.edges || [];
        for (const n of data.nodes) {
          this.nodes.set(n.id, n);
          this.indexNode(n);
        }
        console.log(`🧠 Project Brain loaded from cache: ${this.nodes.size} nodes, ${this.edges.length} edges`);
        return;
      } catch {
        // Fallback to graphify or scan
      }
    }

    // 2. Try loading Graphify knowledge graph if present
    const graphifyPath = join(this.workspacePath, "graphify-out", "graph.json");
    if (existsSync(graphifyPath)) {
      await this.loadFromGraphify(graphifyPath);
    } else {
      // 3. Perform initial AST / filesystem index
      await this.indexWorkspace();
    }
  }

  /**
   * Ingest nodes and edges from a Graphify graph.json export.
   */
  async loadFromGraphify(graphifyJsonPath: string): Promise<void> {
    try {
      const raw = await readFile(graphifyJsonPath, "utf-8");
      const data = JSON.parse(raw) as {
        nodes?: Array<{ id: string; label?: string; type?: string; file?: string; line?: number }>;
        edges?: Array<{ source: string; target: string; type?: string; relation?: string }>;
      };

      if (data.nodes) {
        for (const gn of data.nodes) {
          const type: BrainNodeType = this.normalizeNodeType(gn.type ?? "symbol");
          const node: BrainNode = {
            id: gn.id,
            type,
            name: gn.label ?? gn.id,
            filePath: gn.file,
            line: gn.line,
            lastUpdated: new Date().toISOString(),
          };
          this.nodes.set(node.id, node);
          this.indexNode(node);
        }
      }

      if (data.edges) {
        for (const ge of data.edges) {
          const edge: BrainEdge = {
            sourceId: ge.source,
            targetId: ge.target,
            type: this.normalizeEdgeType(ge.type ?? ge.relation ?? "depends_on"),
          };
          this.edges.push(edge);
        }
      }

      console.log(`🧠 Ingested Graphify knowledge graph: ${this.nodes.size} nodes, ${this.edges.length} edges`);
      await this.persist();
    } catch (err) {
      console.warn("Could not parse Graphify graph, falling back to workspace scan:", err);
      await this.indexWorkspace();
    }
  }

  /**
   * Scan and index workspace code files directly.
   */
  async indexWorkspace(): Promise<void> {
    console.log("🔍 Scanning workspace to build Project Brain...");
    const files = await this.collectFiles(this.workspacePath);

    for (const file of files) {
      const rel = relative(this.workspacePath, file);
      const fileNodeId = `file:${rel}`;

      const fileNode: BrainNode = {
        id: fileNodeId,
        type: "file",
        name: basename(file),
        filePath: rel,
        language: this.detectLanguage(file),
        lastUpdated: new Date().toISOString(),
      };
      this.nodes.set(fileNodeId, fileNode);
      this.indexNode(fileNode);

      // Extract symbols and imports from code files
      if (file.endsWith(".ts") || file.endsWith(".js") || file.endsWith(".tsx") || file.endsWith(".jsx")) {
        await this.indexSourceFile(file, fileNodeId, rel);
      }
    }

    console.log(`✅ Project Brain indexed: ${this.nodes.size} nodes, ${this.edges.length} edges`);
    await this.persist();
  }

  /**
   * Query the Project Brain.
   */
  async query(q: BrainQuery): Promise<BrainQueryResult> {
    const matchedNodes: BrainNode[] = [];
    const matchedEdges: BrainEdge[] = [];
    const relevanceScores: Record<string, number> = {};

    const lowerQuery = q.query.toLowerCase().trim();

    if (q.type === "symbol" || q.type === "search") {
      for (const node of this.nodes.values()) {
        if (q.filters?.nodeTypes && !q.filters.nodeTypes.includes(node.type)) {
          continue;
        }
        if (q.filters?.filePath && node.filePath !== q.filters.filePath) {
          continue;
        }

        let score = 0;
        const lowerName = node.name.toLowerCase();

        if (lowerName === lowerQuery) {
          score = 1.0;
        } else if (lowerName.startsWith(lowerQuery)) {
          score = 0.8;
        } else if (lowerName.includes(lowerQuery)) {
          score = 0.5;
        } else if (node.filePath && node.filePath.toLowerCase().includes(lowerQuery)) {
          score = 0.3;
        }

        if (score > 0) {
          matchedNodes.push(node);
          relevanceScores[node.id] = score;
        }
      }
    } else if (q.type === "impact") {
      // Find what depends on the target symbol / file
      const targetNodes = Array.from(this.nodes.values()).filter(
        (n) => n.name.toLowerCase() === lowerQuery || n.filePath?.toLowerCase().includes(lowerQuery)
      );

      for (const target of targetNodes) {
        matchedNodes.push(target);
        relevanceScores[target.id] = 1.0;

        // Inbound edges: nodes that depend on or call target
        for (const edge of this.edges) {
          if (edge.targetId === target.id) {
            matchedEdges.push(edge);
            const caller = this.nodes.get(edge.sourceId);
            if (caller && !matchedNodes.some((n) => n.id === caller.id)) {
              matchedNodes.push(caller);
              relevanceScores[caller.id] = 0.75;
            }
          }
        }
      }
    } else if (q.type === "dependency") {
      // Outbound edges: what does target depend on?
      const targetNodes = Array.from(this.nodes.values()).filter(
        (n) => n.name.toLowerCase() === lowerQuery || n.filePath?.toLowerCase().includes(lowerQuery)
      );

      for (const target of targetNodes) {
        matchedNodes.push(target);
        relevanceScores[target.id] = 1.0;

        for (const edge of this.edges) {
          if (edge.sourceId === target.id) {
            matchedEdges.push(edge);
            const dep = this.nodes.get(edge.targetId);
            if (dep && !matchedNodes.some((n) => n.id === dep.id)) {
              matchedNodes.push(dep);
              relevanceScores[dep.id] = 0.75;
            }
          }
        }
      }
    }

    // Sort by relevance score
    matchedNodes.sort((a, b) => (relevanceScores[b.id] ?? 0) - (relevanceScores[a.id] ?? 0));

    const limit = q.limit ?? 25;
    const finalNodes = matchedNodes.slice(0, limit);

    return {
      nodes: finalNodes,
      edges: matchedEdges,
      relevanceScores,
    };
  }

  /**
   * Save the current Project Brain graph to disk.
   */
  async persist(): Promise<void> {
    try {
      const dir = join(this.workspacePath, ".flux");
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
      const data = {
        nodes: Array.from(this.nodes.values()),
        edges: this.edges,
      };
      await writeFile(this.brainFile, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("[ProjectBrain] Failed to persist brain to disk:", err);
    }
  }

  // ─── Internal Parsing & Indexing ──────────────────────────

  private indexNode(node: BrainNode): void {
    const key = node.name.toLowerCase();
    if (!this.symbolIndex.has(key)) {
      this.symbolIndex.set(key, new Set());
    }
    this.symbolIndex.get(key)!.add(node.id);
  }

  private async indexSourceFile(filePath: string, fileNodeId: string, relPath: string): Promise<void> {
    try {
      const content = await readFile(filePath, "utf-8");
      const lines = content.split("\n");

      // Regex patterns for key symbols
      const exportFuncPattern = /export\s+(?:async\s+)?function\s+([A-Za-z0-9_$]+)/g;
      const exportClassPattern = /export\s+class\s+([A-Za-z0-9_$]+)/g;
      const exportInterfacePattern = /export\s+interface\s+([A-Za-z0-9_$]+)/g;
      const exportTypePattern = /export\s+type\s+([A-Za-z0-9_$]+)/g;
      const importPattern = /import\s+(?:.+?\s+from\s+)?['"]([^'"]+)['"]/g;

      lines.forEach((line, idx) => {
        const lineNum = idx + 1;

        // Functions
        let match: RegExpExecArray | null;
        while ((match = exportFuncPattern.exec(line)) !== null) {
          const fnName = match[1];
          if (!fnName) continue;
          const fnId = `${relPath}:${fnName}`;
          const fnNode: BrainNode = {
            id: fnId,
            type: "function",
            name: fnName,
            filePath: relPath,
            line: lineNum,
            lastUpdated: new Date().toISOString(),
          };
          this.nodes.set(fnId, fnNode);
          this.indexNode(fnNode);
          this.edges.push({ sourceId: fileNodeId, targetId: fnId, type: "contains" });
        }

        // Classes
        while ((match = exportClassPattern.exec(line)) !== null) {
          const clsName = match[1];
          if (!clsName) continue;
          const clsId = `${relPath}:${clsName}`;
          const clsNode: BrainNode = {
            id: clsId,
            type: "class",
            name: clsName,
            filePath: relPath,
            line: lineNum,
            lastUpdated: new Date().toISOString(),
          };
          this.nodes.set(clsId, clsNode);
          this.indexNode(clsNode);
          this.edges.push({ sourceId: fileNodeId, targetId: clsId, type: "contains" });
        }

        // Interfaces
        while ((match = exportInterfacePattern.exec(line)) !== null) {
          const ifaceName = match[1];
          if (!ifaceName) continue;
          const ifaceId = `${relPath}:${ifaceName}`;
          const ifaceNode: BrainNode = {
            id: ifaceId,
            type: "interface",
            name: ifaceName,
            filePath: relPath,
            line: lineNum,
            lastUpdated: new Date().toISOString(),
          };
          this.nodes.set(ifaceId, ifaceNode);
          this.indexNode(ifaceNode);
          this.edges.push({ sourceId: fileNodeId, targetId: ifaceId, type: "contains" });
        }

        // Imports
        while ((match = importPattern.exec(line)) !== null) {
          const importTarget = match[1];
          if (!importTarget) continue;
          this.edges.push({
            sourceId: fileNodeId,
            targetId: `module:${importTarget}`,
            type: "imports",
          });
        }
      });
    } catch {
      // Ignore parse failure on unreadable files
    }
  }

  private async collectFiles(dir: string): Promise<string[]> {
    const results: string[] = [];
    const ignored = new Set(["node_modules", ".git", "dist", ".turbo", "graphify-out", ".agents"]);

    const walk = async (currentDir: string): Promise<void> => {
      const entries = await readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (ignored.has(entry.name)) continue;
        const full = join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
        } else if (entry.isFile()) {
          results.push(full);
        }
      }
    };

    await walk(dir);
    return results;
  }

  private detectLanguage(filePath: string): string {
    const ext = extname(filePath).toLowerCase();
    switch (ext) {
      case ".ts":
      case ".tsx":
        return "typescript";
      case ".js":
      case ".jsx":
        return "javascript";
      case ".json":
        return "json";
      case ".md":
        return "markdown";
      case ".yaml":
      case ".yml":
        return "yaml";
      default:
        return "plaintext";
    }
  }

  private normalizeNodeType(raw: string): BrainNodeType {
    const valid: BrainNodeType[] = [
      "file", "directory", "symbol", "function", "class", "interface",
      "type", "variable", "export", "import", "endpoint", "route",
      "component", "hook", "test", "migration", "schema", "config",
      "requirement", "decision", "documentation", "dependency", "service",
      "database", "api",
    ];
    return valid.includes(raw as BrainNodeType) ? (raw as BrainNodeType) : "symbol";
  }

  private normalizeEdgeType(raw: string): BrainEdgeType {
    const valid: BrainEdgeType[] = [
      "imports", "exports", "calls", "implements", "extends", "depends_on",
      "tests", "documents", "modifies", "creates", "deletes", "configures",
      "deploys", "requires", "satisfies", "contains",
    ];
    return valid.includes(raw as BrainEdgeType) ? (raw as BrainEdgeType) : "depends_on";
  }
}
