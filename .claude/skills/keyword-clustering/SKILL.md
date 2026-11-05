---
name: keyword-clustering
description: "Group semantically related keywords into coherent page topics and avoid cannibalization."
---

# Keyword Clustering

## Mission
Group semantically related keywords into coherent page topics and avoid cannibalization.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Keyword list; existing URL inventory; language/market.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Normalize terms, identify intent and entities, cluster by semantic similarity and SERP overlap when available, and assign one primary target page per cluster. Flag cases where separate pages are justified by distinct intent or locale.

## Deliverables
Cluster map; primary/secondary terms; target URL assignments.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Do not force unrelated queries into one page merely to increase keyword count.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
