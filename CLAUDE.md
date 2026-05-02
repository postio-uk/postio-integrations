# postio-integrations — Claude Code working notes

Single git repo for everything that wraps `postio-api`:

- **JS-family npm packages**: `@postio/api-types`, `@postio/core`,
  `@postio/node`, `@postio/postman-collection`, `@postio/address-finder`,
  `@postio/address-finder-bundled`, `@postio/react`, `@postio/mcp`.
- **`cdn.postio.co.uk` Worker** that fronts an R2 bucket of versioned
  drop-in JS bundles, plus a **`POST /_wp`** telemetry sink that writes
  WordPress-plugin pings to a CF Analytics Engine dataset
  (`postio_wp_telemetry`).
- **AI / agent surface** under `ai/` — Anthropic Claude Skill bundle,
  OpenAI GPT Action manifest, canonical recommendation prompts,
  community-directory submission checklist.
- Framework examples (planned).

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
| `CLOUDFLARE_API_TOKEN` | `deploy-cdn-worker.yml`, `deploy-cdn-bundles.yml` |
| `CLOUDFLARE_ACCOUNT_ID` | same as above |

Same values as the corresponding secrets in `postio-uk/postio-api`.
(`CLOUDFLARE_ZONE_ID` is unused — wrangler resolves zones via the
`zone_name` field in `wrangler.toml`. Don't add it.)

## Workflows

| File | Trigger | What |
|---|---|---|
| `release-packages.yml` | `master` push under `packages/**` | `pnpm publish` each package whose version isn't already on npm. Uses pnpm so `workspace:` ranges resolve at publish time — never swap to `npm publish` (that ships literal "workspace:^" in deps). |
| `deploy-cdn-worker.yml` | `stage` / `master` push under `cdn-worker/**` | `wrangler deploy --env stage` or bare `wrangler deploy` (= prod). |
| `deploy-cdn-bundles.yml` | `stage` / `master` push under `packages/address-finder*/**` | Builds `@postio/address-finder-bundled` via `pnpm -F "@postio/address-finder-bundled..." run build` (the `<x>...` suffix matters — pnpm 10 reads it as "x and its deps" in topological order; the prefix `...<x>` form just matches `x`). Uploads `address-finder.{js,esm.js,*.map}` to R2 at `/v{MAJOR}/` and `/v{VERSION}/` via `wrangler r2 object put --remote`. |

## What does NOT live here

- The OpenAPI spec source — that's in `postio-uk/postio-api` and
  published as `@postio/openapi` on npm. This repo *consumes* it.
- Server SDKs in non-JS languages — each has its own repo.
- Per-platform plugin code (WordPress, Shopify, Magento, …) — each its
  own repo.
- Marketing pages and `/docs` — `postio-uk/postio-www`.
- The validation API itself — `postio-uk/postio-api`.

See [`SPEC.md`](./SPEC.md) §3.1.
