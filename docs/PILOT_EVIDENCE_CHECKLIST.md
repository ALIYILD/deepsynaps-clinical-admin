# Clinical Admin pilot evidence checklist

L06 evidence preparation is open; the pilot decision remains blocked. This checklist implements the supplied runbook's handoff requirements and makes no standards or compliance determination. The responsible owners must confirm the evidence required for the intended deployment.

## Owners and scope

| Responsibility | Named owner | Required decision |
| --- | --- | --- |
| Trust sponsor | To be nominated | Intended service, purpose, users and bounded pilot scope |
| Clinical safety | To be nominated | Hazard review, local output evaluation and stop criteria |
| Information governance | To be nominated | Hosting, processors, data flows, retention and access arrangements |
| Operations and support | To be nominated | Training, support hours, escalation and incident response |
| Release operator | To be nominated | Exact deployment, rollback, recovery and release control |
| EPR integration | To be nominated if required | Destination, scopes, write contracts and acknowledgements |

## Evidence to attach to the candidate release

- Candidate commit, immutable deployment identifier, environment and approved configuration references.
- `loops/latest-report.json` plus L01–L03 TAP evidence; distinguish local verification from connected test outcomes.
- Completed S01–S14 staging results from `STAGING_HANDOFF.md`, including negative access cases and redacted telemetry.
- Reviewed write contracts and tests for conflicts, retries, lost acknowledgements, consent and provider failures.
- Manual browser, keyboard and screen-reader findings with severity, remediation and retest evidence.
- Security review and access/revocation checks for the exact deployment.
- Local documentation and speech evaluation, human review controls and known output limitations.
- Recovery rehearsal: interrupted workflow, lost service, restoration, document attribution and rollback evidence.
- Training material, support rota, incident procedure and agreed escalation route.
- Supplier and Trust assurance decisions requested by the nominated owners, with evidence references and unresolved issues.

## Decision record

Complete only after the evidence is reviewed: candidate commit and deployment; proposed service and participant scope; evidence references; unresolved risks and owners; each reviewer’s name, role, dated decision and conditions; pilot start/end dates; support and escalation contacts; release operator; rollback authority and procedure. Current decision: **not approved; owners and connected evidence outstanding**.

Stop the pilot for unexpected cross-patient access, lost or misattributed documents, unsafe output patterns, consent failures or recovery failures. Before use, owners must agree who stops access, how staff escalate, how evidence is preserved and who may authorise resumption.

Diagnosis/treatment recommendations, autonomous orders, unsupervised risk triage, twins simulations and self-training on identifiable NHS records remain excluded.
