# DeepSynaps Clinical Admin — Oxford Health proposed pilot

A private, synthetic-data Sites prototype with actual DeepSynaps branding, organisation/service proposals, extension request previews and a detailed delivery plan. Not a commissioned Trust system and not authorised for real patients.

## Main files

- `dist/`: deployed static product prototype.
- `dist/registry-evidence.js`: exact 158-function source snapshot and limitations from Clinical OS revision `2be80acd1ac68b01756c1acccad8010363755389`.
- `dist/product-data.js`: proposed organisation profiles, extension catalogue, inspected integration map and 30 delivery work packages.
- `docs/Oxford_Health_Clinical_Admin_Implementation_Plan.md`: detailed plan; same downloadable file in `dist/`.
- `integration/clinical-os-reader.mjs`: server-only, synthetic-staging read adapter. **Not imported by the site, mounted or deployed.**
- `tests/`: prototype behaviour and adapter unit tests. No claim of upstream/live verification.

## Runtime boundary

All published prototype actions use fictional data and localStorage under `clinical-admin-demo-v1`. No real microphone, AI, SMS, patient upload, Clinical OS or NHS/EPR connection. The connection centre reports this explicitly. Local configuration and extension requests do not grant real permissions or notify anyone.

Production connection requires approved staging infrastructure and authentication. The partner API is read-only; writes require authenticated workspace APIs. Do not place keys in `dist/`, localStorage, URLs or exported proposals. Preserve existing upstream tenant, consent, processor and governance gates. Do not restart or deploy Fly.io or deploy the Clinical OS repository as part of this Site change.

Run `npm test` and `npm run check`. Manual visual and screen-reader accessibility QA remain outstanding. Automated browser coverage is described below.

## Implementation loops

Run `npm run loops` for a finite local verification pass and evidence refresh. View the recorded result at `#loops` in the site. L01–L03 verify the product, source-only gateway and three-patient workflow. L04–L06 record staging, write-integration and human assurance dependencies. No background task is scheduled.

See `docs/Clinical_Admin_Implementation_Loops.md` for the loop runbook and `loops/implementation.json` for the OH01–OH30 mapping. `dist/workflow.js` applies patient separation, snapshot-bound note review, per-field form approval and version-linked tasks. `integration/clinical-admin-gateway.mjs` is a source-only policy handler whose trusted session and permission services still need implementation.

The [staging handoff](docs/STAGING_HANDOFF.md) records the missing identity/deployment inputs and S01–S14 acceptance cases. The [pilot evidence checklist](docs/PILOT_EVIDENCE_CHECKLIST.md) provides owner nominations, evidence requirements and a decision record. Neither advances the blocked connected loops.

GitHub Actions runs local checks and uploads verification evidence on pushes and pull requests. It does not deploy or run connected tests. Use Node.js 22 or later for local verification. The Node loop tests need no third-party dependencies; browser tests use the locked Playwright development dependency.

## Browser workflow verification

Run `npm ci`, `npx playwright install chromium`, then `npm run test:browser`. Python 3 serves `dist/` on loopback port 4179 for the test run; the server stops when testing ends. No external service or deployment is contacted by the demo workflows.

The Chromium suite exercises desktop (1440 × 1000) and mobile (390 × 844) layouts, patient isolation and reload, exact-text review, signing/amendment history, form review and downloaded provenance, capture interruption, reset, viewport overflow and keyboard dialog controls. GitHub Actions retains the browser HTML report and failure screenshots/traces separately from the Node loop evidence. Automated checks do not replace manual accessibility, clinical validation or staging access tests.
