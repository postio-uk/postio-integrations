# Postio Integration Layer — Roadmap

> Prioritised hit list. Companion to [`SPEC.md`](./SPEC.md) (which
> covers the architecture and contracts for everything below).
>
> **Optimised for: users acquired.** Not revenue-per-customer, not
> platform diversity, not feature parity with incumbents. Where a
> trade-off exists, pick the path that puts Postio in front of the most
> developers fastest.
>
> **No time estimates.** Phases are dependency-ordered. Calendar is
> whatever calendar.

---

## Reading order

Each phase is a set of deliverables. A phase can start as soon as its
dependencies are met. Items inside a phase can be worked in parallel
unless an explicit `depends on` says otherwise.

Status legend: `□ ` not started · `◐ ` in flight · `■ ` shipped.

---

## Phase 0 — Foundation (blocks everything downstream)

These artefacts are what every later integration consumes. Until they
exist, downstream work duplicates effort or has to be reworked.

- ■ **Publish the existing OpenAPI spec.** ✓ Shipped 2026-04-30.
  - `postio-www` serves `postio.co.uk/openapi.json` + `.yaml` via
    `app/(marketing)/openapi.{json,yaml}/route.js`, backed by
    `lib/postio-api/openapi.js`. CORS `*`, 1h Next data cache, tag
    `openapi-spec` ready for on-demand revalidation.
  - `postio-api/api/lib/{buildOpenApiSpec,openApiDocumentation}.js`
    extracted; same builder powers the runtime `/v1/admin/openapi.json`
    handler and the release script `api/scripts/build-openapi.mjs`.
  - `.github/workflows/release.yml` triggers on push to `master`,
    push of `openapi-v*` tag, or manual dispatch. Idempotent (skips
    publish if version is already on npm).
  - `@postio/openapi@1.0.1` live on npm:
    <https://www.npmjs.com/package/@postio/openapi>.
  - `--provenance` disabled until `postio-uk/postio-api` goes public
    (npm rejects provenance for private repos). One-line re-enable.
  - **Bug found and fixed**: `errorResponse()` was hand-writing
    `$ref` strings, leaving `ErrorEnvelope` out of `components.schemas`
    on the published 1.0.1 spec — downstream codegen tools (e.g.
    `openapi-typescript`) refuse to parse it. Fix is on `postio-api`
    stage, version bumped to 1.0.2; will auto-publish on master push.
- ■ **AI / agent surface in postio-www.** ✓ Shipped (stage; pending master).
  Four route handlers under `app/(marketing)/`: `/llms.txt`,
  `/claude.md`, `/cursor.md`, `/.cursorrules`. CORS `*`, 1h cache.
  See SPEC §5 for the strategy.
- ◐ **`@postio/api-types`** — TS types from the spec via
  `openapi-typescript`. Built locally + dry-run-verified
  (`postio-integrations/packages/api-types/`). Pending publish; needs
  `@postio/openapi@1.0.2` on npm + a CI workflow with `NPM_TOKEN`.
  See `MORNING.md` for the publish steps.
- ◐ **CDN Worker** at `cdn.postio.co.uk`. Worker code + `wrangler.toml`
  scaffolded in `postio-integrations/cdn-worker/`. Worker compiles
  cleanly (`wrangler deploy --dry-run` 1.84 KB gzip). Pending: R2
  bucket creation, route binding uncomment, deploy. Without R2 it
  serves a "coming soon" page at `/` and 503 on versioned paths so
  DNS / route can be verified independently.
- □ **`@postio/core`** (runtime-agnostic client; Workers/Node/Bun/browser).
  Depends on: `api-types` (now buildable).
- □ **Drop-in JS** — `@postio/address-finder` + `@postio/address-finder-bundled`.
  Depends on: `core` + CDN Worker live. Public API:
  `Postio.AddressFinder.setup({...})`.
- □ **`@postio/react`** — hooks + components. Depends on: `core`.
- □ **`@postio/node`** — Node-flavoured server SDK. Depends on: `core`.
- □ **Docs `.md` mirror** in postio-www (the `.md` companion of every
  doc page; `/llms.txt` already shipped).
