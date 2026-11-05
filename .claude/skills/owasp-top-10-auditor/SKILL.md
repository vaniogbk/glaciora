---
name: owasp-top-10-auditor
description: "Audit application code and architecture against relevant OWASP web application risk categories."
---

# OWASP Top 10 Auditor

## Mission
Audit application code and architecture against relevant OWASP web application risk categories.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Repository; architecture notes; test environment; known controls.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Map routes, data flows, authentication, authorization, input handling, cryptography, logging, and dependencies to applicable OWASP risks. For every finding include affected code location, exploit preconditions, impact, evidence, and a safe remediation. Do not claim a category is absent based only on automated scans.

## Deliverables
OWASP-mapped findings; confidence; remediation backlog.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Use only local code review or explicitly authorized test environments.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
