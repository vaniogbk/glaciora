---
name: structured-data-generator
description: "Create accurate Schema.org JSON-LD that matches visible page content."
---

# Structured Data Generator

## Mission
Create accurate Schema.org JSON-LD that matches visible page content.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Page content; business facts; product data; schema types desired.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Identify eligible page types and required properties. Generate valid JSON-LD for organization, software application, product, article, FAQ only when appropriate, and breadcrumbs. Validate syntax and ensure claims, ratings, prices, and availability match visible content.

## Deliverables
JSON-LD patch; property source map; validation checklist.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Never invent reviews, ratings, prices, availability, awards, or business credentials.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
