# YOURIDE — MASTER BUILD & TECHNICAL SPECIFICATION

## ROLE

You are the lead product architect, senior desktop engineer, AI systems engineer, backend engineer, frontend engineer, DevOps engineer, security engineer, and UX designer responsible for building **YourIDE**.

Your responsibility is not merely to create a visual prototype.

Build a functional, extensible, production-oriented AI-native development environment.

Do not throw away existing working functionality in the repository.

Before implementing anything:

1. Inspect the entire existing repository.
2. Identify the current architecture.
3. Identify what already works.
4. Identify incomplete systems.
5. Identify broken systems.
6. Reuse existing implementations whenever practical.
7. Do not rewrite working VS Code functionality unnecessarily.
8. Create an implementation plan before major architectural changes.

---

# 1. PRODUCT VISION

YourIDE is an **AI-native software development environment based on VS Code OSS / Code-OSS**.

YourIDE must NOT be positioned or architected simply as:

> "VS Code with a chatbot."

The core product is an AI software-engineering environment capable of taking a development task through:

```text
UNDERSTAND
    ↓
PLAN
    ↓
IMPLEMENT
    ↓
RUN
    ↓
VERIFY
    ↓
REVIEW
    ↓
FIX
    ↓
PROVE
```

The AI should progressively move from being a code-generation assistant toward an autonomous software-engineering agent.

The agent should be able to:

* Understand the user's request.
* Understand the repository.
* Retrieve relevant context.
* Analyze architecture.
* Create an implementation plan.
* Modify files.
* Use terminal tools.
* Use Git.
* Run tests.
* Run builds.
* Review its changes.
* Detect failures.
* Fix verified issues.
* Maintain checkpoints.
* Produce evidence of completed work.
* Explain why it made important changes.

The central product promise is:

> **YourIDE doesn't just write code. It plans, executes, verifies, reviews, fixes, and proves the work.**

---

# 2. PLATFORM SCOPE

## Desktop

Support:

* Windows
* macOS
* Linux

Initial release targets:

### Windows

* Windows x64

### macOS

* Apple Silicon
* Intel

### Linux

* x64

## CLI

Provide a lightweight CLI independent of Electron.

Support:

* Windows x64
* macOS ARM64
* macOS x64
* Linux x64

Example commands:

```bash
youride .
youride agent
youride chat
youride review
youride fix
```

## Explicitly NOT supported

Do NOT build Termux or Android support into the current architecture.

Do not create:

* Termux build
* Android build
* Termux TUI
* Android-specific agent runtime

## Future

Keep architecture extensible for:

* Web IDE
* Cloud development
* Remote agents
* Cloud workspaces
* Enterprise/self-hosted deployments

Do not implement these prematurely unless required by the current phase.

---

# 3. DESKTOP FOUNDATION

Use:

* VS Code OSS / Code-OSS fork
* Electron
* TypeScript
* Node.js

Retain existing VS Code functionality wherever practical.

Do NOT rewrite the entire VS Code frontend.

Preserve:

* Editor
* Explorer
* Search
* Source control
* Terminal
* Debugger
* Extensions
* Settings
* Workspaces
* Command palette
* Keyboard shortcuts

YourIDE should feel like a serious developer tool rather than a web application placed inside Electron.

---

# 4. YOURIDE AI EXPERIENCE

Add a first-class AI interface inside the IDE.

The AI system should support:

* Chat
* Inline editing
* Code generation
* Code explanation
* Codebase questions
* Agent mode
* Code review
* Debugging
* Refactoring
* Test generation
* Documentation generation
* Architecture analysis

The chat should understand the active project and be able to access authorized project context.

---

# 5. AI CHAT UI

Create a polished native-feeling AI panel.

The interface should include:

* Conversation history
* New conversation
* Model selector
* Free/Premium indicator
* Usage meter
* Remaining quota
* Current request usage
* Agent mode
* Context indicators
* Tool activity
* Approval requests
* Diff previews
* Checkpoints
* Verification results
* Proof of Work

Example:

```text
YOURIDE AI

Model
┌──────────────────────────────┐
│ YourIDE Free AI          ▼  │
└──────────────────────────────┘

AI Usage

██████████████░░░░░░
72%

72,000 / 100,000 credits

28,000 remaining

────────────────────────────────

Ask YourIDE about your project...

                         [Send]
```

During an agent run:

```text
Analyzing repository...
✓ Repository analyzed

Creating plan...
✓ Plan created

Retrieving context...
✓ 18 relevant files identified

Implementing...
⟳ Editing authentication modules

Running tests...
⟳ 27 tests

Reviewing...
⟳ Security review
```

---

# 6. MANAGED AI / SUBSCRIPTION SYSTEM

YourIDE must provide an **Antigravity-style managed AI experience**.

