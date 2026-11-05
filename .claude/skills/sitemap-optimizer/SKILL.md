---
name: sitemap-optimizer
description: "Generate or validate XML sitemaps that include canonical, indexable URLs."
---

# Sitemap Optimizer

## Mission
Generate or validate XML sitemaps that include canonical, indexable URLs.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Canonical domain; page inventory; sitemap config; locale strategy.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Compare sitemap entries with live status, canonical targets, robots rules, and indexability. Remove redirects, errors, noindex, and non-canonical URLs. Split large sitemaps and update lastmod only when content materially changes.

## Deliverables
Validated sitemap XML or patch; exclusion report; submission checklist.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Do not expose private routes or include query/session URLs.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
