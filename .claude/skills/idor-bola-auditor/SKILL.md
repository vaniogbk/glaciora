---
name: idor-bola-auditor
description: "Detect object-level authorization gaps that could expose another tenant's or user's records."
---

# IDOR BOLA Auditor

## Mission
Detect object-level authorization gaps that could expose another tenant's or user's records.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Repository; API routes; tenancy model; synthetic test fixtures.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Map object identifiers and ownership checks across API handlers, database queries, background jobs, and file downloads. Verify authorization is enforced server-side for every object operation. Create tests with two synthetic users/tenants and assert cross-tenant access is denied.

## Deliverables
Endpoint/object matrix; missing ownership checks; cross-tenant regression tests.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Use synthetic accounts and data only; never access real users' records.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
