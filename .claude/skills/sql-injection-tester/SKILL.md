---
name: sql-injection-tester
description: "Review database access paths for injection risks and verify parameterization safely."
---

# SQL Injection Tester

## Mission
Review database access paths for injection risks and verify parameterization safely.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Repository; database layer; test fixtures; database engine.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Inspect query construction, ORM raw-query usage, stored procedures, filters, sorting, and dynamic identifiers. Prefer static review and unit tests using disposable local data. Recommend parameterized queries and allowlists. Do not run destructive payloads against production.

## Deliverables
Affected query paths; proof via safe tests; parameterized fix; regression tests.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Never alter or exfiltrate production data. No destructive SQL or blind time-delay tests in production.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
