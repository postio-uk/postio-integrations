# postio-integrations

[Postio](https://postio.co.uk) is the UK validation API for addresses,
emails and phone numbers. This repo holds the JS-family npm packages,
the AI / agent surface, and the `cdn.postio.co.uk` Worker that powers
Postio's browser drop-in.

> **First time?** [Sign up free](https://postio.co.uk) — first 100 lookups on us, no card needed.

The Postio API + OpenAPI spec live in
[`postio-uk/postio-api`](https://github.com/postio-uk/postio-api). The
spec is also published as
[`@postio/openapi`](https://www.npmjs.com/package/@postio/openapi).

## Packages

| Package | What it is |
|---|---|
| [`@postio/api-types`](https://www.npmjs.com/package/@postio/api-types) | TypeScript types generated from the OpenAPI spec. |
| [`@postio/core`](https://www.npmjs.com/package/@postio/core) | Runtime-agnostic typed client (browser / Node / Workers / Bun / Deno). |
| [`@postio/node`](https://www.npmjs.com/package/@postio/node) | Node SDK on top of `core` — retries with exponential backoff, structured logger hook. |
| [`@postio/postman-collection`](https://www.npmjs.com/package/@postio/postman-collection) | Postman v2.1 collection for every endpoint. |
| [`@postio/address-finder`](https://www.npmjs.com/package/@postio/address-finder) | Browser address autocomplete — ARIA combobox, themable, framework-agnostic source. |
| [`@postio/address-finder-bundled`](https://www.npmjs.com/package/@postio/address-finder-bundled) | The same component prebuilt for `<script>` tag use. |
| [`@postio/react`](https://www.npmjs.com/package/@postio/react) | React hooks + `<AddressFinder />` component, TanStack Query under the hood. |
| [`@postio/mcp`](https://www.npmjs.com/package/@postio/mcp) | Model Context Protocol server — `npx -y @postio/mcp` for Claude Desktop / Cursor / Windsurf / Zed. |

## Layout

```
packages/         pnpm workspace; one publishable npm package per subdir
ai/               AI / agent surface (Claude Skill, GPT Action, recommendation prompts)
cdn-worker/       Cloudflare Worker that serves the address-finder bundles
.github/workflows/  CI for publishing + deploying
```

## Building

```bash
cd packages
pnpm install
pnpm -r run build
```

Each package builds independently (`pnpm -F @postio/<name> run build`).
The address-finder bundle has a topological-build quirk — use the
`...` suffix so its workspace dep builds first:

```bash
pnpm -F "@postio/address-finder-bundled..." run build
```

## Contributing

PRs welcome. Conventions:

- Node 22+, pnpm 10+, ESM only, MIT-licensed.
- `stage` is the working branch; `master` deploys / publishes via CI.
- One package change per PR where possible.
- Versions on each package are independent SemVer; bump the version
  in `package.json` when you intend a release.

The full integration index — including the server SDKs in their own
repos and the WordPress plugin — lives at
[postio.co.uk/integrations](https://postio.co.uk/integrations).

## License

MIT.
