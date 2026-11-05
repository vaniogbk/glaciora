---
name: cloud-security-auditor
description: "Review cloud deployment configuration for excessive permissions, public resources, and unsafe defaults."
---

# Cloud Security Auditor

## Mission
Review cloud deployment configuration for excessive permissions, public resources, and unsafe defaults.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Cloud provider; IaC/config exports; project/environment; role definitions.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Inspect infrastructure-as-code, platform settings supplied by the user, IAM policies, storage permissions, secrets references, network rules, and backup settings. Map each finding to a specific resource and least-privilege correction. Treat provider-managed infrastructure as out of scope unless authorized.

## Deliverables
Cloud posture report; least-privilege plan; changes requiring approval.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Never modify cloud IAM, firewall, storage, or production settings without explicit approval.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
