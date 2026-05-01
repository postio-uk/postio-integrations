// Two CSS layers:
//   STRUCTURAL — non-overrideable. Makes the combobox work at all.
//   VISUAL     — neutral defaults, every property exposed as a CSS var.
//
// Both layers inherit font / color from the parent so the widget blends
// into the page's typography by default.
//
// `bare: true` in setup() suppresses the visual layer and only injects
// the structural layer — the consumer styles the rest themselves.

const STYLE_TAG_ID = "postio-address-finder-styles";
const BARE_TAG_ID = "postio-address-finder-styles-bare";

const STRUCTURAL_CSS = `
.postio-af__listbox {
  position: absolute;
  z-index: var(--postio-af-z, 1000);
  margin: 0;
  padding: 0;
  list-style: none;
  font: inherit;
  color: inherit;
  max-height: 320px;
  overflow-y: auto;
  box-sizing: border-box;
  display: none;
}
.postio-af__listbox[data-open="true"] { display: block; }
.postio-af__option {
  cursor: pointer;
  user-select: none;
  font: inherit;
  color: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.postio-af__option:focus { outline: none; }
`;

const VISUAL_CSS = `
.postio-af__listbox {
  background: var(--postio-af-bg, #fff);
  border: var(--postio-af-border, 1px solid rgba(0, 0, 0, 0.15));
  border-radius: var(--postio-af-radius, 6px);
  box-shadow: var(--postio-af-shadow, 0 4px 16px rgba(0, 0, 0, 0.08));
  padding: var(--postio-af-padding, 4px);
}
.postio-af__option {
  padding: var(--postio-af-option-padding, 8px 10px);
  border-radius: var(--postio-af-option-radius, 4px);
}
.postio-af__option[aria-selected="true"],
.postio-af__option:hover {
  background: var(--postio-af-option-hover-bg, rgba(0, 0, 0, 0.06));
}
.postio-af__listbox:focus-visible {
  outline: var(--postio-af-focus-ring, 2px solid #2563eb);
  outline-offset: 1px;
}
`;

export function injectStyles(bare: boolean): void {
  if (typeof document === "undefined") return;
  const id = bare ? BARE_TAG_ID : STYLE_TAG_ID;
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = bare ? STRUCTURAL_CSS : STRUCTURAL_CSS + VISUAL_CSS;
  document.head.appendChild(style);
}
