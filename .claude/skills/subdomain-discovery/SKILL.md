---
name: subdomain-discovery
description: "Identify and review subdomains only for domains explicitly authorized by the user."
---

# Subdomain Discovery

## Mission
Identify and review subdomains only for domains explicitly authorized by the user.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Approved parent domains; passive/active mode; exclusions.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Start with passive sources and configuration files. If active discovery is requested, confirm the exact parent domain and authorization, use low request rates, and avoid takeover attempts or service interaction. Validate discovered names against the approved scope and classify stale DNS, dangling records, and sensitive names for human review.

## Deliverables
Subdomain list; DNS evidence; risk-ranked review queue.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Do not scan domains belonging to customers, vendors, or unrelated organizations.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
