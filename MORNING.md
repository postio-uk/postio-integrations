# Morning checklist (overnight session 2026-04-30 → 04-31)

> Quick pickup notes. What's done, what's queued, what needs you.

## ✓ Shipped overnight

### postio-api (stage `dc3a5b3`)

- **OpenAPI spec bug fix.** `errorResponse()` in
  `api/lib/openapiSchemas.js` was hand-writing `$ref` strings, so
  `ErrorEnvelope` never landed in `components.schemas` on the
  published 1.0.1 spec. Switched to `resolver(ErrorEnvelopeSchema)`,
  bumped `info.version` to **1.0.2**.
- The runtime + Scalar `/docs` page rendered fine (consumers don't
  follow refs at view time), but downstream codegen (e.g.
  `openapi-typescript`) failed with "Can't resolve $ref". This is why
  api-types couldn't build against the published 1.0.1.

### postio-www (stage `e857f07`)

- **AI / agent discoverability surface.** Four new routes under
  `app/(marketing)/`:
  - `/llms.txt` — llmstxt.org-spec sitemap.
  - `/claude.md` — agent-agnostic guidance (when to suggest Postio,
    request shape, error model, billing semantics, hard constraints).
  - `/cursor.md` — Cursor-specific install pointer.
  - `/.cursorrules` — drop-in rules file
    (`curl -o .cursorrules https://postio.co.uk/.cursorrules`).
- Earlier docs commit (`df9a4ba`) added Public surfaces table to
  README + OpenAPI route section to CLAUDE.

### postio-integrations (untracked, local)

- **`@postio/api-types`** built and verified at
  `postio-integrations/packages/api-types/`.
  - `pnpm run build` produces `dist/index.d.ts` (58 KB, types for
    paths/components/operations).
  - `npm publish --dry-run` packs cleanly: 6.3 KB gzipped.
  - Sample consumer typecheck passes
    (`import type { paths, components, operations } from "@postio/api-types"`
    resolves with strict TS).
- **CDN Worker** scaffolded at `postio-integrations/cdn-worker/`.
  - Worker code (`src/index.js`) compiles, dry-run packages at 1.84 KB
    gzip.
  - Versioned URL handling (`/vN/`, `/vN.M.P/`, `/latest/`).
  - CORS `*`, immutable cache for pinned versions, SWR for floating.
  - Falls back to "coming soon" page when R2 binding is absent so
    DNS / route can be validated independently.
- Updated `SPEC.md`, `ROADMAP.md`, `README.md` to reflect new state.

## You-must-do, in order

### 1. Push postio-api stage → master

This auto-publishes `@postio/openapi@1.0.2` to npm (fixing the
ErrorEnvelope bug for downstream codegen).

```bash
cd /home/oliverkingston/PROJECTS/ONNO/POSTIO/postio-api
git checkout master
git pull origin master
git merge --ff-only stage
git push origin master      # prod-deploy-guard will block; you confirm
```