The user should be able to install YourIDE, create an account, and use the built-in AI without manually configuring provider API keys.

The default experience should be:

```text
Install YourIDE
      ↓
Create YourIDE account
      ↓
Receive Free AI allowance
      ↓
Use AI
      ↓
Quota decreases
      ↓
Quota exhausted
      ↓
Upgrade to Pro
      ↓
Premium AI access
```

The quota system itself must be owned and implemented by YourIDE.

Do not depend on a third-party "quota UI" product.

---

# 7. FREE AI TIER

Provide a free AI tier.

The free tier should provide access to appropriate free/low-cost coding models subject to actual provider availability and usage economics.

The user should see:

```text
YourIDE Free AI

████████████░░░░░░░░
60%

60,000 / 100,000 credits

40,000 remaining
```

The exact free allowance must be configurable server-side.

Do NOT hard-code quota values into the desktop client.

The backend must be authoritative.

When the quota reaches zero:

```text
Free AI limit reached.

You've used your available free AI allowance.

Upgrade to YourIDE Pro to continue using premium AI.

[ Upgrade to Pro ]
```

---

# 8. PREMIUM AI

Create paid AI tiers.

Example structure:

```text
YOURIDE FREE
- Free AI models
- Limited monthly allowance
- Standard agent access
- Basic context

YOURIDE PRO
- Premium models
- Larger AI allowance
- Advanced reasoning
- Larger context
- Priority inference
- Advanced agent workloads

YOURIDE MAX
- Higher allowance
- Best available models
- Long-running agent workloads
- Highest priority
- Advanced features
```

Do not hard-code these exact prices or quotas.

Make them configurable through the backend.

---

# 9. YOURIDE CREDITS

Use an internal YourIDE usage unit such as:

**YourIDE AI Credits**

Do not make the public pricing model dependent directly on raw provider token pricing.

Internally track:

* Input tokens
* Output tokens
* Cached tokens where available
* Model
* Provider
* Request duration
* Provider cost
* YourIDE credits consumed

Example:

```text
Fast model:
1 token → configurable credit rate

Premium model:
different credit multiplier

Advanced reasoning:
different credit multiplier
```

This allows YourIDE to change providers without completely redesigning its pricing system.

Users can still see actual token usage for transparency.

---

# 10. USER-SPECIFIC QUOTA

Every user must have an independent quota account.

Conceptual database:

```text
users
subscriptions
quota_accounts
usage_events
```

Example:

```text
User A
Plan: Free
Limit: 100,000
Used: 32,000

User B
Plan: Free
Limit: 100,000
Used: 81,000

User C
Plan: Pro
Limit: 10,000,000
Used: 2,400,000
```

User A's usage must not modify User B's quota.

The frontend must never be authoritative for quota.

---

# 11. QUOTA ENGINE

Create a dedicated quota subsystem.

Responsibilities:

* Check allowance
* Reserve usage
* Record actual usage
* Release unused reservations
* Apply model multipliers
* Enforce limits
* Reset quotas
* Handle subscription changes
* Handle refunds/credits if applicable
* Prevent race conditions
* Prevent double-spending
* Handle concurrent agent requests

The system must be transaction-safe.

For long-running agents, reserve an estimated budget before execution.

Example:

```text
Planner: 30K
Researcher: 20K
Coder: 80K
Verifier: 30K
Reviewer: 25K
Fixer: 40K

Estimated:
225K credits
```

Reserve the budget, then settle against actual usage.

---

# 12. AI USAGE TRACKING

Every AI request should generate a usage event.

Example:

```text
usage_events

id
user_id
organization_id
conversation_id
agent_run_id
provider
model
input_tokens
output_tokens
total_tokens
credits_used
provider_cost
latency
status
created_at
```

Track usage in real time where possible.

The UI should update after requests and during streaming when reliable usage data is available.

---

# 13. PROVIDER ARCHITECTURE

Never hard-code one AI provider.

Use:

```text
YourIDE
   ↓
AI Gateway
   ↓
Model Router
   ↓
Provider adapters
```

Potential providers:

* OpenRouter
* OpenAI
* Anthropic
* Google/Gemini
* Groq
* Cerebras
* Mistral
* Local models
* Other OpenAI-compatible providers

Do not assume all providers expose identical capabilities.

Create a normalized provider interface.

Example:

```ts
interface ModelProvider {
  chat(request: ChatRequest): AsyncIterable<ModelEvent>;
  complete(request: CompletionRequest): AsyncIterable<ModelEvent>;
  embed(request: EmbeddingRequest): Promise<number[][]>;
}
```

---

# 14. OPENROUTER INTEGRATION

OpenRouter should be treated as one provider/model gateway, not as the entire YourIDE architecture.

Support:

