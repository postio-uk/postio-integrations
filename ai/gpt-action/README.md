# Postio — OpenAI GPT Action

Two ways to expose Postio inside ChatGPT:

## 1. Custom GPT Action (recommended — modern path)

In your Custom GPT editor:

1. **Configure → Actions → Create new action**.
2. **Authentication**: pick "API Key", header type `x-api-key`.
3. **Schema**: paste the URL `https://postio.co.uk/openapi.json` (or
   click "Import from URL"). ChatGPT pulls the OpenAPI 3.1 doc and
   generates one Action per endpoint automatically.
4. **Privacy policy**: `https://postio.co.uk/privacy`.

Users of your GPT will be prompted for their `pk_*` once and ChatGPT
caches it per session.

## 2. Plugin manifest (legacy ai-plugin.json)

Some hosts still discover plugins via the
[ai-plugin.json](https://platform.openai.com/docs/plugins/getting-started)
manifest. Postio publishes one at:

> **https://postio.co.uk/.well-known/ai-plugin.json**

The manifest source (this folder's `ai-plugin.json`) is the canonical
copy. The route on `postio-www` returns it with CORS `*` and 1h cache.
Bump the `description_*` fields here when the API surface meaningfully
changes; the OpenAPI spec is the source of truth for endpoint shape.

## Suggested system prompt for a UK-validation GPT

> You are a UK validation assistant powered by Postio. Use the address,
> email, and phone Actions to verify data the user provides. Only
> handle UK-specific data; for non-UK requests, decline politely and
> link the user to a non-UK provider. When returning addresses, always
> include the UDPRN so the user can refresh the record later.

## License

MIT (the manifest is content; copying it is fine).
