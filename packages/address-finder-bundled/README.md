# @postio/address-finder-bundled

Pre-bundled drop-in build of
[`@postio/address-finder`](https://www.npmjs.com/package/@postio/address-finder)
— the UK address autocomplete for [Postio](https://postio.co.uk), the
UK validation API for addresses, emails and phone numbers. Use this
package when you don't want a build step: drop a `<script>` tag in,
configure, done.

> **First time?** [Sign up free](https://postio.co.uk) — first 100 lookups on us, no card needed.

For bundler-based projects, use `@postio/address-finder` directly.
For React, use `@postio/react`.

## Use via our CDN (recommended)

```html
<input id="address-search" />
<input id="address-line-1" />
<input id="town" />
<input id="postcode" />

<script src="https://cdn.postio.co.uk/v1/address-finder.js"></script>
<script>
  Postio.AddressFinder.setup({
    apiKey: "pk_…",
    input: "#address-search",
    output: {
      address_line_1: "#address-line-1",
      post_town: "#town",
      postcode: "#postcode",
    },
  });
</script>
```

`/v1/address-finder.js` always points at the latest **v1.x.x** release.
For exact pinning in production, use the immutable URL — same file,
1-year cache:

```html
<script src="https://cdn.postio.co.uk/v1.0.0/address-finder.js"></script>
```

## Use via jsDelivr / unpkg

The same artefact is on npm, so it's auto-mirrored:

```html
<script src="https://cdn.jsdelivr.net/npm/@postio/address-finder-bundled@1"></script>
<script src="https://unpkg.com/@postio/address-finder-bundled@1"></script>
```

## Use as a module

```html
<script type="module">
  import { setup } from "https://cdn.postio.co.uk/v1/address-finder.esm.js";
  setup({ apiKey: "pk_…", input: "#search", output: { /* … */ } });
</script>
```

## API

Identical to
[`@postio/address-finder`](https://www.npmjs.com/package/@postio/address-finder).

## License

MIT.
