# @postio/api-types

TypeScript types for the [Postio](https://postio.co.uk) API — UK
address, email, and phone validation.

Generated from [`@postio/openapi`](https://www.npmjs.com/package/@postio/openapi)
via [`openapi-typescript`](https://github.com/openapi-ts/openapi-typescript).

## Install

```bash
npm install --save-dev @postio/api-types
```

## Use

```ts
import type { paths, components, operations } from "@postio/api-types"

// The full request/response shape for an operation:
type SearchOp = operations["getV1AddressSearch"]
type SearchResponse = SearchOp["responses"]["200"]["content"]["application/json"]

// Or pull a schema directly:
type Address = components["schemas"]["Address"]
type ErrorEnvelope = components["schemas"]["ErrorEnvelope"]

// Path-level shapes (matches the OpenAPI document):
type AddressSearchPath = paths["/address/search"]
```

## Versioning

Lockstep with `@postio/openapi` and the underlying API spec. Bumping
the API spec version in `postio-uk/postio-api` cascades to a new
release of both packages.

## Build

```bash
pnpm install
pnpm build           # generates types from local @postio/openapi
pnpm build:fetch     # generates types from postio.co.uk/openapi.json
```

The generated `src/index.ts` and compiled `dist/index.d.ts` are both
gitignored. CI rebuilds them on every release.

## License

MIT.
