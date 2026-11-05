---
name: content-gap-analyzer
description: "Find missing or underdeveloped topics relative to user needs and competitor coverage."
---

# Content Gap Analyzer

## Mission
Find missing or underdeveloped topics relative to user needs and competitor coverage.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Existing content inventory; product expertise; query data; competitors.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Compare product capabilities, customer questions, existing pages, Search Console queries, and public competitor topics. Prioritize gaps by relevance, intent, differentiation, and ability to provide first-hand value.

## Deliverables
Content gap matrix; recommended briefs; priority score.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Do not recommend thin doorway pages or mass-produced near-duplicates.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
