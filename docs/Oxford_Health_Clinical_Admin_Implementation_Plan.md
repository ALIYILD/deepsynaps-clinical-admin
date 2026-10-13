# DeepSynaps Clinical Admin — Oxford Health implementation plan

**Prepared:** 13 October 2026  
**Intended audience:** Oxford Health NHS Foundation Trust, proposed pilot discussion  
**Product owner:** Ali Yildirim, DeepSynaps  
**Current state:** Branded synthetic prototype; source-reviewed integration foundation; no live API connection  
**Relationship:** A proposal prepared for the Trust. No commissioning, partnership, procurement decision or NHS approval is implied.

## 1. Product decision and intended scope

Build DeepSynaps Clinical Admin as a standalone clinical documentation and administration product, powered by existing DeepSynaps Clinical Intelligence OS services. Keep a coherent core workspace and enable optional extensions only through an organisation-controlled process.

The initial purpose is to help authorised staff prepare appointments, capture conversations with the appropriate consent, draft and review documentation, complete source-linked forms, coordinate tasks and transfer reviewed outputs through approved processes. It does not independently diagnose, prescribe, recommend patient-specific treatment, perform unsupervised risk triage or train on identifiable NHS records.

Oxford Health provides physical, mental health and social care, including community settings. Proposed initial profiles are adult mental health, community health and older-adult services. These are product proposals informed by the Trust's broad published remit; the precise service, team, workflow and EPR must be agreed with the Trust.

Recommend one initial service and one complete patient-to-reviewed-document workflow before expansion. Agree the clinical sponsor, operational lead, participant roles and baseline measures before setting a deployment date. Do not assume that a repository feature count or a product demonstration establishes readiness for real patients.

## 2. Evidence inspected and what it establishes

Clinical OS repository: `ALIYILD/DeepSynaps-Clinical-Intelligence-OS`  
Pinned source revision: `2be80acd1ac68b01756c1acccad8010363755389`

Inspected:

- `docs/clinical-workspace/FUNCTION_STATUS.md`: complete 158-function status register, descriptions and limitations.
- `docs/clinical-workspace/README.md`: deployment profiles, reused services, clinical-workspace endpoints and safeguards.
- `docs/clinical-workspace/NHS_TEST_ENVIRONMENT.md`: synthetic environment configuration and test procedure.
- `docs/clinical-workspace/PILOT_READINESS.md`: real-patient readiness gates and human responsibilities.
- `docs/api/partner-api.md`: read-only partner integration, authentication and event model.
- `packages/api-client/partner-openapi.json`: partner GET endpoints and headers.
- `apps/api/app/routers/clinical_workspace_router.py`: capability, registry, profile and organisation-level routes.
- `apps/api/app/routers/clinical_workspace_patient_router.py`: patient-scoped briefing, transcripts, drafts, forms, handovers and EPR routes.
- Public Clinical OS HTML, CSS tokens and SVG logo.
- Oxford Health's official About us page; current NHS DTAC and API-assurance guidance.

This is source and documentation inspection. The upstream repository test suite and deployed service connectivity were not verified in this build. Verify the current release revision and rerun its required tests before integrating or releasing it.

| Repository status | Count | Delivery treatment |
|---|---:|---|
| Operational | 68 | Verify the implementation and reuse it |
| Operational when configured | 23 | Verify provider configuration, service health and full error paths |
| Existing DeepSynaps module | 31 | Treat as a separate integration, not automatically embedded functionality |
| Partial | 9 | Record the missing acceptance criteria and complete them explicitly |
| External dependency | 14 | Resolve contracts, licences and external authorisations |
| Governance process | 8 | Maintain named owners and actual evidence/sign-offs |
| Excluded | 5 | Keep excluded from this product scope |
| **Total** | **158** | Preserve every ID in the traceability register |

Important corrections from source inspection:

- The partner API is read-only. It cannot save notes, sign records, submit forms or create tasks.
- Workspace writes use authenticated Clinical OS routes with existing tenant, role, consent and processing gates.
- Speaker labels are suggested from content, not acoustic diarisation.
- Speech accuracy and terminology improvements have not been demonstrated by a local clinical benchmark.
- PDF field detection is for fillable AcroForms. OCR extracts text; these are separate capabilities.
- Safeguarding concerns are clinician-raised; the system does not autonomously identify or triage them.
- Source matching is lexical and does not establish clinical accuracy.
- RiO and EMIS adapters fail closed pending authorisation.
- Twins and patient-specific clinical orchestration have additional NHS-scope restrictions even where a main-platform module exists.
- There is conflicting wording in the inspected documentation about UK Core DocumentReference conformance. Resolve against the applicable current profiles, actual generated resources and recipient requirements; do not advertise verified conformance from these documents alone.
- The inspected test-environment document has both an EU synthetic-test allowance and a UK provisioning instruction. For this proposed Trust engagement, resolve hosting explicitly with the owner and Trust before deployment; do not silently select a region.

## 3. Work applied in this release

| Applied item | Result | Limit |
|---|---|---|
| DeepSynaps identity | Original neuron logo; Outfit headings; DM Sans body; navy, teal and blue palette | Accessibility still requires browser and manual audit |
| Light and dark presentation | User-selectable and saved locally | Prototype appearance setting |
| Oxford Health workspace | Named proposed workspace and service profiles | No actual Trust tenant has been provisioned |
| Daily overview | Appointment list, task totals and document-review state | Fictional browser-local records |
| Organisation configuration | Save team label, proposed owner, service and objectives; export proposal JSON | No live organisation settings are changed |
| Extension request workflow | Draft, edit, withdraw and export requests; view examples | No purchase, notification, entitlement or clinical activation |
| Connection centre | Inspected endpoint map and truthful setup status | No successful live API call is claimed |
| Delivery plan | Six phases, 30 work packages, local notes and follow-up tasks | Planning actions do not sign off gates |
| Catalogue reconciliation | Exact source titles and limitations across all 158 IDs | Upstream functionality remains repository-reported |
| Server integration foundation | Explicit read operations, server-only secrets, timeouts and fail-closed handling | Source module only; not mounted or deployed |

The published site remains a synthetic demonstration. It has no Clinical OS user session, staging API origin or server-side sandbox key configured. Existing note, form, task and capture actions continue to be labelled simulations. None can write into the Clinical OS or NHS systems.

## 4. Architecture and ownership

### Application boundary

Clinical Admin browser → authenticated Clinical Admin backend → approved Clinical OS services and authorised NHS/EPR adapters.

The browser renders workflows, captures authorised user intent and displays processing state. It must not contain privileged API keys, trust user-selected tenant identifiers, or determine its own live entitlements.

The Clinical Admin backend should manage the reviewed session boundary, organisation/module permissions, safe API orchestration and product configuration. Prefer existing Clinical OS records as the source of truth for patients, clinical documents and tasks. Avoid maintaining a second independently editable copy of a signed record.

Reuse the Clinical OS database, migrations, object storage and job services where the selected deployment supports this. Do not introduce a separate clinical database solely because the product has a new interface. If a backend-for-frontend requires its own store, initially limit it to sessions, approved organisation configuration, module grants and operational state, with explicit linkage to upstream identifiers.

### Data and access model

Define organisation, service, team and user membership; patient access and purpose; consultation, recording, transcript, source references, draft and signed document versions; form jobs and source confirmations; tasks, handovers and referrals; extension grants and audit events.

Keep upstream patient identifiers and organisation scope separate from display labels. A browser role preview is not an access control. Enforce membership and permissions in the API on every operation, including direct URL access and background jobs. Deny by default and preserve existing upstream restrictions.

Use named staff accounts. Proposed roles: clinician, care-team member, organisation lead and auditor. Confirm real authorisation rules with the service rather than hard-coding job titles as permission grants. Staff SSO and any NHS identity service require a reviewed integration; patient login is a separate use case.

### Sessions and credentials

Use a reviewed per-user Clinical OS authentication flow and server-managed session. Define expiry, renewal, revocation, logout and CSRF controls. Do not invent token exchange or impersonation mechanisms. Verify the auth contract before proxying writes. Keep partner sandbox keys and other service credentials in a managed secret store; never in localStorage, public JavaScript, URLs or diagnostic exports.

The source adapter in `integration/clinical-os-reader.mjs` requires an explicit approved HTTPS origin and supports GET operations only. It rejects live partner keys. It is not an authentication server and must be mounted behind authenticated, tenant-authorised backend routes before use.

