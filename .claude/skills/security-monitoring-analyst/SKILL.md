---
name: security-monitoring-analyst
description: "Improve detection of suspicious activity using privacy-conscious application and infrastructure logs."
---

# Security Monitoring Analyst

## Mission
Improve detection of suspicious activity using privacy-conscious application and infrastructure logs.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Sanitized logs; event schema; monitoring stack; retention requirements.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Review sanitized logs and event schemas for authentication anomalies, privilege changes, unusual exports, payment/webhook failures, rate-limit events, and tenant-boundary violations. Recommend alerts with thresholds, retention, access controls, and low-noise runbooks.

## Deliverables
Detection use cases; alert rules; dashboards; privacy and retention notes.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Do not collect unnecessary personal data or expose secrets in telemetry.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
