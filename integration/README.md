# Clinical OS integration foundation

This directory contains a server-only read adapter for a future approved synthetic staging deployment. It is not imported into `dist/` or connected by the published prototype. The optional Node host mounts its gateway without enabling upstream access by default. It does not establish real user authentication, module entitlement or Trust approval.

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

`clinical-admin-gateway.mjs` composes the reader with trusted `verifySession`, `resolveTenantReader` and `canReadPatient` services. It validates expiry, operation permissions, tenant binding and explicit boolean patient-access decisions. It denies mutations and query scope overrides. The optional Node host mounts it; no concrete identity or tenant service is implemented here. Read the L02/L04 contracts in `docs/Clinical_Admin_Implementation_Loops.md`. Tests use injected synthetic dependencies: `node --test tests/gateway.test.mjs`.

The reader accepts integer timeouts from 1 to 30,000 ms (default 10,000 ms), exact JSON or FHIR JSON media types, and at most 1 MiB of response bytes. The byte limit is enforced while streaming, including when Content-Length is absent. See [the staging handoff](../docs/STAGING_HANDOFF.md) for required identity inputs and deployment acceptance cases.

The gateway snapshots the verified identity and permission list for each request. It rechecks expiry after patient and tenant lookups and after the upstream read; an expired session receives 401 without returned patient data. This checks expiry, not live revocation: authoritative session/membership revocation still belongs to the staging identity services. Whitespace-only identities and missing or malformed upstream tokens fail closed.

Only known integration error codes with HTTP error statuses may be exposed. Unknown typed errors are sanitised to `integration_unavailable`. A reader must return a non-null JSON object; arrays, primitives and missing results produce 502. These shape checks do not validate endpoint-specific clinical schemas. Method rejections advertise `Allow: GET`.

## Request lifetime

The gateway has a shared deadline across session verification, patient access, tenant resolution and the upstream read: `timeoutMs` defaults to 15,000 ms and accepts integers from 1 to 30,000. Expiry returns non-cacheable `504 gateway_timeout`; caller cancellation returns `408 request_cancelled` without exposing the caller's abort reason. The host must propagate request disconnects into the standard Request signal.

Trusted dependencies receive an optional final `{signal}` argument: `verifySession(request, {signal})`, `canReadPatient(session, patientId, {signal})`, and `resolveTenantReader(organisationId, {signal})`. Reader operation parameters also include `signal`; the supplied reader forwards it to upstream fetch and streamed body consumption while retaining its own timeout. Implementations should honour cancellation and clean up their work. The gateway can stop waiting and prevent further pipeline stages, but cannot forcibly stop a custom dependency that ignores its signal. Late dependency settlement is handled without returning data or starting a later read. No automatic retry is performed.

## Node server host

`npm start` serves `dist/` and `/api/clinical-admin/` on `127.0.0.1:4179`. `HOST` and `PORT` can override the binding. The UI remains a browser-local synthetic demonstration even when gateway dependencies are configured. `/healthz` reports `gatewayConfigured` but always reports `connectedVerified: false` and `writesSupported: false`; it is a process check, not staging acceptance.

For an approved deployment, put a trusted JavaScript module outside `dist/` and set `CLINICAL_ADMIN_SERVER_ADAPTER` to its absolute path. Its default export must supply `verifySession`, `resolveTenantReader` and `canReadPatient`, following the contracts above. Only the server operator selects this module; request headers and queries cannot select it. Missing functions or module-load failures refuse startup without printing module errors or credentials. With no module, gateway reads return 503. No sample session verifier grants access.

Terminate HTTPS at the approved reverse proxy, bind this host to its private/loopback interface, and preserve the session headers expected by the verified adapter. Client disconnects cancel pending gateway work. Static routes accept GET/HEAD only, serve supported file types strictly within `dist/`, reject hidden paths and escaping symlinks, and never fall back to index.html for missing APIs. API errors and responses are non-cacheable; unknown service errors are sanitised. Shut down with SIGTERM/SIGINT for a five-second drain.

The socket-level tests exercise actual HTTP requests, session-header forwarding, method boundaries, directory/symlink protection, sanitised failures and client-disconnect cancellation. Playwright uses this same host for the entire desktop/mobile UI suite. Deployment-specific authentication, rate limiting, endpoint schemas, telemetry, and session lifecycle remain required before connected acceptance.
