---
name: session-security-auditor
description: "Evaluate session lifecycle, cookie flags, token storage, rotation, and logout behavior."
---

# Session Security Auditor

## Mission
Evaluate session lifecycle, cookie flags, token storage, rotation, and logout behavior.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Repository; session middleware; cookie config; auth provider.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Check Secure, HttpOnly, SameSite, domain/path scope, expiry, rotation after privilege changes, logout invalidation, refresh-token reuse detection, and browser storage choices. Verify server-side revocation semantics and add tests for session fixation and stale sessions.

## Deliverables
Session-control matrix; findings; recommended settings; regression tests.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Do not expose live tokens in reports; redact all credential material.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
