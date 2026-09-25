# n8n-nodes-postio

An [n8n](https://n8n.io) community node for [Postio](https://postio.co.uk) — UK address lookup, postcode autocomplete, email validation and phone validation on official Royal Mail PAF data.

## Operations

| Resource | Operation | What it does |
|---|---|---|
| Address | Search | Typeahead: a partial address or postcode → suggestions, each with a UDPRN |
| Address | Get by UDPRN | One full Royal Mail PAF address from its UDPRN |
| Address | List by Postcode | Every delivery point on a UK postcode |
| Email | Validate | Syntax, MX, live SMTP probe, disposable/role flags, typo suggestion |
| Phone | Validate | E.164 normalisation, live carrier lookup, line type, reachability |

Address search is free; you pay only when a full address is returned. Email and phone are billed per lookup. Pricing from 1p per request, 100 free lookups on sign-up, no contracts — see [postio.co.uk/pricing](https://postio.co.uk/pricing).

## Install

In n8n: **Settings → Community Nodes → Install** and enter `n8n-nodes-postio`. Or on a self-hosted instance:

```
npm install n8n-nodes-postio
```

## Credentials

Create a **Postio API** credential with your API key (`pk_…`). Get one free at [postio.co.uk/signup](https://postio.co.uk/signup). The credential test calls `GET /v1/connect`.

## Compatibility

Tested against n8n 1.x. No runtime dependencies — every operation is a declarative HTTP request against `https://api.postio.co.uk/v1`, matching the public [OpenAPI spec](https://postio.co.uk/openapi.json).

## Resources

- [Postio API docs](https://postio.co.uk/docs)
- [n8n community nodes](https://docs.n8n.io/integrations/community-nodes/)

## Licence

MIT