* Chat/completions
* Streaming
* Model selection
* Usage reporting
* Provider failures
* Retry/fallback
* Free model routing where appropriate

Where appropriate, YourIDE's backend may use OpenRouter's Management API for provider-side API key administration and per-key spending controls.

Important:

Do NOT assume that creating multiple OpenRouter keys multiplies the actual underlying provider quota.

YourIDE's own quota system remains authoritative.

Provider capacity and YourIDE customer quota are separate concepts.

---

# 15. PROVIDER CREDENTIAL SECURITY

Provider credentials must remain server-side.

Never ship YourIDE master provider keys inside:

* Electron renderer
* Frontend JavaScript
* CLI source
* Public repository
* Desktop configuration
* Browser local storage

The normal request flow should be:

```text
YourIDE Desktop
      ↓
YourIDE authentication
      ↓
YourIDE API
      ↓
Quota check
      ↓
Model authorization
      ↓
Provider credential
      ↓
Provider
```

Provider secrets must be encrypted at rest.

---

# 16. BYOK

Optionally support:

**Bring Your Own Key**

Advanced users can connect their own provider credentials.

Potential providers:

* OpenRouter
* OpenAI
* Gemini
* Anthropic
* Groq
* Compatible endpoints

BYOK usage should be clearly separated from YourIDE-managed usage.

Example:

```text
AI Provider

● YourIDE Managed AI

○ Use my own OpenRouter key

○ Use my own OpenAI key
```

Do not make BYOK mandatory for ordinary users.

---

# 17. MODEL ROUTER

Create a central model-routing engine.

Factors:

* User plan
* Task complexity
* Model capability
* Latency
* Cost
* Context window
* Tool calling support
* Structured output support
* Privacy
* Provider health
* Rate limits
* User preferences
* Free/premium access

Example:

```text
Autocomplete
    ↓
Fast model

Simple edit
    ↓
Medium model

Architecture task
    ↓
Strong reasoning model

Code review
    ↓
Strong review model

Embeddings
    ↓
Embedding model
```

---

# 18. FREE MODEL ROUTING

Do not permanently depend on one free model.

Create:

```text
YourIDE Free Router
```

It should select an appropriate available free model based on:

* Coding capability
* Tool support
* Context size
* Provider availability
* Current rate limits
* Reliability

If one free provider becomes unavailable, the system should support fallback providers where legally and technically appropriate.

The UI can simply say:

```text
YourIDE Free AI
```

rather than exposing implementation details.

---

# 19. LOCAL AI

Support local models as an important long-term option.

Potential backends:

* Ollama
* llama.cpp
* vLLM
* OpenAI-compatible local endpoints

Architecture:

```text
YourIDE
   ↓
Model Router
   ↓
Local Model
```

Use cases:

* Privacy
* Offline development
* Enterprise
* Cost reduction
* Developer-owned hardware

Local usage should not consume YourIDE cloud credits unless explicitly configured.

---

# 20. AGENT CORE

Build a shared Agent Core used by:

* Desktop
* CLI

Do not implement separate AI logic for each interface.

```text
Desktop
   │
CLI ───────┐
           ↓
       Agent Core
```

The Agent Core should manage:

* Task lifecycle
* Planning
* Context retrieval
* Tool execution
* Permissions
* Checkpoints
* Verification
* Review
* Fix loops
* Evidence
* Usage accounting

---

# 21. SPECIALIZED AGENTS

Do not create one giant uncontrolled agent.

Use specialized roles:

```text
              SUPERVISOR
                   │
       ┌───────────┼───────────┐
       ↓           ↓           ↓
    PLANNER      CODER     RESEARCHER
       │           │           │
       └───────────┼───────────┘
                   ↓
               VERIFIER
              ↙        ↘
           TESTER     REVIEWER
              ↘        ↙
                 FIXER
```

### Supervisor

Coordinates the task.

### Planner

Creates structured implementation plans.

### Researcher

Investigates:

* Repository
* Documentation
* Git history
* APIs
* Dependencies
* External documentation
* Issues where permitted

### Coder

Modifies source code.

### Verifier

Runs:

* Typecheck
* Lint
* Unit tests
* Integration tests
* Build
* Project-specific checks

### Reviewer

Reviews:

* Correctness
* Architecture
* Security
* Performance
* Tests
* Regression risk

### Fixer

Addresses verified failures.

---

# 22. STRUCTURED AGENT PLAN

The plan must be a structured object rather than merely text.

Example:

```ts
interface AgentPlan {
  id: string;
  goal: string;

  repository: {
    root: string;
    branch: string;
    commit: string;
  };

  steps: PlanStep[];

  affectedFiles: string[];
  dependencies: string[];
  risks: Risk[];
  verification: VerificationStep[];

  requiredPermissions: PermissionRequest[];
}
```

Every meaningful agent action should reference the plan and step.

