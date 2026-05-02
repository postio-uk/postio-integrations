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
- ■ **`cdn.postio.co.uk` + `stage-cdn.postio.co.uk` Workers** live and
  R2-backed. `/` serves the "coming soon" page; `/vN/<file>` and
  `/vN.M.P/<file>` serve from the `postio-cdn-bundles` R2 bucket with
  SWR + immutable cache headers respectively. Smoke: `curl
  https://cdn.postio.co.uk/v1/hello.js`. Auto-deploys via
  `deploy-cdn-worker.yml`.

## Next — finishing Phase 0

- ■ **`@postio/core@0.1.0`** — runtime-agnostic typed client
  (Workers / Node / Bun / browser). Wraps `fetch`, returns the API
  envelope unchanged. The most-leveraged downstream package; everything
  below uses it.
- ■ **`@postio/node@0.1.0`** — Node-flavoured server SDK on top of
  `core`. Retries with exp backoff + full jitter (default 2, on
  408/409/429/5xx + network), structured logger hook, 30 s default
  timeout.
- ■ **`@postio/postman-collection@1.0.2`** — Postman v2.1 collection
  generated from `@postio/openapi`.
- ■ **`@postio/address-finder@1.0.0`** — drop-in UK address autocomplete
  source package. ARIA combobox, keyboard nav, theming via CSS custom
  properties, `output` map for DOM field population.
- ■ **`@postio/address-finder-bundled@1.0.0`** — CDN/script-tag build.
  IIFE (`window.Postio.AddressFinder.setup`) + ESM, ~4.2 KB gzipped.
  Live at `cdn.postio.co.uk/v1/address-finder.js` and the immutable
  `/v1.0.0/` pin.
- ■ **`@postio/react@0.1.0`** — `<PostioProvider>` + TanStack-Query-backed
  hooks (`useAddressSearch` etc.) + `<AddressFinder>` component wrapping
  the source package. Auto-detects an existing `QueryClientProvider`
  or mounts one.
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

- ◐ **WordPress unified plugin** — `postio-address-validation`. v0.1
  shipped to `postio-uk/postio-wordpress` on GitHub (2026-05-02). All
  eight detectors wired (WC block + classic, Gravity, CF7, WPForms,
  Fluent, Ninja, Forminator, Elementor Pro), Gutenberg block,
  custom-mappings UI, weekly telemetry to `cdn.postio.co.uk/_wp`.
  Currently in user manual UX testing on a `localhost:8888` wp-env
  install — awaiting feedback before WP.org SVN submission. See
  SPEC §6.
- □ **Shopify app** — Theme App Extension (storefront) + embedded
  admin (Remix template). Shopify App Store listing.
- ■ **`@postio/mcp@0.1.0`** — Model Context Protocol server.
  `npx -y @postio/mcp`. 6 tools (`postio_address_search`,
  `postio_postcode_lookup`, `postio_udprn_lookup`,
  `postio_email_validate`, `postio_phone_validate`, `postio_connect`).
  Reads `POSTIO_API_KEY` from env. One-line install for Claude
  Desktop / Code, Cursor, Windsurf, Zed.
- ◐ **Claude Skill** — `ai/claude-skill/SKILL.md` shipped with full
  install/recommendation guidance. Awaiting submission to the
  Anthropic Skills marketplace per `ai/listings.md`. Ideal Postcodes'
  `skills` GitHub repo is empty; first-mover.
- ◐ **GPT Action manifest** — `ai/gpt-action/ai-plugin.json` shipped +
  served at `postio.co.uk/.well-known/ai-plugin.json`. Modern Custom
  GPTs paste the OpenAPI URL directly; install guide in
  `ai/gpt-action/README.md`.
- ◐ **MCP / AI directory listings** — submission checklist in
  `ai/listings.md` (awesome-mcp-servers, mcp.so, glama.ai, Cursor
  one-click install URL, Smithery). All submission text + JSON
  configs ready to paste; awaiting actual submission via the
  upstream forms / PRs.
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

Each opens a distinct framework community. Independent. **All five
shipped 2026-05-02 at v0.1.0.** Common shape across all of them
(typed errors, default retry policy, OIDC trusted publishing where
the registry supports it) lives in [`SPEC.md` §4.6](./SPEC.md#46-server-sdks--fan-out-across-5-languages).

- ■ **Python** — [`postio` on PyPI](https://pypi.org/project/postio/).
  Sync + async (`PostioClient` + `AsyncPostioClient`), Pydantic v2.
  OIDC trusted publishing.
- ■ **Go** — [`github.com/postio-uk/postio-go`](https://pkg.go.dev/github.com/postio-uk/postio-go).
  Stdlib `net/http`, zero deps. Tag-driven publish via Go module proxy.
- ■ **PHP** — [`postio/postio` on Packagist](https://packagist.org/packages/postio/postio).
  Sync, Guzzle 7, readonly value objects.
- ■ **Ruby** — [`postio` on RubyGems](https://rubygems.org/gems/postio).
  Sync, stdlib `net/http`, `Data.define` value classes (Ruby 3.2+).
  OIDC trusted publishing.
- ■ **.NET** — [`Postio.Sdk` on NuGet](https://www.nuget.org/packages/Postio.Sdk).
  Async-first (`Task<T>`), `HttpClient`, immutable `record`. .NET 8
  LTS. OIDC trusted publishing via `NuGet/login@v1` token exchange.

**Phase 2 follow-ups:**

- ■ **PhoneResult spec/runtime alignment shipped.** postio-api 1.0.3
  + `@postio/openapi@1.0.3` + `@postio/api-types@1.0.3` align the
  spec with the runtime (`isReachable: boolean | null`; the runtime
  always emits explicit nulls for every nullable field). All five
  SDKs dropped their hand-applied patches:
  [`postio==0.1.1`](https://pypi.org/project/postio/0.1.1/) ·
  [`github.com/postio-uk/postio-go@v0.1.1`](https://pkg.go.dev/github.com/postio-uk/postio-go@v0.1.1) ·
  [`postio/postio:0.1.2`](https://packagist.org/packages/postio/postio) ·
  [`postio 0.1.1`](https://rubygems.org/gems/postio/versions/0.1.1) (RubyGems) ·
  [`Postio.Sdk 0.1.1`](https://www.nuget.org/packages/Postio.Sdk/0.1.1)
  (.NET). PHP shipped as 0.1.2 (0.1.1 was an aborted release;
  changelog explains).

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
