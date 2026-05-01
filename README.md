# postio-integrations

The integration layer that sits above `postio-api`. Everything here is a
distribution surface — drop-in JS, server SDKs, platform plugins, AI/agent
hooks — that turns the raw HTTPS API into something a developer or a
WordPress admin can install in five minutes.

This directory is the umbrella. Most sub-folders end up as their own git
repo when they ship (separate publish targets: npm, PyPI, Packagist,
NuGet, WP.org SVN, Shopify CLI, Marketplace listings).

## Where to look

- [`SPEC.md`](./SPEC.md) — master spec. Architecture, taxonomy,
  naming, CDN/distribution decisions, foundation contracts, AI strategy.
  **Read this before starting any integration work.**
- [`ROADMAP.md`](./ROADMAP.md) — prioritised hit list and build order.
  Phase 0 → Phase 6, with deferrals. Optimised for **users acquired**,
  not revenue or platform diversity.
- Per-integration folders (added as they ship) — each gets its own
  `README.md`, `CLAUDE.md`, and deploy/publish runbook.

## Top-level layout

```
postio-integrations/
├── SPEC.md           ← architecture + decisions
├── ROADMAP.md        ← prioritised build order
├── packages/         ← JS-family monorepo (drop-in, npm core, React, MCP, CLI, OpenAPI tooling)
├── sdks/             ← server SDKs (Python, PHP, .NET, Go, Ruby) — one repo each
├── platforms/        ← platform plugins/apps grouped by category
│   ├── ecomm/        ← Shopify, Magento, BigCommerce, Shopware, …
│   ├── wordpress/    ← single unified WP plugin (covers WooCommerce + form builders)
│   ├── nocode/       ← Webflow, Wix, Squarespace, Framer, …
│   ├── crm/          ← HubSpot, Salesforce, Dynamics, Pipedrive, Zoho
│   ├── workflow/     ← Zapier, Make, n8n
│   └── browser-extension/
├── ai/               ← llms.txt, Claude Skill, GPT Action, Cursor rules, prompt canon
└── examples/         ← framework-by-framework demos (Next, Vite, Astro, Remix, …)
```

The grouping in `platforms/` is the **taxonomy** — it maps to how
customers and search engines categorise these things, not to internal
build similarity.

## Relationship to other repos

- `postio-api` — the HTTP surface every integration here wraps. The
  OpenAPI spec **is generated and published from there** (Zod schemas
  → `hono-openapi` → `@postio/openapi` on npm + `postio.co.uk/openapi.{json,yaml}`).
  See SPEC §4.1.
- `postio-www` — hosts marketing pages and `/docs/*` for each integration.
  The `.md`-suffixed mirror of every doc page (an AI-discoverability
  requirement, see `ai/` and `SPEC.md` §AI Surface) is generated from
  `postio-www` content, not duplicated here. `postio-www` also serves
  the public OpenAPI URL.
- `postio-pipeline` / `postio-paf-bulk` / `postio-perf` — not relevant to
  the integration layer.

## Status

| Phase | Item | Status |
|---|---|---|
| 0 | OpenAPI spec public (postio.co.uk/openapi.{json,yaml}) | ✓ live |
| 0 | `@postio/openapi` on npm | ✓ 1.0.1 published; **1.0.2 fix queued on `postio-api` stage** |
| 0 | `llms.txt`, `claude.md`, `cursor.md`, `.cursorrules` in postio-www | ✓ on stage; pending master merge |
| 0 | `@postio/api-types` (TS types from the spec) | ✓ built locally + dry-run-verified; pending publish (needs npm_token wired and `@postio/openapi@1.0.2` on npm) |
| 0 | `cdn.postio.co.uk` Worker | ✓ scaffolded (Worker code + wrangler.toml); pending R2 bucket + DNS verify + deploy |
| 0 | `@postio/core` (runtime client) | not started |
| 0 | Drop-in JS (`@postio/address-finder`) | not started — depends on `core` + cdn |
| 0 | `@postio/react`, `@postio/node`, examples gallery | not started |
| 1 | WordPress plugin, Shopify app, MCP server, Claude Skill, … | not started |

See [`MORNING.md`](./MORNING.md) for the actionable checklist when you're back at the keyboard. `ROADMAP.md` has the full build order; `SPEC.md` has the contracts.
