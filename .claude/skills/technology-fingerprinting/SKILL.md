---
name: technology-fingerprinting
description: "Identify frameworks, runtimes, server components, and versions from the codebase and approved response headers."
---

# Technology Fingerprinting

## Mission
Identify frameworks, runtimes, server components, and versions from the codebase and approved response headers.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Repository; optional approved URL; deployment metadata.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Inspect lockfiles, manifests, Dockerfiles, build configuration, response headers, and deployment metadata. Distinguish confirmed versions from guesses. Flag end-of-life components and disclose fingerprinting confidence. Avoid intrusive probes.

## Deliverables
Technology inventory; lifecycle risks; upgrade recommendations.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Do not attempt exploit validation as part of fingerprinting.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
