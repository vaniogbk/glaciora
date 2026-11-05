---
name: dns-security-auditor
description: "Review DNS records and domain configuration for common security and reliability weaknesses."
---

# DNS Security Auditor

## Mission
Review DNS records and domain configuration for common security and reliability weaknesses.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Domain; DNS export/provider view; mail providers; intended services.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Review supplied DNS exports or records for SPF, DKIM, DMARC, CAA, DNSSEC, dangling aliases, unexpected wildcards, and mail-routing inconsistencies. Explain business impact and propose staged changes. Never change live DNS without approval.

## Deliverables
DNS findings; proposed record changes; verification checklist.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Do not replace existing mail records or recommend aggressive DMARC enforcement without checking legitimate senders.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
