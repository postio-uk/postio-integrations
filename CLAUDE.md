# postio-integrations — agent notes

Operational notes for coding agents working in this repo.

## Stack

- **pnpm workspace** rooted at `packages/`. Each subdirectory under
  `packages/<name>/` is an independently publishable npm package with
  its own `package.json`.
- **Node 22+**. ESM only. TypeScript 5.x. `openapi-typescript` for
  type generation.
- All public packages are MIT-licensed.

## Build commands

```bash
# from packages/
pnpm install
pnpm -r run build                       # build every package
pnpm -F @postio/api-types run build     # build one package
pnpm -F "@postio/address-finder-bundled..." run build
                                        # build a package and its workspace deps
                                        # (the `<x>...` suffix is load-bearing —
                                        #  pnpm 10 reads it as "x and its deps"
                                        #  in topological order; the prefix
                                        #  `...<x>` form just matches `x`)
```

## Branch + release model

- `stage` — working branch.
- `master` — push triggers the CI publish / deploy workflows. They
  are idempotent: same version twice is a no-op.

`@postio/api-types` tracks the spec version lockstep — the version
in `packages/api-types/package.json` should match the
`@postio/openapi` version it pins as a dev dependency.

Other packages have independent SemVer; bump
`packages/<name>/package.json#version` when you intend a release.

**Sibling deps must be `"workspace:^"`, never a pinned registry
version.** `@postio/core` carried `"@postio/api-types": "1.0.2"` until
2026-08-12 and had been silently building its types against a stale
*published* api-types instead of the one in this repo — so a field
removed from the spec still appeared in core's and
address-finder-bundled's generated `.d.ts` after a full rebuild. If a
type change doesn't propagate, check this first.

## Workflows

- `release-packages.yml` — on master push under `packages/**`,
  walks every workspace package and runs `pnpm publish` for any
  whose version is new on npm. Always use `pnpm publish` (not
  `npm publish`) so `workspace:` dep ranges resolve at publish
  time — `npm publish` ships the literal `workspace:^` string.
- `deploy-cdn-worker.yml` — on push under `cdn-worker/**`, runs
  `wrangler deploy` (or `--env stage`).
- `deploy-cdn-bundles.yml` — on push under
  `packages/address-finder*/**`, builds the bundled package and
  uploads to the CDN's R2 bucket.

## Public copy — canonical Postio one-liner

Whenever a README, package description, or other public-facing surface
needs a "what is Postio" sentence, use this canonical line verbatim:

> Postio is the UK validation API for addresses, emails and phone numbers.
> Sign up free — first 100 lookups on us, no card needed.

In markdown contexts, wrap "Sign up free" as a link to
`https://postio.co.uk`. The aim is consistency wherever a prospective
user might land — npm pages, GitHub READMEs, Packagist, PyPI, RubyGems,
NuGet, pkg.go.dev, the OpenAPI spec `info.description`.

Don't paraphrase locally. If the line doesn't fit a particular surface,
flag it so the canonical wording can be updated centrally — then
propagate the new version to every surface in one pass.

## What does NOT live here

- The OpenAPI spec source — that's in `postio-uk/postio-api`,
  published as `@postio/openapi` on npm. This repo *consumes* it.
- Per-language server SDKs (Python / Go / PHP / Ruby / .NET) — each
  in its own repo: `postio-uk/postio-{python,go,php,ruby,dotnet}`.
- Per-platform plugins (WordPress, Shopify, Magento) — each in its
  own repo when shipped.
- The marketing site + customer dashboard — `postio-uk/postio-www`.
