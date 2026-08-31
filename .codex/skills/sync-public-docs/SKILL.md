---
name: sync-public-docs
description: Synchronize SpendWise's public README and Markdown documentation with the current repository while excluding secrets, personal data, private infrastructure, and internal-only details. Use only when explicitly invoked to audit and update public project documentation.
---

# Sync Public Docs

Audit and update `README.md` and every `docs/**/*.md` file so public documentation accurately reflects the current repository. Invocation authorizes documentation edits only, not application, configuration, schema, or migration changes.

## Establish the Source of Truth

1. Read `AGENTS.md`, inventory `README.md` and all `docs/**/*.md`, and inspect the current Git status and recent history.
2. Inspect only the source, configuration, schema, and package files needed to verify documented behavior. Use `.env.example` and code references for configuration names; never read `.env`, `.env.local`, credentials, private keys, or other secret-bearing files.
3. Treat working code, current schemas, and committed configuration as stronger evidence than stale documentation. Do not guess about behavior that cannot be verified.
4. Invoke `$scalable-feature-development` to identify the architectural and compatibility implications that the public documentation should capture.

Review every public documentation file, but edit only files that are inaccurate, incomplete, duplicated, unsafe, or no longer relevant. Keep feature status, routes, setup steps, architecture, data models, validation rules, deployment guidance, and recommended next work consistent across files.

## Protect Public Information

Public documentation may include verified architecture, generic schemas, RLS design, public routes, development commands, environment-variable names, localhost examples, and clearly fake placeholder values.

Never add or preserve:

- actual secrets, environment values, passwords, tokens, cookies, session data, credentials, or private keys;
- real personal identifiers, email addresses, user IDs, or financial records;
- private project identifiers, production URLs, internal hostnames, infrastructure details, or admin-only procedures that are not required for public setup;
- internal incidents, private security findings, exploit instructions, or unresolved vulnerability details;
- machine-specific absolute paths, usernames, or local workspace details.

Use portable repository-relative links and sanitized examples. When information might be private and its public status cannot be verified, omit or redact it and report only its category and location without repeating the sensitive value.

## Apply Documentation Updates

After the audit identifies required edits, invoke `$branch-before-editing` immediately before the first tracked-file change and follow it completely. If the current branch already belongs to the implementation task being documented, do not create a redundant branch.

Preserve useful document structure and tone, remove stale or conflicting statements, and avoid copying the same detail into multiple files without a clear audience need. Modify only `README.md` and Markdown files under `docs/`. If a mismatch requires an application or schema change, leave code untouched and report the conflict.

## Verify and Report

Before finishing:

1. Re-read every public documentation file and compare changed claims with their repository sources.
2. Check that repository-local links are relative, portable, and point to existing files where applicable.
3. Scan documentation for potential secrets or private data, manually distinguishing safe schema names and placeholders from sensitive values.
4. Run `git diff --check` and confirm the diff contains only intended public documentation changes.

Report the documents changed, stale content corrected, private material removed or redacted, checks run, and any unresolved documentation or code conflicts. Do not commit or push unless the user explicitly requests it. If no update is needed, say so and leave the repository unchanged.
