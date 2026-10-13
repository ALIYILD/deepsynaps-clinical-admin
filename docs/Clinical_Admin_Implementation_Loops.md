# DeepSynaps Clinical Admin — implementation loops

Prepared 13 October 2026 for the proposed Oxford Health NHS Foundation Trust workspace. This is a product implementation record, not Trust approval or a clinical deployment decision.

## How each loop works

1. **Inspect:** identify the narrow user outcome, source contract and required inputs.
2. **Implement:** make one reversible increment in this separate product repository.
3. **Verify:** run tests that cover the outcome and its failure cases. For connected work, use synthetic staging records and real access checks.
4. **Record:** save changes, test evidence, limitations and the next dependency.
5. **Advance or stop:** advance only when the next loop's inputs exist. Record blocked work explicitly; do not replace unavailable services with simulated success.

Run `npm run loops` from this checkout. This executes one finite verification pass for local loops L01–L03, stops running further local tests on failure and writes a report for all six loops. There are no automatic retries, background schedules, credential searches or production deployments in the runner. It returns a nonzero exit status for local verification failure. A zero exit status means local checks passed; L04–L06 can still be blocked.

The runner saves TAP output under `loops/evidence`, a machine-readable report at `loops/latest-report.json`, and the browser snapshot at `dist/loop-report.js`. The report includes a SHA-256 fingerprint of the JavaScript, integration modules, tests, runner and ledger used in the pass. It is traceability evidence, not a signed clinical audit record. The website's Implementation loops page shows that recorded snapshot; its buttons cannot execute repository tests or approve a release.

## Loop map

| Loop | Deliverable | Applied scope | Exit condition |
|---|---|---|---|
| L01 | Branded product and 158-function register | Existing prototype and local regression checks | Exact function IDs/status counts, route handlers, local extension requests and proposal controls pass |
| L02 | Read gateway and adapter policy | Source-only modules, tested with injected fake services | Required sessions, explicit permissions, organisation binding and patient checks; deny writes, scope overrides and unsupported routes |
| L03 | Complete representative demo workflow | Three independent fictional records in browser storage | Patient isolation, exact-text signing, amendment history, per-field form review and source-linked follow-up tasks pass |
| L04 | Authenticated synthetic staging reads | Blocked on environment and identity integration | Successful authorised reads and failed cross-organisation/patient reads against an actual staging deployment |
| L05 | Authenticated workflow writes and optional connectors | Blocked on L04 and verified write contracts | One real consent-to-reviewed-document journey with concurrency, retry and failure tests; optional services activated individually |
| L06 | Assurance and controlled pilot decision | Evidence preparation can proceed; decision remains blocked | Named owners review the exact deployment and record the required decisions, support and stop criteria |

Full OH01–OH30 mapping and acceptance text is in `loops/implementation.json`. Some work packages span a local foundation and a later connected loop. Passing a local loop does not mark the corresponding production package complete.

## L01 — product and source register

The product retains the original DeepSynaps logo, light/dark design tokens, Oxford Health proposal context, service profiles, extension-request drafts and all 158 source-backed function entries. Counts remain 68 ready, 23 service-dependent, 31 linked, 9 partial, 14 externally dependent, 8 awaiting human sign-off and 5 excluded.

`tests/product.test.mjs` verifies route output and handler syntax, function evidence, filters, gates, local configuration and reset. These are Node-based checks with a minimal DOM fixture, not browser rendering or clinical validation. The Clinical OS upstream tests have not been rerun by this project.

## L02 — read gateway foundation

New module: `integration/clinical-admin-gateway.mjs`. Existing read transport: `integration/clinical-os-reader.mjs`. Both are server-only foundations and are **not mounted or deployed** in this static site.

The gateway accepts standard Request objects and returns JSON Responses. Only explicit GET routes under `/api/clinical-admin/` are recognised. It calls three trusted server integrations:

- `verifySession(request)`: verify the real session and return subject, organisation ID, permissions, millisecond expiry and an upstream user token where needed. Browser-supplied role or organisation headers are not trusted identity.
- `resolveTenantReader(organisationId)`: return a matching organisation binding and the configured server-only reader. The resolver must use approved server configuration, not a browser-selected upstream URL.
- `canReadPatient(session, patientId)`: confirm authoritative patient access for the verified subject and organisation. A broad partner key cannot replace this decision.

Missing integrations fail closed. Expired sessions return 401; insufficient permissions return 403; denied patient reads return 404; unconfigured services return 503. Successful responses and errors are non-cacheable. Unexpected errors are sanitised. The reader restricts upstream origins and synthetic sandbox keys, bounds timeouts, rejects redirects and invalid content, and preserves upstream denials. There is no fallback to synthetic patient data when a connected read fails.

The isolated tests cover missing/expired sessions, upstream identity selection, absent permissions, patient denial, mismatched organisation bindings, clinic-wide permission requirements, query overrides, duplicate parameters, method restrictions and redacted errors. They prove the module's behaviour with injected dependencies; they do not prove the as-yet-unimplemented identity service.

## L03 — applied patient workflow

### Separate fictional records

