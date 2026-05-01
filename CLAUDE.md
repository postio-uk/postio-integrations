# postio-integrations — Claude Code working notes

Single git repo for everything that wraps `postio-api`. JS-family npm
packages (`@postio/api-types`, `@postio/core`, drop-in JS, React, MCP)
plus the `cdn.postio.co.uk` Worker plus framework examples.

Read [`README.md`](./README.md) and [`SPEC.md`](./SPEC.md) before
making architectural changes — this file is the operational guide.

## Stack

- **pnpm workspace** rooted at `packages/`. Each subdirectory under
  `packages/<name>/` is an independent npm package with its own
  `package.json`.
- **Node 22+**. ESM only. TypeScript `5.x`. `openapi-typescript` for
  type generation.
- **Cloudflare Workers** for `cdn-worker/` (separate from the npm
  family — its own `package.json`, its own deploy).
- All public packages are MIT-licensed.

## Branch + deploy model (mirrors postio-api / postio-www)

- `stage` — working branch.
- `master` — pushes auto-publish on npm and / or auto-deploy to
  Cloudflare via `.github/workflows/`.
- Idempotent: workflows skip if the version is already on npm.

## Versioning

- `@postio/api-types` tracks `@postio/openapi` lockstep — the version
  is generated from the spec at build time.
- `@postio/core` and downstream packages have their own SemVer; bump
  `package.json#version` when you intend a release.

## Common commands

```bash
# from packages/
pnpm install                 # workspace install (also pulls latest @postio/openapi)
pnpm -r run build            # build every package
pnpm -F @postio/api-types build   # build one package

# from cdn-worker/
npm install
npm run dev                  # wrangler dev
npm run deploy:stage         # wrangler deploy --env stage
npm run deploy               # wrangler deploy (= prod)
```

## Secrets the CI needs

| Secret | Used by |
|---|---|
| `NPM_TOKEN` | `release-packages.yml` (publishes `@postio/*`) |
| `CLOUDFLARE_API_TOKEN` | `deploy-cdn-worker.yml` |
| `CLOUDFLARE_ACCOUNT_ID` | `deploy-cdn-worker.yml` |
| `CLOUDFLARE_ZONE_ID` | `deploy-cdn-worker.yml` |

Same values as the corresponding secrets in `postio-uk/postio-api`.

## What does NOT live here

- The OpenAPI spec source — that's in `postio-uk/postio-api` and
  published as `@postio/openapi` on npm. This repo *consumes* it.
- Server SDKs in non-JS languages — each has its own repo.
- Per-platform plugin code (WordPress, Shopify, Magento, …) — each its
  own repo.
- Marketing pages and `/docs` — `postio-uk/postio-www`.
- The validation API itself — `postio-uk/postio-api`.

See [`SPEC.md`](./SPEC.md) §3.1.
