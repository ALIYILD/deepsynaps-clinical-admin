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

## Forms UI increment

Added `dist/forms-ui.js`, `dist/forms-ui.css` and `tests/forms-ui.test.mjs`; the loader is appended after the consultation UI. The UI separates the current patient form from a searchable template library. Only the follow-up preference form is implemented locally. Organisation forms, mental-health/community assessments, PDF completion and OCR are clearly shown as service-dependent; their cards open the existing capability requirements. No clinical questionnaire content or scoring is invented.

The editor keeps a selected field's original and current values side by side, shows empty/changed/reviewed states, provides per-field review and a final exact-snapshot confirmation. Editing invalidates that field's review. Empty required values cannot be confirmed. A final approval request expires if values, review flags, patient or form version change. Source comparison can be focused from the field control, including when the source panel stacks below the editor on narrow screens.

UI metadata lives under `state.formUi[patientId]` with a local version number and snapshot history. The original `formData`, `formReviewed` and `formApproval` fields remain authoritative for the underlying workflow, so the existing cross-patient review queue continues to work. Approvals and source-reload drafts are copied into local history; reopening an approved form increments the local version and clears reviews. These are editable browser records, not server-immutable clinical versions. The connected store must provide document IDs and authoritative versions.

The forms UI wraps patient selection to cancel its own pending dialogs and reset the selected source field. It calls the existing form mutation functions rather than changing workflow.js. Approved-form controls provide readable text and existing source-linked JSON exports. Neither export implies patient delivery or EPR submission.

Validation: 11 new Node tests cover empty/required states, library filtering, review invalidation, final snapshot confirmation, stale patient/reload requests, retained approved/draft history, per-patient version isolation, truthful exports, safe source rendering/focus and handler syntax. Combined local suite: 74 tests. Manual browser layout, keyboard traversal and screen-reader verification remain outstanding.

## Tasks and handovers UI increment

Added `dist/tasks-ui.js`, `dist/tasks-ui.css` and `tests/tasks-ui.test.mjs`, loaded after the forms UI. Tasks now have editable descriptions, example assignees, optional due dates, author-selected administrative priority and notes. Status, owner, due-date, priority and text filters combine; due-date comparisons use the Europe/London calendar. Existing tasks receive no invented deadlines. Administrative priority is explicitly distinct from clinical risk assessment.

Task fields are additive (`dueDate`, `priority`, `context`). The editor snapshots the current task and refuses to overwrite it if it changes while the dialog is open. Edits preserve completion state, patient association and the exact source note. The existing completion and assignment functions remain in use. Indices are suitable only for this append-only local task array; the connected API must supply stable task IDs, permissions and authoritative revisions.

Handover drafts require a signed local document, an example recipient role, a message and final confirmation of the exact patient/source snapshot. Source changes invalidate a pending confirmation. Drafts are stored under `state.handoverDrafts` with patient identity, source version/revision/text, recipient, message, preparation timestamp and `deliveryStatus: 'not-sent'`. Patient changes cancel pending task/handover dialogs. Saved drafts retain earlier source text after an amendment and display a review-needed indicator. Readable exports identify the synthetic environment and lack of delivery. No external message, API request, notification or additional task is sent/created by saving a handover draft.

These records remain browser-local editable development data. Connected delivery requires verified recipients, server-side authorisation, source/document IDs, durable writes, concurrency handling and explicit delivery acknowledgements. Do not map a local draft save to a successful clinical handover.

Validation: 11 additional Node tests cover date validity, UK-date overdue logic, combined filters, input validation, task source preservation, stale edits, signed-source and recipient gates, exact handover confirmation, patient-switch cancellation, amendment indicators, truthful export, escaping and rendered handler syntax. Combined suite: 85 tests. Manual browser layout, keyboard traversal and screen-reader checks remain outstanding; no live Clinical OS requests were performed. The CLI-owned loop-report snapshot remains unchanged.

## Patient workspace UI increment

Added `dist/patient-ui.js`, `dist/patient-ui.css` and `tests/patient-ui.test.mjs`, loaded after the tasks UI. The patient overview now combines document/form status, explicit patient-linked tasks and handover drafts, scripted context with source passages, missing-information notices and appointment preparation. Appointment times remain clearly labelled as the example clinic on 13 October 2026. The next administrative step follows the existing local note/form review state and does not infer clinical priority.

Preparation state is stored separately under `state.patientPreparation[patientId]` as a checklist, optional 1,500-character agenda note and fingerprint of the source context/current document/form. Changes to document content/revision/review state or form values/reviews make previous checks stale. Rechecking starts a fresh checklist; clearing the checklist retains agenda notes. Preparation never records consent, fills missing clinical facts or asserts verified patient identity. State rehydrates from the existing local store and remains isolated between patients.

