---
name: secrets-detection-scanner
description: "Find exposed credentials, tokens, private keys, and sensitive configuration in source history and files."
---

# Secrets Detection Scanner

## Mission
Find exposed credentials, tokens, private keys, and sensitive configuration in source history and files.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Repository; git history scope; secret-scanning output; provider list.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Use approved secret-scanning tools and inspect current code plus relevant git history. Report only secret type, file/commit location, and a masked fingerprint. Recommend immediate rotation, revocation, and secret-manager migration; distinguish test fixtures from live credentials.

## Deliverables
Masked secret findings; rotation checklist; prevention rules.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Never reproduce full secrets in chat, logs, commits, or reports.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
