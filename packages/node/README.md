# @postio/node

Server-side SDK for [Postio](https://postio.co.uk) — the UK validation
API for addresses, emails and phone numbers. Wraps
[`@postio/core`](https://www.npmjs.com/package/@postio/core) with
retries (exp backoff + full jitter) and an optional structured logger.

> **First time?** [Sign up free](https://postio.co.uk) — first 100 lookups on us, no card needed.

If you're building in the browser, a Cloudflare Worker, Bun, or Deno —
use [`@postio/core`](https://www.npmjs.com/package/@postio/core) directly.
This package is the right pick when you're calling Postio from a
long-running Node server (Express, Fastify, Hono on Node, Next.js
server actions, queue workers, cron jobs).

Node 20+.

## Install

```bash
npm install @postio/node
```

## Use

```ts
import { Postio } from "@postio/node";

const postio = new Postio({ apiKey: process.env.POSTIO_API_KEY! });

const search = await postio.address.search("57 wimpole");
const full = await postio.address.udprn(search.results[0]!.udprn);
const email = await postio.email.validate("alice@postio.co.uk");
```

The surface — `connect`, `address.{search,postcode,udprn}`,
`email.validate`, `phone.validate` — is identical to `@postio/core`.

## Retries

On by default: **2 retries**, exponential backoff with full jitter,
on `408 / 409 / 429 / 500 / 502 / 503 / 504` and network errors
(DNS / TCP / TLS reset). 4xx error responses are NOT retried —
they're programming errors that won't get better. User-aborted
requests (via your own `AbortSignal`) are NOT retried.

Tune or disable:

```ts
new Postio({
  apiKey: "…",
  retry: { maxRetries: 5, baseDelayMs: 250, capDelayMs: 4000 },
});

new Postio({ apiKey: "…", retry: false }); // off
```

Default per-request timeout is **30 s** (vs. 10 s in core). Override
via `timeoutMs`. The timeout bounds total time across retries — if
a single attempt is slow, retries won't overrun the budget.

## Logging

Pass a single function. You'll get a structured event per attempt and
per retry decision — easy to forward to pino / winston / OpenTelemetry.

```ts
new Postio({
  apiKey: "…",
  logger: (e) => console.log(`[${e.level}] ${e.msg}`, e),
});
```

Event shape:

```ts
{
  level: "debug" | "info" | "warn" | "error",
  msg: "postio_request_ok" | "postio_request_failed"
     | "postio_request_retrying" | "postio_request_retrying_after_error"
     | "postio_request_aborted" | "postio_request_error",
  attempt: number,        // 0 = first try
  status?: number,
  durationMs?: number,
  delayMs?: number,       // backoff sleep before next attempt
  url?: string,
  error?: unknown,
}
```

## Errors

Same `PostioError` as `@postio/core`. Re-exported here so you don't
need to install both.

```ts
import { Postio, PostioError } from "@postio/node";

try {
  await postio.address.udprn(99999999);
} catch (err) {
  if (err instanceof PostioError) {
    err.status;      // 404
    err.code;        // "udprn_not_found"
    err.requestId;   // server-side correlation id
  }
}
```

## License

MIT.
