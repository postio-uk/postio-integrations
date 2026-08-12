# @postio/address-finder

Drop-in UK address autocomplete — accessible combobox over
[Postio](https://postio.co.uk), the UK validation API for addresses,
emails and phone numbers.

> **First time?** [Sign up free](https://postio.co.uk) — first 100 lookups on us, no card needed.

This is the **source** package — for use with bundlers (Vite, Webpack,
esbuild, Rollup, Next.js, etc.). For a script-tag drop-in with no
build step, install
[`@postio/address-finder-bundled`](https://www.npmjs.com/package/@postio/address-finder-bundled)
or load from `https://cdn.postio.co.uk/v1/address-finder.js`.

## Install

```bash
npm install @postio/address-finder
```

## Use

```html
<input id="address-search" />
<input id="address-line-1" />
<input id="town" />
<input id="postcode" />
```

```ts
import { setup } from "@postio/address-finder";

const finder = setup({
  apiKey: "pk_…",
  input: "#address-search",
  output: {
    address_line_1: "#address-line-1",
    post_town: "#town",
    postcode: "#postcode",
  },
});

// Later, if needed:
finder.clear();
finder.close();
finder.destroy();
```

## Options

| Option | Type | Default | Notes |
|---|---|---|---|
| `apiKey` | `string` | — | Required. `pk_*` publishable key. |
| `input` | `string \| HTMLInputElement` | — | Required. The text input the user types into. |
| `output` | `OutputMap` | — | Required. Map of API field → DOM target to populate. |
| `baseUrl` | `string` | `https://api.postio.co.uk/v1` | Override for self-hosted / staging. |
| `bare` | `boolean` | `false` | Skip the visual CSS layer; ship structural only. |
| `minLength` | `number` | `2` | Min chars before searching. |
| `debounceMs` | `number` | `80` | Debounce input by N ms. |
| `maxResults` | `number` | `7` | Max suggestions in dropdown (cap 50). |
| `className` | `string` | — | Extra class on the listbox element. |
| `zIndex` | `number` | `1000` | z-index of the dropdown. |
| `onReady` | `() => void` | — | Called once after setup. |
| `onSearch` | `(query, results) => void` | — | After every search response. |
| `onSelect` | `(address) => void` | — | When the user picks an address. Gets the full record. |
| `onError` | `(err) => void` | — | Any search or fetch error. |

`output` keys are the API field names —
`address_line_1`, `post_town`, `postcode`, `udprn`,
`latitude`, `longitude`, etc. See
[`@postio/api-types`](https://www.npmjs.com/package/@postio/api-types)
for the full list.

`output` values can be a CSS selector or an `HTMLElement`. `<input>`,
`<textarea>` and `<select>` get their `.value` set + `input` and
`change` events dispatched (so React/Vue/Angular pick up the change).
Anything else gets `.textContent` set.

## Theming

Default styling is intentionally minimal and inherits font + color
from the parent. Override via CSS custom properties on any ancestor:

```css
.my-form {
  --postio-af-bg: white;
  --postio-af-border: 1px solid #d0d4dc;
  --postio-af-radius: 6px;
  --postio-af-padding: 4px;
  --postio-af-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  --postio-af-option-padding: 8px 10px;
  --postio-af-option-radius: 4px;
  --postio-af-option-hover-bg: #f3f4f6;
  --postio-af-focus-ring: 2px solid #2563eb;
  --postio-af-z: 1000;
}
```

Or target the BEM-style classes directly:

```css
.postio-af__listbox { /* … */ }
.postio-af__option { /* … */ }
.postio-af__option[aria-selected="true"] { /* … */ }
```

For full control, opt out of visual defaults — `setup({ ..., bare: true })`
ships only the structural CSS (positioning, list semantics, hide/show).

## Accessibility

- ARIA combobox pattern (WAI-ARIA 1.2): `role="combobox"` on the input,
  `role="listbox"` on the dropdown, `role="option"` per suggestion,
  `aria-expanded` / `aria-controls` / `aria-activedescendant` updated live.
- Full keyboard nav: `↑` / `↓` / `Home` / `End` / `Enter` / `Escape` / `Tab`.
- Mouse hover follows keyboard highlight.
- Inherits `font-family`, `color`, and `font-size` so it picks up the
  page's typography automatically.

## Performance

- One in-flight search at a time — the previous one is aborted on the
  next keystroke.
- Free `/connect` warm-up fired on first input focus (no billing impact).
- Debounced input by default at 80 ms.

## License

MIT.
