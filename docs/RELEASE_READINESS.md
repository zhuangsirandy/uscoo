# Source release readiness

Status: preparation only. Repository stays private until a reviewed source release is ready.

## Verified so far

- GitHub repository access is available.
- Existing application checkout has assessment, case organization, report and attorney-brief modules.
- Build configuration imports a platform-specific plugin and hosting configuration.
- Authentication trusts hosting-provided identity headers and needs an appropriate trusted boundary for standalone use.

## Required before public release

- [ ] Confirm source checkout matches the intended production version.
- [ ] Create a separate clean source snapshot without production Git history.
- [ ] Review tracked files for secrets, personal data, private affiliations and production configuration.
- [ ] Preserve third-party copyright notices and review dependency licensing.
- [ ] Select and include the release license.
- [ ] Provide safe authentication for the documented runtime, or explicitly limit the release to modules that do not require it.
- [ ] Document database and storage setup using new resources; never export production records.
- [ ] Include configuration templates containing placeholders only.
- [ ] Include a synthetic example and clearly label it fictional.
- [ ] Verify installation and documented workflows from a clean checkout.
- [ ] Ensure hosted-only capabilities and unsupported features are clearly described.
- [ ] Review public author identity and commit metadata before changing visibility.

## Acquisition and collaboration

The README links to the hosted application with GitHub referral parameters. These parameters do not themselves install analytics or prove conversion tracking exists.

Evaluate the release by useful outcomes: referral visits where measurement exists, completed assessments, actionable feedback, and qualified law-firm conversations. Stars alone do not demonstrate product adoption.

Initial law-firm outreach should invite feedback on a concrete intake or evidence workflow. Do not advertise existing integrations, clients, partnerships, or APIs without verification.
