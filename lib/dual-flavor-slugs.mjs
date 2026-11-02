/**
 * Single source of truth for which Fluid Functionalism components have both
 * a Radix and a Base UI flavour.
 *
 * Consumed by:
 *  - `scripts/postbuild-registry.mjs` (decides which JSONs to emit under
 *    `r/radix/` and `r/base/`, and how to URL-rewrite cross-component deps)
 *  - `lib/base-context.tsx` (decides whether the right-panel "Primitive"
 *    toggle should affect the install URL on a given doc page)
 *
 * Adding a new dual-flavour component: append its slug here and that's it.
 */
export const DUAL_FLAVOR_SLUGS = [
  "accordion",
  "button",
  "checkbox-group",
  "combobox",
  "date-picker",
  "dialog",
  "dropdown",
  "mobile-drawer",
  "radio-group",
  "scroll-area",
  "select",
  "sidebar",
  "slider",
  "switch",
  "tabs",
  "thinking-steps",
  "tooltip",
];

/**
 * Single-source components whose dependencies include a dual-flavour one.
 * The postbuild emits a `base/` and a `radix/` payload for each (with the
 * matching flavour of every dependency), so a Base UI install must point at
 * `r/base/<slug>.json`. Hand-maintained here so the client-side install URL
 * needs no manifest; tests/registry-consistency.test.mjs keeps it equal to
 * the set the postbuild derives from registry.json.
 */
export const FLAVORED_SINGLE_SOURCE_SLUGS = [
  "ask-user-questions",
  "banner",
  "calendar",
  "color-picker",
  "command-menu",
  "dialog-sidebar",
  "input-copy",
  "input-message",
  "queued-stack",
  "sidebar-app",
  "sidebar-inset-topbar",
  "sidebar-search-field",
  "sidebar-user-footer",
  "sidebar-workspace-header",
];
