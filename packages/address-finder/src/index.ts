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
  /**
   * How the customer finds their address.
   *
   * - `"search"` (default): type-ahead. Suggestions appear as they type
   *   anything — house, street, postcode. Searching is free; one lookup is
   *   charged when they pick an address.
   * - `"postcode"`: postcode lookup. Once a full UK postcode is typed, every
   *   address at it is listed (up to 100) and the customer picks theirs.
   *   One lookup is charged per postcode; picking from the list is free.
   *   Repeat lookups of the same postcode on the same page are cached.
   */
  mode?: FinderMode;
  /** Max type-ahead suggestions to show. Default `7`, range `1`–`50`. Ignored in postcode mode. */
  maxResults?: number;
  /** Override the wording shown in postcode mode (e.g. for translation). */
  labels?: Partial<FinderLabels>;
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

export type FinderMode = "search" | "postcode";

export interface FinderLabels {
  /** Shown on focus, and while a postcode is part-typed. */
  postcodeHint: string;
  /** Shown while the lookup is in flight. */
  postcodeLoading: string;
  /** Header above the list. `{count}` and `{postcode}` are replaced. */
  postcodeCount: string;
  /** Same, for exactly one address. */
  postcodeCountOne: string;
  /** No addresses at a well-formed postcode. `{postcode}` is replaced. */
  postcodeNone: string;
}

const DEFAULT_LABELS: FinderLabels = {
  postcodeHint: "Enter your full postcode to see every address, e.g. BA2 4QT",
  postcodeLoading: "Finding addresses…",
  postcodeCount: "{count} addresses at {postcode}",
  postcodeCountOne: "1 address at {postcode}",
  postcodeNone: "No addresses found at {postcode}. Check the postcode, or type your address in.",
};

/** Full UK postcode, space optional. Server-side validation is authoritative. */
const FULL_POSTCODE = /^(GIR ?0AA|[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2})$/i;
/** Something that could still become a postcode as the customer keeps typing. */
const PARTIAL_POSTCODE = /^[A-Z]{1,2}([0-9]([A-Z0-9]( ?[0-9]?[A-Z]{0,2})?| ?[0-9][A-Z]{0,2})?)?$/i;

function normalisePostcode(raw: string): string {
  const compact = raw.toUpperCase().replace(/\s+/g, "");
  return compact.slice(0, -3) + " " + compact.slice(-3);
}