Watch [`github.com/postio-uk/postio-api/actions`](https://github.com/postio-uk/postio-api/actions). Both
`Deploy` and `Publish @postio/openapi` workflows fire. Verify:

- `npm view @postio/openapi version` returns `1.0.2`
- `curl https://postio.co.uk/openapi.json | jq '.info.version'` returns `"1.0.2"`
- `curl https://postio.co.uk/openapi.json | jq '.components.schemas | keys | length'` returns 15 (was 14)

### 2. Push postio-www stage → master

Brings the docs updates + the AI surface routes to prod.

```bash
cd /home/oliverkingston/PROJECTS/ONNO/POSTIO/postio-www
git checkout master
git pull origin master
git merge --ff-only stage
git push origin master      # prod-deploy-guard blocks; confirm
```

Verify:

- `curl -I https://postio.co.uk/llms.txt` returns 200, content-type text/plain
- `curl -I https://postio.co.uk/claude.md` returns 200, content-type text/markdown
- `curl -I https://postio.co.uk/cursor.md` returns 200
- `curl -I https://postio.co.uk/.cursorrules` returns 200

### 3. Decide repo strategy for `postio-integrations/packages/`

The api-types package is locally complete but not in a git repo or
published. SPEC §3.1 says `packages/` should be its own git repo.
Options:

- **Recommended**: `gh repo create postio-uk/postio-integrations --public` (or `--private`)
  from `postio-integrations/` (one umbrella repo containing
  `packages/`, `cdn-worker/`, future `sdks/` etc.). Easier, fewer
  repos to manage.
- **Per-SPEC**: separate repos — `postio-uk/postio-packages` (the
  pnpm monorepo), `postio-uk/postio-cdn`, etc. More work, matches the
  written spec.

Whichever you pick, you'll need to:

1. `gh repo create postio-uk/<name> --public --source=. --push`
   (run from inside the chosen directory)
2. Add `NPM_TOKEN` as a repo secret
   (`gh secret set NPM_TOKEN < <(echo "$NPM_TOKEN")` if you have it
   locally, or via the GH UI).

### 4. Publish `@postio/api-types@1.0.2`

After step 1 (so `@postio/openapi@1.0.2` is on npm) and step 3 (so
the package is in a repo with `NPM_TOKEN`):

Either set up a release workflow (mirror `postio-api/.github/workflows/release.yml`)
**or** publish manually:

```bash
cd /home/oliverkingston/PROJECTS/ONNO/POSTIO/postio-integrations/packages/api-types
pnpm install            # pulls @postio/openapi@1.0.2 (now valid)
pnpm run build          # regenerates types from the fixed spec
npm login               # one-time, scope @postio
npm publish --access public
```

Verify with `npm view @postio/api-types version` → `1.0.2`.

### 5. Bring up the CDN Worker

```bash
cd /home/oliverkingston/PROJECTS/ONNO/POSTIO/postio-integrations/cdn-worker
npm install

# Create R2 buckets
wrangler r2 bucket create postio-cdn-bundles
wrangler r2 bucket create postio-cdn-bundles-stage

# Add stage DNS in CF: stage-cdn.postio.co.uk CNAME → postio.co.uk (orange)

# Uncomment the [[r2_buckets]] and routes blocks in wrangler.toml

# Stage deploy first
npm run deploy:stage

# Verify https://stage-cdn.postio.co.uk/ shows the "coming soon" page

# Prod deploy (will hit the prod-deploy-guard hook)
npm run deploy
```

See `cdn-worker/README.md` for the full runbook.

## What I'd do next once 1–5 are done

In rough priority:

1. **`@postio/core`** — runtime-agnostic typed client. Wraps `fetch`,
   uses `@postio/api-types`. Workers / Node / Bun / browser. The
   single most-leveraged downstream package.
2. **`@postio/address-finder`** (drop-in JS, the headline product) —
   depends on `core` + CDN Worker live. Public API:
   `Postio.AddressFinder.setup({ apiKey, outputFields })`. Bundle
   uploaded to `cdn.postio.co.uk/v1/...` + auto-mirrored on jsDelivr
   via npm.
3. **`@postio/react`** — hooks + components. Quick win once `core`
   exists.
4. **MCP server `@postio/mcp`** — `npx -y @postio/mcp`. First-mover
   in the agent ecosystem (Ideal Postcodes' `skills` repo is empty).

## Outstanding open questions (no rush)

- Repo strategy (see #3 above). Default to umbrella repo for speed.
- Make `postio-uk/postio-api` public to re-enable
  `npm publish --provenance` for `@postio/openapi`. Worth doing if
  there's no sensitive code in there. Audit first.
- Wire `revalidateTag('openapi-spec')` from `postio-api`'s deploy
  step so a prod deploy invalidates `postio-www`'s data-cache copy
  immediately (today it lags up to 1h).

## File map of what's where

```
POSTIO/
├── postio-api/                (stage dc3a5b3 — push to master to publish 1.0.2)
│   ├── api/lib/openapiSchemas.js     ← errorResponse() fix
│   └── api/lib/openApiDocumentation.js ← version 1.0.2
├── postio-www/                (stage e857f07 — push to master to ship AI surface)
│   └── app/(marketing)/{llms.txt,claude.md,cursor.md,.cursorrules}/route.js
└── postio-integrations/       (no git, untracked)
    ├── MORNING.md             ← you're reading this
    ├── README.md
    ├── ROADMAP.md
    ├── SPEC.md
    ├── packages/
    │   ├── api-types/         ← built + dry-run-verified, ready to publish
    │   └── package.json       (pnpm workspace root)
    └── cdn-worker/            ← scaffolded, not deployed
```
