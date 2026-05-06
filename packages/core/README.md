# @postio/core

Runtime-agnostic typed client for [Postio](https://postio.co.uk) — the
UK validation API for addresses, emails and phone numbers.

> **First time?** [Sign up free](https://postio.co.uk) — first 100 lookups on us, no card needed.

Works in Node 20+, modern browsers, Cloudflare Workers, Deno, and Bun.
Uses the platform's native `fetch`. Returns the API envelope unchanged
so you can hand it straight to your own UI or storage layer.

## Install

```bash
npm install @postio/core
```

## Use

```ts
import { Postio } from "@postio/core";

const postio = new Postio({ apiKey: process.env.POSTIO_API_KEY! });

const search = await postio.address.search("57 wimpole");
// { success: true, results: [{ udprn, suggestion }, …], meta: { requestId, … } }

const full = await postio.address.udprn(search.results[0]!.udprn);
const byPostcode = await postio.address.postcode("W1G 8YW");

const email = await postio.email.validate("alice@example.com");
const phone = await postio.phone.validate("+447700900123");

// Free key/health probe — useful as an input-focus warm-up.
await postio.connect();
```

## Options

```ts
new Postio({
  apiKey: "pk_…",
  baseUrl: "https://api.postio.co.uk/v1", // default
  timeoutMs: 10_000,                       // default
  fetch: customFetch,                      // override (e.g. tests, proxy)
  headers: { "x-correlation-id": "…" },    // merged into every request
});
```

Per-request you can pass an `AbortSignal`:

```ts
const ctrl = new AbortController();
const p = postio.address.search("brid", { signal: ctrl.signal });
ctrl.abort(); // throws PostioError with code: "request_aborted"
```

## Errors

Anything non-2xx, network failure, abort, or parse error throws a
`PostioError`. The original API envelope is attached when the server
returned one.

```ts
import { Postio, PostioError } from "@postio/core";

try {
  await postio.address.udprn(99999999);
} catch (err) {
  if (err instanceof PostioError) {
    err.status;     // 404
    err.code;       // "udprn_not_found"
    err.requestId;  // server-side correlation id
    err.envelope;   // raw { success: false, error, results: [], meta }
  }
}
```

`PostioError.code` for transport-level failures: `request_timeout`,
`request_aborted`, `network_error`, `parse_error`,
`unexpected_content_type`.

## Types

Every method returns the envelope shape from the OpenAPI spec —
`{ success, results, meta }`. Re-exported from
[`@postio/api-types`](https://www.npmjs.com/package/@postio/api-types):

```ts
import type { Address, EmailResult, PhoneResult, AddressSearchResult } from "@postio/core";
```

## Build

```bash
pnpm install
pnpm build
```

## License

MIT.
