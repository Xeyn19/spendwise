---
name: branch-before-editing
description: Create a dedicated Git branch before the first repository-tracked edit in a task. Use for implementation, fixes, refactors, configuration changes, documentation edits, or any other request that will modify versioned files; do not use for read-only investigation or planning.
---

# Branch Before Editing

Create one task-specific branch before changing repository-tracked files. Branch creation does not authorize edits beyond the user's request.

## Workflow

1. Confirm the working directory is inside a Git repository and inspect the current branch and `git status`.
2. Preserve the working tree exactly as found. Never reset, clean, stash, discard, overwrite, or commit existing changes automatically.
3. If the current branch was already created for this same task and no additional task branch is needed, treat the requirement as satisfied. Do not create a branch per file or per edit.
4. Otherwise, derive a short descriptive kebab-case name from the task. Follow the repository's established branch convention when it does not conflict with these rules.
5. Remove the word `codex`, case-insensitively, from every proposed branch name. Do not use `codex/`, `codex-`, or any other form containing that word.
6. Check local and remote branch names. If the name is occupied, add a numeric suffix such as `-2` rather than replacing or reusing another task's branch.
7. Create and switch to the branch before the first tracked-file modification, then verify the active branch and working-tree status.

If uncommitted changes already exist, leave them in place while creating the branch and avoid modifying unrelated files. Report any pre-existing changes that materially limit safe execution.

Stop and explain the blocker if the directory is not a Git repository, Git is unavailable, the branch name cannot be made compliant, or branch creation fails. Do not silently continue editing on the original branch.
