BUILD A NEW CATEGORY: AI SOFTWARE ENGINEERING PLATFORM

You are not being asked to build another AI code editor.

You are being asked to design and build a potentially market-leading AI Software Engineering Platform that can compete with and, where possible, redefine the categories occupied by AI-native IDEs, coding agents, autonomous software engineers, browser app builders, cloud development environments, CLI agents, and traditional IDEs.

Think like the founder, principal product architect, AI systems architect, developer-tools engineer, UX designer, security architect, infrastructure architect, and business strategist responsible for making this product succeed at global scale.

The objective is:

«Maximum useful capability + genuine differentiation + maximum adoption + exceptional retention + sustainable maximum profit + maximum platform reach.»

Do not optimize for any single one of these at the expense of the others.

---

1. THE CORE VISION

Build a platform where a person can express software intent and the platform can intelligently move from:

IDEA
 ↓
RESEARCH
 ↓
REQUIREMENTS
 ↓
SPECIFICATION
 ↓
ARCHITECTURE
 ↓
PLANNING
 ↓
IMPLEMENTATION
 ↓
TESTING
 ↓
DEBUGGING
 ↓
SECURITY
 ↓
REVIEW
 ↓
DEPLOYMENT
 ↓
MONITORING
 ↓
MAINTENANCE

The platform should support both:

Beginner workflow

«"Build me a website for my business."»

and:

Professional workflow

«"Refactor this distributed service, preserve API compatibility, add regression coverage, benchmark it, and prepare a staging deployment."»

The same underlying platform should support both.

---

2. DO NOT BUILD A CLONE

The product must not be positioned internally or externally as:

- a Cursor clone
- a Windsurf clone
- a Replit clone
- a Lovable clone
- a Claude Code clone
- a Codex clone
- a Devin clone
- an Antigravity clone
- a Copilot clone
- a Kiro clone

Use the entire market as the baseline, not the ceiling.

The objective is:

«Everything users already expect + substantially better execution + capabilities created by combining systems that competitors keep separate + genuinely new capabilities.»

---

3. MANDATORY COMPETITIVE ANALYSIS BEFORE IMPLEMENTATION

Before making final product decisions, analyze the current market.

At minimum investigate:

- Cursor
- Windsurf
- GitHub Copilot
- Google Antigravity
- Amazon Kiro
- Replit
- Lovable
- Bolt
- v0
- Devin
- Claude Code
- OpenAI Codex
- Cline
- Aider
- Zed
- JetBrains AI/Junie
- Sourcegraph/Cody
- Augment
- Amazon Q Developer
- major emerging AI development products available at implementation time

Also examine relevant:

- VS Code ecosystem
- JetBrains ecosystem
- terminal-based developer tooling
- browser-based development environments
- cloud IDEs
- autonomous agent frameworks
- MCP ecosystem
- model providers
- local AI tooling

Do not assume this list remains complete.

Research current competitors before finalizing the product architecture.

For each competitor identify:

1. What it does exceptionally well
2. What users love
3. What users dislike
4. What users complain about
5. What it costs
6. How its AI usage is monetized
7. Its agent architecture
8. Its context architecture
9. Its model strategy
10. Its platform strategy
11. Its extensibility
12. Its security model
13. Its biggest limitations
14. What it does that we must match
15. What it does that we should deliberately do differently

Create an internal competitive capability matrix.

Do not merely copy descriptions into the product.

---

4. FEATURE-PARITY REQUIREMENT

Everything that has become a legitimate expectation in modern AI development environments should be considered table stakes.

This includes, where appropriate:

IDE

- professional code editor
- syntax highlighting
- IntelliSense
- language servers
- autocomplete
- code navigation
- symbol search
- refactoring
- debugger
- terminal
- Git
- extensions
- themes
- keyboard shortcuts
- command palette
- workspace management
- multi-root workspaces
- split panes
- tabs
- search
- replace
- settings

AI

- chat
- inline editing
- code generation
- explanation
- refactoring
- debugging
- autocomplete
- agent mode
- plan mode
- ask mode
- review mode
- research mode
- architecture assistance
- documentation generation

Agents

- autonomous agents
- subagents
- parallel agents
- background agents
- cloud agents
- terminal agents
- browser agents
- specialized agents
- custom agents
- agent teams
- task delegation
- task dependencies
- agent memory
- agent skills
- agent permissions

Development lifecycle

- requirements
- specs
- architecture
- implementation
- testing
- debugging
- security
- performance
- review
- deployment
- monitoring
- documentation
- maintenance

