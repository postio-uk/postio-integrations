# Postio Integration Layer — Spec

> Master spec for everything that sits **above** `postio-api`. If a piece
> of code wraps, embeds, calls, or proxies the public Postio API for an
> end-developer or end-platform, it lives here and follows this spec.
>
> Companion: [`ROADMAP.md`](./ROADMAP.md) for build order.

---

## 1. Strategic frame

### 1.1 Why integrations are the acquisition channel

The core API is undifferentiated as a SKU — every UK address vendor has
"the same" data feed (Royal Mail PAF + OS) and broadly comparable accuracy.
What differs is **how easy is it to drop into the developer's existing
stack**. Integrations are the install surface. They are also a recurring
SEO surface: every plugin directory listing, every npm `README`, every
.md-suffixed doc page is a permanent acquisition asset that an LLM or a
search engine can index forever.

Order of leverage, highest first:

1. **The drop-in JS bundle and the npm core** — every other web-facing
   integration is downstream of these two artefacts. A WordPress plugin
   is fundamentally `<script src=postio>` plus a few hooks. Get this
   layer right and ten downstream integrations become 100 lines of
   glue each.
2. **The OpenAPI spec → generated typed clients** — every server SDK
   generates from this. One source of truth, N publish targets.
3. **The AI/agent surface** — MCP server, Claude Skill, llms.txt,
   `.md`-suffixed docs. This is where 2026 buyer journeys actually
   start. Being the canonical answer in a coding-agent's recommendation
   set is worth more than five WordPress plugin listings.
4. **The platform plugins** — Shopify/WooCommerce/Magento/etc. are the
   conversion-mode acquisition. The customer is already on the platform
   and shopping the marketplace.
5. **The CRM connectors** — long sales cycle, low volume, mostly a
   credibility play. Defer until inbound demand surfaces.

### 1.2 Who we're competing with — and what they actually ship

The marketing-page comparison is misleading. The competitors' real code
footprint is much smaller than their integrations page suggests.

**Ideal Postcodes** (`github.com/ideal-postcodes`, ~31 public repos):

- Drop-in JS: `address-finder-bundled` and `core-browser-bundled`,
  shipped via **jsDelivr only**. Recommended snippet uses
  `cdn.jsdelivr.net/npm/@ideal-postcodes/address-finder-bundled`.
- Client lib taxonomy: `core-interface` (types) +
  `core-browser` / `core-node` / `core-axios` (transports). Good pattern.
- Platform plugins on GitHub: only **Magento** and **OpenCart** are
  open-source. Everything else (Shopify, WooCommerce, Salesforce, etc.)
  is private code maintained behind their docs site.
- Server SDKs: only **Node** is alive. The Ruby SDK hasn't seen a
  commit since 2021. **No** Python, PHP, .NET, or Go SDK exists.
- WordPress: a single unified plugin, *UK Address Postcode Validation*,
  with **~700 active installs** — much smaller than the per-form-builder
  install bases (CF7 5M+, WPForms 6M+).
- AI: they ship `llms.txt` and `.md`-suffixed doc URLs. Their `skills`
  GitHub repo (registered Apr 2026) is **empty** — the name is squatted
  but no Skill has shipped.
- They run **postcodes.io** (1.4k GH stars) as an open postcode/geo API
  that doubles as a brand halo.

**Other UK incumbents** worth a glance, all weaker on developer surface
than IP:

- **Loqate / PCA Predict** — enterprise-priced, JS finder is closed
  source, the ecosystem is built around their `loqate.js` tag and
  Salesforce-/Dynamics-first plugins.
- **getAddress.io** — cheaper than IP, ships JS + Node SDK + a few WP
  plugins. Smaller GitHub org, no AI surface to speak of.
- **Royal Mail's own API** — direct PAF licensee but raw HTTP only, no
  drop-in, no plugins.
- **Fetchify (formerly CraftyClicks)** — JS finder + WP plugin + Shopify
  app. Lightweight integration footprint.

The honest read: **none of the incumbents have built a 2026-shaped
integration layer.** They have accumulated plugins over a decade. The
AI/agent surface, the typed-everywhere SDK matrix, the
generated-from-OpenAPI client family — those are all open ground.

### 1.3 Posture: aggressive on foundations, ruthless on platforms

- Build the foundation and AI surface to a higher quality bar than any
  incumbent.
