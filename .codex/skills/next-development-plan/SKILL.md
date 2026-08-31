---
name: next-development-plan
description: Inspect the current SpendWise repository and produce one decision-complete plan for the highest-priority unfinished development item. Use only when explicitly invoked to decide what should be developed next.
---

# Next Development Plan

Choose one evidence-backed next development item and turn it into an implementation-ready plan. Re-evaluate the repository on every invocation so completed work is not recommended again.

## Establish the Current State

Read before selecting work:

1. `AGENTS.md` and any more specific repository instructions.
2. The current-status, incomplete-work, and recommended-work sections of `README.md`.
3. The current gaps and recommended next steps in `docs/PROJECT_ARCHITECTURE.md`, plus domain documentation relevant to the candidates.
4. Recent Git history and the relevant implementation files for each credible candidate.

Reconcile documentation with the repository. Working code and recent commits are stronger evidence than stale status text. Exclude items that are already complete, duplicated by newer work, or no longer fit the current architecture. Note material documentation drift in the plan instead of treating it as product work unless correcting it is necessary for the selected feature.

## Select Exactly One Item

Start with documented gaps and recommended work. Rank unfinished candidates using:

- prerequisite or unblocker value for later features;
- user value and completeness of the core finance workflow;
- architectural leverage and reduction of existing duplication or coupling;
- dependency order, implementation effort, and delivery risk.

Choose the strongest candidate and do not present a menu of alternatives. Suggest a newly inferred feature only when no documented backlog item remains more valuable or necessary.

Invoke `$scalable-feature-development` before designing the selected item. Apply its architecture, compatibility, validation, failure-mode, and testing guidance. For Next.js-specific recommendations, follow its requirement to read the relevant local framework documentation before relying on APIs or conventions.

## Produce One Decision-Complete Plan

Return a single plan containing:

1. A clear feature title and concise summary.
2. Why this is the next priority, citing repository evidence.
3. Current behavior and the intended end state.
4. Implementation changes grouped by subsystem and responsibility.
5. Public interfaces, types, schemas, data flow, migrations, and compatibility effects that must change, or an explicit statement that none change.
6. Relevant validation, authorization, error handling, failure states, and operational risks.
7. Test scenarios and observable acceptance criteria.
8. Explicit assumptions, defaults, and excluded scope.

Make the plan specific enough that another engineer can implement it without choosing architecture or behavior. Keep it proportional to the feature and avoid speculative abstractions.

## Preserve Read-Only Planning

Normal invocation is read-only: do not create a branch, edit files, run migrations, or implement the plan. If the user also asks to save or implement any part of the result, invoke `$branch-before-editing` and follow it completely before the first repository-tracked edit.
