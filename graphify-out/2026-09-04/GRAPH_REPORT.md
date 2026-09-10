# Graph Report - fluxIDE APP  (2026-09-04)

## Corpus Check
- 77 files · ~42,256 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 700 nodes · 1387 edges · 36 communities (31 shown, 3 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 59 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- protocol/src/index.ts
- generateId
- scripts
- cli/package.json
- engine/package.json
- CompletionRequest
- compilerOptions
- model-gateway/package.json
- protocol/package.json
- tasks
- cli/src/index.ts
- cli/tsconfig.json
- engine/tsconfig.json
- model-gateway/tsconfig.json
- protocol/tsconfig.json
- FluxIDE Multi-Tier Architecture
- Graphify Knowledge Graph Rules
- ProjectBrain
- MemoryManager
- director.ts
- build.js
- EncryptedVault
- IpcService
- server.ts
- engine.test.ts
- desktop/package.json
- compilerOptions
- boot
- terminalExecute
- engine/src/index.ts
- engine/src/verification.ts
- database.ts
- AIDirector
- test-endpoints.js

## God Nodes (most connected - your core abstractions)
1. `boot()` - 73 edges
2. `generateId()` - 39 edges
3. `compilerOptions` - 24 edges
4. `CompletionRequest` - 23 edges
5. `ProjectBrain` - 22 edges
6. `IpcService` - 21 edges
7. `MemoryManager` - 17 edges
8. `PermissionGate` - 17 edges
9. `ContextEngine` - 16 edges
10. `EncryptedVault` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Monorepo Workspace Structure` --references--> `FluxIDE Multi-Tier Architecture`  [INFERRED]
  pnpm-workspace.yaml → ai_ide_research_and_build_prompt.md
- `Copilot Architecture Navigation Instructions` --references--> `Graphify Knowledge Graph Rules`  [INFERRED]
  .github/copilot-instructions.md → .agents/rules/graphify.md
- `boot()` --indirect_call--> `fsListDir()`  [INFERRED]
  packages/engine/src/index.ts → packages/engine/src/tools/filesystem.ts
- `boot()` --indirect_call--> `fsPatchFile()`  [INFERRED]
  packages/engine/src/index.ts → packages/engine/src/tools/filesystem.ts
- `boot()` --indirect_call--> `fsReadFile()`  [INFERRED]
  packages/engine/src/index.ts → packages/engine/src/tools/filesystem.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **FluxIDE Autonomous Engineering Core Architecture** — ai_ide_research_and_build_prompt_core_vision, ai_ide_research_and_build_prompt_platform_architecture, ai_ide_research_and_build_prompt_task_graph_engine, ai_ide_research_and_build_prompt_project_brain [INFERRED 0.95]

## Communities (36 total, 3 thin omitted)

### Community 0 - "protocol/src/index.ts"
Cohesion: 0.05
Nodes (40): AccountingManager, MODEL_PRICING, ModelPricing, AgentTurnOptions, McpConfig, McpManager, McpServerConfig, ApprovalCallback (+32 more)

### Community 1 - "generateId"
Cohesion: 0.21
Nodes (7): HealthCenter, HealthMetric, ProjectHealthReport, SecurityEngine, SecurityFinding, SecurityReport, generateId()

### Community 2 - "scripts"
Cohesion: 0.06
Nodes (33): description, devDependencies, prettier, tsup, @types/node, typescript, vitest, engines (+25 more)

### Community 3 - "cli/package.json"
Cohesion: 0.07
Nodes (29): bin, flux, dependencies, @fluxide/protocol, ws, description, devDependencies, tsup (+21 more)

### Community 4 - "engine/package.json"
Cohesion: 0.06
Nodes (31): @fluxide/model-gateway, dependencies, @fluxide/model-gateway, @fluxide/protocol, ws, description, devDependencies, tsup (+23 more)

### Community 5 - "CompletionRequest"
Cohesion: 0.09
Nodes (16): ModelProviderAdapter, AnthropicProvider, GeminiProvider, OllamaProvider, OpenAIProvider, ModelRouter, RouterConfig, TokenUsage (+8 more)

### Community 6 - "compilerOptions"
Cohesion: 0.06
Nodes (34): node_modules, packages/engine/src/index.ts, packages/model-gateway/src/index.ts, packages/protocol/src/index.ts, compilerOptions, baseUrl, declaration, declarationMap (+26 more)

### Community 7 - "model-gateway/package.json"
Cohesion: 0.08
Nodes (24): dependencies, @fluxide/protocol, description, devDependencies, tsup, typescript, vitest, exports (+16 more)

### Community 8 - "protocol/package.json"
Cohesion: 0.09
Nodes (21): description, devDependencies, tsup, typescript, vitest, exports, tsup, typescript (+13 more)

### Community 9 - "tasks"
Cohesion: 0.10
Nodes (20): ^build, dependsOn, outputs, cache, cache, persistent, dist/**, outputs (+12 more)

### Community 10 - "cli/src/index.ts"
Cohesion: 0.28
Nodes (8): color, FluxClient, main(), printBanner(), runOneShot(), startInteractive(), StartSessionPayload, UserPromptPayload

### Community 11 - "cli/tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, extends, include, src, ../../tsconfig.base.json

### Community 12 - "engine/tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, extends, include, src, ../../tsconfig.base.json

### Community 13 - "model-gateway/tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, extends, include, src, ../../tsconfig.base.json

### Community 14 - "protocol/tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, extends, include, src, ../../tsconfig.base.json

### Community 15 - "FluxIDE Multi-Tier Architecture"
Cohesion: 0.33
Nodes (7): FluxIDE Core Vision & Intent Lifecycle, FluxIDE Model Gateway & Intelligent Router, FluxIDE Permission & Security Governance, FluxIDE Multi-Tier Architecture, FluxIDE Project Brain & Knowledge Graph, FluxIDE Task Graph & Execution Engine, Monorepo Workspace Structure

### Community 16 - "Graphify Knowledge Graph Rules"
Cohesion: 0.67
Nodes (3): Graphify Knowledge Graph Rules, Graphify Knowledge Graph Workflow, Copilot Architecture Navigation Instructions

### Community 17 - "ProjectBrain"
Cohesion: 0.13
Nodes (13): ProjectBrain, ProjectBrainOptions, ContextEngine, ContextEngineOptions, BrainEdge, BrainEdgeType, BrainNode, BrainNodeType (+5 more)

### Community 18 - "MemoryManager"
Cohesion: 0.23
Nodes (5): MemoryManager, MemoryManagerOptions, MemoryEntry, MemoryQuery, MemoryScope

### Community 19 - "director.ts"
Cohesion: 0.12
Nodes (13): DecompositionPlan, FileMutex, TaskEngine, TaskExecutionResult, TaskHandler, AcceptanceCriterion, Task, TaskArtifact (+5 more)

### Community 20 - "build.js"
Cohesion: 0.25
Nodes (7): buildEnv, packages, portableBin, portableNode, portableNodeModules, portableToolsDir, rootDir

### Community 23 - "IpcService"
Cohesion: 0.09
Nodes (7): DaemonStatus, DaemonSupervisor, DesktopAppConfig, FluxDesktopApp, FileNode, IpcService, TerminalSession

### Community 24 - "server.ts"
Cohesion: 0.12
Nodes (12): AgentLoop, FluxServer, FluxServerOptions, getWorkspaceTree(), MessageHandler, WorkspaceTreeNode, getDashboardHtml(), getDesktopIdeHtml() (+4 more)

### Community 25 - "engine.test.ts"
Cohesion: 0.16
Nodes (10): BUILTIN_PERSONAS, getPersona(), PersonaDefinition, CouncilDeliberation, CouncilOpinion, EngineeringCouncil, ProjectRule, RuleViolation (+2 more)

### Community 26 - "desktop/package.json"
Cohesion: 0.12
Nodes (15): dependencies, @fluxide/protocol, description, devDependencies, typescript, @fluxide/protocol, typescript, main (+7 more)

### Community 27 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, lib, module, moduleResolution, outDir, rootDir, target, extends (+6 more)

### Community 28 - "boot"
Cohesion: 0.19
Nodes (4): ApiCenter, boot(), RulesEngine, createBuiltinToolRegistrations()

### Community 29 - "terminalExecute"
Cohesion: 0.28
Nodes (6): CheckpointManager, gitCommit(), gitDiff(), gitStatus(), terminalExecute(), Checkpoint

### Community 30 - "engine/src/index.ts"
Cohesion: 0.24
Nodes (8): ApiEndpoint, ApiTestResponse, PORT, fsListDir(), fsPatchFile(), fsReadFile(), fsSearch(), fsWriteFile()

### Community 31 - "engine/src/verification.ts"
Cohesion: 0.29
Nodes (4): SelfHealingDiagnosis, VerificationEngine, VerificationEngineOptions, VerificationCheck

### Community 32 - "database.ts"
Cohesion: 0.33
Nodes (3): DatabaseCenter, DatabaseTable, QueryResult

## Knowledge Gaps
- **218 isolated node(s):** `name`, `version`, `private`, `description`, `license` (+213 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 257 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `boot()` connect `boot` to `protocol/src/index.ts`, `database.ts`, `generateId`, `AIDirector`, `CompletionRequest`, `ProjectBrain`, `MemoryManager`, `director.ts`, `EncryptedVault`, `server.ts`, `engine.test.ts`, `terminalExecute`, `engine/src/index.ts`, `engine/src/verification.ts`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `generateId()` connect `generateId` to `protocol/src/index.ts`, `database.ts`, `AIDirector`, `cli/src/index.ts`, `ProjectBrain`, `MemoryManager`, `director.ts`, `server.ts`, `engine.test.ts`, `boot`, `terminalExecute`, `engine/src/index.ts`, `engine/src/verification.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `EncryptedVault` connect `EncryptedVault` to `engine.test.ts`, `boot`, `engine/src/index.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Are the 43 inferred relationships involving `boot()` (e.g. with `.runTurn()` and `.indexWorkspace()`) actually correct?**
  _`boot()` has 43 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _218 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `protocol/src/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.050957481337228175 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.058823529411764705 - nodes in this community are weakly interconnected._