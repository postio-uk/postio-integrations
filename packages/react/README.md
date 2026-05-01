# @postio/react

React hooks and components for the [Postio](https://postio.co.uk) API
— UK address, email, and phone validation.

Built on [TanStack Query](https://tanstack.com/query) for caching and
request deduplication. Compatible with Next.js (App + Pages router),
Remix, Vite, CRA — anywhere React 18+ runs.

## Install

```bash
npm install @postio/react @tanstack/react-query
```

`react` and `@tanstack/react-query` are peer dependencies.

## Setup

Wrap your tree once:

```tsx
import { PostioProvider } from "@postio/react";

export default function App({ children }) {
  return (
    <PostioProvider apiKey={process.env.NEXT_PUBLIC_POSTIO_KEY!}>
      {children}
    </PostioProvider>
  );
}
```

If you already have a `<QueryClientProvider>` higher up the tree, we
use yours. If you don't, we mount one for you.

## `<AddressFinder>` — drop-in autocomplete

```tsx
"use client";
import { useState } from "react";
import { AddressFinder, type Address } from "@postio/react";

export function CheckoutAddress() {
  const [address, setAddress] = useState<Address | null>(null);
  return (
    <>
      <AddressFinder
        placeholder="Start typing your address…"
        onSelect={(a) => setAddress(a)}
        className="form-input"
      />
      {address && (
        <pre>{JSON.stringify(address, null, 2)}</pre>
      )}
    </>
  );
}
```

`<AddressFinder>` accepts every standard `<input>` prop (`className`,
`placeholder`, `name`, `id`, `disabled`, `aria-*`, …) plus the
finder-specific props below.

| Prop | Type | Notes |
|---|---|---|
| `onSelect` | `(address: Address) => void` | Recommended way to capture the picked address. |
| `output` | `OutputMap` | Optional. Direct DOM-binding escape hatch for non-React fields. |
| `apiKey` | `string` | Override the provider's key for this finder only. |
| `bare` | `boolean` | Skip default visual styling. |
| `minLength` | `number` | Default `2`. |
| `debounceMs` | `number` | Default `80`. |
| `maxResults` | `number` | Default `7`. |
| `zIndex` | `number` | Dropdown z-index. |
| `listboxClassName` | `string` | Extra class on the dropdown. |
| `onPostioError` | `(err) => void` | Search/fetch errors. |

The component imperatively exposes `clear()` and `close()` via a ref:

```tsx
const ref = useRef<AddressFinderHandle>(null);
ref.current?.clear();
```

Theming is the same as
[`@postio/address-finder`](https://www.npmjs.com/package/@postio/address-finder)
— set CSS custom properties on any ancestor:

```css
.my-form {
  --postio-af-border: 1px solid #d0d4dc;
  --postio-af-radius: 6px;
  --postio-af-option-hover-bg: #f3f4f6;
  --postio-af-focus-ring: 2px solid #2563eb;
}
```

## Hooks

All hooks return a TanStack Query result (`{ data, error, isLoading,
isFetching, refetch, … }`).

```tsx
import {
  useAddressSearch,
  usePostcode,
  useUdprn,
  useEmailValidation,
  usePhoneValidation,
} from "@postio/react";

function AddressLookup({ udprn }) {
  const { data } = useUdprn(udprn);
  return data?.results[0]?.address_line_1 ?? "—";
}

function PostcodeList({ postcode }) {
  const { data, isLoading } = usePostcode(postcode);
  if (isLoading) return "…";
  return (
    <ul>
      {data?.results.map((a) => (
        <li key={a.udprn}>{a.address_line_1}, {a.postcode}</li>
      ))}
    </ul>
  );
}

function EmailField({ email }) {
  const { data } = useEmailValidation(email, { enabled: email.includes("@") });
  return data?.results[0]?.deliverability ?? "checking…";
}
```

| Hook | Default `staleTime` |
|---|---|
| `useAddressSearch(query, opts?)` | 1 min |
| `usePostcode(postcode, opts?)` | 5 min |
| `useUdprn(udprn, opts?)` | 24 h (UDPRN records change rarely) |
| `useEmailValidation(email, opts?)` | 1 h |
| `usePhoneValidation(number, opts?)` | 1 h |
| `useConnect(opts?)` | 5 min |

Each hook auto-disables when its input is empty/null. Pass `enabled`
to override.

## Errors

The hooks surface `PostioError` in `result.error`. Same shape as
`@postio/core` — `status`, `code`, `details`, `requestId`.

```tsx
const { data, error } = useUdprn(99999999);
if (error instanceof PostioError && error.code === "udprn_not_found") {
  return <Notice>No address with that UDPRN.</Notice>;
}
```

## Server Components

Every public export is a Client Component or client-only hook —
mark consumer files `"use client"` (or import from a `"use client"`
boundary). One-shot lookups can also be done server-side via
[`@postio/core`](https://www.npmjs.com/package/@postio/core) directly.

## License

MIT.