## 5. API work and button-level completion criteria

### Read integration

Verified partner contract:

| Operation | Endpoint | Boundary |
|---|---|---|
| Key metadata | `GET /api/partner/v1/meta` | Server-held partner key |
| Clinic handovers | `GET /api/partner/v1/fhir/Task` | `requested`, `accepted` or `all`; authorised scope |
| Patient documents | `GET /api/partner/v1/fhir/Patient/{id}/DocumentReference` | Signed/superseded notes; drafts excluded |
| Patient referrals | `GET /api/partner/v1/fhir/Patient/{id}/ServiceRequest` | Patient and tenant gates |

Sandbox keys reach synthetic records only. Real partner reads require the upstream deployment switch, approved key under a data agreement, scope and patient sharing consent. These conditions are not bypassed by the new product.

### Workspace integration

Verified router examples:

| Operation | Endpoint | Integration work |
|---|---|---|
| Capabilities | `GET /api/v1/clinical-workspace/capabilities` | Authenticated clinician; render actual available services |
| Function registry | `GET /api/v1/clinical-workspace/functions` | Replace static source snapshot after authenticated connection |
| Deployment profile | `GET/PUT /api/v1/clinical-workspace/profile` | Writes require clinic lead; never switch profiles implicitly |
| Briefing | `GET /api/v1/clinical-workspace/patients/{id}/briefing` | Retain provenance and missing-data indicators |
| AI draft | `POST /api/v1/clinical-workspace/patients/{id}/drafts` | Exact body schema, patient consent, master switch, approved processor |
| Handover | `POST /api/v1/clinical-workspace/patients/{id}/handovers` | Exact body schema and authorised recipient |
| EPR submission | `POST /api/v1/clinical-workspace/patients/{id}/notes/{note_id}/epr-submissions` | Signed note; authorisation and acknowledgement required |

The existing `/api/v1/clinical-notes`, `/api/v1/recordings`, `/api/v1/work-queue`, `/api/v1/assessments-v2`, `/api/v1/documents` and `/api/v1/reminders` services are documented for reuse. Inspect their exact operation schemas and authentication before implementing their clients; do not extrapolate write endpoints from these base paths.

### Every enabled action must satisfy this contract

1. Authorise the actor, patient, organisation, module and purpose on the server.
2. Validate input and source document version; prevent wrong-patient context.
3. Display an accurate in-progress state and handle cancellation where supported.
4. Persist the intended change or report an explicit failure. Never fabricate success.
5. Record actor, scope, version, time and outcome in the appropriate production audit.
6. Handle duplicate clicks, retries, concurrent edits, stale state and session expiry.
7. Return the resulting record and reconcile the screen with server state.
8. Test both permitted behaviour and denied/failed paths.

| Workflow | Acceptance criteria |
|---|---|
| Consent and capture | Required consent checked at capture and upload; pause/resume works; device interruption preserves recoverable audio; unsupported capture is explicit |
| Offline recording | Encryption/key handling reviewed; lost key and expired queue states visible; consent rechecked on sync; no false “uploaded” status |
| Transcription | Actual provider timestamps; explicit errors; speaker suggestions require confirmation; no synthetic transcript fallback |
| Drafting | Sources retained; generated text remains a suggestion; absent data not inferred as a negative clinical finding |
| Save and sign | Correct patient and version; conflict protection; signing identity recorded; signed version immutable; amendment preserves original |
| Forms | Uploaded format detected correctly; source confirmation per filled field; approval rejects unresolved fields |
| Tasks and handovers | Authorised assignee; complete and acknowledge are distinct; transitions audited; retry does not duplicate work |
| Messaging | Verified destination and permission; opt-out/withdrawal behaviour; provider receipt or failure; no silent retry storm |
| EPR submission | Correct identifier mapping, signed content hash, idempotent queue, vendor receipt, reconciliation of uncertain outcomes |
| Retention | Approved policy applied only when conditions are met; no deletion from an assumed or simulated EPR receipt |

## 6. Core product and extensions

Core navigation: Today; Patients and appointments; AI Consultation; Notes and Documents; Forms and Assessments; Tasks and Follow-up; Evidence and Context; Connection Centre; Governance; Organisation Setup.