App-building

- natural-language application creation
- frontend generation
- backend generation
- database generation
- authentication
- APIs
- preview
- deployment

Infrastructure

- containers
- cloud environments
- databases
- environment variables
- secrets
- CI/CD
- logs
- observability

Integrations

- GitHub
- GitLab
- Bitbucket
- Jira
- Linear
- Slack
- MCP
- cloud providers
- databases
- deployment platforms
- issue trackers

Do not omit important capabilities simply because competitors already provide them.

---

5. COMPETITIVE INNOVATION ENGINE

After achieving feature parity, deliberately search for differentiation.

For every major subsystem ask:

A. Can we match the best existing implementation?

B. Can we make it substantially better?

C. Can we combine it with another capability to create a new workflow?

D. What important developer problem remains unsolved?

E. What new capability becomes possible because our systems share common project intelligence?

F. Would this feature give users a reason to switch?

G. Would it give users a reason to stay?

Do not add gimmicks merely to claim innovation.

Prioritize innovations that improve:

- developer productivity
- reliability
- trust
- project understanding
- agent coordination
- software quality
- cost efficiency
- onboarding
- collaboration
- accessibility
- deployment
- maintenance
- cross-platform development

The product must develop its own identity rather than becoming an accumulation of competitor features.

---

6. PRODUCT ARCHITECTURE

Use a layered architecture.

┌──────────────────────────────────────────────┐
│             USER EXPERIENCE                  │
│ IDE • CLI • WEB • MOBILE • REMOTE            │
├──────────────────────────────────────────────┤
│             AI EXPERIENCE                    │
│ Chat • Plan • Agent • Research • Review      │
├──────────────────────────────────────────────┤
│             AGENT PLATFORM                   │
│ Director • Agents • Teams • Tasks • Skills   │
├──────────────────────────────────────────────┤
│             INTELLIGENCE LAYER               │
│ Project Brain • Context • Memory • Graph     │
├──────────────────────────────────────────────┤
│             MODEL GATEWAY                    │
│ OpenAI • Anthropic • Google • etc.           │
├──────────────────────────────────────────────┤
│             EXECUTION LAYER                  │
│ Terminal • Browser • Sandbox • Cloud         │
├──────────────────────────────────────────────┤
│             DEVELOPMENT FOUNDATION           │
│ Editor • LSP • Git • Debugger • Filesystem   │
└──────────────────────────────────────────────┘

The AI/agent/platform layers must remain as independent as practical from the editor foundation.

---

7. EDITOR STRATEGY

Use a VS Code-derived foundation initially to obtain mature:

- editor capabilities
- language support
- terminal
- Git
- debugging
- workspace functionality
- extension ecosystem
- accessibility
- cross-platform behavior

However:

«Do not make the AI platform architecturally dependent on VS Code.»

Build our own independent:

- Agent Runtime
- Model Gateway
- Context Engine
- Project Brain
- Memory
- Task Engine
- Permission System
- Verification Engine
- Tool Runtime
- Cloud Agent Runtime
- Workflow Engine

The VS Code-based desktop application is one client of this platform.

Do not design the company around "a VS Code fork."

Design it around:

«a software engineering platform that initially uses a VS Code-derived client.»

---

8. MULTI-PLATFORM STRATEGY

Provide first-class support for:

Windows

Desktop application.

macOS

Desktop application.

Linux

Desktop application.

CLI

Support:

- Windows
- macOS
- Linux
- WSL
- SSH
- remote servers
- CI environments

The CLI must be a genuine first-class interface.

Examples:

product
product agent
product plan
product review
product test
product debug
product deploy
product status
product login

Web

Provide a browser-based workspace and control center.

Mobile

Do not attempt to duplicate the desktop IDE.

Provide:

- agent monitoring
- task management
- approvals
- notifications
- artifact review
- screenshots
- logs
- remote commands within permission limits

Remote development

Support:

- SSH
- containers
- dev containers
- WSL
- cloud workspaces
- remote repositories

---

9. THE PROJECT BRAIN

Create a persistent intelligence layer called:

PROJECT BRAIN

It must understand the project as a system.

Track:

- files
- folders
- symbols
- dependencies
- services
- APIs
- databases
- infrastructure
- requirements
- architecture
- tests
- documentation
- design system
- project rules
- decisions
- technical debt
- bugs
- deployment
- agent history
- tasks
- user flows

Build relationships between these objects.

The Project Brain should answer questions such as:

