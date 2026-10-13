# Oxford Health workspace — UI workstream

13 October 2026. This workstream develops the product interface while the CLI implements integration loops. The site is a development workspace with synthetic records, not a clinically deployed Trust service.

## Applied interface

- Task-focused landing page: example clinic list, all-patient review totals, outstanding tasks and recent documents.
- Daily-work navigation: patient directory, review queue, task board, consultation, documents, forms and context. Engineering plans and the function library move into the settings reference area.
- Patient search by name or record ID, empty-result recovery, patient overview and persistent identity context across clinical screens. Missing date of birth, NHS number and allergy information is explicit.
- Document library with draft/reviewed filters; review queue aggregates unsigned notes and unapproved forms across the separate patient records.
- Note editor with source conversation beside the text, version history, export, amendment and existing exact-snapshot signing rules.
- Task status and assignee filters, an accessible task form and source inspection for tasks linked to a reviewed version.
- Workspace search supports patient/page matching and Ctrl/Cmd+K. Labels, visible focus styles, larger text and responsive layouts are included.
- A persistent development-state indicator identifies synthetic data, local persistence and the disconnected Clinical OS. No false production status is introduced.

## File ownership and integration boundary

| File | Purpose |
|---|---|
| `dist/product-ui.js` | Presentation and navigation layer loaded after existing state/workflow scripts |
| `dist/product-ui.css` | Responsive workspace styles loaded after existing stylesheet |
| `dist/index.html` | Loads UI files; updates product metadata and environment indicator |
| `tests/product-ui.test.mjs` | New UI workflow regression checks |
| `docs/UI_WORKSPACE_HANDOFF.md` | This integration handoff |

No backend, authentication, gateway, implementation-loop runner, function registry or clinical workflow module is edited by this UI increment. Existing state and mutation functions remain authoritative for the local workflow. The UI does not grant real identity, roles or entitlements.

Use the UI branch/PR to integrate with concurrent CLI changes. Do not reset main to the Sites commit or overwrite CLI work. The starting GitHub source was `96305c03fa82f2ab7817b1e1a23cd84e242c4bd0`; its full tree matched Sites source `12d5a3bf5dacc35e20d434ca55f5b7444972409b`.

## Frontend dependencies to preserve or replace deliberately

`product-ui.js` currently consumes existing `state`, `demoPatients`, `ensurePatientState`, `currentPatient`, `selectPatient`, `save`, `audit`, `render`, `nav`, `modal`, `closeModal`, `icon`, `esc`, `head`, `service`, `draftNote`, `changeTemplate`, `updateNote`, `saveNote`, `reviewNote`, `signNote`, `amendNote`, `showHistory`, `exportNote`, `createFollowup`, `transcriptMarkup`, category renderers and configuration helpers.

The UI wraps `render` and overrides presentation functions after the existing scripts. It is a deliberately contained migration layer, not the final frontend architecture. When replacing synthetic state with a real application store, keep the visual components and move their data reads/mutations behind an explicit frontend adapter. Do not connect this browser directly to secret-bearing upstream services.

Routes added: `record` (selected-patient overview), `documents` (all-patient document list), `review` (all-patient review queue). Existing category routes remain for compatibility; `N` is the selected-patient editor. Patient switching from a clinical screen preserves that screen. Source-linked task content is not altered by assignment or status filtering.

Current UI assumes one active note and one preference form per synthetic patient because that is the current store contract. A connected document list must use stable document IDs, authors, timestamps and multiple versions from the server; do not infer live review status from these local flags. Example appointments are explicitly dated 13 October 2026 rather than presented as a live current-day feed.

## Next UI increments with the CLI integration

1. Replace the fictional clinician profile with the verified session; load authorised services and patient lists.
2. Introduce loading, empty, retry, denied, expired-session and offline states for each connected route.
3. Replace local autosave messaging with confirmed server-save timestamps, pending state and conflict recovery.
4. Bind document IDs, forms, assignees and source snapshots to actual API responses, preserving review invalidation and immutable signed-version behaviour.
5. Show real role capabilities from the server and preserve disabled explanations where an action is unavailable.
6. Replace the environment indicator only when the connected runtime and data mode are actually known. Keep an unmistakable staging/synthetic environment marker.
7. Run browser, keyboard, mobile viewport and screen-reader checks, followed by observed workflow sessions with the intended Trust staff.

These are next increments, not completed claims. The product interface alone does not complete the staging, security or Trust assurance loops.

## Validation

New UI tests cover nineteen route outputs and dialog handlers, cross-patient review counts, patient search/escaping, document filters, patient switching, unchanged exact-text signing, task filtering/assignment, task input validation, keyboard search and honest environment labels. They use a minimal Node DOM harness and cannot prove visual layout, real focus traversal or accessibility conformance.

Run `node --check dist/product-ui.js` and `node --test tests/product-ui.test.mjs`; run `npm test` for the combined suite. The ten new tests plus the existing forty-two give fifty-two checks. The earlier loop-report snapshot remains unchanged because the CLI owns the loop evidence workflow; it still records the previous forty-two-test pass and its original timestamp/fingerprint.

Browser visual verification and manual accessibility testing were unavailable during this UI build and remain outstanding. No staging or live Clinical OS request was performed.

## Consultation UI increment

Added `dist/consultation-ui.js`, `dist/consultation-ui.css` and `tests/consultation-ui.test.mjs`, with the loader changes in `dist/index.html`. The new module is loaded after `product-ui.js`. It owns a synthetic capture timer and patient-scoped UI state under `state.consultationUi`, without modifying the original workflow or gateway files.

The consultation screen now has preparation, capture, source review and document stages. It presents explicit patient confirmation and consent, a disconnected microphone/transcription status, start/pause/resume/finish controls for the local example, timestamped scripted source, source-review confirmation and a protected draft-creation path. There is no microphone access, audio upload or speech provider call. Elapsed capture time describes the local example and is not the source transcript duration.

Navigation and patient changes pause capture. Reload restores elapsed time without restarting. Consent withdrawal stops capture immediately. Reset confirms before clearing capture state and retains existing documents. Preparing a replacement draft preserves a history copy and checks the current patient, text, revision and version before writing; signed versions cannot be replaced by this route. Source review is distinct from final document review/signing.

The UI module wraps the existing `pauseRecord` and `selectPatient` hooks to stop its own timer. The CLI should preserve those hooks or provide an explicit capture lifecycle adapter when introducing real services. The controller must be removed/replaced for a connected recording service; do not interpret synthetic elapsed time or local consent as proof of real capture or server consent. The original generic note example controls remain governed by the existing workflow module; the new replacement confirmation applies to the consultation's preparation path.

Validation: 11 additional Node tests cover preparation gates, pause/resume/finish, consent withdrawal, patient-scoped elapsed time, stale timer callbacks, navigation/reload, source-review gates, draft replacement preservation and stale confirmations, signed-document protection, reset behaviour and rendered handler syntax. Combined local suite: 63 tests. Manual visual, keyboard traversal and screen-reader checks for this increment remain outstanding.