The function catalogue is an administration and evaluation tool, not the clinician's default landing task. Show features appropriate to the organisation's enabled services and the staff member's role.

Initial extension candidates:

- Evidence Intelligence and authorised source search.
- Patient Timeline.
- Patient Goals and Outcomes.
- Patient Application for approved documents/forms.
- Cognitive report context, subject to separate specialist review.
- qEEG report context, subject to separate specialist review.
- Wearable and sleep context with provenance and sharing permissions.
- Deepy assistance restricted to approved documentation/admin tasks.

Proposed production extension lifecycle: available → requested → scope reviewed → approved/configured → enabled → suspended/revoked. Record requester, organisation, intended purpose, data categories, permissions, processor route, accountable owner, approval evidence, version and review date. A licence or commercial entitlement alone is insufficient for clinical activation. Revocation must prevent API access and stop new jobs while preserving the required audit.

The prototype only supports local draft requests and example views. It does not model an approval as if one had happened.

## 7. Delivery work packages and dependencies

The live Delivery Plan presents 30 packages. These are implementation phases, not promised calendar dates. Estimate effort after deployment access and the first service's requirements are confirmed.

### Phase 1 — Brand and product definition

- **OH01 — Brand application.** DeepSynaps logo, design tokens, typography, light/dark surfaces, readable states. Applied to prototype; browser QA outstanding.
- **OH02 — Service profiles.** Configurable adult mental health, community health and older-adult proposals. Applied locally; Trust confirmation outstanding.
- **OH03 — Function reconciliation.** All 158 source IDs and implementation notes included. Source reviewed; upstream tests not rerun.
- **OH04 — Pilot definition.** Agree one service, clinical sponsor, intended purpose, participant roles and evaluation measures. Owner: product owner + Trust sponsor. Exit: documented pilot brief.

### Phase 2 — Identity, data and environment

- **OH05 — Synthetic environment.** Use the existing Clinical OS test-deployment procedure after an approved host, DNS and release operator are available. Validate database migration version against the chosen release. Exit: seeded synthetic environment and passed smoke tests.
- **OH06 — Real sessions and roles.** Implement verified authentication, session lifecycle and server authorisation. Exit: role, revocation and expiry tests pass.
- **OH07 — Tenancy.** Establish approved organisation/service/team mapping; test cross-tenant reads, writes, exports and jobs. Exit: no scope accepted merely from browser input.
- **OH08 — Data processing decisions.** Agree hosting, every processor, access locations, retention and key management. Exit: reviewed data-flow and environment configuration.

Dependencies: OH04 informs roles and scope. OH05/06/07/08 are required before connected clinical workflows or identifiable records.

### Phase 3 — Clinical OS connection

- **OH09 — Read adapter foundation.** Implemented in source, unit-tested with mocks; not deployed. Mount behind the reviewed backend session boundary only after OH05/06/07.
- **OH10 — Authenticated integration.** Inspect the current auth/token contract and establish the per-user staging session. Exit: permitted/denied requests against actual staging.
- **OH11 — Capability responses.** Fetch the registry and service configuration; derive availability from server state. Exit: unconfigured AI/OCR/speech is accurately shown and cannot be bypassed.
- **OH12 — Patient reads.** Connect briefings and reviewed records; verify source timestamps, scope and missing fields. Exit: user cannot access another patient by editing an ID.

Do not treat a successful `/meta` response as evidence of write permissions or an NHS connection.

### Phase 4 — Complete clinical workflows

- **OH13 — Consent and recording.** Capture, upload, interruptions, playback, offline state and retention. Owner: frontend + API engineering; clinical review for consent UX.
- **OH14 — Transcription.** Configure approved STT, review timestamps and speaker suggestions, assess unsupported formats and languages.
- **OH15 — Notes.** Implement source-linked drafting, persistence, signing and amendments; test concurrency and failed saves.
- **OH16 — Forms.** Separate AcroForm field filling from OCR extraction; confirm sources and version templates.
- **OH17 — Team coordination.** Integrate tasks, handovers and referrals with authorised assignees, reviewed documents and audited transitions.
- **OH18 — Messaging and schedules.** Configure approved provider/outbox and external scheduler; verify retries, opt-outs and delivery status.

