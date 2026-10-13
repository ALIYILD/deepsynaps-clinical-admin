# Oxford Health prototype update — 13 October 2026

Applied the original DeepSynaps logo and source-derived brand tokens, light/dark themes, proposed Oxford Health organisation setup, service profiles, eight extension request/example workflows, connection centre, source-backed catalogue metadata and a six-phase / thirty-package delivery plan.

Source reviewed at Clinical OS commit `2be80acd1ac68b01756c1acccad8010363755389`. Its partner API is read-only. Exact workspace routers were inspected, but no authenticated staging connection was available. Upstream tests were not rerun.

Validation: `npm test` passes 20 tests covering adapter failures and boundary conditions, 158 unique registry IDs and totals, 16 routes, all detail dialogs, exact-ID search, consent/service/review gates, amendment history, task deduplication, proposal input escaping, extension draft requests, plan notes and theme/reset behaviour. `npm run check` checks all application script syntax. Tests use a minimal DOM harness and mock upstream responses, not browser or live-system execution.

Browser-based visual and manual accessibility QA remain outstanding. No preview server or substitute browser was started.

The source-only read adapter is not deployed or mounted. No live API, Clinical OS user session, production authorisation, Trust tenant or NHS integration was created. No messages or extension requests were sent. The Site remains private to its owner.

## Implementation-loop increment — 13 October 2026

Added a six-loop execution ledger, finite local verifier, downloadable runbook and website evidence snapshot. Applied separate records for Maya, Alex and Sam, legacy-state migration, per-patient transcript/templates, exact-snapshot review/signing, amendment preservation, per-field source review with approval invalidation, approved form exports, source/version-linked follow-up tasks and correct patient handoff/export identifiers. Added a source-only read gateway requiring verified sessions, tenant binding, operation permissions and explicit patient access.

`npm run loops` passed 42 local tests: 10 product, 20 adapter/gateway and 12 patient-workflow checks, plus shipped JavaScript syntax checks. L04–L06 remain dependency-blocked. Live connectivity, server writes, browser visual verification and Trust assurance are still outstanding. No upstream Clinical OS deployment or external communication occurred.

## Boundary hardening and handoff preparation

The read adapter now requires an integer timeout from 1 to 30,000 milliseconds, matches JSON media types exactly, and enforces its 1 MiB response limit while streaming. Oversized streams are cancelled; split UTF-8 characters are preserved. Approved demo forms cannot be overwritten by invoking the fill handler before reopening. The loop runner removes stale TAP evidence before each pass so skipped tests cannot appear current.

Added staging identity/deployment inputs and fourteen connected acceptance cases in `STAGING_HANDOFF.md`, plus the owner and release evidence checklist in `PILOT_EVIDENCE_CHECKLIST.md`. GitHub Actions runs syntax and local loop checks and retains the resulting evidence. It performs no deployment or connected tests.

Validation: `npm run check` and `npm run loops` pass with 51 local tests (13 product/runner, 25 adapter/gateway, 13 workflow). Runner regression tests exercise failing tests, syntax failures, skipped evidence removal and blocked-loop reporting in isolated temporary fixtures. L04–L06 remain blocked on the documented external inputs. Manual browser/accessibility checks, live staging tests and human release decisions remain outstanding.

## Real browser workflow verification

Added a locked Playwright development dependency and ten Chromium tests across desktop and mobile viewports. The suite verifies patient isolation/reload, exact-text review, signing and amendment history, per-field review invalidation, downloaded form provenance, capture interruption, reset, route rendering, horizontal overflow and keyboard dialog controls. GitHub Actions now retains the browser report and failure traces in a separate job.

Browser testing exposed stale screen content after URL fragment changes. Hash navigation now resolves through the same route handler as application buttons, stops simulated capture, dismisses dialogs and moves keyboard focus to the main content. Closing or cancelling a review clears the pending signature snapshot.

Validation: 10 Chromium checks pass at 1440 × 1000 and 390 × 844. The 51 Node checks and syntax validation also pass. This is automated interaction coverage, not a manual visual or screen-reader audit. L04–L06 still require the staging contracts and named human decisions recorded in the handoff.

## Browser storage failure recovery

Browser storage quota and permission failures now leave a persistent, accessible warning with a Retry saving control. In-memory edits remain available, and a successful retry saves the full current workspace and clears the warning. The app requests the browser's standard unload warning while changes are unsaved; browser support and user interaction determine whether that prompt appears.

