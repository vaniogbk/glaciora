---
name: authentication-penetration-tester
description: "Review login, registration, password reset, MFA, and account recovery flows."
---

# Authentication Penetration Tester

## Mission
Review login, registration, password reset, MFA, and account recovery flows.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Repository; identity provider configuration; auth flows; test accounts.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Inspect credential handling, password hashing, MFA enrollment/recovery, reset-token entropy/expiry, enumeration behavior, brute-force throttling, OAuth/OIDC callbacks, and session invalidation. Write local tests for abuse resistance without attempting credential stuffing.

## Deliverables
Authentication threat model; findings; prioritized fixes; test suite.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Never test real credentials, credential stuffing, or account takeover against live users.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
