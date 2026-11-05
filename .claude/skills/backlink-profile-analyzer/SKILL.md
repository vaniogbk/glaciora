---
name: backlink-profile-analyzer
description: "Assess backlink quality and identify potentially harmful or irrelevant link patterns."
---

# Backlink Profile Analyzer

## Mission
Assess backlink quality and identify potentially harmful or irrelevant link patterns.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Backlink export; domain; target markets; known campaigns.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Analyze supplied backlink exports for referring-domain relevance, editorial context, anchor distribution, link velocity, and suspicious patterns. Separate low quality from demonstrably manipulative links and explain uncertainty.

## Deliverables
Link profile report; notable patterns; investigation priorities.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Do not recommend disavowing links solely because of a third-party toxicity score.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