Exit: one complete synthetic journey works without manual database edits; every active UI action has corresponding persistence, permission and error-path evidence. A provider outage never changes the application into a simulated workflow.

### Phase 5 — NHS connections and extensions

- **OH19 — Confirm Trust systems.** Record actual EPR, identity, network, identifier and document-transfer requirements. RiO and EMIS remain candidate adapters; neither is asserted as the selected pilot system.
- **OH20 — Authorised EPR adapter.** Obtain vendor/Trust permissions and sandbox; implement read/write contracts, reconciliation and confirmed receipts. Exit: named UAT and recipient acceptance.
- **OH21 — Extension requests.** Local prototype request flow applied. Convert to persisted, permission-controlled workflow after server identity is available.
- **OH22 — Entitlements.** Enforce module access and revocation on the server for every API and job. Exit: disabled features remain inaccessible via direct calls.
- **OH23 — Specialist scope.** Separately assess any report analyser, studio or clinical AI extension. Keep documentation pilot exclusions intact.

If the Trust agrees a reviewed manual export route, an initial documentation pilot may proceed without live EPR write-back once all applicable deployment gates are complete. The product must label manual transfer accurately.

### Phase 6 — Assurance, user acceptance and release

- **OH24 — Supplier clinical safety.** Named qualified CSO completes hazard assessments, safety case and residual-risk acceptance for the actual release.
- **OH25 — Trust deployment and IG.** Trust-owned deployment assessment, DPIA, agreements, data controller/processor responsibilities and access policy.
- **OH26 — Assurance evidence pack.** Use current DTAC form and applicable DSPT evidence; resolve conflicting or stale repository evidence counts.
- **OH27 — Security and accessibility.** Independent or suitably qualified reviews; tenant isolation, session and upload tests; keyboard, screen reader, zoom and contrast verification.
- **OH28 — Local quality evaluation.** Clinician-reviewed transcription/drafting/OCR/assessment cases, with pre-agreed acceptance thresholds and subgroup checks.
- **OH29 — Operations.** Restore a backup; rehearse rollback, alerting, job recovery and incident escalation with measured recovery objectives.
- **OH30 — Release decision.** Named release operator and clinical/Trust owners approve the exact version, enabled features, user training, support and stop criteria.

No engineering checkbox substitutes for these signatures. The Clinical OS repository instructions prohibit Fly.io restart/deployment and unauthorised release of that branch. This work publishes only the separate Sites prototype and does not deploy the Clinical OS repository.

## 8. Oxford Health discovery and ownership

| Decision or deliverable | Proposed accountable role | Current state |
|---|---|---|
| Product scope and implementation budget | DeepSynaps product owner | Ali Yildirim; scope discussion needed |
| Initial service and pilot sponsor | Oxford Health clinical/service lead | To be nominated |
| Supplier safety case | DeepSynaps Clinical Safety Officer | Named appointment and sign-off needed |
| Trust deployment assessment | Trust Clinical Safety Officer | To be nominated |
| DPIA, contracts, processors and retention | Trust/DeepSynaps DPO and IG leads | To be agreed |
| EPR/SSO/network integration | Trust digital team + vendor + engineering | Requirements and contacts unconfirmed |
| Accessibility and quality evaluation | Trained reviewers + participating clinicians | Not started for this product |
| Hosting, monitoring and release | Authorised release/operator team | Staging origin and access not supplied |
| Training, support and incident response | Joint service operations owners | To be agreed |

Discovery questions: Which first service? Which notes/forms and languages? Which EPR and staff identity? Which patient-matching workflow? Which records can leave which systems? Which processors and storage regions are approved? What is the consent/notification workflow? What improvement is worth a pilot? Who can stop or roll back the pilot?

Do not email or invite anyone as part of this implementation without an explicit communication instruction.

## 9. Validation, evaluation and release gates

### Engineering tests

- Inventory: 158 unique IDs; 68/23/31/9/14/8/5 status totals; all categories accounted for.
- Navigation: every route, catalogue search, detail view, extension request and local export.
- Workflow: consent refusal; absent provider; failed upload; expired session; wrong patient; concurrent edits; sign and amendment; failed EPR receipt; duplicate submission.
- Security: cross-tenant enumeration/read/write; direct module access; revoked credentials; unapproved origins; response/URL injection; file upload validation; no PHI in logs.
- Contract tests: generated client/schema drift; exact request/response fixtures; staging checks against the selected release.
- Accessibility: keyboard focus, dialog trapping and return, screen-reader announcements, zoom, contrast and reduced motion across light/dark views.
- Operational: backup restore, task retry, queue reconciliation, processor outage and rollback.