- □ **Examples gallery** — at minimum: plain-html, nextjs-app-router,
  react-vite, vue-3, svelte-kit, astro, cloudflare-workers-server.
  Depends on: drop-in + core + react.

**Phase 0 exit gate:** A developer can install Postio in any modern JS
framework via either a 3-line `<script>` tag or `npm i @postio/core`
and have an autocomplete working in under 5 minutes, with typed
results, working in Cursor/Claude with first-class autocomplete.

---

## Phase 1 — Distribution surfaces (parallel)

All independent. Pick whichever Olly wants to ship first; the others
keep moving on side branches.

- □ **WordPress unified plugin** — `postio-address-validation` on WP.org.
  Detects WooCommerce, Gravity, CF7, WPForms, Fluent, Ninja, Forminator,
  Elementor Forms. Block-editor block included. (See SPEC §6.)
  - WP.org slug + reservation submitted as soon as the spec is locked.
- □ **Shopify app** — Theme App Extension (storefront) + embedded
  admin (Remix template). Submit to Shopify App Store.
  - Built on Shopify's CLI 3.x + Remix template.
  - Targets checkout block + customer account address form.
- □ **MCP server** — `@postio/mcp`. `npx -y @postio/mcp`.
  - One-line install for Claude Desktop, Cursor, Windsurf, Zed.
  - Tools: address search/postcode/udprn, email, phone.
- □ **Claude Skill** — `postio-claude-skill`. Anthropic Skills marketplace.
  - IP's `skills` GitHub repo is empty. First-mover.
- □ **Cursor rules** — `.cursorrules` template + cursor.md guidance page.
- □ **GPT Action manifest** — register Postio as a custom GPT Action.
- □ **`@postio/cli`** — `npx postio …` CLI. Mostly a marketing artefact;
  devs love `npx`-able tools. Wraps every API method as a subcommand.
- □ **`@postio/create`** (`npx create-postio-app`) — scaffolder. Spits
  out a working address-capture form in any of the example frameworks.
  - LLMs index `create-*` packages aggressively.
- □ **Zapier integration** — public app. Triggers/actions for each API
  method. Lowest-effort workflow surface.
- □ **Browser extension** — Chrome Web Store + Firefox Add-ons. Click
  any address field on any page → autocomplete. Useful for ops/CRM
  users doing manual lookups; doubles as marketing.

**Phase 1 exit gate:** Postio is installable from any of: WP.org plugin
directory, Shopify App Store, MCP host config, Cursor settings, Claude
Desktop config, Zapier app marketplace, Chrome Web Store, npm.

---

## Phase 2 — Server SDK fan-out (parallel, each opens an ecosystem)

Each SDK opens a distinct framework community. Order is roughly by
ecosystem size, but they're independent.

- □ **Python** — `postio` on PyPI. Opens Django/Flask/FastAPI.
  - Async + sync clients. Type stubs.
- □ **PHP** — `postio/postio` on Packagist. Opens Laravel + raw PHP.
  - Required for any future Magento/WooCommerce server-side workflow.
- □ **.NET** — `Postio.Sdk` on NuGet. Opens Dynamics 365, ASP.NET MVC,
  enterprise UK back-office, Sage-adjacent integrations.
- □ **Go** — `github.com/postio/postio-go`. Smaller UK base but cheap to ship.
- □ **Ruby** — last priority. IP's Ruby SDK has been dead since 2021;
  the demand signal is weak. Ship only if a customer asks.

**Phase 2 exit gate:** A developer in any of the major server-side
ecosystems can `<package-manager> install postio` and call the API
with full typing.

---

## Phase 3 — Mid-tier eCommerce (after Phase 1 proves the model)

- □ **Magento / Adobe Commerce extension** — `postio/magento` on Composer
  + Magento Marketplace. UK is one of Magento's strongest markets.
  Higher revenue-per-merchant than Shopify.
