# Netlify delivery

The dedicated site publishes `dist/` and bundles the two entry points in `netlify/functions/`. `netlify.toml` runs the local verification loops before a hosted build. Browser tests remain a separate GitHub Actions job. No global SPA rewrite is needed because the application uses hash routes; missing files and unrelated API paths must remain missing.

`/healthz` reports that the synthetic UI is responding and explicitly reports unverified connectivity and disabled server writes. `/api/clinical-admin/*` uses the existing read gateway without an identity adapter, so known GET routes return 503 and mutation attempts return 405. No upstream origin, key, token or patient identity is inferred from caller input. Static header configuration does not apply to function responses; those handlers set their own no-store and content-type headers.

Use `npm run loops` and `npm run test:browser -- --workers=2` before publication. With a linked site, `netlify deploy --prod --no-build --dir dist` publishes the already verified files and bundles the functions. Review the resulting site URL, health response, unavailable API response, missing-file status and workspace settings check. `.netlify/` is ignored by Git and contains only local project linkage/build output. Do not put deployment credentials in the repository.

The initial deployment is a manual publication. GitHub pushes run verification; they do not automatically publish this site unless continuous deployment is explicitly connected later. The synthetic workspace remains in browser storage on each origin. Existing data on another hostname is not transferred to the Netlify origin.

Netlify hosts the standalone demonstration. It does not deploy the optional Node HTTP process or the Hetzner Clinical OS stack. Future connected work still requires the verified server identity, tenancy and patient-access contracts, appropriate hosting, and staging acceptance evidence. See `HETZNER_TEST_ENVIRONMENT.md` for the separately located test stack.
