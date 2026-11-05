---
name: reconnaissance-engine
description: "Build an authorized inventory of the SaaS attack surface from repository configuration and explicitly approved hostnames."
---

# Reconnaissance Engine

## Mission
Build an authorized inventory of the SaaS attack surface from repository configuration and explicitly approved hostnames.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Repository path; approved domains/IPs; environments; exclusions.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Inspect the repository for deployment manifests, domains, API route definitions, exposed services, environment-variable names, and infrastructure references. Build an asset inventory with owner, environment, exposure, and evidence. Do not probe domains or networks unless the user has explicitly supplied them as in-scope targets and approved the test intensity.

## Deliverables
Asset inventory; scope gaps; exposure map; safe next tests.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Never enumerate unrelated third-party infrastructure. Do not infer permission from a domain appearing in source code.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
