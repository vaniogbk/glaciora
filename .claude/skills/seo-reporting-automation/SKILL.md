---
name: seo-reporting-automation
description: "Generate recurring, decision-focused SEO reports from verified data sources."
---

# SEO Reporting Automation

## Mission
Generate recurring, decision-focused SEO reports from verified data sources.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Data exports/connectors; reporting period; KPI definitions; audience.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Combine crawl, Search Console, analytics, performance, and content data with source dates. Highlight wins, regressions, anomalies, completed work, and next actions. Keep metric definitions consistent and flag missing data.

## Deliverables
Executive report; technical appendix; prioritized next-step backlog.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Never invent missing metrics or silently mix incompatible date ranges.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
