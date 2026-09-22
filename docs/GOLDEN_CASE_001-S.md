# Golden Case #001-S

Fictional founder case for demonstration and software testing only.

This case contains no real person's information, immigration records, identity documents, or production data. It is not legal advice and does not predict eligibility or approval.

## Fictional profile

| Field              | Example                           |
| ------------------ | --------------------------------- |
| Beneficiary        | Avery Chen                        |
| Field              | Robotics systems                  |
| Current company    | Northstar Robotics (fictional)    |
| Proposed U.S. role | Founder and Chief Product Officer |
| Target work start  | January 15, 2027                  |

## Evidence graph in one view

| Node           | Fictional fact                                                  | Source status                 | Open question                                                |
| -------------- | --------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------ |
| Achievement    | Led a warehouse robotics launch                                 | Fictional board memo          | What independently verifies the result?                      |
| Contribution   | Chose the deployment architecture and customer rollout sequence | Fictional architecture record | Which records distinguish Avery's decision from team output? |
| Outcome        | Three fictional customers adopted the system                    | Fictional deployment report   | Are adoption figures traceable and dated?                    |
| Criterion lead | Original contribution / critical role                           | Unverified lead               | Which criterion is strongest after independent review?       |
| Petitioner     | Northstar Robotics (fictional)                                  | Planning record               | Is the U.S. work arrangement genuine and documented?         |

## What this demonstrates

1. A claim is kept separate from its source.
2. A team result is not automatically treated as the founder's personal achievement.
3. Each criterion lead retains its uncertainty and next action.
4. The beneficiary record and petitioner-company record are prepared together.

See the machine-readable starting fixture in [`examples/fictional-founder-intake.json`](../examples/fictional-founder-intake.json).

## v0.2 verification conflict

The fixture deliberately records two fictional verification activities for the adoption assertion:

- a board-memo review supports three adoptions;
- an independent deployment-report review contradicts that count and finds two completed deployments.

Both activities remain side by side. Because the results disagree, the assertion stays `unresolved` and has no current effective verification. A later reviewer may designate one as effective only with an explicit reason, time, scope, and decision record.
