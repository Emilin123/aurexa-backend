# AUREXA

AUREXA beta validation is executed on clean GitHub Actions runners.

- Frontend: Bun 1.4.0 with `bun.lock` and `bun install --frozen-lockfile`.
- Backend: Node 22.16.0 / npm 10.9.2 with npm lockfile v3.
- No production deployment is performed by the validation workflow.
- Private Firebase Admin and Telegram credentials must exist only in staging secret storage.

Beta validation trigger: 2026-09-10T04:24Z
