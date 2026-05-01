import { Postio, PostioError } from "@postio/core";
import type { Address, AddressSearchResult } from "@postio/core";
import { injectStyles } from "./styles.js";

export type { Address, AddressSearchResult } from "@postio/core";
export { PostioError } from "@postio/core";

/** Every API field is bindable. The keys map 1:1 to the API response shape. */
export type AddressField =
  | "udprn"
  | "address_line_1"
  | "address_line_2"
  | "address_line_3"
  | "post_town"
  | "postcode"
  | "postcode_outward"
  | "postcode_inward"
  | "postcode_type"
  | "building_number"
  | "building_name"
  | "sub_building_name"
  | "organisation_name"
  | "department_name"
  | "thoroughfare"
  | "dependent_thoroughfare"
  | "dependent_locality"
  | "double_dependent_locality"
  | "po_box"
  | "delivery_point_suffix"
  | "country"
  | "county"
  | "district"
  | "ward"
  | "latitude"
  | "longitude"
  | "eastings"
  | "northings";

export type OutputTarget = string | HTMLElement;
export type OutputMap = Partial<Record<AddressField, OutputTarget>>;

export interface SetupOptions {
  /** Postio publishable key (`pk_*`). */
  apiKey: string;
  /** The text input the user types into. CSS selector or element. */
  input: string | HTMLInputElement;
  /** Map of API field → DOM element to populate when the user picks an address. */
  output: OutputMap;
  /** Override the API base URL. Default `https://api.postio.co.uk/v1`. */
  baseUrl?: string;
  /** Suppress default visual styling. Structural CSS still ships. */
  bare?: boolean;
  /** Min characters before searching. Default `2`. */
  minLength?: number;
  /** Debounce input by N ms. Default `80`. */
  debounceMs?: number;
  /** Max search suggestions to show. Default `7`. Hard cap `50`. */
  maxResults?: number;
  /** Extra class added to the dropdown listbox element. */
  className?: string;
  /** z-index of the dropdown. Default `1000`. */
  zIndex?: number;
  /** Called once after setup completes. */
  onReady?: () => void;
  /** Called after every search response. */
  onSearch?: (query: string, results: AddressSearchResult[]) => void;
  /** Called once the user picks an address — gets the full record. */
  onSelect?: (address: Address) => void;
  /** Called for any error during search or address fetch. */
  onError?: (err: PostioError | Error) => void;
}

export interface FinderHandle {
  /** Tear down listeners, remove DOM nodes, restore the input's ARIA state. */
  destroy(): void;
  /** Clear the input and close the dropdown. */
  clear(): void;
  /** Force-close the dropdown. */
  close(): void;
}

let listboxIdCounter = 0;

