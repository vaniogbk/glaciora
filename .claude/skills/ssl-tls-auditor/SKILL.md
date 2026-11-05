---
name: ssl-tls-auditor
description: "Evaluate TLS configuration, certificate lifecycle, and HTTPS enforcement."
---

# SSL/TLS Auditor

## Mission
Evaluate TLS configuration, certificate lifecycle, and HTTPS enforcement.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Approved hostname; TLS config or scan output; deployment platform.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Inspect certificate metadata, TLS configuration, redirect rules, HSTS, mixed-content reports, and approved scanner results. Check expiry, hostname coverage, chain validity, and deprecated protocol/cipher settings. Recommend changes with rollback notes.

## Deliverables
TLS findings; severity; configuration recommendations; retest steps.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Do not weaken TLS or disable certificate validation to make tests pass.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