- Why does this file exist?
- What depends on this function?
- Which requirement caused this feature?
- Which tests verify this behavior?
- What could break if this API changes?
- Which agent changed this subsystem?
- What architectural decisions constrain this code?
- Which documentation is now outdated?

Continuously update the Project Brain.

---

10. CONTEXT ENGINE

Build intelligent context selection.

Potential context:

- current file
- selection
- open files
- repository
- symbols
- dependency graph
- Git history
- Git diff
- terminal
- browser
- screenshots
- documentation
- Project Brain
- memory
- tasks
- databases
- APIs
- MCP resources

Do not blindly send the repository.

Rank context by relevance.

Show the user a concise context summary.

Support references such as:

@file
@folder
@symbol
@repo
@git
@terminal
@browser
@task
@database
@api
@docs
@project

---

11. MEMORY

Implement:

User memory

Persistent preferences.

Project memory

Project-specific knowledge.

Task memory

Temporary task context.

Memory must be:

- inspectable
- editable
- searchable
- deletable
- scoped

Do not allow uncontrolled memory accumulation.

---

12. AI DIRECTOR

Create a top-level orchestration layer.

Call it:

AI DIRECTOR

The Director receives user intent and decides:

- what kind of task this is
- whether research is required
- whether specification is required
- which agents are needed
- which models are appropriate
- which tasks can run concurrently
- which tasks depend on others
- what permissions are necessary
- what verification is required
- when humans must intervene

The Director should optimize for correctness and cost, not maximum agent activity.

---

13. ENGINEERING AGENTS

Provide specialized agents including:

- Product Manager
- Researcher
- Architect
- Frontend Engineer
- Backend Engineer
- Full-stack Engineer
- Mobile Engineer
- Database Engineer
- UI/UX Designer
- QA Engineer
- Security Engineer
- Performance Engineer
- DevOps Engineer
- Documentation Engineer
- Code Reviewer
- Release Manager

Allow custom agents.

Each agent has:

- identity
- role
- instructions
- model
- tools
- skills
- memory
- permissions
- budget
- timeout
- environment
- allowed paths

---

14. ENGINEERING COUNCIL

For difficult decisions allow multiple independent agents/models to analyze a problem.

Example:

Architect A
Architect B
Architect C
      ↓
Independent analysis
      ↓
Judge
      ↓
Comparison
      ↓
Recommended solution

Evaluate:

- correctness
- simplicity
- maintainability
- security
- performance
- scalability
- cost
- compatibility

Do not expose hidden chain-of-thought.

Expose concise conclusions and evidence.

---

15. AGENT TEAMS

Allow users to create reusable teams.

Example:

Startup Team

- Product Manager
- Researcher
- Architect
- Designer
- Frontend
- Backend
- Database
- QA
- Security
- DevOps

A user can invoke the entire team for a sufficiently complex task.

---

16. PARALLEL EXECUTION

Support parallel work where tasks are independent.

Example:

Frontend ──────┐
Backend ───────┤
Database ──────┼──→ Integration
Tests ─────────┤
Documentation ─┘

Automatically determine dependencies.

Show:

- task graph
- agent status
- progress
- duration
- cost
- files changed
- logs
- artifacts
- failures

---

17. TASK SYSTEM

Create a first-class task graph.

Every task contains:

- objective
- owner
- status
- dependencies
- requirements
- acceptance criteria
- permissions
- model
- budget
- files
- verification requirements

Statuses:

- Backlog
- Planned
- Ready
- Running
- Waiting
- Review
- Failed
- Completed

Allow humans to modify task relationships.

---

18. DEVELOPMENT MODES

Provide:

ASK

Read-only investigation.

PLAN

Requirements → design → tasks → verification.

No modification until approved.

AGENT

Autonomous execution within permissions.

DEBUG

Reproduce → investigate → hypothesis → fix → verify.

REVIEW

Read-only engineering review.

DESIGN

UI/UX-focused workflow.

RESEARCH

Research before implementation.

ARCHITECT

Architecture creation and critique.

---

19. SPEC-FIRST WORKFLOW

For complex tasks provide:

Requirements

What must be built.

Design

How it should work.

Architecture

Technical approach.

Tasks

Implementation sequence.

Acceptance criteria

Measurable success.

Verification

How success will be demonstrated.

The user can edit the specification before implementation.

For trivial tasks, don't force unnecessary ceremony.

---

20. MODEL GATEWAY

Never depend on one AI company.

Create provider adapters for major hosted and local model ecosystems.

Support:

