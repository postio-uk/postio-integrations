# cdn.postio.co.uk Worker

Cloudflare Worker that fronts an R2 bucket and serves Postio's drop-in
JavaScript bundles (`@postio/address-finder-bundled` and family) at
versioned + immutable URLs.

This is one of the Phase 0 foundation pieces in
[`../SPEC.md`](../SPEC.md) §4.3 / §10.4.

## URL conventions

```
https://cdn.postio.co.uk/v1/<file>          ← latest 1.x.x; cache-control 5min/1h SWR 24h
https://cdn.postio.co.uk/v1.2.3/<file>      ← exact pin; cache-control 1y immutable
https://cdn.postio.co.uk/latest/<file>      ← discouraged; same cache as /v1/
```

`<file>` resolves directly to an R2 object key (e.g. `v1/address-finder.js`
fetches `v1/address-finder.js` from the bucket). Anything else 404s.

CORS is `*` on every response — these bundles are deliberately public.

## Bringing it up

The Worker code is ready and works without R2 (returns a "coming soon"
HTML at `/` and `503 Service Unavailable` for versioned paths). To make
it live and serving bundles, do these steps in order:

### 1. DNS (already done for prod)

`cdn.postio.co.uk` is CNAMEd to `postio.co.uk`, orange-cloud. For
**stage**, add `stage-cdn.postio.co.uk` the same way (CNAME → `postio.co.uk`,
orange).

### 2. Create R2 buckets

```bash
# Prod
wrangler r2 bucket create postio-cdn-bundles

# Stage
wrangler r2 bucket create postio-cdn-bundles-stage
```

### 3. Uncomment the bindings in `wrangler.toml`

The `[[r2_buckets]]` and `routes` blocks are commented out. Uncomment
once buckets and DNS are in place.

### 4. Deploy stage

```bash
cd cdn-worker
npm install
npm run deploy:stage
```

Verify `https://stage-cdn.postio.co.uk/` returns the "coming soon" page.

### 5. Deploy prod

```bash
npm run deploy
```

`wrangler deploy` with no `--env` flag = prod, matching the postio-api
convention. The prod-deploy-guard hook will require explicit
confirmation on this command.

## Uploading bundles

Once the Worker is live, any `address-finder` build pipeline can
upload to R2:

```bash
wrangler r2 object put postio-cdn-bundles/v1/address-finder.js \
  --file ./dist/address-finder.umd.min.js \
  --content-type "application/javascript; charset=utf-8"

wrangler r2 object put postio-cdn-bundles/v1.0.0/address-finder.js \
  --file ./dist/address-finder.umd.min.js \
  --content-type "application/javascript; charset=utf-8"
```

The Worker reads the `content-type` header from R2 if set, but also
infers it from the URL extension as a fallback.

## Local dev

```bash
npm install
npm run dev
```

Hits `http://localhost:8787`. Without `env.BUNDLES` bound locally
you'll see the "coming soon" page at `/` and a 503 on versioned
paths — that's correct.

To test against a real R2 bucket locally:

```bash
wrangler dev --remote
```

## WordPress plugin telemetry sink (`POST /_wp`)

[`postio-uk/postio-wordpress`](https://github.com/postio-uk/postio-wordpress)
pings this endpoint weekly with:

```json
{
  "plugin_version": "0.1.0",
  "wp_version": "6.7.1",
  "php_version": "8.1.27",
  "site_lang": "en-GB",
  "active_builders": ["woocommerce", "wpforms-lite", "everest-forms"]
}
```

Each payload writes one Analytics Engine data point per active
builder (or one with `_none` if the array is empty), so SQL queries
can aggregate install share by builder slug:

```sql
SELECT blob5 AS builder, count() AS pings
FROM postio_wp_telemetry
WHERE timestamp > NOW() - INTERVAL '7' DAY
GROUP BY builder ORDER BY pings DESC;
```

Blob layout: `blob1=plugin_version, blob2=wp_version,
blob3=php_version, blob4=site_lang, blob5=builder_slug`. Index =
builder_slug.

The endpoint is POST-only (other methods 405). Returns `204` on
accept (including silently-filtered bad slugs), `400` on malformed
JSON or missing `plugin_version`, `413` on bodies > 4KB. Never
echoes a body.

The plugin sends with a custom `User-Agent: Postio-WP/<version>` —
no site URL ever reaches this Worker.

## Observability

`observability.enabled = true` is set in `wrangler.toml` — Workers
traces show in the CF dashboard automatically. Use `npm run tail` for
a live log feed.

## Why a Worker + R2 instead of jsDelivr only?

Per [SPEC §4.3](../SPEC.md#43-cdn-strategy--own-first-jsdelivr-fallback):

- Branded URL (`cdn.postio.co.uk` is what the install snippet shows).
- Telemetry (load count, geo, version split).
- Instant cache invalidation under our control.
- One less third-party in the install snippet.
- Same deploy lifecycle as the rest of the CF estate.

`@postio/address-finder-bundled` is **also** auto-mirrored on jsDelivr
via npm — documented as the alternative, not the default.