export function setup(options: SetupOptions): FinderHandle {
  const input = resolveElement(options.input);
  if (!(input instanceof HTMLInputElement)) {
    throw new TypeError(
      "@postio/address-finder: `input` must resolve to an HTMLInputElement.",
    );
  }
  if (typeof options.apiKey !== "string" || options.apiKey.length === 0) {
    throw new TypeError("@postio/address-finder: `apiKey` is required.");
  }

  const outputs = resolveOutputs(options.output);
  const minLength = options.minLength ?? 2;
  const debounceMs = options.debounceMs ?? 80;
  const maxResults = Math.min(50, options.maxResults ?? 7);

  injectStyles(options.bare === true);

  const client = new Postio({
    apiKey: options.apiKey,
    ...(options.baseUrl !== undefined ? { baseUrl: options.baseUrl } : {}),
  });

  const listboxId = `postio-af-${++listboxIdCounter}`;
  const listbox = document.createElement("ul");
  listbox.className = "postio-af__listbox" + (options.className ? " " + options.className : "");
  listbox.id = listboxId;
  listbox.setAttribute("role", "listbox");
  listbox.setAttribute("data-open", "false");
  if (options.zIndex !== undefined) {
    listbox.style.setProperty("--postio-af-z", String(options.zIndex));
  }
  document.body.appendChild(listbox);

  // Snapshot prior ARIA so we can restore in destroy().
  const priorAria = {
    role: input.getAttribute("role"),
    autocomplete: input.getAttribute("aria-autocomplete"),
    controls: input.getAttribute("aria-controls"),
    expanded: input.getAttribute("aria-expanded"),
    activeDescendant: input.getAttribute("aria-activedescendant"),
    autoCompleteAttr: input.getAttribute("autocomplete"),
  };

  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", listboxId);
  input.setAttribute("aria-expanded", "false");
  // Disable browser autofill — it fights the dropdown.
  if (!input.hasAttribute("autocomplete")) input.setAttribute("autocomplete", "off");

  let results: AddressSearchResult[] = [];
  let highlighted = -1;
  let isOpen = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let searchAbort: AbortController | null = null;
  let warmed = false;

  const positionListbox = () => {
    const rect = input.getBoundingClientRect();
    listbox.style.top = `${rect.bottom + window.scrollY + 2}px`;
    listbox.style.left = `${rect.left + window.scrollX}px`;
    listbox.style.width = `${rect.width}px`;
  };

  const open = () => {
    if (isOpen || results.length === 0) return;
    isOpen = true;
    positionListbox();
    listbox.setAttribute("data-open", "true");
    input.setAttribute("aria-expanded", "true");
  };

  const close = () => {
    if (!isOpen && listbox.getAttribute("data-open") !== "true") {
      // ensure ARIA is consistent even when not open
      input.setAttribute("aria-expanded", "false");
      return;
    }
    isOpen = false;
    listbox.setAttribute("data-open", "false");
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    highlighted = -1;
  };

  const renderResults = () => {
    listbox.innerHTML = "";
    results.forEach((r, i) => {
      const li = document.createElement("li");
      li.className = "postio-af__option";
      li.id = `${listboxId}-opt-${i}`;
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", "false");
      li.dataset["index"] = String(i);
      li.textContent = r.suggestion;
      listbox.appendChild(li);
    });
    if (results.length === 0) {
      close();
    } else {
      open();
    }
  };

  const setHighlight = (index: number) => {
    if (results.length === 0) return;
    const next = ((index % results.length) + results.length) % results.length;
    if (highlighted >= 0) {
      const prev = listbox.children[highlighted] as HTMLElement | undefined;
      prev?.setAttribute("aria-selected", "false");
    }
    highlighted = next;
    const el = listbox.children[next] as HTMLElement | undefined;
    if (el) {
      el.setAttribute("aria-selected", "true");
      input.setAttribute("aria-activedescendant", el.id);
      const elTop = el.offsetTop;
      const elBottom = elTop + el.offsetHeight;
      if (elTop < listbox.scrollTop) listbox.scrollTop = elTop;
      else if (elBottom > listbox.scrollTop + listbox.clientHeight)
        listbox.scrollTop = elBottom - listbox.clientHeight;
    }
  };

  const runSearch = async (query: string) => {
    searchAbort?.abort();
    searchAbort = new AbortController();
    try {
      const env = await client.address.search(query, {
        maxResults,
        signal: searchAbort.signal,
      });
      results = env.results;
      renderResults();
      options.onSearch?.(query, results);
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return;
      if (err instanceof PostioError && err.code === "request_aborted") return;
      options.onError?.(err as Error);
    }
  };

  const onInputEvent = () => {
    const q = input.value.trim();
    if (q.length < minLength) {
      results = [];
      renderResults();
      return;
    }
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => runSearch(q), debounceMs);
  };

  const pickIndex = async (index: number) => {
    const choice = results[index];
    if (!choice) return;
    try {
      const env = await client.address.udprn(choice.udprn);
      const address = env.results[0];
      if (!address) return;
      populateOutputs(outputs, address);
      input.value = formatPicked(address);
      options.onSelect?.(address);
      results = [];
      renderResults();
    } catch (err) {
      options.onError?.(err as Error);
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen && results.length > 0) open();
      setHighlight(highlighted + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen && results.length > 0) open();
      setHighlight(highlighted < 0 ? results.length - 1 : highlighted - 1);
    } else if (e.key === "Enter") {
      if (highlighted >= 0) {
        e.preventDefault();
        void pickIndex(highlighted);
      }
    } else if (e.key === "Escape") {
      if (isOpen) {
        e.preventDefault();
        close();
      }
    } else if (e.key === "Tab") {
      close();
    } else if (e.key === "Home" && isOpen) {
      e.preventDefault();
      setHighlight(0);
    } else if (e.key === "End" && isOpen) {
      e.preventDefault();
      setHighlight(results.length - 1);
    }
  };

  const onClick = (e: MouseEvent) => {
    const target = (e.target as HTMLElement).closest(".postio-af__option") as HTMLElement | null;
    if (!target) return;
    const index = Number(target.dataset["index"]);
    if (Number.isFinite(index)) void pickIndex(index);
  };

  const onMouseMove = (e: MouseEvent) => {
    const target = (e.target as HTMLElement).closest(".postio-af__option") as HTMLElement | null;
    if (!target) return;
    const index = Number(target.dataset["index"]);
    if (Number.isFinite(index) && index !== highlighted) setHighlight(index);
  };

  const onFocus = () => {
    if (!warmed) {
      warmed = true;
      client.connect().catch(() => {
        /* warm-up failures are silent */
      });
    }
    if (results.length > 0) open();
  };

  const onBlur = (e: FocusEvent) => {
    // Defer so a click on the listbox can land first.
    const related = e.relatedTarget as Node | null;
    if (related && listbox.contains(related)) return;
    setTimeout(() => {
      if (document.activeElement !== input) close();
    }, 120);
  };

  const reposition = () => {
    if (isOpen) positionListbox();
  };

  // Prevent listbox click from blurring the input before we handle it.
  const onListboxMouseDown = (e: MouseEvent) => {
    e.preventDefault();
  };

  input.addEventListener("input", onInputEvent);
  input.addEventListener("keydown", onKeyDown);
  input.addEventListener("focus", onFocus);
  input.addEventListener("blur", onBlur);
  listbox.addEventListener("mousedown", onListboxMouseDown);
  listbox.addEventListener("click", onClick);
  listbox.addEventListener("mousemove", onMouseMove);
  window.addEventListener("scroll", reposition, { passive: true, capture: true });
  window.addEventListener("resize", reposition);

  options.onReady?.();

  return {
    destroy() {
      input.removeEventListener("input", onInputEvent);
      input.removeEventListener("keydown", onKeyDown);
      input.removeEventListener("focus", onFocus);
      input.removeEventListener("blur", onBlur);
      listbox.removeEventListener("mousedown", onListboxMouseDown);
      listbox.removeEventListener("click", onClick);
      listbox.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", reposition, { capture: true } as EventListenerOptions);
      window.removeEventListener("resize", reposition);
      searchAbort?.abort();
      if (debounceTimer) clearTimeout(debounceTimer);
      restoreAttr(input, "role", priorAria.role);
      restoreAttr(input, "aria-autocomplete", priorAria.autocomplete);
      restoreAttr(input, "aria-controls", priorAria.controls);
      restoreAttr(input, "aria-expanded", priorAria.expanded);
      restoreAttr(input, "aria-activedescendant", priorAria.activeDescendant);
      restoreAttr(input, "autocomplete", priorAria.autoCompleteAttr);
      listbox.remove();
    },
    clear() {
      input.value = "";
      results = [];
      renderResults();
    },
    close,
  };
}

