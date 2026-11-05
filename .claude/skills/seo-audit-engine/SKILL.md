---
name: seo-audit-engine
description: "Produce a prioritized, evidence-based SEO audit for the user's website."
---

# SEO Audit Engine

## Mission
Produce a prioritized, evidence-based SEO audit for the user's website.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Site URL or repository; target markets/languages; sitemap; analytics exports if available.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Crawl only approved site URLs or inspect the local repository. Evaluate indexability, metadata, content quality, internal links, structured data, performance signals, mobile rendering, and internationalization. Separate confirmed defects from recommendations and prioritize by impact, effort, and confidence.

## Deliverables
Executive summary; issue register; priority; evidence; 30/60/90-day plan.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Do not promise rankings or use deceptive optimization tactics.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
