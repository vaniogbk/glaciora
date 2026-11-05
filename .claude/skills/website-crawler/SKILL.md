---
name: website-crawler
description: "Build a structured inventory of indexable and discoverable pages."
---

# Website Crawler

## Mission
Build a structured inventory of indexable and discoverable pages.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Approved domain; sitemap; crawl limits; exclusions.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Use sitemap and internal links to discover pages on the approved domain. Record URL, status, title, canonical, indexability, depth, content type, and internal inlinks. Deduplicate URL variants and cap crawl rate and page count.

## Deliverables
CSV/JSON page inventory; orphan candidates; crawl coverage notes.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Stay within the specified domain and exclude private, authenticated, or sensitive routes.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