- For platforms, only ship into stores where the **listing itself**
  generates traffic (WP.org plugin directory, Shopify App Store, Magento
  Marketplace, npm, PyPI). A plugin nobody installs is pure maintenance
  burden.
- Don't replicate the long-tail museum (ShopWired, OpenCart, Sage,
  Quickbooks, Really Simple Systems) until a customer asks for it.

---

## 2. The taxonomy

Six top-level categories. Every integration belongs to exactly one.

| Category | Folder | What lives here |
|---|---|---|
| **JS / web platform** | `packages/` (monorepo) | Drop-in bundle, npm core, React, MCP server, CLI, scaffolder, OpenAPI tooling. Everything that's TS/JS and shares types from a single OpenAPI source. |
| **Server SDKs** | `sdks/` (one repo per language) | Python, PHP, .NET, Go, Ruby. Each generated/handwritten against the OpenAPI spec, each published to its native registry. |
| **eCommerce** | `platforms/ecomm/` | Shopify, Magento/Adobe Commerce, BigCommerce, Shopware. Apps and extensions that live in a platform-specific marketplace. |
| **WordPress** | `platforms/wordpress/` | One unified plugin covering WooCommerce + the major form builders (Gravity, CF7, WPForms, Fluent, Ninja, Forminator, Elementor Forms). One SVN listing. |
| **No-code / page builders** | `platforms/nocode/` | Webflow, Wix, Squarespace, Framer. Each is an app on the host platform's app store. |
| **CRM / business apps** | `platforms/crm/` | HubSpot, Salesforce AppExchange, Dynamics 365, Pipedrive, Zoho. Long-cycle credibility plays — defer per ROADMAP. |
| **Workflow & dev tooling** | `platforms/workflow/` + `platforms/browser-extension/` | Zapier, Make, n8n, Chrome/Firefox extension. |
| **AI / agentic** | `ai/` | `llms.txt`, `.md` doc mirror generation, Claude Skill, GPT Action, Cursor rules, canonical prompt examples. |
| **Examples** | `examples/` | Framework-by-framework demos. Indexed by AI tools, useful for SEO. |

This taxonomy is fixed. Adding a new category requires updating this
spec.

---

## 3. Folder & repo structure

### 3.1 One umbrella repo

`postio-uk/postio-integrations` is a **single git repo** containing
everything in this directory tree:

- `packages/` — pnpm workspace; each subdirectory is an independently-
  publishable npm package (`@postio/api-types`, `@postio/core`,
  `@postio/react`, `@postio/address-finder`, `@postio/mcp`, …).
- `cdn-worker/` — Cloudflare Worker for `cdn.postio.co.uk` (its own
  deploy lifecycle but shares the repo).
- `examples/` — framework demos.
- `.github/workflows/` — release pipelines per artefact.

**Why one repo, not many:** SPEC v0 (pre-build) split each piece into
its own repo. Once we started shipping, the cost-benefit shifted
clearly toward one repo: one source of truth for cross-cutting docs,
one CI surface, one set of secrets, one PR review queue, one place to
land cross-package refactors. Splitting later via `git subtree split`
is cheap if a sub-piece outgrows the monorepo; merging back is hard.

**Out of scope for this repo (lives elsewhere):**

- Server SDKs in non-JS languages (`postio-uk/postio-python`,
  `postio-uk/postio-php`, `postio-uk/postio-dotnet`, etc.). Each has a
  toolchain incompatible with this repo's pnpm/Node setup.
- Per-platform plugin code (`postio-uk/postio-wordpress`,
  `postio-uk/postio-shopify`, etc.) — each has platform-specific tooling
  (WP.org SVN, Shopify CLI workspace layout, Magento module structure).
