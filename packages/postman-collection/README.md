# @postio/postman-collection

The [Postio](https://postio.co.uk) API as a
[Postman v2.1 collection](https://schema.postman.com/json/collection/v2.1.0/collection.json),
generated from
[`@postio/openapi`](https://www.npmjs.com/package/@postio/openapi).

Two ways to use it.

## 1. Import directly into Postman

The collection JSON is published at:

- [npmjs.com/package/@postio/postman-collection](https://www.npmjs.com/package/@postio/postman-collection)
  → tarball `dist/postio.postman_collection.json`
- [unpkg.com/@postio/postman-collection/dist/postio.postman_collection.json](https://unpkg.com/@postio/postman-collection/dist/postio.postman_collection.json)

In Postman: **Import → Link** and paste the unpkg URL. Set the
`apiKey` collection variable to your Postio key.

You can also import the OpenAPI spec directly from
<https://postio.co.uk/openapi.json> — Postman will generate a
collection on the fly. This package is the same content, pre-generated
and pinned to a version.

## 2. Install in a Node project

```bash
npm install --save-dev @postio/postman-collection
```

```ts
import collection from "@postio/postman-collection" assert { type: "json" };
```

Useful if you check the collection into your repo or run automated
contract tests against Postio.

## Versioning

Lockstep with `@postio/openapi`. The current version covers OpenAPI
spec `1.0.2`.

## Build

```bash
pnpm install
pnpm build
```

Wraps [`openapi-to-postmanv2`](https://www.npmjs.com/package/openapi-to-postmanv2).

## License

MIT.