The overview displays only tasks and handover drafts carrying the selected patient's explicit `patientId`. Existing team tasks are not associated by guessing from names. Patient-scoped task composition uses the existing task validation and records `patientId`; changing patients cancels a pending composition. Such tasks are administrative and have no implied signed-source attachment. Existing signed-document follow-up tasks retain their original source-link behaviour.

Saved activity combines retained note snapshots, form history and handover drafts for the selected patient. Filters distinguish their types; recorded timestamps display in UK time and undated entries remain undated. Snapshot dialogs escape text and leave the current record unchanged. The interface identifies this as editable browser-local history, not an EPR timeline or tamper-evident clinical audit. Task and source section shortcuts restore the overview and focus their destinations.

Integration notes: replace local task indices/history indices with stable server IDs and enforce patient access on the server. Supply verified source/document versions before using preparation fingerprints in a connected environment. The preparation checklist is UI metadata and must not satisfy clinical identity, consent, medication/allergy verification or document-signing requirements. No backend, authentication, workflow or loop-runner file changed in this increment.

Validation: 11 new Node tests cover truthful initial state, patient isolation and reload, preparation invalidation, bounded input, exact source passages, review-dependent next actions, patient-linked task creation/cancellation/completion, history filtering/order, missing timestamps, source escaping and handler syntax/focus destinations. Combined local suite: 96 tests. Browser layout, real keyboard traversal and screen-reader testing remain outstanding. No live Clinical OS request was performed and the CLI-owned loop-report snapshot is unchanged.

## Documents and review UI increment

Added `dist/documents-ui.js`, `dist/documents-ui.css` and `tests/documents-ui.test.mjs`, loaded after the patient UI. Documents now support combined status, patient, template and text filters, with current-version counts, retained-copy counts and read-only previews. Search covers patient names/IDs and document types, not clinical text. The list explicitly represents one current document per synthetic patient. Preview does not change the selected patient; opening saved activity selects the corresponding patient and document-history filter.

The review queue combines unsigned documents and unapproved forms, with patient/type/search filters and field-review counts that exclude empty values. Each document opens an individual exact-text review with the note beside its scripted source; no bulk approval is provided. The UI delegates pending snapshot creation and signing to the existing workflow functions and retains the `review-confirm` control. Edits, patient switches and changed revisions still invalidate review. Local review is labelled as a development action, without claiming clinical signature or EPR submission.

The editor now uses protected template/example loading handlers. Selecting a template for an empty document changes the selected type without inserting content. Replacing an existing draft requires confirmation, preserves its exact text in patient history with a timestamp, and then loads the selected predefined example. Requests bind patient, text, revision, version and current template and recheck the drafting setting and signed state before applying. Cancellation keeps existing text; patient changes clear pending requests. Template/example changes invalidate previous document review. This is scripted replacement, not AI rewriting or format conversion. Existing consultation replacement safeguards remain in place.

The integration must preserve exact-document review and replacement concurrency rules using authoritative server versions, and provide stable document IDs for multiple-document support. New UI handlers are isolated from backend/workflow files. The current browser-local retained copies remain editable development data, not immutable clinical storage.

Validation: 11 additional Node tests cover combined filters, safe empty states/search, patient-correct preview/history, mixed review queues, exact-source review, signing invalidation, blank template selection, confirmed/stale replacement, cancellation, patient switches, content escaping and handler syntax. Combined local suite: 107 tests. Manual browser layout, keyboard traversal and screen-reader checks remain outstanding. No live service calls, EPR submissions or external messages were made. The CLI-owned loop-report snapshot is unchanged.

Concurrent integration: the CLI merged PR #1 while this increment was publishing. Reconciled with GitHub main `9c17dbc4b47348f0c32e1d8debe8767461318532`, preserving its storage-status/recovery UI, stale-tab protections, hash routing, form guard and workflow changes. Combined main plus this UI increment passes 122 Node tests. Browser spec selectors now match the revised review/save labels, with a replacement-preservation scenario added to the existing suite; browser checks have not been run in this environment. L03 includes the new document regression file; the upstream evidence snapshots were carried over unchanged and were not regenerated here. This increment is submitted as a new PR after #1 merged.

Follow-up reconciliation included main `7268f1f074e6a89cb48148fa5f40c45f5bfa4ed3` and its task/handover/agenda save-failure fixes. Draft replacement now also distinguishes successful persistence from changes held only in the current tab. Added a regression for failure/retry without duplicate history copies. Combined suite: 127 passing Node tests. Existing new browser storage scenarios were preserved and their review-control selectors updated.

## EPR handoff UI increment

Added `dist/handoff-ui.js`, `dist/handoff-ui.css` and `tests/handoff-ui.test.mjs`, loaded after the documents UI. The patient handoff route now separates local document review, draft preparation, future submission and confirmed receipt. It presents the current document, retained handoff drafts, patient-matching gaps, connector requirements and explicit absence of acknowledgement/retention action. No connection, signature, sending or deletion is simulated.

