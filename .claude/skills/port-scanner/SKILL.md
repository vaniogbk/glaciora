---
name: port-scanner
description: "Assess network-service exposure on explicitly authorized assets using non-disruptive checks."
---

# Port Scanner

## Mission
Assess network-service exposure on explicitly authorized assets using non-disruptive checks.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Exact IPs/hosts; environment; approved ports; maintenance window.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Require a written target list and confirmation of ownership/authorization. Prefer reviewing cloud security groups, deployment configuration, and existing scan outputs. If an active scan is explicitly approved, use conservative timing and a narrow port list; do not run exploit scripts, brute force, or denial-of-service checks.

## Deliverables
Open-service inventory; unexpected exposure; remediation suggestions.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
No scanning public IP ranges, shared hosting, or provider infrastructure without explicit authorization.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
