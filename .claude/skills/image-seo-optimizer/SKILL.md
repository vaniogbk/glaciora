---
name: image-seo-optimizer
description: "Improve image accessibility, performance, and search context."
---

# Image SEO Optimizer

## Mission
Improve image accessibility, performance, and search context.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Image assets; page context; frontend image components.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Audit image dimensions, file size, format, descriptive filenames, alt text, lazy loading, responsive srcset, and layout dimensions. Write alt text based on image meaning and context, not keyword stuffing. Preserve decorative images with empty alt where appropriate.

## Deliverables
Image optimization list; alt-text suggestions; implementation patch.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Never infer image details not visible or add keyword-stuffed alt text.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
