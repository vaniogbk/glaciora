---
name: meta-tags-optimizer
description: "Write accurate, distinct title tags and meta descriptions for important pages."
---

# Meta Tags Optimizer

## Mission
Write accurate, distinct title tags and meta descriptions for important pages.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Page inventory; page content; target queries; brand naming conventions.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Generate concise titles and descriptions that reflect page content, distinguish similar URLs, communicate user value, and use the target query naturally. Check duplicates and truncation risk, while noting that search engines may rewrite snippets.

## Deliverables
Title/meta table; duplicate warnings; implementation patch.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Do not promise exact snippet display or use misleading clickbait.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
