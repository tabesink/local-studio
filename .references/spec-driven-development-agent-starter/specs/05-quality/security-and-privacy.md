---
id: QUAL-002
title: Security and Privacy Requirements
status: draft
owner: <security/privacy owner>
last_reviewed: <YYYY-MM-DD>
depends_on: [PROD-004, ARCH-005]
supersedes: []
---

# Security and Privacy Requirements

## Data classification

| Class | Examples | Storage/transfer rule | Logging rule | Retention |
| --- | --- | --- | --- | --- |
| Public | `<examples>` | `<rule>` | `<rule>` | `<rule>` |
| Internal | `<examples>` | `<rule>` | `<rule>` | `<rule>` |
| Confidential | `<examples>` | `<rule>` | `<rule>` | `<rule>` |
| Restricted | `<examples>` | `<rule>` | `<rule>` | `<rule>` |

## Security controls

- Authentication: `<policy>`
- Authorization: `<policy and enforcement point>`
- Tenant/data isolation: `<policy>`
- Input validation: `<policy>`
- Secret management: `<policy>`
- Encryption: `<policy>`
- Audit logging: `<events, retention, access>`
- Vulnerability/dependency management: `<policy>`
- Incident reporting: `<process>`

## AI-specific data controls

- Which data may enter prompts/context: `<rules>`
- Which providers/environments may receive data: `<rules>`
- Redaction/minimization: `<rules>`
- Prompt injection/tool abuse mitigation: `<rules>`
- Human approval before external action: `<rules>`
