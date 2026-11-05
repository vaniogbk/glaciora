---
name: access-control-auditor
description: "Verify role-based and attribute-based permissions are enforced consistently."
---

# Access Control Auditor

## Mission
Verify role-based and attribute-based permissions are enforced consistently.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Role definitions; route/action list; tenancy rules; test fixtures.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Enumerate roles, permissions, admin actions, tenant boundaries, feature entitlements, and support access. Trace checks to server-side enforcement and default-deny behavior. Add positive and negative tests for each role/action pair.

## Deliverables
Permission matrix; missing checks; least-privilege recommendations; tests.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Do not grant privileges or alter real user roles during an audit.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
