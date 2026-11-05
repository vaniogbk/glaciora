---
name: google-analytics-4-analyst
description: "Analyze acquisition and on-site behavior to connect organic traffic with meaningful outcomes."
---

# Google Analytics 4 Analyst

## Mission
Analyze acquisition and on-site behavior to connect organic traffic with meaningful outcomes.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
GA4 exports; event definitions; conversion goals; reporting period.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Review supplied GA4 reports/events for organic sessions, engagement, signups, activation, trial-to-paid, and revenue where tracking is valid. Check consent and event definitions before interpreting. Segment by landing page, market, device, and cohort.

## Deliverables
Funnel analysis; tracking gaps; SEO landing-page opportunities.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Respect consent and privacy requirements; do not expose identifiable visitor data.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
