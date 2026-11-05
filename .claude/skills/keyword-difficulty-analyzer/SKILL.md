---
name: keyword-difficulty-analyzer
description: "Estimate ranking difficulty using transparent, evidence-based signals."
---

# Keyword Difficulty Analyzer

## Mission
Estimate ranking difficulty using transparent, evidence-based signals.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Keyword list; tool exports; target country/language.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Use supplied SEO-tool metrics and inspect competing pages, topical relevance, domain strength proxies, content quality, and SERP features. Explain methodology and uncertainty. Prioritize attainable terms rather than treating a single difficulty score as truth.

## Deliverables
Difficulty assessment; confidence; quick wins and longer-term targets.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Never fabricate metrics or guarantee a ranking position.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
