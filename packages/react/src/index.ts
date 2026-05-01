"use client";

export { PostioProvider, usePostio, usePostioContext } from "./provider.js";
export type { PostioProviderProps } from "./provider.js";

export {
  useAddressSearch,
  usePostcode,
  useUdprn,
  useEmailValidation,
  usePhoneValidation,
  useConnect,
} from "./hooks.js";
export type {
  UseHookOptions,
  UseAddressSearchOptions,
  UsePostcodeOptions,
} from "./hooks.js";

export { AddressFinder } from "./address-finder.js";
export type { AddressFinderProps, AddressFinderHandle } from "./address-finder.js";

// Re-export the API types for convenience.
export type {
  Address,
  AddressSearchResult,
  EmailResult,
  PhoneResult,
  AddressSearchEnvelope,
  AddressPostcodeEnvelope,
  AddressUdprnEnvelope,
  EmailEnvelope,
  PhoneEnvelope,
  ConnectSuccess,
  ErrorEnvelope,
  Meta,
  Performance,
  PostioError,
} from "@postio/core";

// Re-export the address-finder types so consumers can build their own
// wrappers without a second install.
export type {
  AddressField,
  OutputMap,
  OutputTarget,
  FinderHandle,
  SetupOptions,
} from "@postio/address-finder";
