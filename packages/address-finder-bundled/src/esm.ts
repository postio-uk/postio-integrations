// Entry for the ESM bundle. Re-exports the source surface so consumers
// can do:
//   import { setup } from "@postio/address-finder-bundled";
// or load via <script type="module">:
//   import * as Postio from "https://cdn.postio.co.uk/v1/address-finder.esm.js";
export { setup } from "@postio/address-finder";
export { default } from "@postio/address-finder";
export type {
  SetupOptions,
  FinderHandle,
  AddressField,
  OutputMap,
  OutputTarget,
  Address,
  AddressSearchResult,
} from "@postio/address-finder";
