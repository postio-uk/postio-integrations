# @postio/postcode-lookup

UK postcode lookup and address autocomplete, on Royal Mail PAF data.

**This package is a named alias for [`@postio/node`](https://www.npmjs.com/package/@postio/node).**
Same code, same versions, same support — it exists because people search npm
for "postcode lookup" rather than for us. If you already use `@postio/node`
or `@postio/core`, you do not need this one.

```bash
npm i @postio/postcode-lookup
```

```ts
import { Postio } from "@postio/postcode-lookup";

const postio = new Postio({ apiKey: process.env.POSTIO_API_KEY! });

// Every delivery point at a postcode
const { results } = await postio.address.postcode("W1G 8YW");

// Autocomplete as someone types — searching is free
const { results: suggestions } = await postio.address.search({ q: "57 wimpole" });
```

Searching is free; you are charged only when you retrieve an address (pay as
you go, from 1p a lookup — current rates at [postio.co.uk/pricing](https://postio.co.uk/pricing)),
and nothing when a search returns no match. New accounts get 100 free lookups
without a card — [get a key](https://postio.co.uk/signup).

Full documentation: [postio.co.uk/docs](https://postio.co.uk/docs)

MIT © Onno Group Limited