- OpenAI
- Anthropic
- Google
- xAI
- DeepSeek
- Qwen
- Mistral
- OpenRouter
- Ollama
- LM Studio
- custom OpenAI-compatible APIs
- enterprise/private endpoints

Do not hard-code today's model names into the core architecture.

Models should be dynamically configurable.

---

21. INTELLIGENT MODEL ROUTING

Choose models according to:

- task difficulty
- context size
- coding ability
- reasoning requirement
- latency
- cost
- vision capability
- privacy requirements
- user preference

Allow manual selection.

Allow user-defined routing rules.

Example:

Autocomplete → fastest suitable model
Architecture → strongest reasoning model
UI screenshot → vision model
Simple documentation → low-cost model
Private repository → local model

---

22. MODEL COMPETITION

For important tasks allow multiple models to independently solve the same problem.

Then evaluate results using a judge.

Possible workflow:

Problem
 ↓
Model A
Model B
Model C
 ↓
Evaluation
 ↓
Best solution
 ↓
Implementation

Do not waste multiple models on trivial tasks.

Use competition selectively where its expected value exceeds its cost.

---

23. BYOK

Allow users to provide their own:

- API keys
- endpoints
- local models
- enterprise endpoints

BYOK must be a first-class architecture capability.

Clearly show:

- who pays for inference
- which provider is being used
- where code is being sent

---

24. LOCAL-FIRST

Support local:

- models
- indexing
- Project Brain
- Git
- terminal
- browser testing
- development environments

A user should be able to work privately without sending project code to our hosted AI infrastructure where technically feasible.

---

25. MCP

Provide first-class Model Context Protocol support.

Support:

- local MCP servers
- remote MCP servers
- authentication
- OAuth where applicable
- tools
- resources
- prompts

Every MCP server must expose:

- status
- permissions
- available tools
- logs
- configuration

---

26. UNIVERSAL TOOL RUNTIME

Create a consistent tool abstraction for:

- filesystem
- terminal
- browser
- Git
- databases
- APIs
- MCP
- cloud
- deployment
- search
- documentation

Agents should interact with tools through one permission and audit system.

---

27. PERMISSION SYSTEM

Create granular autonomy controls.

READ

Read/search.

EDIT

Modify files.

EXECUTE

Run commands.

NETWORK

Access external services.

INFRASTRUCTURE

Modify infrastructure.

PRODUCTION

Production operations.

DESTRUCTIVE

Irreversible actions.

Allow:

- Always allow
- Ask
- Deny

per tool/category/project/agent.

Critical destructive actions require explicit authorization.

---

28. SANDBOXING

Agents must run in controlled environments.

Control:

- filesystem
- network
- environment variables
- secrets
- processes
- CPU
- memory
- execution time

Never expose credentials unnecessarily.

Secrets should not automatically enter model context.

---

29. CHECKPOINTS AND ROLLBACK

Before significant modifications create checkpoints.

Preserve:

- files
- Git state
- task state
- relevant artifacts
- agent state

Allow:

- compare
- restore
- rollback
- branch from checkpoint

Every autonomous modification should be recoverable.

---

30. AGENT REPLAY AND AUDIT

Record structured actions:

- agent
- model
- task
- files accessed
- files modified
- commands
- tool calls
- approvals
- tests
- errors
- retries
- artifacts
- result

Do not expose hidden chain-of-thought.

Instead provide concise action summaries.

---

31. TRUST SYSTEM

Every meaningful AI task should answer:

What did it do?

What changed?

Why was that approach selected?

What was verified?

What remains uncertain?

How can it be undone?

Trust is a core product feature.

---

32. PROOF OF COMPLETION

Never declare success merely because code changed.

Generate a:

PROOF OF COMPLETION

Containing applicable evidence:

- requirements satisfied
- specification satisfied
- files changed
- build result
- tests
- browser verification
- API verification
- security checks
- accessibility
- performance
- project-rule compliance
- Git diff
- deployment status
- remaining risks

Display:

VERIFIED

only when sufficient evidence exists.

---

33. SELF-HEALING DEVELOPMENT LOOP

Agents should follow:

Understand
 ↓
Plan
 ↓
Implement
 ↓
Build
 ↓
Test
 ↓
Run
 ↓
Observe
 ↓
Diagnose
 ↓
Fix
 ↓
Retest
 ↓
Security
 ↓
Rules
 ↓
Review
 ↓
Verify

Allow configurable retry limits and budgets.

---

34. PROJECT RULES

Support:

- global rules
- project rules
- folder rules
- language rules
- agent rules
- team rules