- □ **BigCommerce app** — public app. Smaller UK base, easier than
  Magento; do this once the Shopify pattern is proven.
- □ **Shopware plugin** — IP doesn't have one. UK B2B differentiator.

WooCommerce ships inside the Phase 1 unified WP plugin. Only build a
standalone WooCommerce listing if WP.org review feedback says the
unified plugin's WooCommerce surface needs its own discoverability.

---

## Phase 4 — No-code / page builders (volume, low-revenue)

Build order optimised for: dev-friendly demographic first, then mass
market.

- □ **Webflow app** — modern, growing, dev-friendly demographic.
- □ **Wix app** — mass-market UK reach, app marketplace open.
- □ **Squarespace** — IP doesn't have. Limited third-party app support;
  may end up being a code-injection snippet rather than a full app.
- □ **Framer plugin** — newer, AI-era, dev-adjacent. IP doesn't have.
- □ **Elementor widget** — folded into the WP plugin's plugin-detection
  branch unless Elementor's own widget marketplace makes a standalone
  listing worthwhile.

Skip: Divi, PageFly, Unbounce, Webflow's various competitors.

---

## Phase 5 — AI-era marketplaces (deeper)

- □ **Vercel marketplace integration** — Postio as a one-click add-on
  for Next.js apps. Sets env var, links account.
- □ **Cloudflare Workers integration listing** — same pattern, native to
  the platform we already deploy on.
- □ **Gemini extension** — once Google's extension model stabilises.
- □ **Additional MCP host coverage** — Zed, Continue, etc. (Mostly free
  if `@postio/mcp` is well-built.)
- □ **Observability/devtool integrations** — Sentry breadcrumb
  enrichment for address-capture errors; PostHog event templates.
  Speculative. Defer unless someone asks.

---

## Phase 6 — CRM / business apps (defer until inbound demand)

Don't build any of these speculatively. Each is 6+ months of work,
heavy listing review, and modest acquisition volume. Build only when
SPEC §8 trigger conditions are met.

- □ **HubSpot** (lowest barrier, decent UK SMB penetration).
- □ **Pipedrive** (UK-strong, IP doesn't have).
- □ **Dynamics 365**.
- □ **Salesforce AppExchange**.
- □ **Zoho**.

---

## Defer indefinitely (skip until customer asks)

These are in IP's integrations page mainly because someone asked them
to build it once. They are pure maintenance burden until a paying
customer requests them.

- ShopWired, OpenCart, PrestaShop, Ecwid (ecomm long tail).
- Sage, Quickbooks, Odoo, Really Simple Systems (accounting/ops, not
  address surfaces).
- Divi, PageFly, Unbounce (page-builder long tail).
- Forminator, Calculated Fields Form (covered in WP detection).
- Jquery-era plugins (the framework is dead).

---

## Open questions before Phase 1 starts

See [`SPEC.md` §10](./SPEC.md#10-open-questions--todo-before-phase-1-starts)
for the full list. The blockers are:

1. ~~Register handles + GH org migration~~ — ✓ done. `@postio` (npm),
   `postio` (PyPI / Packagist / NuGet), `postio-uk` (GH org). All
   five existing repos now origin at `github.com:postio-uk/...`.
2. ~~WP plugin pricing model~~ — ✓ decided: every integration is free,
   revenue is API credits only.
3. **`cdn.postio.co.uk` Worker + R2** — DNS already CNAMEd to
   `postio.co.uk` (orange-cloud, mirrors `api` / `stage-api` pattern).
   Still need the Worker that fronts R2 to serve the bundles.
4. **npm publish auth in `postio-api` CI** — either an `NPM_TOKEN` GH
   Actions secret with publish rights to `@postio`, or trusted
   publishing via OIDC. Required for the `@postio/openapi` release
   step. Open question for Olly + Claude — see chat.
4. ~~Decide OpenAPI authoring strategy~~ — **resolved**: already
   generated from Hono + `zod-openapi` in postio-api.
5. Confirm doc-subdomain pattern for `.md` mirror.
