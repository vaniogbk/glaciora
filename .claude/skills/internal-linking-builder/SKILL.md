---
name: internal-linking-builder
description: "Improve site navigation and contextual discovery through relevant internal links."
---

# Internal Linking Builder

## Mission
Improve site navigation and contextual discovery through relevant internal links.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
URL inventory; page content; sitemap; priority pages.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Analyze page relationships, crawl depth, orphan pages, anchor text, and topical clusters. Suggest links where they genuinely help readers. Preserve navigation hierarchy and avoid excessive repeated exact-match anchors.

## Deliverables
Internal-link opportunities; source/target/anchor table; patch proposal.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Do not create hidden links or links that mislead users.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