function resolveElement(target: string | HTMLElement): HTMLElement | null {
  if (typeof target === "string") return document.querySelector<HTMLElement>(target);
  return target;
}

interface ResolvedOutput {
  field: AddressField;
  el: HTMLElement;
}

function resolveOutputs(map: OutputMap): ResolvedOutput[] {
  const out: ResolvedOutput[] = [];
  for (const [field, target] of Object.entries(map)) {
    if (!target) continue;
    const el = resolveElement(target);
    if (!el) {
      // Surface in console but don't throw — partial maps are valid.
      // eslint-disable-next-line no-console
      console.warn(`@postio/address-finder: output target for "${field}" not found`);
      continue;
    }
    out.push({ field: field as AddressField, el });
  }
  return out;
}

function populateOutputs(outputs: ResolvedOutput[], address: Address): void {
  for (const { field, el } of outputs) {
    const value = (address as Record<string, unknown>)[field];
    const stringValue = value == null ? "" : String(value);
    if (
      el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement
    ) {
      el.value = stringValue;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      el.textContent = stringValue;
    }
  }
}

function formatPicked(address: Address): string {
  const parts = [
    address.address_line_1,
    address.post_town,
    address.postcode,
  ].filter((p): p is string => typeof p === "string" && p.length > 0);
  return parts.join(", ");
}

function restoreAttr(el: HTMLElement, name: string, value: string | null) {
  if (value === null) el.removeAttribute(name);
  else el.setAttribute(name, value);
}

const AddressFinder = { setup };
export default AddressFinder;
