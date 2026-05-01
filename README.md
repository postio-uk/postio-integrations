# postio-integrations

Single git repo for everything that wraps the Postio API: typed JS
clients, drop-in widgets, MCP server, framework examples, and the
`cdn.postio.co.uk` Worker.

The OpenAPI spec itself lives in
[`postio-uk/postio-api`](https://github.com/postio-uk/postio-api) and
is published as
[`@postio/openapi`](https://www.npmjs.com/package/@postio/openapi) +
served at <https://postio.co.uk/openapi.json>. Everything in **this**
repo consumes that spec.

## Where to look

- [`SPEC.md`](./SPEC.md) — architecture, taxonomy, naming, AI strategy, conventions.
- [`ROADMAP.md`](./ROADMAP.md) — what's shipped, what's next, what's deferred.
- [`CLAUDE.md`](./CLAUDE.md) — operational notes for agents working in this repo.

## Layout

```
postio-integrations/
├── packages/                    pnpm workspace; one publishable npm pkg per subdir
│   └── api-types/               @postio/api-types — TS types from the spec
│   (more to come — core, react, address-finder, mcp, cli, …)
├── cdn-worker/                  Cloudflare Worker for cdn.postio.co.uk
├── examples/                    (planned) framework demos
└── .github/workflows/
    ├── release-packages.yml     publish @postio/* on master push (idempotent)
    └── deploy-cdn-worker.yml    wrangler deploy stage / master
```

Out of scope for this repo (each its own):

- **`postio-uk/postio-api`** — the API itself + the OpenAPI spec source.
- **`postio-uk/postio-www`** — marketing site, customer dashboard, public OpenAPI URL, AI-discoverability surface.
- Server SDKs in non-JS languages (Python / PHP / .NET / Go / Ruby) — separate repos when they ship.
- Per-platform plugins (WordPress / Shopify / Magento / …) — separate repos when they ship.

## Status

| Item | Status |
|---|---|
| `@postio/openapi` on npm | ✓ 1.0.2 |
| `postio.co.uk/openapi.{json,yaml}` | ✓ live, 15 schemas |
| `postio.co.uk/llms.txt` + `claude.md` + `cursor.md` + `.cursorrules` | ✓ live |
| `@postio/api-types` on npm | ✓ 1.0.2 |
| `cdn.postio.co.uk` + `stage-cdn.postio.co.uk` Workers | ✓ live (placeholder; R2 pending) |
| `@postio/core` runtime client | next |
| Drop-in JS `@postio/address-finder` | depends on `core` + R2 |

See [`ROADMAP.md`](./ROADMAP.md) for the full forward look.

## Conventions

- Node 22+, pnpm 10+, ESM only, MIT-licensed.
- `stage` is the working branch on every repo; `master` deploys / publishes.
- Versions track release artefacts lockstep where possible — e.g.
  `@postio/api-types@1.0.2` regenerates against `@postio/openapi@1.0.2`.
- All deploys / publishes are CI-driven (no `npm login` locally,
  no `wrangler login` locally — secrets live in GH Actions).
