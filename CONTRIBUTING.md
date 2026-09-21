# Contributing to USCOO

Thank you for helping improve transparent O-1A preparation software.

## Before opening an issue

- Search existing issues first.
- Use fictional examples only.
- Never upload passports, petitions, resumes, recommendation letters, receipt numbers, contact details, or other applicant information.
- Do not ask maintainers for legal advice or an eligibility determination.
- Report security or privacy problems privately as described in [SECURITY.md](SECURITY.md).

## Pull requests

1. Create a focused branch.
2. Explain the user problem and the chosen boundary.
3. Add or update synthetic tests.
4. Run `pnpm lint`, `pnpm build`, and `pnpm test`.
5. Confirm that the diff contains no secrets, production identifiers, or personal data.

Large changes to authentication, storage, AI behavior, legal-content wording, or the data model should begin with an issue so reviewers can agree on scope.

## Product principles

- Source evidence is more important than generated prose.
- AI output must remain reviewable and attributable to inputs.
- Users control whether case material is sent to a model.
- The product must distinguish preparation support from legal advice.
- Current USCIS sources take priority over hard-coded assumptions.
- Access checks and tenant isolation are never optional.

By contributing, you agree that your contribution is licensed under Apache-2.0.
