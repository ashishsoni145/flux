# CheckpointManager

> 11 nodes

## Key Concepts

- **CheckpointManager** (12 connections) — `packages/engine/src/checkpoints.ts`
- **Checkpoint** (9 connections) — `packages/protocol/src/checkpoints.ts`
- **engine/src/checkpoints.ts** (9 connections) — `packages/engine/src/checkpoints.ts`
- **.create()** (5 connections) — `packages/engine/src/checkpoints.ts`
- **.createCheckpoint()** (4 connections) — `packages/engine/src/checkpoints.ts`
- **.fileExists()** (3 connections) — `packages/engine/src/checkpoints.ts`
- **.rollback()** (3 connections) — `packages/engine/src/checkpoints.ts`
- **StoredCheckpoint** (2 connections) — `packages/engine/src/checkpoints.ts`
- **.get()** (2 connections) — `packages/engine/src/checkpoints.ts`
- **.list()** (2 connections) — `packages/engine/src/checkpoints.ts`
- **SnapshotEntry** (1 connections) — `packages/engine/src/checkpoints.ts`

## Relationships

- [boot](boot.md) (6 shared connections)
- [protocol/src/index.ts](protocol-src-index.ts.md) (4 shared connections)
- [agent.ts](agent.ts.md) (3 shared connections)
- [CompletionRequest](CompletionRequest.md) (2 shared connections)
- [PermissionGate](PermissionGate.md) (1 shared connections)

## Source Files

- `packages/engine/src/checkpoints.ts`
- `packages/protocol/src/checkpoints.ts`

## Audit Trail

- EXTRACTED: 32 (94%)
- INFERRED: 2 (6%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*