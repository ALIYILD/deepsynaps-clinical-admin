# Clinical OS integration foundation

This directory contains a server-only read adapter for a future approved synthetic staging deployment. It is not imported into `dist/`, mounted as a server route, or connected by the published prototype. It does not establish real user authentication, module entitlement or Trust approval.

Source reviewed: `ALIYILD/DeepSynaps-Clinical-Intelligence-OS` at `2be80acd1ac68b01756c1acccad8010363755389`:

- `packages/api-client/partner-openapi.json`
- `docs/api/partner-api.md`
- `apps/api/app/routers/clinical_workspace_router.py`
- `apps/api/app/routers/clinical_workspace_patient_router.py`

## Deployment integration still required

1. Approve a synthetic staging origin; put it on the server's origin allowlist. Never accept an origin from a browser request.
2. Store a sandbox `phi:read` partner key in the server secret store, if testing partner reads. Never use a live key with this foundation.
3. Mount a backend route behind verified sessions. Obtain the authenticated user's Clinical OS token through a reviewed session flow. Do not accept arbitrary caller-supplied user/tenant identity.
4. Authenticate and authorise every incoming request. Scope any partner key to the caller's permitted tenant and module grants. The adapter itself is not an authorisation boundary.
5. Use server-side sessions, CSRF controls for mutations, rate limits, PHI-free structured logs, response schemas, trace IDs and a reviewed data-processing boundary.
6. For write workflows, inspect full request schemas and auth rules in the Clinical OS source. The partner API is read-only. This adapter intentionally exposes GET operations only; it does not implement signing, consent, recording or EPR submission.
7. Run integration tests against the exact candidate deployment. Existing unit tests use mock fetch responses and do not prove connectivity.

Reads preserve upstream denial statuses and return sanitised errors. Redirects are rejected. Missing configuration fails closed. No generated fallback or sample patient is returned after a failure. No credentials are logged or persisted by this module.

Run `node --test tests/integration.test.mjs`.

## Gateway policy module

`clinical-admin-gateway.mjs` composes the reader with trusted `verifySession`, `resolveTenantReader` and `canReadPatient` services. It validates expiry, operation permissions, tenant binding and explicit boolean patient-access decisions. It denies mutations and query scope overrides. It is not mounted, and no concrete identity or tenant service is implemented here. Read the L02/L04 contracts in `docs/Clinical_Admin_Implementation_Loops.md`. Tests use injected synthetic dependencies: `node --test tests/gateway.test.mjs`.

The reader accepts integer timeouts from 1 to 30,000 ms (default 10,000 ms), exact JSON or FHIR JSON media types, and at most 1 MiB of response bytes. The byte limit is enforced while streaming, including when Content-Length is absent. See [the staging handoff](../docs/STAGING_HANDOFF.md) for required identity inputs and deployment acceptance cases.