Maya Collins, Alex Taylor and Sam Wilson now have their own consent, transcript-loaded state, notes, versions, history and forms. Patient selection is available on clinical screens and the appointment list. Switching patients stops the simulated capture and cancels a pending note review. Browser reload preserves the selected record. Existing single-patient demo notes migrate to Maya only. Reset removes all three records' local edits.

### Review, sign and amend

Each patient's scripted transcript and note templates use that patient's ID and preferences. Review displays the exact draft and source. Confirmation is tied to patient, text, version and edit revision. Any edit or patient switch invalidates that review. Signing stores a version snapshot; subsequent edits require an amendment. History retains the signed source. This is a local demonstration signature, not a legal or clinical signature, and browser storage is not an immutable audit service.

### Form review

Each field shows its original fictional source, accepts edits and requires its own review. Editing a field clears its review and disables approval eligibility. Approval stores a snapshot and protects fields until explicitly reopened. Export includes source values, edits, review flags, patient ID and `DEMO_APPROVED_NOT_SUBMITTED`. Nothing is submitted to a patient or EPR.

### Tasks and handoff

Follow-up creation requires the selected patient's signed note. Its deduplication key includes patient, action and signed version. Each task retains the exact signed text so later amendments do not silently change its source. The task asks staff to review the signed note before arranging follow-up; it does not infer instructions from arbitrary edited text. Handoff previews use the selected patient ID and say `NOT_SUBMITTED`. Note exports identify the selected patient and version.

The team task list and local audit are workspace-wide, while clinical records are patient-specific. This browser isolation improves the demo; production isolation must be server-enforced.

## L04 — next executable connected loop

Required inputs:

1. An approved synthetic staging origin and a release/deployment owner.
2. The session verification contract, session lifecycle and upstream per-user token mapping.
3. Authoritative organisation membership and patient-access resolvers.
4. A server secret-store reference for a sandbox partner key, plus synthetic accounts and patients across at least two organisations.

Do not send secrets through the browser or enter them into this demo. No secret-entry fields are provided. The read gateway must be mounted on an approved authenticated server before the UI is wired to it. This loop does not authorise restarting or deploying the main Clinical OS.

Implement and demonstrate, in order:

1. Reject an unauthenticated request without an upstream call.
2. Read capabilities with the actual user's upstream session.
3. Read the function registry and distinguish server availability from the historical source snapshot.
4. Read one permitted patient's briefing and approved partner documents.
5. Deny another organisation's patient and an unassigned same-organisation patient.
6. Show explicit states for expired sessions, missing permissions, timeouts and unavailable upstream services.
7. Remove simulated data from the connected path and label modes clearly.

Record actual request outcomes without credentials or patient data in logs. A successful connection needs staging test evidence, not only a configured origin or a 200 from a mocked service.

## L05 — real write workflows

Inspect the authenticated write schemas before implementation. The partner API remains read-only. Connect in narrow increments: consent and recording lifecycle; transcription with human speaker review; draft/save/sign/amend; source-backed forms; assigned tasks; approved messaging or EPR connectors.

For each increment, define actor and patient scope, request/response schema, denied states, concurrency control, idempotency, source provenance, retention and audit requirements. Test successful writes, stale edits, repeated submission, lost acknowledgement, rejected consent and provider failure. Persist signed documents on the server; do not use browser state as clinical authority. An EPR request is not complete until an authorised destination acknowledges it.

Transcription, AI drafting, OCR, SMS and EPR capabilities remain separately gated. A missing connector must show its dependency, not a success notification. Optional DeepSynaps modules need backend entitlements, an approver, scope, expiry and revocation before activation.

## L06 — evidence and human decision

Work can start on requirements, evidence assembly and owner nomination while staging work proceeds. Confirm the intended pilot service, Trust sponsor, clinical safety and information governance leads, operational owner, exact hosting/processor arrangements, EPR requirements and deployment release operator. All named-person roles are currently **to be nominated**, not invented by the product.

Carry forward the detailed plan's supplier and Trust assurance work, manual accessibility and security checks, local documentation/speech evaluation, recovery rehearsal, training, support and incident arrangements. The exact standards/evidence requested must be checked with the responsible owners for the intended deployment; this runbook does not claim compliance.

Pilot entry needs a recorded human decision on the exact release. Pilot stop criteria should include unexpected cross-patient access, lost or misattributed documents, unsafe output patterns, consent failures or recovery failures, with a named escalation route agreed before use. Excluded functions remain excluded: diagnosis/treatment recommendations, autonomous orders, unsupervised risk triage, twins simulations and self-training on identifiable NHS records.

## Verification limits and current result

The release report records local syntax and automated tests. A separate Playwright suite now checks Chromium desktop/mobile workflows, viewport overflow and keyboard dialog controls with `npm run test:browser`; its evidence is retained by the browser CI job. Manual visual and screen-reader verification remain outstanding. No live API or EPR test, Trust UAT, clinical validation or assurance sign-off has occurred. The public function readiness categories continue to describe the inspected upstream register, not 158 implemented functions in this site.

The actionable next handoff is the L04 staging and identity contract. Until that exists, the published product remains a private synthetic demonstration and the integration modules remain source-only.
