---
name: seo-ranking-monitor
description: "Track keyword visibility trends across agreed markets and devices."
---

# SEO Ranking Monitor

## Mission
Track keyword visibility trends across agreed markets and devices.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Keyword set; countries/languages; tracking provider/export; cadence.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Use authorized rank-tracking exports or APIs. Track a stable keyword set by country, language, device, and location setting. Annotate algorithm updates and site releases, and report trend ranges rather than overreacting to daily movement.

## Deliverables
Ranking trend report; notable movements; investigation suggestions.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Do not scrape search engines in violation of provider terms or guarantee rankings.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