Draft, organisation, extension-request, planning-note and reset notifications now distinguish successful persistence from changes retained only in the current tab. A failed reset warns that previously stored records may return after reload. This remains browser-local demo storage, not server persistence or an immutable audit record.

Validation: 53 Node tests and 14 Chromium desktop/mobile tests pass. New tests inject quota and permission failures, verify the warning persists through signing and unsuccessful retries, then restore storage and confirm the signed note survives reload. Node regression checks also verify multi-patient recovery and failed-reset messaging. Connected staging, real writes and pilot approval remain blocked.

## Stale browser tab detection

Each tab retains the exact saved snapshot it loaded or last wrote. Before saving, it compares the current storage value with that snapshot and blocks writes if another tab has changed or cleared it. Storage events surface conflicts promptly. A stale tab cannot bypass the conflict with Retry saving or reset; users can export the tab's fictional state and explicitly reload the saved version. Recovery exports are marked `DEMO_LOCAL_RECOVERY_NOT_FOR_IMPORT`.

Validation: 55 Node tests and 16 Chromium desktop/mobile tests pass. The two-tab browser scenario verifies that stale edits cannot overwrite a newer signed note, exported recovery content retains the stale edit, cancelling reload preserves the tab, and confirmed reload restores the newer signature. Node checks cover stale resets and externally cleared storage. This detects observed stale snapshots; localStorage comparison and write are not atomic. Server-side concurrency, idempotency and authoritative audit remain L05 dependencies.

## Damaged saved data recovery

The loader now validates saved workspace structure before rendering or migrating it. Malformed JSON, invalid root/settings/task/audit structures, unsupported schema versions and incompatible patient or product fields enter a clearly labelled temporary preview. Normal saves and retries are blocked so the original saved value is preserved. Valid legacy single-patient records remain supported.

Users can export the exact original value in a recovery JSON wrapper before explicitly resetting the demo. Reset confirmation explains replacement and irreversibility. A failed replacement preserves the original and keeps recovery controls available. These exports are for inspection, not automatic import, and no clinical data integrity or immutable audit guarantee is implied.

Validation: 57 Node tests and 20 Chromium desktop/mobile checks pass. New cases cover malformed JSON, invalid structures, unknown versions, original-value export, blocked ordinary writes, cancellation, confirmed reset and failed-reset recovery. Staging integration and human approval dependencies are unchanged.

Integrated the independently merged Oxford Health workspace UI, retaining its patient, consultation, forms, tasks and handover changes. Recovery browser tests now use the new interface. Added all five UI Node suites to the finite loop ledger: the combined release passes 111 Node tests (23 product/runner/UI, 25 integration, 63 workflow/UI) and 20 Chromium tests.

## Save feedback across the merged workspace

Team task creation/editing, patient-linked tasks and handover drafts now report whether browser persistence succeeded. Failed writes retain the in-memory change and show explicit unsaved feedback; handovers continue to state that nothing was sent. Agenda notes show their unsaved status across route changes and refresh immediately after successful retry.

Updated the task and patient Node fixtures to retain storage writes, so they exercise the actual stale-tab checks instead of simulating storage that always returns its original value. Validation passes 115 Node tests and 24 Chromium desktop/mobile checks. New tests cover task edits, patient tasks, duplicate-safe handover retry and agenda persistence after reload. No connected services were activated.

## Complete verification input tracking

Loop evidence now uses a versioned per-file SHA-256 manifest covering shipped HTML/CSS/assets, JavaScript, documentation, nested browser tests, integration modules, scripts, dependency files, Playwright configuration and CI workflows. Generated reports and TAP outputs are excluded to keep the fingerprint stable across unchanged runs. The report exposes syntax outcomes, unassigned Node suites, source drift and overall verification status. Browser code is fingerprinted without implying browser execution in the Node loop.

The runner rejects Node suites omitted from the ledger and invalidates a pass if source inputs change during verification, stopping subsequent local loops. CI removes old generated evidence before starting so a startup failure cannot upload an old report as current. The website highlights failed verification even when some tests passed.

Validation: 119 Node tests, including source mutation, missing-suite, manifest coverage and failed-report display checks. Browser workflows remain separately verified in CI. L04–L06 remain dependency-blocked; this traceability record is not a signed clinical audit.

## Gateway expiry and error boundaries

The source-only gateway now rechecks session expiry after patient authorisation, after tenant resolution and before releasing an upstream result. Expiry before the read prevents it; expiry during the read discards returned data. Verified core identity and permission values are snapshotted to avoid mutation through a shared session object. Whitespace identities, malformed tokens and invalid clocks fail closed.

