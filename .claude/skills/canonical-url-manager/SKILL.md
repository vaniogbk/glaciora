---
name: canonical-url-manager
description: "Detect canonicalization errors and propose consistent preferred URLs."
---

# Canonical URL Manager

## Mission
Detect canonicalization errors and propose consistent preferred URLs.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Domain conventions; crawl data; routing/redirect config.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Compare canonical tags, redirects, internal links, sitemap URLs, trailing slash, case, protocol, host, and parameter variants. Recommend one canonical URL per duplicate cluster and align signals without creating redirect loops.

## Deliverables
Duplicate clusters; canonical map; safe patch proposal.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Do not canonicalize distinct localized or materially different product pages together.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
