# Clinical Admin staging handoff

L04 remains blocked. The release operator and identity owners must complete the inputs below before mounting the source-only gateway. Use synthetic records only. The local verification report does not establish staging connectivity.

## Required deployment and identity inputs

| Input | Required record | Current state |
| --- | --- | --- |
| Deployment | Approved HTTPS origin, candidate commit, hosting environment and release operator | Not supplied |
| Session service | Verification mechanism, issuer/audience where applicable, expiry, logout/revocation and upstream per-user token mapping | Not supplied |
| Organisation binding | Authoritative membership source and server-configured reader per organisation | Not supplied |
| Patient access | Authoritative assignment/access resolver, including revoked access behaviour | Not supplied |
| Partner access | Secret-store reference for an organisation-scoped sandbox key and approved read scopes | Not supplied |
| Test fixtures | Two organisations, one user per organisation, an assigned patient and an unassigned patient in the first organisation, and a patient in the second | Not supplied |

Record references to secret-store entries only; never put credentials, cookies, patient payloads or tokens into this repository. No credential discovery or production deployment is part of this handoff.

## Server dependency contract

`createClinicalAdminGateway` takes three trusted server functions. Identity services must be implemented against the agreed deployment contract, not against browser headers or local demo records.

- `verifySession(request, {signal})` returns `null` for an invalid session or a verified object with nonempty `subject` and `organisationId`, numeric `expiresAt` in milliseconds, explicit `permissions`, and `upstreamAccessToken` for workspace reads. Permissions are `workspace:read`, `partner:read` and the separate clinic-wide `partner:clinic_read` grant. Revalidate expiry, revocation and membership according to the approved lifecycle.
- `resolveTenantReader(organisationId, {signal})` returns `{organisationId, reader}` for that exact organisation, or no binding. Construct the reader using approved server configuration and that organisation's sandbox key. Never allow the caller to choose an upstream origin or key.
- `canReadPatient(session, patientId, {signal})` returns the boolean `true` only after an authoritative subject, organisation and patient access decision. Missing or denied access must never inherit the broad permissions of a partner key.

The optional final `{signal}` argument carries the gateway deadline and caller cancellation. Trusted services must honour it and release their resources. The host must connect client disconnects to the incoming Request signal. Staging tests must cover stalled identity/permission lookups, timeout, caller cancellation and late completion without a later upstream call.

Mount only `/api/clinical-admin/` GET routes on the authenticated server. Keep responses non-cacheable. The static `dist/` site must remain in demo mode until real reads have passed the following acceptance cases. Do not add secret-entry fields or import server modules into the browser.

## Staging acceptance sequence

Run these against the exact deployed gateway with actual synthetic sessions and actual upstream services. Injected dependency tests cannot satisfy this table.

| Case | Request or condition | Required outcome |
| --- | --- | --- |
| S01 | No session; GET workspace capabilities | 401 and zero upstream calls |
| S02 | Valid session; GET workspace capabilities | 200 using that user's upstream identity |
| S03 | Valid session; GET workspace functions | 200; UI distinguishes current availability from historical register |
| S04 | Assigned patient; GET workspace briefing and partner documents | 200 for both, correct synthetic patient and organisation |
| S05 | Patient belonging to second organisation | 404 and zero upstream reads |
| S06 | Unassigned patient in the user's own organisation | 404 and zero upstream reads |
| S07 | Expired or revoked session | 401 and zero upstream calls when expired at entry or before the read; expiry during an upstream read discards its result. Authoritative revocation requires identity-service evidence. |
| S08 | Missing operation permission | 403 and zero upstream calls |
| S09 | Missing or mismatched tenant binding | 503, no fallback records |
| S10 | Controlled upstream timeout or outage | 504 for timeout; explicit sanitised failure for outage; no demo fallback |
| S11 | Duplicate patient IDs, organisation/origin override query, POST | 400 for query violations, 405 for POST; zero upstream calls |
| S12 | Partner tasks without clinic-wide permission | 403 even if patient-read permission exists |
| S13 | Upstream 401, 403, 404 or 429 | Preserve denial status; no patient payload or upstream diagnostics in errors |
| S14 | UI mode and session changes | Connected mode explicitly labelled; expired session clears stale patient display; no simulated result on failure |

Record case ID, timestamp, candidate commit, deployment ID, fixture alias, expected and observed status, upstream call count from redacted server telemetry, and pass/fail. Do not record request headers or response bodies. Review every case with the release operator before updating L04 from blocked. UI wiring and session lifecycle tests remain implementation work after the required contracts arrive.

## Write contract required for L05

For each increment, record the inspected upstream revision and endpoint, actor permissions, organisation and patient scope, request/response schema, source provenance, consent preconditions, retention/audit policy, conflict response and version token, idempotency key scope and lifetime, and acknowledgement semantics. Begin with one consent-to-reviewed-document journey after L04 passes.

Required outcomes include successful consent/save/sign/amend; denied or withdrawn consent; stale-version rejection; duplicate submission; lost acknowledgement followed by a safe retry; interrupted recording; and provider failure. Signed documents must persist on the server. EPR completion requires an authorised destination acknowledgement. Transcription, AI, OCR, messaging and EPR activation each need their own verified contract and approval. Until supplied, keep them blocked.

## Located upstream test setup

The dedicated Hetzner synthetic environment and existing owner test acceptance have now been located; see `HETZNER_TEST_ENVIRONMENT.md`. Current upstream records call the deployment ready to build, and the example DNS name does not resolve. An actual hostname/IP or SSH alias is still needed to verify an independently provisioned host. Existing synthetic-test acceptance is retained; it is not a real-patient pilot release decision.

`npm start` now mounts the gateway in the optional Node HTTP host, returning 503 without a trusted server adapter. This removes the missing local host implementation; it does not supply identity, tenancy, live connectivity or writes. Socket-level tests and browser verification run against that host.
