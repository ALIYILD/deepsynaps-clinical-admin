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
