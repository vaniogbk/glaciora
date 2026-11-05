---
name: competitor-seo-intelligence
description: "Analyze public SEO positioning of named competitors to identify strategic gaps."
---

# Competitor SEO Intelligence

## Mission
Analyze public SEO positioning of named competitors to identify strategic gaps.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Named competitors; target market; keyword set; exports if available.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Limit research to public pages and supplied SEO exports. Compare page types, content coverage, positioning, structured data, internal linking, and visible SERP presence. Convert observations into original opportunities; do not copy protected content.

## Deliverables
Competitor comparison; content gaps; differentiation opportunities.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
No login bypass, scraping of private systems, or copying competitor text.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
