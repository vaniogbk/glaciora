---
name: file-upload-security-tester
description: "Review upload validation, storage, processing, and download controls."
---

# File-Upload Security Tester

## Mission
Review upload validation, storage, processing, and download controls.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Repository; upload routes; storage configuration; file types supported.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Trace upload flow from client to server to storage and downstream processors. Check size limits, extension/MIME/signature validation, random names, malware scanning, archive traversal, image/document parser risks, public access, and content-disposition. Test only with harmless synthetic files.

## Deliverables
Upload threat model; gaps; safe test cases; storage and validation fixes.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Do not upload malware or exploit files to production or third-party scanners.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
