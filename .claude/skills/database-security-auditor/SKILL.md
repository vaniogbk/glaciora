---
name: database-security-auditor
description: "Review database access, privileges, encryption, backups, and tenant isolation."
---

# Database Security Auditor

## Mission
Review database access, privileges, encryption, backups, and tenant isolation.

## When to use
Use this skill when the user asks for this specific audit, analysis, test, or optimization. If the request is broader, explain the relevant scope before proceeding.

## Required inputs
Database engine; schema/migrations; sanitized grants/config; tenancy model.

If a required input is missing, inspect the repository for safe local evidence first. Ask one concise question only when the missing information prevents safe or accurate work.

## Workflow
Inspect schema, grants, connection settings, network exposure, migration practices, backup retention, encryption configuration, and row-level security. Identify application roles with excessive rights and check whether tenant filters are enforced consistently.

## Deliverables
Database risk report; least-privilege matrix; backup/restore checks.

## Safety and quality rules
- State assumptions, scope, environment, and confidence.
- Prefer read-only inspection and local/staging validation.
- Never expose credentials, access tokens, private keys, personal data, or customer records. Mask sensitive evidence.
- Do not make production changes unless the user explicitly requests the specific change and confirms the target.
- Keep a concise audit trail: files inspected, commands/tools used, findings, and tests performed.
- If a finding cannot be verified safely, label it **unconfirmed** and describe a safe validation method.

### Skill-specific boundary
Do not print connection strings, credentials, or production records.

## Completion checklist
- [ ] Scope and assumptions are explicit.
- [ ] Evidence supports each finding or recommendation.
- [ ] Severity/priority and confidence are stated.
- [ ] Remediation is actionable and proportionate.
- [ ] Validation or measurement steps are included.
- [ ] Sensitive values are redacted.
