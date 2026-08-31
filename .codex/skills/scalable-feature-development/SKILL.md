---
name: scalable-feature-development
description: Plan, design, implement, or meaningfully refactor SpendWise features with scalable and maintainable architecture. Use when discussing or developing product features whose boundaries, data flow, interfaces, reuse, testing, or future growth require deliberate engineering decisions.
---

# Scalable Feature Development

Shape features so they meet the current need cleanly and can evolve without unnecessary coupling or premature abstraction.

## Ground the Design

Before proposing implementation details:

1. Clarify the feature goal, success criteria, constraints, and explicitly excluded behavior from the conversation.
2. Inspect the relevant existing architecture, data model, nearby implementations, and repository instructions. Reuse established patterns unless a concrete limitation justifies changing them.
3. For Next.js work, read the relevant guide in `node_modules/next/dist/docs/` before relying on framework APIs or conventions, as required by this repository's `AGENTS.md`.

Do not create a branch for discussion, planning, or other read-only work. Immediately before the first repository-tracked edit, invoke `$branch-before-editing` and follow it completely.

## Design for Sustainable Growth

- Give each component, module, and data boundary a clear responsibility. Keep product rules independent from presentation and transport details when that separation provides real value.
- Define validated interfaces at trust boundaries. Make ownership, inputs, outputs, errors, and side effects explicit enough for callers and tests.
- Prefer small cohesive units and composition over duplicated logic, oversized components, or speculative frameworks.
- Design for the next credible extension discussed or implied by the feature, not every hypothetical future requirement.
- Preserve compatibility unless the user approves a breaking change. When data or interfaces must change, include a migration or transition path proportional to the risk.
- Consider security, authorization, failure states, concurrency, performance, accessibility, and observability where they are relevant to the feature rather than as ceremonial checklists.

## Implement and Verify

Implement the smallest coherent vertical slice that satisfies the agreed behavior. Keep unrelated cleanup outside the task unless it is necessary for correctness.

Test behavior at the most stable boundary available. Cover the primary path, meaningful failures, authorization or validation boundaries, and regression-prone integration points. Run the repository's relevant checks and report any residual risk or unverified external dependency.
