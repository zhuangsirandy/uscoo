# Privacy and data handling

USCOO processes unusually sensitive professional, identity, and immigration-preparation material. A fork operator becomes responsible for its own privacy notice, retention rules, subprocessors, security controls, and user requests.

## Data locations

| Data                                            | Default location                                       |
| ----------------------------------------------- | ------------------------------------------------------ |
| Accounts, cases, record versions, audit entries | D1                                                     |
| Assessment events and submitted leads           | D1                                                     |
| Support requests and queued email jobs          | D1                                                     |
| Uploaded evidence and generated files           | R2                                                     |
| Optional AI request content                     | Selected model provider, only when enabled and invoked |
| Optional email content                          | Resend, only when configured                           |

## Minimum operating controls

- Collect only what the workflow needs.
- Keep production and development databases separate.
- Restrict admin IDs and review them regularly.
- Set documented retention and deletion periods.
- Do not copy real cases into GitHub issues, logs, fixtures, analytics, or model prompts without an appropriate basis and user choice.
- Encrypt transport, limit storage access, and maintain recovery procedures.
- Provide a tested export/deletion path and a security contact.

The repository contains no production database, applicant documents, access tokens, analytics exports, or real user examples.
