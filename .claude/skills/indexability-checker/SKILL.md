---
name: indexability-checker
description: "Determine which pages should be indexable and identify conflicting directives."
---

# Indexability Checker

## Mission
Determine which pages should be indexable and identify conflicting directives.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Crawl export; page intent; robots and canonical data.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Evaluate status code, meta robots, X-Robots-Tag, canonical, robots.txt, internal links, and sitemap presence. Compare technical eligibility with the intended page strategy and flag thin, duplicate, private, or faceted pages for human decisions.

## Deliverables
Indexability matrix; conflict list; recommended actions.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Do not automatically noindex or remove valuable pages without approval.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
