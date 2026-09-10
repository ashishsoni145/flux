/**
 * @fluxide/protocol — Project Brain Schema
 *
 * The living intelligence layer that understands the project
 * as a system of interconnected entities and relationships.
 */

// ─── Brain Node Types ───────────────────────────────────────
export type BrainNodeType =
  | "file"
  | "directory"
  | "symbol"
  | "function"
  | "class"
  | "interface"
  | "type"
  | "variable"
  | "export"
  | "import"
  | "endpoint"
  | "route"
  | "component"
  | "hook"
  | "test"
  | "migration"
  | "schema"
  | "config"
  | "requirement"
  | "decision"
  | "documentation"
  | "dependency"
  | "service"
  | "database"
  | "api";

// ─── Brain Edge Types ───────────────────────────────────────
export type BrainEdgeType =
  | "imports"
  | "exports"
  | "calls"
  | "implements"
  | "extends"
  | "depends_on"
  | "tests"
  | "documents"
  | "modifies"
  | "creates"
  | "deletes"
  | "configures"
  | "deploys"
  | "requires"
  | "satisfies"
  | "contains";

// ─── Brain Node ─────────────────────────────────────────────
export interface BrainNode {
  readonly id: string;
  readonly type: BrainNodeType;
  readonly name: string;
  readonly filePath?: string;
  readonly line?: number;
  readonly endLine?: number;
  readonly language?: string;
  readonly signature?: string;
  readonly documentation?: string;
  readonly metadata?: Record<string, unknown>;
  readonly lastUpdated: string;
}

// ─── Brain Edge ─────────────────────────────────────────────
export interface BrainEdge {
  readonly sourceId: string;
  readonly targetId: string;
  readonly type: BrainEdgeType;
  readonly metadata?: Record<string, unknown>;
}

// ─── Brain Query ────────────────────────────────────────────
export interface BrainQuery {
  readonly type: "symbol" | "file" | "dependency" | "impact" | "search";
  readonly query: string;
  readonly filters?: {
    readonly nodeTypes?: readonly BrainNodeType[];
    readonly language?: string;
    readonly filePath?: string;
  };
  readonly limit?: number;
}

// ─── Brain Query Result ─────────────────────────────────────
export interface BrainQueryResult {
  readonly nodes: BrainNode[];
  readonly edges: BrainEdge[];
  readonly relevanceScores: Record<string, number>;
}

// ─── Context Reference ─────────────────────────────────────
export type ContextReferenceType =
  | "file"
  | "folder"
  | "symbol"
  | "repo"
  | "git"
  | "terminal"
  | "browser"
  | "task"
  | "database"
  | "api"
  | "docs"
  | "project"
  | "memory"
  | "mcp";

export interface ContextReference {
  readonly type: ContextReferenceType;
  readonly value: string;
  readonly label?: string;
}

// ─── Context Item (ranked for inclusion) ────────────────────
export interface ContextItem {
  readonly source: string;
  readonly type: ContextReferenceType;
  readonly content: string;
  readonly tokenCount: number;
  readonly relevanceScore: number;
  readonly filePath?: string;
  readonly lineRange?: { start: number; end: number };
}
