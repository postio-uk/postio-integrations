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

## npm auth — a recurring trip hazard

Publishing uses an `NPM_TOKEN` GH secret (here and in `postio-api`). npm
caps write-token lifetime at 90 days, so it expires silently and the
publish fails with a misleading `E404 on PUT` — read that as "token can't
write here", not "no such package". Granular tokens need **Bypass 2FA**
ticked or CI fails regardless. The permanent fix is npm OIDC Trusted
Publishing (the server SDKs already use it), configured per package —
about ten separate setups across the two repos.

## MCP Registry release

`@postio/mcp` is listed on the official MCP Registry as
`uk.co.postio/postcode-address-validation`. **The name is permanent** —
renaming means publishing a second server. `description` and `title` are
capped at 100 characters each and are what aggregators index.

To release: bump `packages/mcp/package.json#version`, the `VERSION`
const in `src/index.ts`, and both version fields in
`packages/mcp/server.json`; push master. `release-packages.yml` publishes
to npm, then `publish-mcp-registry.yml` waits for npm (the registry
reads `mcpName` from the *published* package.json) and republishes the
listing.

## Outstanding: the widget release

Four items, all wanting the same version bump and CDN deploy:

1. `populateOutputs` and `pickIndex` in `address-finder` write with plain
   `el.value =`, which React's value tracker discards — so **any React
   or Vue form using `output` mapping never receives the value**.
   Currently shimmed inside the WordPress plugin only.
2. The widget dispatches `input` back into its own search box, which
   retriggers a search and reopens the dropdown. Also shimmed.
3. Let callers set `x-postio-client`: `core` assigns it *after*
   spreading caller headers, and `address-finder` has no pass-through.
4. `PostioOptions.headers` doc comment names two protected headers when
   there are three.

The WordPress plugin **bundles** the widget, so it needs its own plugin
release; drop-in CDN users on `/v1/` update automatically.

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

## WordPress test site — start it, use it, stop it

The WordPress plugin's local test site (WooCommerce plus the form builders, from `postio-wordpress/.wp-env.json`) is **not left running** on the Hetzner box. It ran idle for 7 weeks once, eating RAM and swap, and was torn down on 2026-10-06.

Whenever work touches the WordPress plugin or needs that site:
- **Start**: `cd ~/PROJECTS/ONNO/POSTIO/postio-wordpress && npx @wordpress/env start` (http://localhost:8888, admin / password; reach it from Olly's devices with `tailscale serve`, never nginx).
- **Stop when done, same session**: `npx @wordpress/env stop` (keeps the data), or `npx @wordpress/env destroy` if nothing on it needs keeping.
- If `wp-env` says "Environment not initialized" but containers are up, the env was started from another home dir — tear it down with `docker compose down -v` in its `~/wp-env/<hash>/` folder.

Never finish a session with it still running.

## What does NOT live here

- The OpenAPI spec source — that's in `postio-uk/postio-api`,
  published as `@postio/openapi` on npm. This repo *consumes* it.
- Per-language server SDKs (Python / Go / PHP / Ruby / .NET) — each
  in its own repo: `postio-uk/postio-{python,go,php,ruby,dotnet}`.
- Per-platform plugins — WordPress (`postio-uk/postio-wordpress-plugin`),
  Shopify, Zapier — each in its own repo.
- The marketing site + customer dashboard — `postio-uk/postio-www`.
