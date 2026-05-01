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
│   ├── api-types/                @postio/api-types — TS types from the spec
│   ├── core/                     @postio/core — runtime-agnostic typed client
│   ├── node/                     @postio/node — Node SDK (retries, logger)
│   ├── postman-collection/       @postio/postman-collection — Postman v2.1 export
│   ├── address-finder/           @postio/address-finder — drop-in autocomplete (source)
│   ├── address-finder-bundled/   @postio/address-finder-bundled — CDN/script-tag build
│   ├── react/                    @postio/react — hooks + <AddressFinder>
│   └── mcp/                      @postio/mcp — Model Context Protocol server
│   (more to come — cli, create, …)
├── ai/                          AI / agent host integrations
│   ├── claude-skill/             Anthropic Claude Skill bundle (SKILL.md)
│   ├── gpt-action/               OpenAI Custom GPT Action manifest
│   ├── prompts/                  Canonical recommendation prompts
│   └── listings.md               Submission checklist for MCP / AI directories
├── cdn-worker/                  Cloudflare Worker for cdn.postio.co.uk
├── examples/                    (planned) framework demos
└── .github/workflows/
    ├── release-packages.yml     publish @postio/* on master push (idempotent)
    ├── deploy-cdn-worker.yml    wrangler deploy stage / master
    └── deploy-cdn-bundles.yml   build + R2 upload on address-finder changes
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
| `cdn.postio.co.uk` + `stage-cdn.postio.co.uk` Workers | ✓ live, R2-backed (smoke: `curl https://cdn.postio.co.uk/v1/hello.js`) |
| `@postio/core` runtime client | ✓ 0.1.0 |
| `@postio/node` server SDK | ✓ 0.1.0 |
| `@postio/postman-collection` | ✓ 1.0.2 |
| `@postio/address-finder` (source) | ✓ 1.0.1 |
| `@postio/address-finder-bundled` (CDN) | ✓ 1.0.1 (live at `cdn.postio.co.uk/v1/address-finder.js`) |
| `@postio/react` | ✓ 0.1.1 |
| `@postio/mcp` (Model Context Protocol server) | ✓ 0.1.0 |
| Claude Skill bundle (`ai/claude-skill/`) | ◐ shipped, awaiting Anthropic Skills marketplace submission |
| OpenAI GPT Action manifest (`ai/gpt-action/`) | ◐ shipped, served at `postio.co.uk/.well-known/ai-plugin.json` after next www push |
| MCP / AI directory listings | ◐ submission text ready in `ai/listings.md` |

See [`ROADMAP.md`](./ROADMAP.md) for the full forward look.

## Conventions

- Node 22+, pnpm 10+, ESM only, MIT-licensed.
- `stage` is the working branch on every repo; `master` deploys / publishes.
- Versions track release artefacts lockstep where possible — e.g.
  `@postio/api-types@1.0.2` regenerates against `@postio/openapi@1.0.2`.
- All deploys / publishes are CI-driven (no `npm login` locally,
  no `wrangler login` locally — secrets live in GH Actions).