Rules should be machine-checkable where possible.

Do not merely place rules into the prompt.

Validate agent output against them.

---

35. GIT

Support:

- status
- diff
- stage
- commit
- branch
- merge
- rebase
- stash
- cherry-pick
- tags
- history
- blame
- conflict resolution

AI:

- commit generation
- diff explanation
- review
- PR generation
- PR summaries
- risk analysis

Support major Git hosting platforms.

---

36. TERMINAL

Provide a full terminal.

Support:

- multiple sessions
- shells
- history
- environments
- working directories
- command replay

Agents use the same terminal through the permission system.

---

37. BROWSER AGENT

Provide an AI-controlled browser.

Capabilities:

- navigation
- click
- type
- scroll
- DOM inspection
- console inspection
- network inspection
- screenshots
- recordings
- responsive testing

Agents should be able to test localhost applications.

---

38. VISUAL DEVELOPMENT

Allow users to select rendered UI elements and edit them visually.

Support:

- text
- spacing
- layout
- typography
- colors
- components
- responsive behavior
- images
- animations

Changes must map to real source code.

---

39. DESIGN SYSTEM INTELLIGENCE

Track:

- colors
- typography
- spacing
- components
- icons
- shadows
- borders
- breakpoints
- animations

AI should reuse existing project design tokens.

Detect inconsistent UI.

---

40. TESTING ENGINE

Support:

- unit
- integration
- end-to-end
- API
- browser
- visual regression
- accessibility
- performance

Determine appropriate tests automatically after changes.

---

41. SECURITY ENGINE

Continuously analyze:

- dependencies
- secrets
- authentication
- authorization
- injection
- XSS
- CSRF
- SSRF
- database permissions
- exposed endpoints
- configuration

Create remediation tasks.

---

42. PERFORMANCE ENGINE

Analyze:

- CPU
- memory
- network
- bundle size
- rendering
- API latency
- database queries
- caching

Create optimization tasks.

---

43. DATABASE CENTER

Support common databases and external providers.

Provide:

- schema
- tables
- rows
- SQL editor
- migrations
- relationships
- indexes
- query analysis

Protect destructive actions.

---

44. API CENTER

Support:

- REST
- GraphQL
- WebSockets
- OpenAPI

Provide:

- explorer
- request testing
- schema analysis
- client generation
- documentation
- mocking
- tests

---

45. DEPLOYMENT CENTER

Support major deployment/cloud providers plus generic infrastructure.

Provide:

- build
- preview
- deploy
- rollback
- environment variables
- logs
- health checks

Support both:

Platform-managed deployment

and:

Bring-your-own infrastructure

Do not force vendor lock-in.

---

46. OBSERVABILITY

Integrate:

- logs
- errors
- metrics
- traces where available
- build failures
- deployment failures

Agents should be able to investigate real runtime failures.

---

47. DOCUMENTATION

Automatically maintain:

- README
- architecture
- API docs
- setup instructions
- changelog
- developer documentation

Detect documentation drift.

---

48. TECHNICAL DEBT

Detect:

- duplicated code
- dead code
- obsolete dependencies
- missing tests
- architectural inconsistencies
- outdated documentation
- unnecessary complexity

Turn findings into actionable tasks.

---

49. PROJECT HEALTH

Provide an evidence-based health dashboard covering:

- security
- testing
- architecture
- dependencies
- documentation
- performance
- accessibility
- technical debt

Do not manufacture arbitrary scores.

Every score should have evidence.

---

50. REQUIREMENT TRACEABILITY

Connect:

Requirement
 ↓
Specification
 ↓
Architecture
 ↓
Task
 ↓
Code
 ↓
Test
 ↓
Verification
 ↓
Release

Users can navigate the chain.

---

51. ARCHITECTURE VISUALIZATION

Generate and maintain:

- architecture diagrams
- dependency graphs
- database ER diagrams
- API maps
- user flows
- agent graphs

Keep them synchronized with the Project Brain where practical.

---

52. EXPERIMENT SYSTEM

Allow:

«"Try three different approaches."»

Create isolated branches/workspaces.

Compare:

- correctness
- design
- performance
- complexity
- maintainability
- security

Allow:

- select A
- select B
- combine
- reject

---

53. RELEASE MANAGEMENT

Provide:

Plan
 ↓
Implement
 ↓
Test
 ↓
Security
 ↓
Review
 ↓
Build
 ↓
Staging
 ↓
Verification
 ↓
Approval
 ↓
Production
 ↓
Monitoring

