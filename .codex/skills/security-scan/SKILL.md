---
name: security-scan
description: Audit the SpendWise Next.js and Supabase project for security risks. Use when the user asks Codex to scan the whole project, perform a security review, find vulnerabilities such as SQL injection, auth or authorization bypasses, exposed secrets, unsafe route handlers or Server Actions, XSS, CSRF, dependency/config risks, or Supabase RLS issues.
---

# Security Scan

Perform a full-project security audit of SpendWise. Treat this as a code-review style security assessment: findings first, concrete file and line evidence, severity calibrated to exploitability, and no speculative noise.

## Required First Steps

1. Confirm the working directory is the SpendWise repo root.
2. Read `AGENTS.md`.
3. Before reviewing app code, read the relevant local Next.js docs in `node_modules/next/dist/docs/`, especially:
   - `01-app/02-guides/data-security.md`
   - `01-app/02-guides/authentication.md`
   - `01-app/02-guides/environment-variables.md` when env exposure is in scope
   - `01-app/02-guides/content-security-policy.md` when XSS or headers are in scope
   - `01-app/01-getting-started/16-proxy.md` when reviewing `proxy.ts`
4. Inspect the project architecture docs before judging data boundaries:
   - `docs/PROJECT_ARCHITECTURE.md`
   - `docs/supabase.md`
   - `docs/supabase_sql.md`

## Audit Scope

Review the whole project, prioritizing:

- `app/**`, especially Server Actions, Route Handlers, auth pages, protected pages, and dashboard mutations.
- `lib/**`, especially Supabase clients, server-side data access, shared validation helpers, and config.
- `components/**`, especially `"use client"` files that receive server data or render user-controlled values.
- `proxy.ts`, `next.config.ts`, `eslint.config.mjs`, `package.json`, and env examples.
- SQL and RLS policy definitions in `docs/supabase_sql.md`.

Do not treat generated or dependency folders as application code, but check manifests and lockfiles for relevant package/config risk when useful.

## Risk Checklist

Look for these classes of issues:

- SQL injection or unsafe dynamic query construction, including raw SQL strings, RPC calls, interpolated filters, or Supabase calls built from untrusted input.
- Missing authentication or authorization in Server Actions and Route Handlers. Page or layout checks do not protect actions.
- IDOR risks where a mutation reads or writes a row by id without proving the row belongs to the authenticated user.
- Supabase RLS gaps, overly broad policies, missing `with check`, missing `auth.uid()` ownership checks, or policies that allow cross-user finance data access.
- Secret exposure through committed env files, `NEXT_PUBLIC_` variables, client imports of server config, or logs/errors that leak sensitive values.
- XSS risks such as `dangerouslySetInnerHTML`, unsafe markdown/HTML rendering, script injection, or unescaped user-controlled values in attributes.
- CSRF and unsafe side effects in GET Route Handlers or render paths.
- Overbroad data transfer from Server Components or Server Actions to Client Components, especially raw profile, auth, or finance records.
- Weak input validation for form data, URL params, search params, request JSON, dates, amounts, enum-like fields, and ids.
- Misconfigured proxy/session refresh behavior, cookie handling, redirects, allowed origins, CSP/security headers, or build/runtime config.
- Dependency or supply-chain risks visible from `package.json` and lockfile context.

## Review Method

Use targeted searches first, then manually read the relevant code paths end to end. Useful searches include:

```powershell
rg -n "use server|route.ts|proxy|createClient|getClaims|getUser|getSession|from\(|rpc\(|select\(|insert\(|update\(|delete\(|eq\(|filter\(|or\(|raw|sql|dangerouslySetInnerHTML|process\.env|NEXT_PUBLIC|cookies\(|headers\(|redirect\(" app lib components docs proxy.ts next.config.ts package.json
```

For every suspicious path, trace:

1. The entry point and attacker-controlled inputs.
2. Authentication and authorization checks.
3. Validation and normalization.
4. Database query or side effect.
5. Returned data or rendered output.
6. Supabase RLS policy backstop, when database access is involved.

Prefer validated findings over broad advice. If a pattern looks risky but is blocked by RLS, input validation, or ownership checks, state why it is not a finding.

## Output Format

Lead with findings ordered by severity:

```markdown
## Findings

- [High] Title
  - Evidence: `path/to/file.ts:123`
  - Risk: Explain the exploit and impact.
  - Fix: Give the smallest practical remediation.

## Open Questions

- Note only questions that affect exploitability or remediation.

## Residual Risk

- State important areas not fully verified, such as live Supabase dashboard settings.

## Checks Run

- List commands and docs reviewed.
```

If no vulnerabilities are found, say so clearly and still include residual risk and checks run.

## Repo-Local Installation Note

This skill is versioned inside the SpendWise repo at `.codex/skills/security-scan`. If Codex does not auto-discover repo-local skills in a future session, copy or symlink this folder into the user skills directory, for example `%USERPROFILE%\.codex\skills\security-scan`, then call it with:

```text
Use $security-scan to audit this project for security risks.
```
