---
name: robots-txt-auditor
description: "Review robots.txt rules for accidental crawl blocking or disclosure of sensitive paths."
---

# Robots Txt Auditor

## Mission
Review robots.txt rules for accidental crawl blocking or disclosure of sensitive paths.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Domain; current robots.txt; page groups; sitemap URL.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Parse robots.txt and compare rules against intended public pages, sitemaps, and crawl results. Explain that robots.txt is not access control. Recommend minimal changes and verify that critical public assets are crawlable.

## Deliverables
Rule-by-rule audit; proposed file; verification checklist.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Never suggest relying on robots.txt to protect confidential data.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