/** Every address on a postcode, so a single lookup covers it. */
const POSTCODE_MAX_RESULTS = 100;

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
  const mode: FinderMode = options.mode === "postcode" ? "postcode" : "search";
  const maxResults = clampInt(options.maxResults, 1, 50, 7);
  const labels: FinderLabels = { ...DEFAULT_LABELS, ...(options.labels ?? {}) };

  injectStyles(options.bare === true);

  const client = new Postio({
    apiKey: options.apiKey,
    ...(options.baseUrl !== undefined ? { baseUrl: options.baseUrl } : {}),
  });

  const listboxId = `postio-af-${++listboxIdCounter}`;
  const listbox = document.createElement("ul");
  listbox.className =
    "postio-af__listbox" +
    (mode === "postcode" ? " postio-af__listbox--postcode" : "") +
    (options.className ? " " + options.className : "");
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
  /** Postcode mode: full records for the listed results, same order. */
  let records: Address[] = [];
  /** Postcode mode: a non-selectable line shown above (or instead of) the options. */
  let status: string | null = null;
  const postcodeCache = new Map<string, Address[]>();
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
    if (isOpen || (results.length === 0 && status === null)) return;
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

  const optionEls: HTMLElement[] = [];

  const renderResults = () => {
    listbox.innerHTML = "";
    optionEls.length = 0;
    highlighted = -1;
    input.removeAttribute("aria-activedescendant");
    if (status !== null) {
      const li = document.createElement("li");
      li.className = "postio-af__status";
      li.setAttribute("role", "presentation");
      li.textContent = status;
      listbox.appendChild(li);
    }
    results.forEach((r, i) => {
      const li = document.createElement("li");
      li.className = "postio-af__option";
      li.id = `${listboxId}-opt-${i}`;
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", "false");
      li.dataset["index"] = String(i);
      li.textContent = r.suggestion;
      listbox.appendChild(li);
      optionEls.push(li);
    });
    if (results.length === 0 && status === null) {
      close();
    } else {
      open();
    }
  };

  const setHighlight = (index: number) => {
    if (results.length === 0) return;
    const next = ((index % results.length) + results.length) % results.length;
    if (highlighted >= 0) {
      const prev = optionEls[highlighted];
      prev?.setAttribute("aria-selected", "false");
    }
    highlighted = next;
    const el = optionEls[next];
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

  const showPostcode = (postcode: string, list: Address[]) => {
    // Natural order, so Flat 2 comes before Flat 10 and before Flat 389.
    const labelled = list
      .map((a) => ({ a, label: formatOption(a) }))
      .sort((x, y) => naturalCompare(x.label, y.label));
    records = labelled.map((x) => x.a);
    results = labelled.map((x) => ({ udprn: x.a.udprn, suggestion: x.label }) as AddressSearchResult);
    status = list.length === 0
      ? fill(labels.postcodeNone, { postcode })
      : fill(list.length === 1 ? labels.postcodeCountOne : labels.postcodeCount, {
          count: String(list.length),
          postcode,
        });
    renderResults();
    options.onSearch?.(postcode, results);
  };

  const setStatusOnly = (text: string | null) => {
    records = [];
    results = [];
    status = text;
    renderResults();
  };

  const runPostcodeLookup = async (postcode: string) => {
    const cached = postcodeCache.get(postcode);
    if (cached) {
      showPostcode(postcode, cached);
      return;
    }
    searchAbort?.abort();
    searchAbort = new AbortController();
    setStatusOnly(labels.postcodeLoading);
    try {
      const env = await client.address.postcode(postcode, {
        maxResults: POSTCODE_MAX_RESULTS,
        signal: searchAbort.signal,
      });
      postcodeCache.set(postcode, env.results);
      showPostcode(postcode, env.results);
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return;
      if (err instanceof PostioError && err.code === "request_aborted") return;
      if (err instanceof PostioError && err.status === 400) {
        // Looked like a postcode but the API says it isn't one.
        showPostcode(postcode, []);
        return;
      }
      setStatusOnly(null);
      options.onError?.(err as Error);
    }
  };

  /** Postcode mode: decide what the dropdown shows for the current text. */
  const postcodeStep = (q: string) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (FULL_POSTCODE.test(q)) {
      const pc = normalisePostcode(q);
      debounceTimer = setTimeout(() => runPostcodeLookup(pc), debounceMs);
      return;
    }
    searchAbort?.abort();
    // Part of a postcode: nudge them on. Anything else (a street typed by
    // hand): stay out of the way.
    setStatusOnly(q.length === 0 || PARTIAL_POSTCODE.test(q) ? labels.postcodeHint : null);
  };

  const onInputEvent = () => {
    const q = input.value.trim();
    if (mode === "postcode") {
      postcodeStep(q);
      return;
    }
    if (q.length < minLength) {
      results = [];
      renderResults();
      return;
    }
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => runSearch(q), debounceMs);
  };

  const finishPick = (address: Address) => {
    populateOutputs(outputs, address);
    input.value = formatPicked(address);
    options.onSelect?.(address);
    results = [];
    records = [];
    status = null;
    renderResults();
  };

  const pickIndex = async (index: number) => {
    const choice = results[index];
    if (!choice) return;
    // Postcode mode already holds the full record — no second lookup, no charge.
    const held = records[index];
    if (mode === "postcode" && held) {
      finishPick(held);
      return;
    }
    try {
      const env = await client.address.udprn(choice.udprn);
      const address = env.results[0];
      if (!address) return;
      finishPick(address);
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
      } else if (isOpen) {
        // Don't submit the checkout from inside an open address list.
        e.preventDefault();
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
    if (mode === "postcode" && results.length === 0 && input.value.trim() === "") {
      setStatusOnly(labels.postcodeHint);
      return;
    }
    if (results.length > 0 || status !== null) open();
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
      records = [];
      status = null;
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

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "string" ? Number.parseInt(value, 10) : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => values[k] ?? m);
}

/**
 * "Flat 2, 14 High Street". Town and postcode are the same for every row on
 * a postcode and already sit in the header, so leaving them out keeps each
 * line short enough to read on a phone.
 */
function formatOption(a: Address): string {
  return [a.address_line_1, a.address_line_2, a.address_line_3]
    .filter((p): p is string => typeof p === "string" && p.length > 0)
    .join(", ");
}

const collator =
  typeof Intl !== "undefined" ? new Intl.Collator("en-GB", { numeric: true, sensitivity: "base" }) : null;

function naturalCompare(a: string, b: string): number {
  return collator ? collator.compare(a, b) : a < b ? -1 : a > b ? 1 : 0;
}

function restoreAttr(el: HTMLElement, name: string, value: string | null) {
  if (value === null) el.removeAttribute(name);
  else el.setAttribute(name, value);
}

const AddressFinder = { setup };
export default AddressFinder;