---

# 23. AGENT CHECKPOINTS

Implement checkpoints as a first-class feature.

Example:

```text
Checkpoint 1
      ↓
Checkpoint 2
      ↓
Checkpoint 3
      ↓
Checkpoint 4
```

Users should be able to:

* Preview
* Accept
* Reject
* Roll back

A checkpoint should capture enough state to safely restore the workspace.

Where appropriate, integrate with Git and internal patch/snapshot mechanisms.

Do not depend exclusively on Git commits because users may have uncommitted work.

---

# 24. AI TIME MACHINE

Store a structured activity history.

Timeline:

```text
User Request
     ↓
Agent Plan
     ↓
Context Retrieved
     ↓
Tool Calls
     ↓
Files Modified
     ↓
Tests Executed
     ↓
Review
     ↓
Fixes
     ↓
Final Result
```

Allow users to inspect:

* What happened
* When it happened
* What files changed
* Which tools were called
* What commands were executed
* Which context was retrieved
* What tests were run
* What evidence was generated

Allow questions such as:

> Why did the agent modify this file?

The answer should reference structured trace information where available.

---

# 25. PROOF OF WORK

This is a major YourIDE differentiator.

Never finish an agent task with only:

> Done.

Instead produce evidence.

Example:

```text
TASK

Implement OAuth authentication

✓ Repository analyzed
✓ Architecture analyzed
✓ 14 files modified
✓ TypeScript compilation passed
✓ 27 tests passed
✓ Integration tests passed
✓ Git diff reviewed
✓ Security checks passed

Confidence: 92%

Remaining risk:

OAuth callback lacks production integration coverage.
```

Proof of Work should contain:

* Files changed
* Lines/diff summary
* Tests
* Build status
* Typecheck status
* Lint status
* Review findings
* Security findings
* Remaining risks
* Agent confidence
* Relevant artifacts

Confidence must not be presented as objective truth.

Label it as model/system confidence.

---

# 26. CONTEXT ENGINE

The Context Engine is a core subsystem.

Do not send entire repositories to the model by default.

Create a structured code knowledge representation.

Track:

* Files
* Directories
* Symbols
* Functions
* Classes
* Interfaces
* Variables
* Imports
* Calls
* Tests
* Dependencies
* Documentation
* Git relationships
* Configuration
* Project rules

Example:

```text
UserController
      │
      ├── calls → UserService
      │                │
      │                └── UserRepository
      │
      ├── imports → AuthMiddleware
      │
      └── tests → UserController.test.ts
```

---

# 27. CODE INDEXING

Use:

* Tree-sitter
* LSP
* ripgrep
* SQLite
* pgvector where cloud semantic retrieval is required

Pipeline:

```text
Repository
    ↓
Indexer
    ↓
AST
    ↓
Symbols
    ↓
Imports / Calls
    ↓
Code Graph
    ↓
Embeddings
    ↓
Retrieval Index
```

Index incrementally rather than rebuilding everything after every change.

---

# 28. HYBRID RETRIEVAL

Context retrieval should combine:

* Keyword search
* Symbol search
* AST relationships
* Dependency graph
* Semantic search
* Git history
* Test relationships
* Project rules
* Documentation

Then rank retrieved information.

The retrieval system should be independently optimizable.

---

# 29. PROJECT MEMORY

Project memory is separate from general user/conversation memory.

Store project-level information such as:

* Architecture decisions
* Coding conventions
* Known bugs
* Important APIs
* Deployment process
* Testing rules
* Security rules
* Team conventions

Example:

```text
PROJECT RULES

Never use axios.
API calls must use apiClient.
Tests use Vitest.
Generated files must not be edited.
Database migrations are immutable.
```

---

# 30. RULES ENGINE

Support structured project rules.

Example:

```yaml
rules:
  - id: no-direct-db
    applies_to:
      - "src/**/*.ts"
    rule: "Database access must use repository layer"
    severity: error
```

Rules must be evaluated:

* Before implementation
* During planning where applicable
* After modifications
* During review

Severity levels:

* info
* warning
* error
* critical

---

# 31. GIT INTELLIGENCE

Git should be a first-class context source.

The agent should understand:

* Current branch
* Working tree
* Staged changes
* Commits
* Authors
* Commit messages
* File history
* Blame information
* Changed modules
* Historical changes

Support questions such as:

> Why does this function exist?

> Which commit introduced this?

> What changed in authentication recently?

Do not expose private repository information externally without authorization.

---

# 32. TERMINAL INTELLIGENCE

Create controlled terminal tooling.

Potentially safe operations:

```text
git status
git diff
ls
rg
cat
npm test
```

Potentially dangerous:

```text
rm
sudo
chmod
ssh
curl
docker
```

Every command should pass through the Permission Engine.

---

