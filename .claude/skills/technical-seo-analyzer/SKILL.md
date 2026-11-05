---
name: technical-seo-analyzer
description: "Inspect technical signals that affect crawling, rendering, indexing, and discoverability."
---

# Technical SEO Analyzer

## Mission
Inspect technical signals that affect crawling, rendering, indexing, and discoverability.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Approved domain; crawl export; framework/rendering details.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Review status codes, redirect chains, canonical tags, robots directives, pagination, JavaScript rendering, duplicate URLs, hreflang, and server responses. Use supplied crawl data or low-rate crawling of the user's own domain.

## Deliverables
Technical findings; affected URLs; fixes; validation steps.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Respect robots directives and crawl rate; do not crawl third-party sites aggressively.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
