# `@postio/*` packages

pnpm workspace for every TypeScript / JavaScript package Postio
publishes. One repo, many packages, single dependency graph.

See [`../SPEC.md`](../SPEC.md) §3.1 (mono/multi-repo split) and §4 for
the contracts each package must satisfy.

## Planned packages

| Package | Status | Purpose |
|---|---|---|
| `@postio/openapi` | planned | OpenAPI spec snapshot (JSON + YAML), published from `postio-api` CI on tag. The single source of truth for everything else here. |
| `@postio/api-types` | planned | TypeScript types generated from `@postio/openapi` via `openapi-typescript`. |
| `@postio/core` | planned | Runtime-agnostic typed client (Workers / Node / Bun / browser). |
| `@postio/browser` | planned | Browser-flavoured client (built on `core`). |
| `@postio/node` | planned | Node-flavoured server SDK (built on `core`). |
| `@postio/react` | planned | Hooks + components. |
| `@postio/address-finder` | planned | Drop-in autocomplete UI source. |
| `@postio/address-finder-bundled` | planned | CDN bundle build of `address-finder`. |
| `@postio/mcp` | planned | MCP server for AI agents. |
| `@postio/cli` | planned | `npx postio` CLI. |
| `@postio/create` | planned | `npx create-postio-app` scaffolder. |

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

(no packages exist yet — workspace is freshly scaffolded)