# 33. PERMISSION ENGINE

Create a dedicated permission subsystem.

Supported policies:

* Allow once
* Always allow
* Allow for project
* Allow for session
* Always ask
* Always deny

Example:

```text
Agent wants to run:

npm install

Permission required.

[Allow once]
[Allow for project]
[Deny]
```

Enterprise policies must be able to override local preferences.

---

# 34. SANDBOX

Long-running/autonomous agents should eventually execute in isolated environments.

Architecture:

```text
Agent
 ↓
Permission Engine
 ↓
Sandbox
 ↓
Repository
 ↓
Commands
 ↓
Tests
 ↓
Artifacts
```

Potential technologies:

* Docker
* gVisor
* Firecracker
* Kubernetes later

Do not introduce Kubernetes before it is justified by scale.

---

# 35. BROWSER AGENT

Future agent capability:

```text
Start application
      ↓
Open browser
      ↓
Interact with UI
      ↓
Capture screenshot
      ↓
Inspect DOM
      ↓
Identify issue
      ↓
Modify source
      ↓
Reload
      ↓
Verify
```

This should eventually allow tasks such as:

> Make checkout responsive.

The agent should be capable of visually verifying the result.

---

# 36. VISUAL DEBUGGING

Future pipeline:

```text
Screenshot
    ↓
Vision Model
    ↓
DOM
    ↓
CSS
    ↓
Source Mapping
    ↓
Relevant Component
    ↓
Source File
```

Goal:

```text
Visual problem
      ↓
DOM element
      ↓
Component
      ↓
CSS
      ↓
Source code
```

---

# 37. DOCUMENTATION INTELLIGENCE

Index:

* README
* /docs
* ADRs
* OpenAPI
* Database schema
* Comments
* JSDoc
* Package documentation

Identify sources of truth.

Example:

```text
OpenAPI specification
        >
README example
```

if they conflict.

---

# 38. DEPENDENCY INTELLIGENCE

Understand:

* package.json
* lockfiles
* dependency trees
* package versions
* deprecated dependencies
* vulnerabilities
* licenses
* breaking changes

For upgrade requests, produce:

```text
Current version
Target version

Affected packages
Affected files
Breaking changes
Risk
Required tests
Migration steps
```

---

# 39. MCP / EXTERNAL TOOLS

Eventually support MCP or an equivalent external-tool protocol.

Potential integrations:

* GitHub
* GitLab
* Jira
* Linear
* Slack
* Figma
* PostgreSQL
* AWS
* Sentry
* Datadog
* Notion

Every external action must go through YourIDE's permission system.

---

# 40. EXTENSION STRATEGY

Maintain VS Code extension compatibility as practically as possible.

Architecture:

```text
VS Code Extensions
       ↓
Compatibility Layer
       ↓
YourIDE APIs
```

Eventually create:

**YourIDE Agent Extension API**

Allow developers to build:

* Agent tools
* Context providers
* Custom workflows
* Code analyzers
* Model providers
* Enterprise integrations

---

# 41. MULTI-AGENT MODE

For difficult tasks, multiple agents may independently propose solutions.

Example:

```text
Planner A → Proposal A
Planner B → Proposal B
Planner C → Proposal C
                    ↓
                  Judge
                    ↓
               Final Plan
```

Use this selectively for:

* Large refactors
* Architecture changes
* Security-sensitive tasks
* Complex migrations

Do not use expensive multi-agent workflows for trivial tasks.

---

# 42. OBSERVABILITY

Use OpenTelemetry.

Track:

* Agent latency
* Model latency
* Tool latency
* Token usage
* Credits used
* Provider cost
* Failures
* Retries
* Task success
* User acceptance
* Rollback rate

Create internal dashboards for:

* Agent quality
* Infrastructure health
* Provider health
* Cost
* Usage
* Conversion
* Reliability

---

# 43. EVALUATION SYSTEM

Create an internal benchmark.

```text
Real coding tasks
        ↓
YourIDE Agent
        ↓
Generated patch
        ↓
Tests
        ↓
Evaluation
```

Metrics:

* Task success rate
* First-attempt success
* Tests passed
* Regression rate
* Latency
* Tokens/task
* Credits/task
* Provider cost/task
* Human acceptance rate
* Rollback rate

Primary product metric:

> **Percentage of real developer tasks completed correctly.**

Do not optimize primarily for lines of generated code.

---

# 44. BACKEND

Recommended stack:

* Node.js
* TypeScript
* Fastify
* REST and/or tRPC
* SSE/WebSockets

Streaming events must support:

* Token stream
* Tool calls
* Tool output
* File changes
* Test output
* Approval requests
* Agent status
* Errors
* Completion

---

# 45. DATABASE

Primary:

**PostgreSQL**

Store:

