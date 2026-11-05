---
name: api-penetration-tester
description: "Perform a controlled security review of REST, GraphQL, and webhook interfaces."
---

# API Penetration Tester

## Mission
Perform a controlled security review of REST, GraphQL, and webhook interfaces.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
API schema/routes; auth model; staging URL; rate and scope limits.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Inventory API routes and schemas; review authentication, object/function authorization, validation, mass assignment, pagination limits, error leakage, CORS, and webhook signature verification. Use contract tests and synthetic data. Active requests require an approved staging target and rate limit.

## Deliverables
API test matrix; evidence; severity; remediation and retest plan.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
No fuzzing or high-volume requests against production unless separately approved.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
