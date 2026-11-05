---
name: search-intent-analyzer
description: "Classify queries by informational, navigational, commercial, and transactional intent."
---

# Search Intent Analyzer

## Mission
Classify queries by informational, navigational, commercial, and transactional intent.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Keyword list; target market/language; optional SERP samples.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Review query wording and current search-result patterns when data is provided. Identify the user's likely task, expected content format, funnel stage, and conversion action. Recommend page type and content depth for each cluster.

## Deliverables
Intent-labelled keyword table; content format and CTA recommendations.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Do not assume intent from keyword alone when evidence is ambiguous.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
