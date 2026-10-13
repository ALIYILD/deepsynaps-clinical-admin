# Located Clinical Admin test environment

Checked 13 October 2026 against the Clinical OS deployment sources and the current GitHub pilot-readiness record. This records discovered setup evidence, not a successful deployment.

The dedicated setup is in [Clinical OS deploy/clinical-admin-test](https://github.com/ALIYILD/DeepSynaps-Clinical-Intelligence-OS/tree/main/deploy/clinical-admin-test). It was added in commit `eb240d817` on 12 October; local speech-to-text followed in `4653e0340`. The local checkout inspected was `/Users/aliyildirim/clinical-os-nerve-learning-20261013`.

This is a separate synthetic-only VPS with its own database, storage and secrets. It includes a compose overlay, Caddy configuration and `cw-test.sh` commands for initialisation, build/start, seed, smoke tests and backups. Demo bearer-token login and partner patient-data access stay off. Local speech-to-text is available; external AI requires its separately approved processor configuration. It does not connect live NHS services.

The [upstream readiness record](https://github.com/ALIYILD/DeepSynaps-Clinical-Intelligence-OS/blob/main/docs/clinical-workspace/PILOT_READINESS.md) still labels gate 4 **Ready to build** and lists creating the server/DNS and running the scripts as outstanding. The example hostname `nhs-test.deepsynaps.com` did not resolve during this check. Neither fact proves that a server with a different hostname has not been created. The owner may provide its hostname/IP or SSH alias so the deployed state can be inspected.

The older `deepsynaps-app-test.netlify.app` setup is different: its documentation points to the production EU API/database at `api-eu.deepsynaps.com`. It must not be mistaken for this isolated synthetic environment.

The [upstream sign-off](https://github.com/ALIYILD/DeepSynaps-Clinical-Intelligence-OS/blob/main/docs/clinical-workspace/SIGNOFF.md) records Dr Ali YILDIRIM's function acceptance and governance acceptance for synthetic testing. That existing test approval need not be requested again. Real-patient pilot gates remain separate, as explicitly recorded upstream.

Once the dedicated host is identified, inspect its deployment revision and container health, confirm its isolated test database and configuration without exporting secrets, and run the existing read-only Clinical Admin smoke check with the host's approved synthetic account. Do not rerun the seeder just to obtain access: it resets passwords. Do not apply the test overlay to the Phase-1 production server.

This repository's optional Node host and read gateway still need the verified session/tenant/patient adapter and connected acceptance evidence described in `STAGING_HANDOFF.md`. The native Clinical OS application and this standalone prototype are separate applications; a running native Clinical OS test server does not automatically connect this browser UI or implement its write workflows.
