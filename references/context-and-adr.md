# Context And ADR

Use this reference when planning reveals reusable project knowledge.

## When to update context

Suggest updating `CONTEXT.md` when the plan introduces or clarifies:

- Domain terms
- Core entities
- Workflow states
- User roles
- Important invariants
- Naming decisions that future agents should reuse

Do not create context docs for one-off implementation details.

## CONTEXT.md shape

```md
# Project Context

## Language

**Term**:
Definition.
_Avoid_: ambiguous synonym

## Relationships

- A **Term A** owns many **Term B**.
- A **State** can transition to **State** when condition holds.

## Flagged Ambiguities

- "Old phrase" was overloaded. Use **Canonical Term** for ...
```

## When to write an ADR

Suggest an ADR when the plan makes a decision that is:

- Hard to reverse
- Cross-module
- Security-sensitive
- Platform-dependent
- Architectural rather than cosmetic
- Likely to be questioned later

## ADR shape

```md
# ADR-[number]: [Decision]

## Status

Proposed / Accepted / Superseded

## Context

## Decision

## Consequences

### Positive

### Negative

### Follow-up
```

## Planning output hook

When context or ADR work is needed, add this section near the end of the plan:

```md
## 建议沉淀

- CONTEXT.md：
- ADR：
- 不需要沉淀的内容：
```
