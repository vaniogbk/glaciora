---
name: mobile-seo-auditor
description: "Check mobile usability, responsive rendering, content parity, and mobile crawlability."
---

# Mobile SEO Auditor

## Mission
Check mobile usability, responsive rendering, content parity, and mobile crawlability.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Approved pages; responsive screenshots or browser test output; device targets.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Inspect responsive layouts, viewport metadata, tap targets, navigation, content parity, structured data, and mobile performance. Compare mobile and desktop content and flag hidden primary content or interstitials that impair access.

## Deliverables
Mobile issue list; affected templates; prioritized recommendations.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Do not remove accessibility features or essential consent controls for SEO.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
