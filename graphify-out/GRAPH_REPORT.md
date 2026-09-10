# Graph Report - fluxIDE APP  (2026-09-04)

## Corpus Check
- 79 files · ~46,438 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 724 nodes · 1419 edges · 31 communities (27 shown, 2 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 59 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- agent.ts
- boot
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
- protocol/src/index.ts
- MemoryManager
- engine.test.ts
- build.js
- EncryptedVault
- IpcService
- SetupForm
- accounting.ts
- desktop/package.json
- compilerOptions
- FluxLauncher
- pack-desktop.js

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
- `boot()` --calls--> `AccountingManager`  [EXTRACTED]
  packages/engine/src/index.ts → packages/engine/src/accounting.ts
- `AgentTurnOptions` --references--> `InteractionMode`  [EXTRACTED]
  packages/engine/src/agent.ts → packages/protocol/src/modes.ts
- `boot()` --calls--> `AgentLoop`  [EXTRACTED]
  packages/engine/src/index.ts → packages/engine/src/agent.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **FluxIDE Autonomous Engineering Core Architecture** — ai_ide_research_and_build_prompt_core_vision, ai_ide_research_and_build_prompt_platform_architecture, ai_ide_research_and_build_prompt_task_graph_engine, ai_ide_research_and_build_prompt_project_brain [INFERRED 0.95]

## Communities (31 total, 2 thin omitted)

### Community 0 - "agent.ts"
Cohesion: 0.05
Nodes (28): AgentLoop, AgentTurnOptions, McpConfig, McpManager, McpServerConfig, PermissionGate, FluxServer, FluxServerOptions (+20 more)

### Community 1 - "boot"
Cohesion: 0.06
Nodes (35): ApiCenter, ApiEndpoint, ApiTestResponse, DatabaseCenter, DatabaseTable, QueryResult, HealthCenter, HealthMetric (+27 more)

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
Cohesion: 0.24
Nodes (9): color, FluxClient, main(), printBanner(), runOneShot(), startInteractive(), ServerMessage, StartSessionPayload (+1 more)

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

### Community 17 - "protocol/src/index.ts"
Cohesion: 0.09
Nodes (27): ProjectBrain, ProjectBrainOptions, ApprovalCallback, AgentAction, AgentSession, AgentStatus, AgentTeam, BrainEdge (+19 more)

### Community 18 - "MemoryManager"
Cohesion: 0.14
Nodes (10): ContextEngine, ContextEngineOptions, MemoryManager, MemoryManagerOptions, ContextItem, ContextReference, ContextReferenceType, MemoryEntry (+2 more)

### Community 19 - "engine.test.ts"
Cohesion: 0.09
Nodes (21): BUILTIN_PERSONAS, getPersona(), PersonaDefinition, CouncilDeliberation, CouncilOpinion, AIDirector, DecompositionPlan, FileMutex (+13 more)

### Community 20 - "build.js"
Cohesion: 0.25
Nodes (7): buildEnv, packages, portableBin, portableNode, portableNodeModules, portableToolsDir, rootDir

### Community 23 - "IpcService"
Cohesion: 0.09
Nodes (7): DaemonStatus, DaemonSupervisor, DesktopAppConfig, FluxDesktopApp, FileNode, IpcService, TerminalSession

### Community 24 - "SetupForm"
Cohesion: 0.19
Nodes (9): Button, CheckBox, FluxIDE.Setup, Form, Label, ProgressBar, STAThread, SetupForm (+1 more)

### Community 25 - "accounting.ts"
Cohesion: 0.29
Nodes (3): AccountingManager, MODEL_PRICING, ModelPricing

### Community 26 - "desktop/package.json"
Cohesion: 0.12
Nodes (15): dependencies, @fluxide/protocol, description, devDependencies, typescript, @fluxide/protocol, typescript, main (+7 more)

### Community 27 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, lib, module, moduleResolution, outDir, rootDir, target, extends (+6 more)

### Community 28 - "FluxLauncher"
Cohesion: 0.40
Nodes (3): FluxIDE, STAThread, FluxLauncher

## Knowledge Gaps
- **222 isolated node(s):** `name`, `version`, `private`, `description`, `license` (+217 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 265 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `boot()` connect `boot` to `agent.ts`, `CompletionRequest`, `protocol/src/index.ts`, `MemoryManager`, `engine.test.ts`, `EncryptedVault`, `accounting.ts`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `generateId()` connect `boot` to `agent.ts`, `cli/src/index.ts`, `protocol/src/index.ts`, `MemoryManager`, `engine.test.ts`, `accounting.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `EncryptedVault` connect `EncryptedVault` to `boot`, `engine.test.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Are the 43 inferred relationships involving `boot()` (e.g. with `.runTurn()` and `.indexWorkspace()`) actually correct?**
  _`boot()` has 43 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _222 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `agent.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05268065268065268 - nodes in this community are weakly interconnected._
- **Should `boot` be split into smaller, more focused modules?**
  _Cohesion score 0.05561105561105561 - nodes in this community are weakly interconnected._