- The OpenAPI spec source itself — that lives in
  [`postio-uk/postio-api`](https://github.com/postio-uk/postio-api) and
  is published as `@postio/openapi`. This repo *consumes* that package.

Cross-cutting concerns (typing, error model, response envelopes) are
enforced by the OpenAPI spec downstream, not by a shared toolchain
across all the satellite repos.

### 3.2 Naming

- npm scope: **`@postio`** ✓ owned. (Earlier draft assumed it was
  taken — turned out to be Olly's own org from a prior signup.)
- PyPI: **`postio`** ✓ owned (top-level, plus future **`postio-*`** sub-packages).
- Packagist: **`postio`** vendor ✓ owned (e.g. **`postio/postio`**, **`postio/<feature>`**).
- NuGet: **`Postio`** prefix ✓ owned (e.g. **`Postio.Sdk`**, **`Postio.<Feature>`**).
- **GitHub org: `postio-uk`** ✓ owned. Note this differs from the npm
  scope (`@postio` was already on GH or is reserved). All repos live
  at `github.com/postio-uk/<repo>`.
- Go module path: **`github.com/postio-uk/postio-go`**.
- Ruby: **`postio`** gem (claim when Ruby SDK ships).
- WordPress plugin slug: **`postio-address-validation`** (reserve via
  WP.org plugin submission when the plugin zip is ready — not a
  pre-claim flow).
- Shopify app handle: **`postio`** (display: "Postio – UK Address &
  Contact Validation").
- MCP server npm: **`@postio/mcp`** (also installable as
  `npx -y @postio/mcp`).
- CLI: **`@postio/cli`** (binary name `postio`).
- Scaffolder: **`@postio/create`** (invoked as
  `npx create-postio-app`).
- Drop-in CDN bundle: **`@postio/address-finder-bundled`** (npm) +
  **`https://cdn.postio.co.uk/v1/address-finder.js`** (own CDN, default).

Repo names mirror npm names where possible: `postio-address-finder`,
`postio-mcp`, `postio-python`, `postio-php`, `postio-dotnet`, etc.

### 3.3 Per-repo conventions

Every repo (regardless of language) ships:

1. `README.md` — install + 30-second example, then link to docs.
2. `CLAUDE.md` — code-level conventions, build commands, gotchas.
   Auto-loaded when an agent opens the repo.
3. `LICENSE` — MIT for everything OSS. Closed-source platform apps
   (Shopify private, etc.) ship without `LICENSE` in their repo.
4. `CHANGELOG.md` — Changesets / language-native changelog.
5. `.github/workflows/release.yml` — automated publish on tag.

---

## 4. The foundation tier (what every integration depends on)

These are **not** integrations themselves. They are the substrate.
Phase 0 in the roadmap. Nothing downstream is allowed to start until
the relevant foundation piece is locked.

### 4.1 OpenAPI spec — the single source of truth

**✓ Shipped 2026-04-30.** Live URLs:

- <https://postio.co.uk/openapi.json>
- <https://postio.co.uk/openapi.yaml>
- `npm i @postio/openapi` → <https://www.npmjs.com/package/@postio/openapi>

Drift is structurally impossible — the spec is generated from the same
Zod schemas the runtime uses to validate.

**How it works:**

- **Source of truth**: Zod schemas in
  `postio-api/api/lib/openapiSchemas.js` plus per-route
  `describeRoute(...)` calls (`hono-openapi` v1.3 + `zod-openapi` v4.2).
  Static `info` / `tags` / `servers` block in
  `postio-api/api/lib/openApiDocumentation.js`. Spec construction in
  `postio-api/api/lib/buildOpenApiSpec.js` — used both at runtime by
  the `/v1/admin/openapi.json` handler and at release time by the
  build script.
- **Admin route** (`api.postio.co.uk/v1/admin/openapi.json`) is unchanged
  — still admin-key-gated, still consumed server-side by
  `postio-www/docs` (Scalar render).
- **Public route** in `postio-www`: `app/(marketing)/openapi.json/route.js`
  + `app/(marketing)/openapi.yaml/route.js` fetch the admin route
  server-side using `lib/postio-api/openapi.js`, cache via Next data
  cache (1h revalidate, tag `openapi-spec` ready for on-demand
  revalidation), serve at `postio.co.uk/openapi.{json,yaml}` with
  CORS `*`.
- **npm package** built by `postio-api/api/scripts/build-openapi.mjs`,
  imports the same `app` + `buildOpenApiSpec()` the runtime uses.
  Output goes to `postio-api/packages/openapi/` (gitignored). Workflow
  `.github/workflows/release.yml` triggers on push to `master`,
  push of `openapi-v*` tag, or manual dispatch — runs `npm ci`,
  `npm run build:openapi`, skips publish if the version is already on
  npm (idempotent), otherwise `npm publish --access public`. Auth via
  `NPM_TOKEN` GH Actions secret (granular access token scoped to
  `@postio`).

**Provenance attestations are off** until `postio-uk/postio-api` goes
public (npm rejects provenance bundles from private repos with HTTP
422). The workflow keeps `id-token: write` permission set so re-enabling
is a one-line change.

**Consumers and where they fetch from:**

| Consumer | Auth | Source |
|---|---|---|
| `postio-www/docs` (Scalar render) | server-side admin key | `api.postio.co.uk/v1/admin/openapi.json` (unchanged) |
| Coding agents (Cursor/Claude/Copilot) | anonymous | `postio.co.uk/openapi.json` |
| LLM crawlers (OpenAI/Anthropic/Google) | anonymous | `postio.co.uk/openapi.json` |
| Customer codegen / Postman import | anonymous | `postio.co.uk/openapi.json` |
| Our codegen (api-types, SDKs) | CI | `npm i @postio/openapi` |
| Third-party SDK builders | CI | `npm i @postio/openapi` |

No public surface on `api.postio.co.uk`. No `openapi.postio.co.uk`
subdomain. No R2 bucket. The marketing host is the canonical public
URL; npm is the canonical package.

**Codegen lives in `postio-integrations/packages/`** (this repo). No
spec authoring here — packages depend on `@postio/openapi` from npm
and run their own generators:

- `packages/api-types/` → `@postio/api-types` (TS types via
  `openapi-typescript`). ✓ shipped.
- Future: `packages/postman-collection/` → `@postio/postman-collection`
  (via `openapi-to-postmanv2`).
- Future: skeleton inputs for each server-SDK repo (consumed by the
  SDK repos' own codegen pipelines, not committed here).

**Versioning**: spec version is always equal to
`OPENAPI_DOCUMENTATION.info.version` in
`postio-api/api/lib/openApiDocumentation.js` (currently 1.0.2).
Bumping that single field and merging to master cascades to
`@postio/openapi` (auto-publish) → `@postio/api-types` on the next
master push to this repo. Major version bump only on breaking change.

**Open follow-up**: wire `revalidateTag('openapi-spec')` from
`postio-api`'s deploy step so a prod deploy invalidates the
`postio-www` data-cache copy immediately (today it lags up to 1h).

### 4.2 Drop-in JS — the headline product

- Repo: `postio-integrations/packages/address-finder/` (source) +
  `postio-integrations/packages/address-finder-bundled/` (CDN bundle
  build).
- Public API. Names chosen for brevity — `output` (not IP's
  `outputFields`), `input` (not `inputField`), `onSelect` (not
  `onAddressSelected`). The bound field keys are the API field names
  themselves (locked by the API contract):
  ```html
  <script src="https://cdn.postio.co.uk/v1/address-finder.js"></script>
  <script>
    Postio.AddressFinder.setup({
      apiKey: "pk_live_…",
      input: "#address-search",
      output: {
        address_line_1: "#line_1",
        post_town:      "#town",
        postcode:       "#postcode",
        county:         "#county",
      },
      onSelect: (address) => { /* full Address record */ },
    });
  ```
- Bundle outputs (built by `tsup`):
  - `dist/address-finder.js` — IIFE, ES2020 target. Drops into
    `<script>` tags. Sets `window.Postio.AddressFinder.setup`.
  - `dist/address-finder.esm.js` — ESM, ES2020 target. For
    `<script type="module">` and bundlers.
  - Both ship a sourcemap for production debuggability.
- Size budget: gzipped IIFE **stays under 8 KB**, hard cap 12 KB.
  Currently shipping at **~4.2 KB gzipped**.
- **Theming**: minimal sane defaults so the widget is usable in bare
  HTML, with everything visual exposed as CSS custom properties on
  `--postio-af-*`. Inherits font, color, font-size from the parent
  page. `bare: true` in `setup()` ships only structural CSS — for
  consumers who want full visual control. Decision rationale: pure
  inherit (no shipped CSS) looks broken in plain HTML, which is
  exactly the audience for the CDN drop-in. See package README for
  the full var list.
- **A11y**: WAI-ARIA 1.2 combobox pattern (`role="combobox"`,
  `aria-expanded`, `aria-controls`, `aria-activedescendant`), full
  keyboard nav (↑↓ Home End Enter Esc Tab), mouse hover follows
  keyboard highlight.
- **Telemetry**: optional `onSearch`, `onSelect`, `onError`,
  `onReady` callbacks. No silent network calls beyond the API itself
  in v0.1 — the planned `/_t` adoption ping is deferred to a later
  release once we land the Workers-side endpoint (SPEC §10 #5).

### 4.3 CDN strategy — own first, jsDelivr fallback

**Decision: ship to BOTH, default install snippet uses `cdn.postio.co.uk`.**

- **Own CDN: `cdn.postio.co.uk`**. Backed by Cloudflare Workers + R2, with
  a 1y immutable cache for versioned URLs (`/v1/`, `/v1.2.3/`) and a
  short-cache mutable URL (`/latest/`). Provides:
  - Branding (URL contains "postio").
  - Telemetry (load count, geo, version split).
  - Instant cache invalidation under our control.
  - One less third-party dependency in the install snippet.
  - Identical deploy lifecycle as the rest of our CF estate.
- **jsDelivr mirror**: same artefact also published to npm as
  `@postio/address-finder-bundled` and therefore auto-mirrored at
  `https://cdn.jsdelivr.net/npm/@postio/address-finder-bundled@1`.
  Documented as the alternative for devs who prefer pinning to npm versions.
- **`cdnjs.com`** (Cloudflare's curated CDN): not pursued. cdnjs is
  whitelist-only, slow to onboard, and doesn't add reach beyond
  jsDelivr/unpkg. Skip.
- **`unpkg`**: also auto-mirrors npm. Documented as a third option, no
  active push.

Versioning rule for `cdn.postio.co.uk`:

- `/v1/address-finder.js` → tracks the latest **v1.x.x** release. Default
  install snippet. Cache-Control 24h.
- `/v1.2.3/address-finder.js` → exact version pin. `Cache-Control:
  immutable, max-age=31536000`. Recommended for production.
- `/latest/address-finder.js` → latest major (current = v1). Discouraged
  in docs but reserved.
- No major version is ever rewritten. v2 ships at `/v2/...` and the v1
  URL keeps working forever.

### 4.4 npm core — `@postio/core`

- Runtime-agnostic Postio client. Works in Node 20+, modern browsers,
  Cloudflare Workers, Deno, Bun.
- Methods are 1:1 with API endpoints (`address.search`,
  `address.postcode`, `address.udprn`, `email.validate`, `phone.validate`,
  plus admin namespace gated by typing).
- Returns the API envelope unchanged: `{ success, results, meta:{ requestId,
  countResults, performance } }`. Don't smuggle convenience layers in
  here — that's `@postio/react`'s job.
- Companion `@postio/api-types` package contains only types
  (no runtime code), generated from OpenAPI. `@postio/core` depends on it.

### 4.5 React package — `@postio/react`

- Hooks: `useAddressSearch`, `usePostcode`, `useUdprn`,
  `useEmailValidation`, `usePhoneValidation`, `useConnect`. Built on
  TanStack Query (peer dep) so users get caching + dedup + AbortSignal
  wiring for free. Each hook auto-disables when its input is
  empty/null, with `enabled` override.
- `<PostioProvider apiKey baseUrl>` holds the client. Auto-detects an
  existing `QueryClientProvider` higher in the tree and uses it;
  mounts a fresh one if none is found, so the hooks Just Work for
  first-time users.
- `<AddressFinder>` — wraps the source `@postio/address-finder` package
  in a React component. Renders a real `<input>` (forwards every
  standard input prop), mounts the finder on first render, tears down
  on unmount. Recommended path is `onSelect` (capture the full address
  in React state); the `output` map is supported as an escape hatch
  for non-React fields.
- Every public file ships `"use client"` at the top. One-shot lookups
  on the server should use `@postio/core` directly.

### 4.6 Server SDKs — Node

- `@postio/node`. Wraps `@postio/core` with Node-specific niceties
  (timeouts, retries with jitter, request-scoped logger). Uses native
  `fetch`. Targets Node 20+.
- This is the **only Node-flavoured SDK**. Workers/Bun/Deno users
  consume `@postio/core` directly.

### 4.7 Docs surface — `.md` mirror, `llms.txt`, `claude.md`, `cursor.md`

- Every page under `https://postio.co.uk/docs/...` has a paired
  `.../<slug>.md` URL serving the raw markdown source. Implemented by
  `postio-www`. (IP does this; it's table stakes for AI indexing.)
- `https://postio.co.uk/llms.txt` and
  `https://postio.co.uk/llms-full.txt` per the llmstxt.org spec.
  Generated from `postio-www` content + `packages/openapi/`.
- `https://postio.co.uk/claude.md` and
  `https://postio.co.uk/cursor.md` (and `/.cursorrules`) — opinionated
  guidance pages targeting agentic coding tools. **IP does not have
  these.** First-mover advantage.
- Authoring rule: the `.md` mirror is generated, not hand-edited. The
  source of truth for prose is in `postio-www` MDX; for endpoint
  reference it's `packages/openapi/`.

### 4.8 Examples gallery — `examples/`

Fifteen-ish reference implementations, one per starter framework
people actually use:

- `examples/plain-html/` — copy-paste hello world.
- `examples/nextjs-app-router/` — SSR/RSC + client AddressFinder.
- `examples/nextjs-pages/` — pages router, for older codebases.
- `examples/react-vite/`, `examples/react-cra/` (legacy).
- `examples/vue-3/`, `examples/nuxt/`.
- `examples/svelte-kit/`, `examples/astro/`, `examples/remix/`.
- `examples/angular/`.
- `examples/cloudflare-workers-server/`,
  `examples/aws-lambda-server/` — server-side validation patterns.
- `examples/python-fastapi/`, `examples/django/` — once Python SDK lands.
- `examples/laravel/`, `examples/wordpress-theme-snippet/` — once PHP
  SDK lands.

Each example has a one-line `npx degit` install command, a screenshot,
and a `<3 minute` time-to-running guarantee.

---

## 5. AI surface — the 2026 differentiator

This is the area where the incumbents are weakest and where the build
order is independent of any platform plugin.

### 5.1 What we ship

| Asset | Purpose | Path |
|---|---|---|
| `llms.txt` + `llms-full.txt` | Machine-readable site map per llmstxt.org | published by `postio-www`, source in `ai/llms/` |
| `.md` doc mirror | LLMs/agents fetch raw markdown of every doc page | generated by `postio-www` |
| `claude.md`, `cursor.md`, `.cursorrules` | Opinionated guidance for coding agents (when to suggest Postio, install snippets, error model) | `ai/agent-guides/` |
| `@postio/mcp` | MCP server. `npx -y @postio/mcp` configures any MCP-aware host (Claude Desktop, Code, Cursor, Windsurf, Zed) to call Postio. | `packages/mcp/` ✓ shipped |
| Claude Skill bundle | Anthropic Claude Skill — `SKILL.md` with frontmatter + install/recommendation guidance. Installable via the Skills marketplace and `claude skill add postio`. | `ai/claude-skill/` ✓ shipped |
| GPT Action manifest | OpenAI Custom GPT Action — paste `postio.co.uk/openapi.json` into a GPT's Actions config. Legacy `ai-plugin.json` served at `postio.co.uk/.well-known/ai-plugin.json` for hosts that still crawl it. | `ai/gpt-action/` ✓ shipped |
| Canonical prompt examples | Lines we want LLMs to paraphrase when asked about UK validation. | `ai/prompts/` ✓ shipped |
| Directory listings | Submission checklist + canonical text for community MCP / AI directories (awesome-mcp-servers, mcp.so, glama.ai, Smithery, Cursor install URL). | `ai/listings.md` ✓ ready to file |
| `@postio/create` (`create-postio-app`) | `npx create-postio-app` scaffolder. Discoverable to LLMs (they love `create-*` packages). | `packages/create-app/` |

### 5.2 MCP server design

- Tools exposed: `postio_address_search`, `postio_postcode_lookup`,
  `postio_udprn_lookup`, `postio_email_validate`, `postio_phone_validate`.
- Reads API key from env (`POSTIO_API_KEY`) or MCP host config.
- Fully typed (uses `@postio/api-types`).
- Ships with a `postio-mcp.json` snippet for Claude Desktop /
  `~/.cursor/mcp.json` / etc. — paste-and-go.
- One-line install: `claude mcp add postio -- npx -y @postio/mcp`.

### 5.3 Why this matters

- IP has `llms.txt` but their `skills` repo is empty and they have
  no MCP server, no GPT Action, no `claude.md`.
- The 2026 buyer journey for a developer building a new app increasingly
  starts in Cursor/Claude/Copilot/Windsurf. Being suggested by the
  agent is bigger than being on page 1 of Google.
- This whole tier is independent of platform plugins, so it can ship
  in parallel with Phase 1.

---

## 6. WordPress strategy — one plugin, not many

**Decision: ship a single `postio-address-validation` plugin.**
**Status (2026-05-02): v0.1 shipped to `postio-uk/postio-wordpress`
on GitHub.** All eight detectors (WooCommerce block + classic, Gravity,
CF7, WPForms, Fluent, Ninja, Forminator, Elementor Pro) wired, plus
the Gutenberg block, custom-mappings settings UI, and weekly telemetry
ping to `cdn.postio.co.uk/_wp`. CF7 / Ninja / Elementor opt in by
class convention (`postio-line-1` etc., plus optional `postio-search`
for a dedicated lookup field separate from line 1). Olly is in user
manual UX testing on a `localhost:8888` wp-env install — circle back
based on his feedback before WP.org SVN submission.


- Detects which form builder / commerce plugin is active at runtime
  (WooCommerce, Gravity, CF7, WPForms, Fluent Forms, Ninja Forms,
  Forminator, Elementor Forms). Adapts integration per detected plugin.
- One SVN listing on WP.org. One support inbox. One release lifecycle.
- Block editor (Gutenberg) support: a `<!-- wp:postio/address-finder /-->`
  block usable in any block-based form.
- **Plugin is fully free.** No pro tier, no upsell. Revenue comes
  from API credits on the user's Postio account; the plugin's only
  config is the API key. (See §10.10.)

Rationale:

- IP ships exactly one WP plugin (~700 installs). Per-builder plugins
  multiply maintenance N× for very marginal directory exposure.
- Modern form builders all expose hooks/filters that allow third-party
  field augmentation without tight coupling. Detection at boot is cheap.
- One plugin gets one set of WP.org reviews and ranking signals; per-builder
  plugins fragment the reputation signal.

We **may** ship a second tiny companion plugin (`postio-form`) — a
standalone Postio-branded address form for users with no form builder.
Only if it stays under 200 LOC. Not in Phase 1.

---

## 7. eCommerce strategy

| Platform | UK relevance | Build vehicle | Listing surface |
|---|---|---|---|
| Shopify | High (top-5 Shopify market) | Public app, Shopify Remix template | Shopify App Store |
| WooCommerce | Massive (43% of WP sites) | Folded into the unified WP plugin | WP.org |
| Magento / Adobe Commerce | UK is one of Magento's strongest markets globally | PHP module via Composer + Magento Marketplace | Magento Marketplace |
| BigCommerce | Modest UK | Public app | BigCommerce App Marketplace |
| Shopware | Growing UK B2B | Plugin via Shopware Store | Shopware Store |

Skip indefinitely: ShopWired, OpenCart, PrestaShop, Ecwid, WiX Stores
(covered by the Wix app in `nocode/`).

Per-platform notes:

- **Shopify**: Theme App Extension for the storefront block (so merchants
  add Postio to checkout/customer pages without touching theme code) +
  embedded admin app for setup. Use Shopify's Remix app template.
- **Magento**: extension auto-loads against Magento 2.4+. Composer
  package `postio/magento`. Marketplace listing requires technical +
  marketing review (~weeks turnaround) — start the package early so
  the queue runs in parallel with code.
- **WooCommerce inside the WP plugin**: detection branch in
  `postio-address-validation` adds field mapping for WooCommerce checkout
  + My Account address forms. Block-checkout (Cart/Checkout block) is
  the priority over classic-shortcode checkout.

---

## 8. CRM strategy — defer

Building a Salesforce AppExchange listing or a Dynamics 365 connector
is a 6-month, lawyer-touching project per platform. Defer until at
least one of:

- Three or more inbound enterprise customer requests for the platform.
- A revenue-justified prospect that won't proceed without the connector.
- A partner-driven build (Salesforce SI offering to do most of the work).

When we do build, order is HubSpot (lowest barrier, decent UK SMB
penetration) → Pipedrive (UK-strong, IP doesn't have it) →
Dynamics 365 → Salesforce → Zoho.

Skip indefinitely: Sage, Quickbooks, Odoo, Really Simple Systems —
these are accounting/ops tools, not address-capture surfaces.

---

## 9. Cross-cutting conventions

### 9.1 API-key model

- Every integration accepts a Postio API key via the platform-native
  config surface (Shopify app settings, WP options page, env var,
  MCP server config, etc.).
- Public-key (`pk_*`) only for browser/drop-in contexts.
- Server SDKs and CLIs accept either — they don't enforce a prefix
  policy beyond "the key is whatever Postio issued you."
- Never log the full key. Mask middle, show first 7 + last 4.

### 9.2 Error model

- Every integration surfaces the API's error envelope unchanged at the
  edges. Platform-native error UIs (WP admin notice, Shopify toast,
  Hono `c.json(...)`) wrap it consistently:
  - `error: <human string>`
  - `details: <free-form, optional>`
  - `requestId: <uuid>` (always — the support handle)
- No integration silently swallows errors.

### 9.3 Telemetry

- **WordPress plugin** (shipped 2026-05-02): weekly
  `POST cdn.postio.co.uk/_wp` from each install with plugin/WP/PHP
  versions, site language, and the slugs of any active form-builder
  plugins from a curated whitelist. Worker writes one CF Analytics
  Engine data point per active builder so install share is
  SQL-aggregatable. Plugin opt-out via Settings → Postio. Custom
  `User-Agent: Postio-WP/<ver>` so no site URL leaks.
- **Drop-in JS / SDKs** (planned): anonymous load events (version,
  host platform, bundle variant) to `cdn.postio.co.uk/_t`. Opt-out
  via `Postio.AddressFinder.setup({ telemetry: false })` in the
  drop-in; SDK env var `POSTIO_TELEMETRY=0`. Drop-in v0.1 ships
  without the `/_t` ping; revisit before drop-in GA.
- We never log search inputs, results, or PII. Only assets-level
  metadata.

### 9.4 Versioning

- All artefacts SemVer.
- Breaking changes only on majors; majors require a written deprecation
  notice in `postio-www` /docs/changelog and a 6-month overlap window
  on the CDN.
- Generated artefacts (api-types, server-SDK skeletons) inherit the
  spec major version.

### 9.5 Licensing

- Default: MIT.
- WordPress plugin: GPLv2+ (WP.org policy).
- Closed-source platform apps (Shopify private app code) ship without
  a `LICENSE` file in their repo and the repo stays private.

---

## 10. Open questions / TODO

Live ones only — resolved questions have been folded into the relevant
section bodies above and trimmed from this list.

1. ~~**R2 buckets + bind to `cdn.postio.co.uk` Worker**.~~ ✓ Live.
   Buckets `postio-cdn-bundles` and `postio-cdn-bundles-stage` exist;
   Worker reads from `env.BUNDLES`; `deploy-cdn-bundles.yml` uploads
   `address-finder.{js,esm.js}` to `/v{MAJOR}/` and `/v{VERSION}/` on
   stage + master pushes.
2. **`docs.postio.co.uk` vs `postio.co.uk/docs`**: confirm doc
   subdomain for the planned `.md` mirror. The OpenAPI spec already
   serves at `postio.co.uk/openapi.json` regardless of which path the
   rendered docs UI lives at.
3. ~~**Postman collection automation**.~~ ✓ Shipped as
   [`@postio/postman-collection@1.0.2`](https://www.npmjs.com/package/@postio/postman-collection).
4. ~~**MCP server vs Claude Skill vs both**.~~ ✓ Both shipped. MCP at
   [`@postio/mcp@0.1.0`](https://www.npmjs.com/package/@postio/mcp) —
   6 tools, stdio transport, `POSTIO_API_KEY` env. Claude Skill bundle
   in `ai/claude-skill/` — pairs with the MCP server (Skill provides
   intent detection + install guidance, MCP provides callable tools).
   GPT Action manifest also shipped in `ai/gpt-action/` + served at
   `postio.co.uk/.well-known/ai-plugin.json`. All listed in
   `ai/listings.md` for community directory submission.
5. **Telemetry transport** — partially resolved. WordPress plugin
   shipped to `cdn.postio.co.uk/_wp` (Analytics Engine binding,
   2026-05-02). Drop-in JS / SDK `/_t` endpoint still pending; same
   pattern when it lands.
6. **Make `postio-uk/postio-api` public** to re-enable
   `npm publish --provenance`. Worth doing if no sensitive code is in
   there. Audit first.

---

## 11. What this spec deliberately does not cover

- Pricing for the Postio API itself (lives in `postio-www` /
  `postio-api`).
- The data ingestion pipeline (`postio-pipeline`, `postio-paf-bulk`).
- Performance benchmarking (`postio-perf`).
- Marketing/brand guidelines (lives in `postio-www`).
- Internal admin tooling — covered by `postio-www/admin/*`.

If a question doesn't touch how a third party installs or calls Postio,
it doesn't belong here.