### Pilot measures to agree before recruitment

Measure documentation time, time from consultation to reviewed note, unsigned backlog, clinician edit burden, speech error rates, clinically material omissions/incorrect additions, task completion, user-reported usability and support incidents. Distinguish source errors from generated errors. Use a baseline comparison and documented case mix. Determine sample size and success thresholds with the clinical team; do not invent expected percentage improvements.

Stop or suspend the affected workflow on unauthorised disclosure, wrong-patient persistence, significant clinical documentation harm, unexpected processor egress or failed recovery. Record incident ownership and escalation routes before launch. Model, prompt and service changes must be versioned and evaluated before release; no unreviewed self-learning on NHS patient records.

### Definition of pilot-ready

Exact release candidate identified; agreed intended purpose and features; operational/authentication tests passed; evidence and relevant approvals signed; approved environment and processors; trained users; support and incident response established; acceptable local quality evaluation; reliable rollback; authorised EPR route or agreed controlled manual transfer; current function register reconciled to that deployment.

## 10. Current blockers and next executable milestone

Needed to connect this product:

1. An approved **synthetic Clinical OS staging origin**, operated by the authorised release team.
2. An authenticated staging user/session integration with the correct organisation scope.
3. If partner reads are used, a server-held **sandbox phi:read key** issued through the existing developer controls.
4. The exact staging release revision and its tested contract.
5. For the Oxford Health pilot itself, the first service/team, responsible Trust contacts and agreed deployment/assurance requirements.

Keys and passwords must be entered through an approved secret store or secure account handoff, not into this demo or its planning exports. The absence of these items does not prevent publishing and reviewing the synthetic product design; it does prevent claiming a live connected product.

The next milestone is **real authenticated staging reads, followed by one saved, reviewed and signed synthetic note through the existing Clinical OS APIs**. Preserve the functioning prototype separately during that transition. Expand only after this journey and its denied/error cases have been demonstrated.

## 11. Sources

- [Clinical OS function register](https://github.com/ALIYILD/DeepSynaps-Clinical-Intelligence-OS/blob/2be80acd1ac68b01756c1acccad8010363755389/docs/clinical-workspace/FUNCTION_STATUS.md)
- [Workspace architecture](https://github.com/ALIYILD/DeepSynaps-Clinical-Intelligence-OS/blob/2be80acd1ac68b01756c1acccad8010363755389/docs/clinical-workspace/README.md)
- [Partner API](https://github.com/ALIYILD/DeepSynaps-Clinical-Intelligence-OS/blob/2be80acd1ac68b01756c1acccad8010363755389/docs/api/partner-api.md)
- [Synthetic test environment](https://github.com/ALIYILD/DeepSynaps-Clinical-Intelligence-OS/blob/2be80acd1ac68b01756c1acccad8010363755389/docs/clinical-workspace/NHS_TEST_ENVIRONMENT.md)
- [Pilot readiness](https://github.com/ALIYILD/DeepSynaps-Clinical-Intelligence-OS/blob/2be80acd1ac68b01756c1acccad8010363755389/docs/clinical-workspace/PILOT_READINESS.md)
- [Oxford Health NHS Foundation Trust — About us](https://www.oxfordhealth.nhs.uk/about-us/)
- [NHS DTAC guidance](https://digital.nhs.uk/services/digital-technology-assessment-criteria-dtac)
- [NHS API assurance process](https://digital.nhs.uk/developer/assurance/process-for-apis-and-services)
- [DeepSynaps brand reference](https://app.deepsynaps.com/?page=home)


## Applied implementation-loop increment

See [Clinical_Admin_Implementation_Loops.md](Clinical_Admin_Implementation_Loops.md) for the six bounded loops, the applied three-patient workflow and source-only gateway policy, test evidence and staging handoff. The loop ledger maps all 30 work packages without treating local prototype tests as completion of live integration or human approval gates.