Generate release notes.

---

54. REMOTE AGENTS

Allow tasks to continue after the user closes the desktop application.

Users can return later and see:

- progress
- logs
- screenshots
- artifacts
- tests
- failures
- pending approvals

Provide safe pause/resume/cancel.

---

55. REMOTE CONTROL

From Web/mobile allow:

- view agents
- view tasks
- approve
- reject
- pause
- stop
- send instructions
- inspect artifacts
- review screenshots
- view logs

Honor the same permission system as desktop.

---

56. EXTENSION PLATFORM

Build an extension architecture for:

- languages
- agents
- skills
- models
- MCP
- tools
- themes
- workflows
- integrations

Make future ecosystem growth possible.

---

57. AGENT MARKETPLACE

Eventually support marketplace distribution for:

- agents
- skills
- workflows
- templates
- MCP integrations
- rules
- model configurations

Provide security/reputation mechanisms for marketplace content.

---

58. NATURAL-LANGUAGE INTERFACE

Most common development actions should be possible through natural language.

Examples:

«"Find why login is failing."»

«"Build this page."»

«"Run the tests."»

«"Make this faster."»

«"Audit authentication."»

«"Compare these architectures."»

«"Deploy staging."»

«"Explain this service."»

The system should infer the correct workflow.

---

59. COMMAND PALETTE

Provide a universal command system:

- Run Agent
- Create Plan
- Start Research
- Start Engineering Council
- Run Security Audit
- Run Tests
- Open Browser
- Create Checkpoint
- Roll Back
- Compare Models
- Start Experiment
- Open Project Brain
- Connect MCP
- Deploy
- Review Changes

---

60. COST ENGINE

Create a transparent AI economics layer.

Before expensive operations show:

- provider
- model
- estimated usage
- estimated cost
- current budget
- remaining budget
- execution mode

Never silently exceed user-configured limits.

---

61. THREE AI EXECUTION MODES

Support:

LOCAL

User's hardware performs inference/execution where possible.

BYOK

User's provider account performs inference.

HOSTED

Our infrastructure performs inference/execution.

Clearly distinguish these modes.

---

62. FREE PLAN

Create a genuinely useful free tier.

It must:

- require no payment method where economically feasible
- have clearly visible limits
- use economically sustainable models
- enforce compute budgets
- protect against abuse
- never promise unlimited expensive inference

Do not design a free tier that cannot survive scale.

---

63. ADVERTISING SYSTEM

Use text-based advertising as a revenue stream for free users.

Ads must be:

- clearly labeled "Sponsored"
- text-first
- relevant to developers
- contextual
- non-intrusive
- separated from AI-generated advice
- never disguised as recommendations
- never inserted into source code
- never inserted into terminal output
- never interrupt agent execution
- never block development

Potential placements:

- dashboard
- extension marketplace
- deployment/service discovery
- relevant project/service surfaces

Do not overload the IDE with advertisements.

Advertising must never compromise trust.

---

64. MONETIZATION

Design multiple revenue streams.

Potential plans:

FREE

- core IDE
- basic AI
- limited hosted usage
- local models
- BYOK
- text advertising

PRO

- no ads
- higher hosted usage
- advanced agents
- background agents
- advanced browser/testing features
- additional platform services

TEAM

- shared workspaces
- shared agents
- shared skills
- audit logs
- governance
- pooled usage
- collaboration

ENTERPRISE

- SSO
- RBAC
- audit
- private deployment
- governance
- custom models
- enterprise support
- data controls

Prices must remain configurable.

Do not hard-code business assumptions into the core architecture.

---

65. MAXIMIZE PROFIT WITHOUT DESTROYING ADOPTION

Optimize unit economics.

Track:

- inference cost
- compute cost
- storage
- bandwidth
- browser execution
- sandbox execution
- database cost
- deployment cost
- ad revenue
- subscription revenue
- conversion
- retention
- infrastructure margin

Optimize:

LTV > CAC

and:

Revenue per active user > variable infrastructure cost

for sustainable hosted usage.

Do not optimize short-term revenue at the expense of trust and retention.

---

66. BYOK BUSINESS MODEL

BYOK should reduce our inference exposure.

Users can use their own:

- OpenAI
- Anthropic
- Google
- OpenRouter
- local model
- enterprise endpoint
- custom endpoint

We can still monetize platform capabilities.

Never deliberately make BYOK worse just to force users into hosted inference.

---

67. BRING-YOUR-OWN INFRASTRUCTURE

Support external:

