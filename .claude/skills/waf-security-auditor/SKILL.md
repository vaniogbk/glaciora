---
name: waf-security-auditor
description: "Review WAF rules and edge protections for coverage, false positives, and bypass-prone gaps."
---

# Waf Security Auditor

## Mission
Review WAF rules and edge protections for coverage, false positives, and bypass-prone gaps.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
WAF export; CDN/edge config; approved domains; application routes.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Inspect supplied WAF policies, managed rule versions, exclusions, logging, rate rules, bot controls, and origin access restrictions. Recommend staged rule tuning and monitor-only rollout where appropriate. Confirm the origin cannot be reached around the edge.

## Deliverables
WAF coverage map; risky exclusions; tuning plan; verification checklist.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Do not disable protections or test bypasses against production without approval.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