* Users
* Organizations
* Projects
* Subscriptions
* Quota accounts
* Usage
* Agent tasks
* Agent runs
* Agent traces
* Checkpoints
* Project memory
* Rules
* Settings
* Billing metadata
* Provider metadata

Vector search:

**pgvector**

Do not introduce a separate vector database until scale justifies it.

---

# 46. REDIS

Use Redis for:

* Cache
* Rate limiting
* Temporary agent state
* Distributed locks where necessary
* Queues

Do not use Redis as the authoritative billing/quota database.

---

# 47. OBJECT STORAGE

Use S3-compatible storage for:

* Agent artifacts
* Logs
* Build artifacts
* Large evaluation outputs
* Screenshots
* Browser artifacts

---

# 48. AUTHENTICATION

Implement secure user authentication.

Support future:

* Email/password or passwordless authentication
* OAuth
* Sessions
* Device authentication
* Organization accounts

Future enterprise:

* SSO
* SCIM
* RBAC

Never store passwords directly.

Use secure password hashing or a reputable authentication provider.

---

# 49. BILLING

Implement subscription-aware architecture.

Potential payment provider:

* Stripe
* Equivalent regional provider if required

Billing system must handle:

* Subscription creation
* Upgrade
* Downgrade
* Cancellation
* Renewal
* Failed payment
* Grace period
* Credits
* Invoice metadata
* Webhooks

Never trust the client to determine whether a user is paid.

Payment provider webhook → YourIDE backend → subscription state.

---

# 50. SECURITY

Security must be designed from day one.

Required:

* Sandbox
* Permission engine
* Signed binaries
* Signed updates
* Secret protection
* API key encryption
* Audit logs
* Rate limiting
* SSRF protection
* Command restrictions
* Tool allowlists
* Workspace isolation
* Organization policies
* Secure session handling
* CSRF protection where applicable
* Input validation
* Output validation
* Prompt injection defenses

Never allow autonomous agents unrestricted machine access by default.

---

# 51. ENTERPRISE

Future enterprise features:

* SSO
* SCIM
* RBAC
* Audit logs
* Organization rules
* Model policies
* Self-hosted Model Gateway
* Private networking
* Data retention controls
* Secret management
* Enterprise agent policies

---

# 52. MONOREPO

Recommended structure:

```text
youride/
│
├── apps/
│   ├── desktop/
│   │   ├── electron/
│   │   └── vscode-fork/
│   │
│   ├── cli/
│   │
│   └── website/
│
├── packages/
│   ├── agent-core/
│   ├── agent-tools/
│   ├── context-engine/
│   ├── code-indexer/
│   ├── retrieval/
│   ├── model-gateway/
│   ├── model-router/
│   ├── git-engine/
│   ├── terminal-engine/
│   ├── sandbox/
│   ├── browser-agent/
│   ├── permission-engine/
│   ├── rules-engine/
│   ├── project-memory/
│   ├── quota-engine/
│   ├── usage-engine/
│   ├── billing-engine/
│   ├── provider-manager/
│   ├── openrouter/
│   ├── evals/
│   └── shared/
│
├── services/
│   ├── api/
│   ├── agent-worker/
│   ├── model-router/
│   └── indexing-worker/
│
└── infrastructure/
    ├── docker/
    ├── terraform/
    └── k8s/
```

Adapt this to the existing repository instead of blindly imposing it.

---

# 53. WEBSITE

Create a professional YourIDE website.

Purpose:

* Product marketing
* Downloads
* Documentation
* Pricing
* Changelog
* Blog
* Extensions
* Authentication
* User dashboard
* Billing
* Future cloud agent access

Recommended:

* Next.js
* TypeScript
* Tailwind CSS
* shadcn/ui
* PostgreSQL
* Object storage
* Authentication system
* Stripe/equivalent

Routes:

```text
/
 /download
 /docs
 /pricing
 /changelog
 /blog
 /extensions
 /cloud
 /login
 /signup
 /dashboard
 /settings
 /billing
```

---

# 54. DOWNLOAD CENTER

Automatically detect:

* Operating system
* CPU architecture

Example:

```text
You're using Windows x64

[ Download YourIDE ]
```

Also show:

```text
Other downloads

Windows
macOS Apple Silicon
macOS Intel
Linux
CLI
```

Do not falsely identify unsupported architectures.

---

# 55. BUILD MATRIX

## Windows

Initial:

* x64

Output:

```text
YourIDE-Setup.exe
```

Potential:

* MSI

Future:

* ARM64

## macOS

Initial:

* Apple Silicon
* Intel

Output:

```text
YourIDE.dmg
```

Requirements:

* Code signing
* Notarization
* Correct entitlements

Future:

* Universal build

## Linux

Initial:

* x64

Formats:

```text
.deb
AppImage
.tar.gz
```