Known integration errors retain their HTTP error statuses; arbitrary typed error messages and success/redirect statuses are sanitised. Missing or non-object reader results return 502, and method rejections include Allow: GET. These controls do not implement session revocation or endpoint-specific schema validation.

Validation targets 127 Node checks, including eight added gateway regressions for delayed expiry, shared-session mutation, malformed dependency results and redacted errors. All dependencies in these checks are injected fixtures. No staging service, identity integration or clinical deployment was created.

## Bounded gateway requests and cancellation

A configurable shared deadline now bounds asynchronous gateway session, patient-access, tenant and reader calls. Deadline expiry returns a sanitised 504; caller cancellation returns 408. All trusted dependencies receive an optional cancellation signal, and the read adapter propagates it to fetch and response-body consumption. Timers and request listeners are removed when the handler finishes. No retry or synthetic fallback is added.

Nine new local tests cover bounded configuration, stalled dependencies, late completion, pre-cancelled requests, mid-request cancellation and gateway-to-reader abort propagation. The gateway stops waiting even if a custom dependency ignores cancellation; that dependency must cooperate to release its own resources. No deployed identity service is claimed. The full local suite contains 136 tests; browser tests remain separate in CI.

## Saved UI record recovery and patient binding

Restoration now validates consultation progress, preparation notes/checklists, form version histories and local handover drafts before the UI reads them. Patient-keyed records accept only the three fictional patients. Approved forms and historical form snapshots must match their containing patient; note history rejects a conflicting explicit patient ID while retaining legacy entries without one. Historical source versions remain valid after amendments. Invalid data uses the existing fresh-preview recovery flow, preserving the original saved value and blocking writes until an explicit reset. These structural checks do not authenticate browser data.

Validation adds malformed nested-data and cross-patient snapshot regressions to the Node suite (159 tests total), plus a browser recovery scenario on desktop and mobile (30 browser checks total). L04–L06 still require the documented staging contracts and human owners.

Merged the concurrently published document-review and EPR-handoff workspaces. The restore guard also covers EPR draft source metadata and requires the local not-sent, no-acknowledgement and no-retention state.

## Runnable HTTP host and recovered Hetzner test setup

Added `npm start` to serve the synthetic application and mount the read gateway. The optional trusted adapter module supplies identity, tenant and patient-access services; absent configuration stays unavailable. The host forwards session headers, cancels work on disconnect, sanitises failures, rejects non-read methods and confines static files to the product directory. Health output distinguishes process/configuration state from connectivity. Playwright now uses this host; six socket-level regressions join the local loops (165 Node tests total).

Located the dedicated upstream Clinical Admin Hetzner test setup and existing owner acceptance for synthetic testing. Current upstream readiness still says ready to build; the example hostname does not resolve. Recorded that evidence and the next host-identification step without equating the older production-backed test frontend with isolated staging. No external deployment, server writes, processor activation or real-patient approval occurred.

## Netlify hosting and service status

Added Netlify deployment configuration, a serverless health endpoint and the read-gateway entry point. With no trusted staging adapter configured, reads return an explicit 503 and writes remain rejected. Only `dist/` is published as static content; function source remains outside it. Static responses disable caching and search indexing and include frame, referrer and browser-permission controls. The source manifest now includes Netlify function files and configuration.

Workspace settings now offer a hosted-service check. It verifies the health response and clearly separates a responding demonstration site from verified Clinical OS connectivity. HTML fallback responses and failed checks never show a connected status. Validation includes the expanded Node and desktop/mobile browser suites, including the concurrently merged navigation, task and handover changes. Staging integration and human pilot verification remain deferred; publication does not enable real patient workflows.

## Task sorting and stable actions

The task board now offers added order, due soonest, and priority-then-due-date sorting. Due and priority sorts put open tasks before completed tasks, keep undated/invalid legacy dates after dated tasks within the relevant grouping, and preserve added order for ties. Sorting operates on display copies, preserving the stored task order and the original indices used for editing, completion, patient navigation and reviewed-source links. Changing the sort updates only the results, retaining keyboard focus on the control.

Regression coverage checks mixed dates/priorities/completion, stable ties, unchanged underlying records, exact source retention when editing a sorted row, correct completion after sorting and persistence after reload. The full suite contains 177 Node checks and 45 browser checks, with one additional desktop case intentionally skipped because it tests the mobile drawer.