- Git repositories
- databases
- deployment providers
- cloud accounts
- model endpoints
- storage
- compute

Users should be able to choose whether infrastructure is:

ours, theirs, or local.

---

68. ANTI-ABUSE SYSTEM

Because the free tier and hosted agents can be abused, implement:

- rate limiting
- account controls
- device/IP abuse detection
- concurrency limits
- compute budgets
- token budgets
- sandbox isolation
- suspicious activity detection

Do this before large-scale free distribution.

---

69. PRIVACY

Provide a Privacy Center explaining:

- what data leaves the device
- which model receives it
- which tools receive it
- which files are accessible
- which credentials are accessible
- where artifacts are stored

Give users granular controls.

---

70. COLLABORATION

Support:

- shared projects
- tasks
- comments
- agent sessions
- shared rules
- shared skills
- shared Project Brain
- permissions

Clearly distinguish human and AI actions.

---

71. ENTERPRISE GOVERNANCE

Provide:

- SSO
- RBAC
- audit logs
- organization policies
- model allowlists
- MCP allowlists
- data retention
- private deployment
- customer-managed keys
- usage analytics
- policy enforcement

---

72. UNIVERSAL SEARCH

Search across:

- files
- symbols
- commits
- branches
- tasks
- conversations
- agents
- documentation
- logs
- database schema
- API definitions
- Project Brain

Provide one unified search experience.

---

73. CONVERSATIONS

Support:

- project conversations
- task conversations
- agent conversations
- branching
- archiving
- search
- summaries
- conversion from conversation to task

Conversations should connect to actual project state.

---

74. VOICE

Support voice commands where practical.

Voice commands must obey exactly the same:

- permissions
- budgets
- security
- confirmation rules

as text commands.

---

75. ONBOARDING

When opening an existing project:

1. detect stack
2. index repository
3. build Project Brain
4. understand architecture
5. detect tests
6. detect deployment
7. detect security issues
8. detect documentation
9. summarize project
10. recommend useful next actions

Do not overwhelm beginners.

---

76. BEGINNER EXPERIENCE

Provide guided workflows.

Examples:

«"I want to build my first website."»

The system explains:

- what is happening
- what it needs
- what it created
- what decisions matter

But advanced developers should be able to disable guidance and operate at maximum speed.

---

77. PROFESSIONAL EXPERIENCE

Provide:

- keyboard-first workflows
- command palette
- shortcuts
- terminal
- Git
- debugging
- advanced agent controls
- granular context
- model controls
- task graphs
- detailed diffs

Never force simplified workflows on expert users.

---

78. ACCESSIBILITY

Build accessibility into the platform:

- keyboard navigation
- screen reader support
- appropriate contrast
- scalable UI
- reduced motion
- accessible command palette
- accessible agent status
- accessible error reporting

---

79. PERFORMANCE

The IDE must remain responsive while agents work.

Separate:

- UI thread
- indexing
- agent execution
- browser execution
- model calls
- filesystem scanning

Do not allow background AI activity to freeze the editor.

---

80. RESILIENCE

If a model/provider/service fails:

- preserve task state
- preserve checkpoints
- retry safely
- switch providers where configured
- continue local work
- resume without losing context

The platform must degrade gracefully.

---

81. UNIVERSAL EXPORT

Users must never become trapped.

Allow export of:

- source code
- Git history
- rules
- skills
- agent configurations
- Project Brain
- tasks
- documentation
- deployment configuration

The user's software remains theirs.

---

82. CORE DIFFERENTIATION PRINCIPLE

The most important question for the product is:

«What becomes possible because the IDE, AI models, agents, project knowledge, tools, execution environments, testing, security and deployment systems are unified?»

Use this question to invent new product capabilities.

Potential examples include, but are NOT limited to:

- intelligent multi-agent engineering
- model competition
- continuous Project Brain
- requirement-to-verification traceability
- proof-of-completion
- autonomous self-healing development
- cross-environment agent execution
- project-wide simulation
- AI-driven architecture governance
- adaptive model routing
- agent teams
- executable project specifications

Do not assume these are the final innovations.

Continue looking for better ones.

---

83. NEW-CATEGORY TEST

The final product should pass this test:

If a user asks:

«"Why should I use this instead of Cursor + Claude Code + Copilot + Replit/Lovable + separate AI models?"»

the answer must NOT simply be:

«"Because we have all their features."»

The answer should be:

«"Because this platform enables workflows that those separate tools cannot provide as one integrated system."»

Find and build those workflows.

---

84. PRODUCT MOAT

