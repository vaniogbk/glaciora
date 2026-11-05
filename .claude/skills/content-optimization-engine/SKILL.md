---
name: content-optimization-engine
description: "Improve existing content for usefulness, clarity, completeness, and search intent."
---

# Content Optimization Engine

## Mission
Improve existing content for usefulness, clarity, completeness, and search intent.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Current page copy; target queries; analytics/search data; product facts.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Compare page content with query intent and real user questions. Identify outdated facts, missing explanations, weak headings, duplication, unclear CTAs, and internal-link opportunities. Preserve accurate material and show edits as a diff.

## Deliverables
Content gap analysis; revised draft or patch; change rationale.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Do not change factual product claims without verification.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
