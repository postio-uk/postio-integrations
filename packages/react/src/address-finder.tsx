"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { InputHTMLAttributes, Ref } from "react";
import { setup } from "@postio/address-finder";
import type {
  Address,
  FinderHandle,
  OutputMap,
  PostioError,
  SetupOptions,
} from "@postio/address-finder";
import { usePostioContext } from "./provider.js";

export interface AddressFinderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onSelect"> {
  /** Per-field DOM targets (escape hatch for non-React fields). Optional. */
  output?: OutputMap;
  /** Override the provider's apiKey for this finder only. */
  apiKey?: string;
  /** Suppress the default visual styling. */
  bare?: boolean;
  /** Min characters before search fires. Default `2`. */
  minLength?: number;
  /** Debounce input by N ms. Default `80`. */
  debounceMs?: number;
  /** Max suggestions shown. Default `7`. */
  maxResults?: number;
  /** z-index of the dropdown. */
  zIndex?: number;
  /** Extra class on the dropdown listbox. */
  listboxClassName?: string;
  /** Called once the user picks a suggestion — gets the full address record. */
  onSelect?: (address: Address) => void;
  /** Called for any search/fetch error. */
  onPostioError?: (err: PostioError | Error) => void;
}

export interface AddressFinderHandle {
  clear: () => void;
  close: () => void;
}

/**
 * Renders an `<input>` and powers it with `@postio/address-finder`.
 * Mounts the autocomplete on first render, tears it down on unmount.
 *
 * Use `onSelect` to capture the full address as React state. The
 * `output` prop is supported as an escape hatch for non-React form
 * fields (legacy code, third-party components that own the DOM).
 */
export const AddressFinder = forwardRef<AddressFinderHandle, AddressFinderProps>(
  function AddressFinder(props, ref) {
    const {
      output,
      apiKey: apiKeyOverride,
      bare,
      minLength,
      debounceMs,
      maxResults,
      zIndex,
      listboxClassName,
      onSelect,
      onPostioError,
      ...inputProps
    } = props;

    const ctx = usePostioContext();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const handleRef = useRef<FinderHandle | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        clear: () => handleRef.current?.clear(),
        close: () => handleRef.current?.close(),
      }),
      [],
    );

    useEffect(() => {
      if (!inputRef.current) return;
      const opts: SetupOptions = {
        apiKey: apiKeyOverride ?? ctx.apiKey,
        input: inputRef.current,
        output: output ?? {},
        ...(bare !== undefined ? { bare } : {}),
        ...(minLength !== undefined ? { minLength } : {}),
        ...(debounceMs !== undefined ? { debounceMs } : {}),
        ...(maxResults !== undefined ? { maxResults } : {}),
        ...(zIndex !== undefined ? { zIndex } : {}),
        ...(listboxClassName !== undefined ? { className: listboxClassName } : {}),
        ...(onSelect ? { onSelect } : {}),
        ...(onPostioError ? { onError: onPostioError } : {}),
      };
      const finder = setup(opts);
      handleRef.current = finder;
      return () => {
        finder.destroy();
        handleRef.current = null;
      };
      // We deliberately re-run on prop changes that affect setup — this
      // re-creates the finder. For most use cases (apiKey, output) the
      // props are stable across renders, so this fires once.
    }, [
      apiKeyOverride,
      ctx.apiKey,
      output,
      bare,
      minLength,
      debounceMs,
      maxResults,
      zIndex,
      listboxClassName,
      onSelect,
      onPostioError,
    ]);

    return <input ref={inputRef} {...inputProps} />;
  },
);

AddressFinder.displayName = "AddressFinder";
