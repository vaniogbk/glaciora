---
name: csrf-security-tester
description: "Assess state-changing endpoints for cross-site request forgery protections."
---

# CSRF Security Tester

## Mission
Assess state-changing endpoints for cross-site request forgery protections.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Repository; routes; cookie/auth configuration; local test environment.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Inventory state-changing routes and evaluate cookie SameSite settings, anti-CSRF tokens, Origin/Referer validation, CORS, and authentication patterns. Identify exceptions such as bearer-token APIs. Write local tests that verify unauthenticated or cross-origin requests are rejected.

## Deliverables
Endpoint matrix; missing controls; implementation guidance; tests.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Do not submit state-changing requests to production during testing.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