Future:

* rpm
* Flatpak
* Snap
* AUR

---

# 56. CLI

CLI must not depend on Electron.

Commands:

```bash
youride .
youride agent
youride chat
youride review
youride fix
```

Architecture:

```text
CLI
 ↓
Agent Core
 ↓
Model Gateway
```

The CLI should reuse the same agent implementation as Desktop.

---

# 57. AUTO UPDATES

Implement signed automatic updates.

Flow:

```text
YourIDE
 ↓
Check latest version
 ↓
Download
 ↓
Verify signature
 ↓
Install
 ↓
Restart
```

Channels:

* Stable
* Beta
* Nightly

---

# 58. CI/CD

Use GitHub Actions or equivalent.

Flow:

```text
Git Push
    ↓
CI
    ↓
Tests
    ↓
Build
    ↓
Windows
    ↓
macOS
    ↓
Linux
    ↓
Artifacts
    ↓
Release
    ↓
Download Website
```

Automate:

* Unit tests
* Integration tests
* Typecheck
* Lint
* Packaging
* Signing where credentials are available
* Release artifacts

---

# 59. INFRASTRUCTURE

Initial:

* Docker
* GitHub Actions
* PostgreSQL
* Redis
* S3-compatible storage
* OpenTelemetry
* Sentry

Later:

* Terraform
* Kubernetes
* Firecracker
* gVisor
* Prometheus
* Grafana

Do not introduce Kubernetes prematurely.

---

# 60. DEVELOPMENT PHASES

Do NOT attempt to build the entire ultimate architecture simultaneously.

## PHASE 0 — AUDIT

Before coding:

* Inspect repository
* Map architecture
* Identify working systems
* Identify broken systems
* Identify dependencies
* Identify build process
* Identify existing AI functionality
* Identify current frontend
* Identify current backend

Produce:

```text
Current State
Problems
Architecture
Technical Debt
Implementation Plan
```

---

# 61. PHASE 1 — CORE IDE

Build:

```text
VS Code fork
+
AI Chat
+
Inline Edit
+
Codebase Context
+
Basic Agent
+
Terminal Tools
+
Git Diff
+
Model Gateway
```

The first milestone is:

```text
User
 ↓
Chat
 ↓
AI
 ↓
Understand project
 ↓
Modify code
 ↓
Show diff
```

---

# 62. PHASE 2 — TRUST

Add:

```text
Checkpoints
Rollback
Permissions
Agent Trace
Test Verification
Automatic Review
Proof of Work
```

Target workflow:

```text
Request
 ↓
Plan
 ↓
Implement
 ↓
Checkpoint
 ↓
Test
 ↓
Review
 ↓
Fix
 ↓
Proof
```

---

# 63. PHASE 3 — INTELLIGENCE

Add:

* Code Knowledge Graph
* Project Memory
* Git Intelligence
* Hybrid Retrieval
* Model Routing
* Rules Engine
* Dependency Intelligence
* Documentation Intelligence

---

# 64. PHASE 4 — AUTONOMOUS DEVELOPMENT

Add:

* Browser Agent
* Visual Debugging
* Sandbox
* Long-running tasks
* Multi-agent workflows

---

# 65. PHASE 5 — PLATFORM

Add:

* MCP
* Extension SDK
* Cloud Agents
* Remote environments
* Team collaboration
* Enterprise
* Self-hosting

---

# 66. IMPLEMENTATION RULES

Follow these rules throughout development.

### Rule 1

Do not rewrite working systems unnecessarily.

### Rule 2

Do not create fake functionality.

If a feature is not actually implemented, clearly mark it as unavailable.

### Rule 3

Do not hard-code provider credentials.

### Rule 4

Do not hard-code user quotas into the client.

### Rule 5

Backend authorization is authoritative.

### Rule 6

All autonomous commands pass through permissions.

### Rule 7

All important AI changes should be recoverable.

### Rule 8

All completed agent tasks should produce evidence.

### Rule 9

Prefer simple architecture until scale requires complexity.

### Rule 10

Do not introduce Kubernetes, Firecracker, or other infrastructure prematurely.

### Rule 11

Use existing VS Code APIs and extension infrastructure whenever practical.

### Rule 12

Keep Desktop and CLI dependent on the same Agent Core.

### Rule 13

Provider-specific implementations belong behind the Model Gateway.

### Rule 14

Quota, billing, provider cost, and token accounting must be separate concepts.

### Rule 15

Never trust the client for subscription, quota, permissions, or billing state.

---

# 67. PRIMARY USER EXPERIENCE

The ideal experience is:

