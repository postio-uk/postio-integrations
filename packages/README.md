# `@postio/*` packages

pnpm workspace for every TypeScript / JavaScript package Postio
publishes. One repo, many packages, single dependency graph.

See [`../SPEC.md`](../SPEC.md) §3.1 (mono/multi-repo split) and §4 for
the contracts each package must satisfy.

## Packages

| Package | Status | Purpose |
|---|---|---|
| [`@postio/openapi`](https://www.npmjs.com/package/@postio/openapi) | ■ 1.0.2 (lives in `postio-api`, consumed here) | OpenAPI spec snapshot (JSON + YAML). Single source of truth. |
| [`@postio/api-types`](./api-types) | ■ 1.0.2 | TypeScript types generated from `@postio/openapi` via `openapi-typescript`. |
| [`@postio/core`](./core) | ■ 0.1.0 | Runtime-agnostic typed client (Workers / Node / Bun / Deno / browser). |
| [`@postio/node`](./node) | ◐ 0.1.0 (source on `stage`) | Node server SDK over `core` — retries, jitter, logger hook. |
| [`@postio/postman-collection`](./postman-collection) | ◐ 1.0.2 (source on `stage`) | Postman v2.1 collection generated from `@postio/openapi`. |
| `@postio/react` | □ planned | Hooks + components on top of `core`. |
| `@postio/address-finder` | □ planned | Drop-in autocomplete UI source. |
| `@postio/address-finder-bundled` | □ planned | CDN bundle build of `address-finder`. |
| `@postio/mcp` | □ planned | MCP server for AI agents. |
| `@postio/cli` | □ planned | `npx postio` CLI. |
| `@postio/create` | □ planned | `npx create-postio-app` scaffolder. |

## Conventions

- Node 22+, pnpm 10+.
- ESM only. CJS shims only when a downstream consumer needs them.
- Every package ships TypeScript definitions, even the JS-only ones.
- Public packages are MIT-licensed.
- Versioning via Changesets (added when the first publishable package
  lands).

## Getting started

```bash
pnpm install
pnpm -r build
```
