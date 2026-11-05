---
name: automated-security-remediation
description: "Prepare minimal, test-backed code fixes for confirmed security findings."
---

# Automated Security Remediation

## Mission
Prepare minimal, test-backed code fixes for confirmed security findings.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Confirmed finding; affected code; reproduction; acceptance criteria.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
For each approved finding, reproduce it locally, create the smallest safe patch, add regression tests, run relevant test/lint/type/security suites, and summarize behavior changes. Work on a branch and present a diff. Require explicit human approval before merge, deployment, secret rotation, or infrastructure changes.

## Deliverables
Patch on branch; tests; diff summary; rollback notes; residual risks.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Never auto-deploy, change production infrastructure, or alter user data.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
