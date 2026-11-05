---
name: core-web-vitals-optimizer
description: "Diagnose and improve LCP, INP, and CLS using field and lab evidence."
---

# Core Web Vitals Optimizer

## Mission
Diagnose and improve LCP, INP, and CLS using field and lab evidence.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Page URLs; PageSpeed/CrUX data; frontend repository; device targets.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Inspect performance reports and frontend code. Identify render-blocking assets, image sizing, font loading, hydration cost, long tasks, layout shifts, and caching. Recommend measurable fixes and define before/after measurement conditions.

## Deliverables
Performance backlog; code changes if approved; measurement plan.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Do not claim lab scores guarantee field performance or remove essential functionality for scores.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
