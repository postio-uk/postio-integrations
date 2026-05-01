import { defineConfig } from "tsup";

const COMMON = {
  target: "es2020" as const,
  minify: true,
  treeshake: true,
  sourcemap: true,
  clean: true,
  dts: false,
  // Inline @postio/* — this bundle is self-contained.
  noExternal: [/^@postio\//],
  // Banner so the bundle's origin is obvious to anyone viewing source.
  banner: {
    js: "/*! @postio/address-finder-bundled — https://postio.co.uk — MIT */",
  },
};

export default defineConfig([
  // IIFE — for <script src="..."> tags. Sets window.Postio.AddressFinder.
  {
    ...COMMON,
    entry: { "address-finder": "src/iife.ts" },
    format: ["iife"],
    outExtension: () => ({ js: ".js" }),
  },
  // ESM — for <script type="module">, bundlers, deno.land/x.
  {
    ...COMMON,
    entry: { "address-finder.esm": "src/esm.ts" },
    format: ["esm"],
    outExtension: () => ({ js: ".js" }),
    dts: { entry: { "address-finder": "src/esm.ts" }, resolve: true },
  },
]);