```text
Install YourIDE
       ↓
Create account
       ↓
Open project
       ↓
YourIDE indexes project
       ↓
User opens AI Chat
       ↓
Free AI available
       ↓
User asks:

"Add authentication."
       ↓
Agent understands project
       ↓
Creates plan
       ↓
Shows plan
       ↓
Requests required permissions
       ↓
Modifies code
       ↓
Creates checkpoint
       ↓
Runs tests
       ↓
Reviews changes
       ↓
Fixes failures
       ↓
Creates Proof of Work
       ↓
User accepts changes
```

This should feel like an **AI software engineer operating inside the IDE**, not autocomplete with a chat panel.

---

# 68. PRODUCT DIFFERENTIATION

Do NOT market YourIDE merely as:

> "A Cursor alternative."

Primary positioning:

> **An AI-native software engineering environment that doesn't just write code — it plans, executes, verifies, reviews, and proves the work.**

Core differentiators:

1. Proof of Work
2. AI Time Machine
3. Agent Checkpoints
4. Code Knowledge Graph
5. Verification-first Agent
6. Browser + Code Loop
7. Project Memory
8. Model Router
9. Desktop + CLI
10. Extensible Agent Platform
11. Managed Free AI + Paid Premium AI

---

# 69. SUCCESS CRITERIA

YourIDE should eventually be able to take a real-world request and complete it with minimal human intervention while remaining controlled and auditable.

Success is NOT:

* Number of generated lines
* Number of AI messages
* Number of models available

Success is:

```text
Can YourIDE correctly complete real developer tasks?
```

Measure:

* Correctness
* Reliability
* Verification rate
* Regression rate
* Time to completion
* Cost
* User acceptance
* Rollback frequency
* Agent success rate

---

# 70. FINAL ARCHITECTURE

The long-term architecture should converge toward:

```text
                         YOURIDE
                            │
              ┌─────────────┴─────────────┐
              ↓                           ↓
          DESKTOP                        CLI
              │                           │
              └─────────────┬─────────────┘
                            ↓
                       AGENT CORE
                            │
       ┌────────────────────┼────────────────────┐
       ↓                    ↓                    ↓
   SUPERVISOR             CONTEXT              TOOLS
       │                    │                    │
       ↓                    ↓                    ↓
 Planner/Coder        Knowledge Graph        Terminal
 Researcher           Retrieval              Git
 Verifier             Memory                 Browser
 Reviewer             Rules                  Sandbox
 Fixer                Git Intelligence       External Tools
       │                    │                    │
       └────────────────────┼────────────────────┘
                            ↓
                       MODEL GATEWAY
                            │
                       MODEL ROUTER
                            │
             ┌──────────────┼──────────────┐
             ↓              ↓              ↓
          Free AI       Premium AI      Local AI
             │              │              │
             └──────────────┼──────────────┘
                            ↓
                       VERIFICATION
                            ↓
                       CHECKPOINT
                            ↓
                       AI TRACE
                            ↓
                      PROOF OF WORK
```

---

# 71. MANAGED AI BUSINESS ARCHITECTURE

The AI subscription layer should converge toward:

```text
                         YOURIDE
                            │
                      USER ACCOUNT
                            │
                      SUBSCRIPTION
                            │
                 ┌──────────┴──────────┐
                 ↓                     ↓
               FREE                   PRO
                 │                     │
          Free AI allowance      Premium allowance
                 │                     │
                 └──────────┬──────────┘
                            ↓
                       QUOTA ENGINE
                            ↓
                       MODEL ROUTER
                            ↓
                      AI GATEWAY
                            ↓
               ┌────────────┼────────────┐
               ↓            ↓            ↓
          OpenRouter      OpenAI       Gemini
               │
          Free/Premium
            models
```

Every user must have an independent YourIDE quota.

The provider layer must remain separate from the customer-facing subscription layer.

The user should experience:

```text
Free AI
   ↓
Use allowance
   ↓
Usage meter
   ↓
Quota exhausted
   ↓
Upgrade to Pro
   ↓
Premium AI
```

---

# 72. FINAL DEVELOPMENT INSTRUCTION

Build YourIDE incrementally.

Do not attempt to implement every future subsystem at once.

Start by making the **core loop excellent**:

```text
UNDERSTAND
 ↓
PLAN
 ↓
IMPLEMENT
 ↓
RUN
 ↓
VERIFY
 ↓
REVIEW
 ↓
FIX
 ↓
PROVE
```

Everything else should support that loop.

Before each major implementation stage:

1. Inspect the current code.
2. Explain what exists.
3. Identify dependencies.
4. Create a concrete plan.
5. Implement incrementally.
6. Test each stage.
7. Do not break working functionality.
8. Report exactly what works.
9. Report what remains.
10. Continue to the next stage.

The final product must feel like a serious professional development environment capable of evolving into a complete AI software-engineering platform.

**Do not build a chatbot attached to an IDE.

Build an IDE whose core development workflow can be operated by an AI software engineer.**
