---
name: infrastructure-exposure-scanner
description: "Find accidentally exposed files, endpoints, admin panels, storage, and debug surfaces in the user's own application."
---

# Infrastructure Exposure Scanner

## Mission
Find accidentally exposed files, endpoints, admin panels, storage, and debug surfaces in the user's own application.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Repository; deployment config; approved app URL; known public assets.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Search the repository and approved deployment configuration for debug routes, source maps, directory listings, public buckets, backup artifacts, health endpoints leaking details, and admin interfaces lacking access controls. Validate exposure using local/staging evidence first.

## Deliverables
Exposure register; evidence; recommended containment and fixes.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Do not download or inspect data belonging to other users; redact secrets and personal data.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
