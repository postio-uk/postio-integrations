"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  AddressSearchEnvelope,
  AddressPostcodeEnvelope,
  AddressUdprnEnvelope,
  EmailEnvelope,
  PhoneEnvelope,
  ConnectSuccess,
} from "@postio/core";
import { usePostio } from "./provider.js";

export interface UseHookOptions {
  enabled?: boolean;
  staleTime?: number;
}

export interface UseAddressSearchOptions extends UseHookOptions {
  maxResults?: number;
}

/**
 * Live address search. Returns suggestions for whatever the user has typed.
 * Disabled until `query` has at least one character (override with `enabled`).
 */
export function useAddressSearch(
  query: string,
  options: UseAddressSearchOptions = {},
) {
  const client = usePostio();
  return useQuery<AddressSearchEnvelope>({
    queryKey: ["postio", "address-search", query, options.maxResults],
    queryFn: ({ signal }) =>
      client.address.search(query, {
        ...(options.maxResults !== undefined ? { maxResults: options.maxResults } : {}),
        signal,
      }),
    enabled: options.enabled ?? query.trim().length >= 2,
    staleTime: options.staleTime ?? 60_000,
  });
}

export interface UsePostcodeOptions extends UseHookOptions {
  maxResults?: number;
}

/** Full address list for a given UK postcode. */
export function usePostcode(
  postcode: string | null | undefined,
  options: UsePostcodeOptions = {},
) {
  const client = usePostio();
  return useQuery<AddressPostcodeEnvelope>({
    queryKey: ["postio", "postcode", postcode, options.maxResults],
    queryFn: ({ signal }) =>
      client.address.postcode(postcode!, {
        ...(options.maxResults !== undefined ? { maxResults: options.maxResults } : {}),
        signal,
      }),
    enabled: !!postcode && (options.enabled ?? true),
    staleTime: options.staleTime ?? 5 * 60_000,
  });
}

/** Single address by UDPRN. Cached aggressively — UDPRN records change rarely. */
export function useUdprn(
  udprn: number | string | null | undefined,
  options: UseHookOptions = {},
) {
  const client = usePostio();
  return useQuery<AddressUdprnEnvelope>({
    queryKey: ["postio", "udprn", udprn],
    queryFn: ({ signal }) => client.address.udprn(udprn!, { signal }),
    enabled: udprn != null && (options.enabled ?? true),
    staleTime: options.staleTime ?? 24 * 60 * 60_000,
  });
}

/** Email validity, deliverability + classification. */
export function useEmailValidation(
  email: string | null | undefined,
  options: UseHookOptions = {},
) {
  const client = usePostio();
  return useQuery<EmailEnvelope>({
    queryKey: ["postio", "email", email],
    queryFn: ({ signal }) => client.email.validate(email!, { signal }),
    enabled: !!email && (options.enabled ?? true),
    staleTime: options.staleTime ?? 60 * 60_000,
  });
}

/** Phone parse + carrier lookup (HLR). */
export function usePhoneValidation(
  number: string | null | undefined,
  options: UseHookOptions = {},
) {
  const client = usePostio();
  return useQuery<PhoneEnvelope>({
    queryKey: ["postio", "phone", number],
    queryFn: ({ signal }) => client.phone.validate(number!, { signal }),
    enabled: !!number && (options.enabled ?? true),
    staleTime: options.staleTime ?? 60 * 60_000,
  });
}

/** Free key/health probe. Useful as an input-focus warm-up. */
export function useConnect(options: UseHookOptions = {}) {
  const client = usePostio();
  return useQuery<ConnectSuccess>({
    queryKey: ["postio", "connect"],
    queryFn: ({ signal }) => client.connect({ signal }),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime ?? 5 * 60_000,
  });
}
