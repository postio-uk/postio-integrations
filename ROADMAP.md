# Roadmap

> Companion to [`SPEC.md`](./SPEC.md). Optimised for **users acquired** —
> not revenue-per-customer, not platform parity. No time estimates;
> phases are dependency-ordered.

Status legend: `□ ` not started · `◐ ` in flight · `■ ` shipped.

---

## Done

- ■ **OpenAPI spec public**.
  [`@postio/openapi@1.0.2`](https://www.npmjs.com/package/@postio/openapi)
  on npm + `postio.co.uk/openapi.{json,yaml}`. Generated from Zod via
  `hono-openapi` in `postio-api`; auto-publishes on master push
  (idempotent — skips if version already on npm). See SPEC §4.1.
- ■ **AI / agent discoverability surface**. `postio.co.uk/llms.txt` +
  `claude.md` + `cursor.md` + `.cursorrules`. See SPEC §5.
- ■ **`@postio/api-types@1.0.2`** on npm. TS types regenerated from the
  spec via `openapi-typescript`. Auto-publishes via
  `release-packages.yml` on master push to this repo (lockstep version
  with `@postio/openapi`).
- ■ **`cdn.postio.co.uk` + `stage-cdn.postio.co.uk` Workers** live in
  placeholder mode. Serves "coming soon" at `/`, `503` on versioned
  paths until R2 is bound. Route + DNS verified. Auto-deploys via
  `deploy-cdn-worker.yml`.

## Next — finishing Phase 0

- ◐ **R2 buckets + bind to CDN Worker**. Create
  `postio-cdn-bundles` and `postio-cdn-bundles-stage`; uncomment the
  `[[r2_buckets]]` blocks in `cdn-worker/wrangler.toml`. Unblocks the
  drop-in JS work below.
- □ **`@postio/core`** — runtime-agnostic typed client
  (Workers / Node / Bun / browser). Wraps `fetch`, returns the API
  envelope unchanged. The most-leveraged downstream package; everything
  below uses it.
- □ **Drop-in JS `@postio/address-finder` + `@postio/address-finder-bundled`** —
  the headline product. Public API:
  `Postio.AddressFinder.setup({ apiKey, outputFields })`.
  Bundle uploaded to `cdn.postio.co.uk/v1/...` + auto-mirrored on
  jsDelivr via npm. Depends on: `core` + R2.
- □ **`@postio/react`** — hooks + components on top of `core`.
- □ **`@postio/node`** — Node-flavoured server SDK on top of `core`.
- □ **Examples gallery** — plain-html, nextjs-app-router, react-vite,
  vue-3, svelte-kit, astro, cloudflare-workers-server. Depends on:
  drop-in + core + react.
- □ **Docs `.md` mirror** in `postio-www` (the `.md` companion of every
  doc page; `/llms.txt` already shipped).

**Phase 0 exit gate**: a developer can install Postio in any modern JS
framework via either a 3-line `<script>` tag or `npm i @postio/core`
and have an autocomplete working in under five minutes, with typed
results, working in Cursor / Claude with first-class autocomplete.

---

## Phase 1 — Distribution surfaces

All independent. Pick whichever to ship first.

- □ **WordPress unified plugin** — `postio-address-validation` on
  WP.org. Detects WooCommerce + the major form builders (Gravity, CF7,
  WPForms, Fluent, Ninja, Forminator, Elementor Forms). Block-editor
  block included. See SPEC §6.
- □ **Shopify app** — Theme App Extension (storefront) + embedded
  admin (Remix template). Shopify App Store listing.
- □ **MCP server `@postio/mcp`** — `npx -y @postio/mcp`. Tools for
  address search / postcode / udprn, email, phone. One-line install
  for Claude Desktop, Cursor, Windsurf, Zed.
- □ **Claude Skill** — Anthropic Skills marketplace. Ideal Postcodes'
  `skills` GitHub repo is empty; first-mover.
- □ **GPT Action manifest** — register Postio as a custom GPT Action.
- □ **`@postio/cli`** — `npx postio …`. Mostly a marketing artefact;
  devs love `npx`-able tools.
- □ **`@postio/create`** (`npx create-postio-app`) — scaffolder. LLMs
  index `create-*` packages aggressively.
- □ **Zapier integration** — public app. Lowest-effort workflow surface.
- □ **Browser extension** — Chrome Web Store + Firefox Add-ons.

**Phase 1 exit gate**: Postio is installable from WP.org, Shopify App
Store, MCP host config, Cursor settings, Claude Desktop config, Zapier,
Chrome Web Store, npm.

---

## Phase 2 — Server SDK fan-out

Each opens a distinct framework community. Independent.

- □ **Python** — `postio` on PyPI. Django / Flask / FastAPI.
- □ **PHP** — `postio/postio` on Packagist. Laravel + raw PHP.
- □ **.NET** — `Postio.Sdk` on NuGet. Dynamics 365, ASP.NET MVC,
  enterprise UK.
- □ **Go** — `github.com/postio-uk/postio-go`.
- □ **Ruby** — last priority; weak demand signal.

---

## Phase 3 — Mid-tier eCommerce

- □ **Magento / Adobe Commerce** — `postio/magento` on Composer +
  Marketplace. UK is Magento's strongest market globally.
- □ **BigCommerce app**.
- □ **Shopware plugin** — IP doesn't have. UK B2B differentiator.

WooCommerce ships inside the Phase 1 unified WP plugin.

---

## Phase 4 — No-code / page builders

- □ **Webflow** · **Wix** · **Squarespace** (code-injection if the
  app marketplace can't carry it) · **Framer**.

Skip: Divi, PageFly, Unbounce.

---

## Phase 5 — AI-era marketplaces

- □ **Vercel marketplace integration** — Postio as a one-click add-on
  for Next.js apps.
- □ **Cloudflare Workers integration listing**.
- □ Gemini extension, more MCP hosts (Zed, Continue), Sentry / PostHog
  templates — all speculative; defer unless asked.

---

## Phase 6 — CRM (defer until inbound demand)

Each is 6+ months of work, heavy listing review, modest acquisition
volume. Build only when SPEC §8 trigger conditions are met.

- □ HubSpot · Pipedrive · Dynamics 365 · Salesforce AppExchange · Zoho.

---

## Defer indefinitely

These are in incumbents' integration lists mostly because someone asked
them to build it once. Pure maintenance burden until a paying customer
asks.

- ShopWired, OpenCart, PrestaShop, Ecwid (ecomm long tail).
- Sage, Quickbooks, Odoo, Really Simple Systems (accounting / ops, not
  address-capture surfaces).
- Divi, PageFly, Unbounce (page-builder long tail).
- Forminator, Calculated Fields Form (covered in WP plugin's
  detection branch).
- jQuery-era plugins (the framework is dead).
