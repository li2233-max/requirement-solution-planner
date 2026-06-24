# Execution Bridge

Use this reference when a plan must become PRD, issues, an implementation brief, a handoff, or actual execution.

## Principle

Planning output is not execution permission. Before acting, restate the exact slice being executed, the verification signal, and the stop condition.

## Convert plan to PRD

Use PRD only when the work needs product context, trade-offs, or stakeholder review.

```md
# PRD: [Name]

## Problem
- User / owner:
- Current pain:
- Why now:

## Goal
- Desired outcome:
- Non-goals:

## Scope
- Include:
- Exclude:
- Dependencies:

## Requirements
- R1:
- R2:
- R3:

## Success Criteria
- Functional:
- Quality:
- Verification:

## Risks
- Product risk:
- Technical risk:
- Platform risk:
```

## Convert plan to issue brief

Use issue brief when one agent or developer should pick up one slice independently.

```md
# [R编号] [事项名]

## Goal

## Context
- Source plan:
- Related files or docs:
- Key assumptions:

## Scope
- Include:
- Exclude:

## Implementation Steps
1. Step -> verify:
2. Step -> verify:

## Acceptance Criteria
- Must pass:
- Must not:

## Review Checklist
- Tests / self-check:
- Docs / context updates:
- Risk review:
```

## Execute one slice

Before editing files or taking action:

1. Identify the selected R item or step.
2. Read the source plan if it exists.
3. Restate target, scope, success criteria, and stop condition.
4. Build the tightest verification signal available.
5. Execute only the selected slice.
6. End with a review result: `继续`, `返工`, or `暂停`.

## Handoff

Use handoff when the next session or agent should continue.

```md
# Handoff: [Topic]

## Current State

## Source Artifacts
- Plan:
- PRD:
- Issues:
- Code changes:

## Decisions Made

## Remaining Work

## Suggested Next Skill / Workflow

## Risks And Unknowns
```