A local handoff draft requires a non-empty reviewed document, an intended system (RiO, EMIS or other), an optional bounded administrative note and exact-source confirmation. The intended system is planning metadata, not an active connector or matched destination record. Drafts under `state.eprHandoffDrafts` retain patient ID/name, source text/template/version/revision, intended destination, context and preparation time, with `submissionStatus: 'NOT_SENT'`, null acknowledgement and no retention action. Identical source/destination/context combinations deduplicate. Patient changes cancel pending composition/review. Source changes invalidate a pending confirmation and flag retained drafts without mutating their text.

Inspection and text export remain patient-scoped, identify non-delivery and unverified matching, and explicitly state that the draft is not a validated FHIR resource. Send is disabled with a visible reason. Storage failures retain one recoverable in-tab draft and report the failed write; retry does not create duplicate drafts. Local data remains editable development state and is not authoritative clinical evidence.

Integration must replace indices with stable server IDs, provide verified patient/receiving-record mapping, authorisation, server document revisions, idempotent submission and acknowledgement contracts. Do not derive delivery success or trigger retention from a local draft, an export, a selected system or a generic HTTP success. This increment performs no network call or automated clinical decision.

Reconciled the CLI main through `7cbcae09cd36f25da78d8366218dfae4b08da787`, preserving its complete-evidence fingerprinting and gateway/session-error fixes, bounded dependency waits and cancellation propagation. Added the handoff regression suite to L03 without regenerating CLI evidence snapshots. Combined Node suite: 158 passed, including 10 handoff tests covering gates, validation, confirmation, deduplication, source amendments, patient isolation, reload, storage recovery, export truthfulness, escaping and handlers. Existing browser suite now includes the handoff route and a prepare/amend/no-send scenario; this increment has not been browser-verified locally. Manual visual, keyboard and screen-reader assessment remains outstanding. Previous PR head `bed4836` had successful automated GitHub workflow runs before this increment.


## UI readiness loop: navigation and keyboard access

Reconciled CLI main through `abf4242a09533a919dba94e326702816baa5b972`. Its GitHub run `38406591510` passed both local loops and desktop/mobile browser workflows. Existing clinical state validation, storage recovery and source review protections are preserved.

Fixed the mobile navigation drawer: closed navigation is inert and hidden, open navigation contains keyboard focus and makes background content inert, Escape/close/backdrop dismiss it with focus restoration, and choosing a route moves focus to the main content. Resizing to desktop releases the background. Menu state is exposed to assistive technology. Added a persistent accessible name to patient search and meaningful page titles. Navigation now creates browser history entries without duplicates, so Back/Forward can return to a patient workspace without discarding local edits.

Added three local regression tests and three browser scenarios: mobile focus containment/dismissal, history with retained edits, and all 19 workspace routes in light/dark themes at existing desktop/mobile sizes. Browser checks run in GitHub CI; this managed environment has no supported browser controller. These checks do not replace manual visual, screen-reader, clinical usability or Trust acceptance work. Live integrations and assurance remain blocked under L04–L06. Use the fresh loop report and GitHub checks for the exact revision's test results.

## UI readiness loop: handover correction and retry

Team and EPR handover reviews now provide Back to edit. Patient/source selection, recipient/destination and entered message/context are retained as escaped values; returning clears the pending review and requires a new exact-source review with a fresh checkbox. An unreviewed source blocks the return without deleting the visible pending message. Switching patient clears the pending workflow. No draft is saved by returning to edit.

Team handover drafts now deduplicate the exact patient, source text/version/revision, recipient and message combination. A different message remains a separate draft. Source revision changes flag retained handovers even if text is unchanged. Closing or cancelling task/handovers clears pending edit/review state. Review footers wrap at narrow sizes so correction and save controls remain reachable.

Added five Node regressions and two desktop/mobile browser scenarios for correction, confirmation reset, retry, cancellation and footer width. Local loops are regenerated for this revision; browser verification runs in GitHub CI. Drafts remain local and unsent. This is UI verification, not clinical acceptance or live integration evidence.

## UI readiness loop: patient-linked task navigation

Added a Patient or team task filter, including a separate team-administration option, and search by explicit patient ID. The patient overview now opens that patient's tasks with stale task filters cleared. Task rows link to their patient record; task details display patient name/ID and make the fixed association explicit. A new team task resets the patient filter so it remains visible after saving. Existing records are never linked by matching names in their text.

Reconciled CLI main `262957faef349c6a88e3b0341add60a2b3ef85da`, retaining the optional Node host, socket tests and browser configuration. The published Sites app remains static and does not mount that host or activate the gateway. Added local and desktop/mobile browser regression coverage for patient/task navigation and filter combinations.
