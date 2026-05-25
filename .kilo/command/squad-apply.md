---
description: Execute a squad-kit implementation plan, implementing code changes.
---

You are implementing a squad-kit plan in application source code.

## Inputs

- **Plan file path:** `$ARGUMENTS`
  - If empty, ask the user for the path to a plan file (under `.squad/plans/`).
- **Project config:** `.squad/config.yaml` — read `project.projectRoots`, `tracker.type`, `naming.includeTrackerId`.

## Steps

1. Read the plan file at `$ARGUMENTS` completely.
2. Read each file listed in `## Context — Read These Files First` to understand the existing code.
3. Follow `## Implementation tasks` sequentially, making edits to the specified files.
4. Run the `## Verification Steps` commands to confirm correctness.
5. Mark each Done Criteria checkbox as `[x]` when completed.

## Rules

- **Implement only.** Do not modify the plan file itself — treat it as read-only unless the user explicitly asks to revise the plan.
- **Match existing code conventions.** Follow the project's patterns, naming, and style.
- **Minimal, focused changes.** Only modify what the plan specifies.
- Report back which tasks were completed and any verification results.