Prioritize defensible advantages such as:

- Project Brain quality
- agent orchestration
- verification infrastructure
- model independence
- tool ecosystem
- extension ecosystem
- agent marketplace
- skills marketplace
- project knowledge
- workflow data
- developer trust
- cross-platform availability
- integrations
- network effects

Do not rely on a single model provider as the moat.

Models will change.

---

85. IMPLEMENTATION PRINCIPLE

Do NOT build fake functionality.

If a feature is displayed, it should either:

1. work, or
2. clearly indicate its current development status.

Do not create decorative dashboards filled with non-functional buttons.

Prioritize working vertical slices.

---

86. DEVELOPMENT PHASES

PHASE 0 — ARCHITECTURE + ECONOMICS

Before significant implementation:

- competitive analysis
- architecture
- threat model
- cost model
- model strategy
- platform strategy
- differentiation analysis
- user personas
- business model

Produce these internally before locking implementation.

---

PHASE 1 — CORE DEVELOPMENT ENVIRONMENT

Build:

- VS Code-derived desktop client
- Windows
- macOS
- Linux
- editor
- terminal
- filesystem
- Git
- command palette
- project management

---

PHASE 2 — AI CORE

Build:

- Model Gateway
- Ask
- Plan
- Agent
- context engine
- tool runtime
- permissions
- checkpoints
- diff review

---

PHASE 3 — PROJECT INTELLIGENCE

Build:

- Project Brain
- semantic indexing
- symbol graph
- dependency graph
- memory
- rules
- enforced validation

---

PHASE 4 — MULTI-AGENT

Build:

- AI Director
- specialized agents
- subagents
- parallel execution
- task graph
- Engineering Council
- model competition
- replay

---

PHASE 5 — VERIFICATION

Build:

- testing engine
- browser agent
- security engine
- performance engine
- Proof of Completion
- self-healing loops

---

PHASE 6 — SOFTWARE LIFECYCLE

Build:

- database center
- API center
- deployment
- observability
- documentation
- technical debt
- release management

---

PHASE 7 — PLATFORM

Build:

- CLI
- Web
- remote agents
- mobile control
- extensions
- MCP ecosystem
- marketplace
- collaboration

---

PHASE 8 — SCALE

Optimize:

- model economics
- infrastructure
- caching
- routing
- abuse prevention
- ads
- subscriptions
- enterprise
- reliability
- global distribution

---

87. PRODUCT METRICS

Design the platform so we can measure:

Acquisition

- downloads
- installs
- signup conversion
- activation

Activation

- first project
- first AI task
- first successful agent task
- first deployed application

Engagement

- daily active developers
- weekly active developers
- tasks/user
- agents/user
- projects/user

Retention

- D1
- D7
- D30
- D90

Quality

- task success rate
- verification pass rate
- rollback rate
- user correction rate
- agent failure rate

Economics

- inference cost/user
- infrastructure cost/user
- ad revenue/user
- subscription revenue/user
- gross margin
- LTV
- CAC

Build analytics so these metrics can be evaluated without compromising user privacy.

---

88. GROWTH STRATEGY

Design for organic distribution.

Encourage:

- shareable projects
- shareable agents
- shareable skills
- templates
- extension ecosystem
- marketplace
- GitHub integration
- team collaboration
- public demos
- community contributions

The product should become more useful as its ecosystem grows.

---

89. FINAL PRODUCT PRINCIPLES

Always prioritize:

Correctness over appearance

Verification over confidence

Trust over manipulation

Interoperability over lock-in

User ownership over platform ownership

Sustainable economics over unsustainable free compute

Automation over unnecessary manual work

Choice over vendor dependency

Real functionality over mock UI

Innovation over imitation

---

90. FINAL DESIGN QUESTION

At every architectural and product decision, ask:

«"If this succeeds at global scale, does this make the product more useful, more defensible, more profitable, more accessible, or more difficult for competitors to replicate?"»

If not, question whether the feature belongs.

---

FINAL OBJECTIVE

Build a product that can credibly become:

«A universal AI software engineering platform — available wherever developers work, compatible with whatever models and tools they choose, capable of coordinating AI engineers across the entire software lifecycle, and differentiated by capabilities that emerge from unifying the development process rather than merely adding another AI chat panel to an editor.»

Do not stop at feature parity.

Do not stop at making a beautiful IDE.

Do not stop at making an autonomous coding agent.

Do not stop at making an app builder.

Build the system that connects all of them.

And then find the next capability that nobody else has built yet.