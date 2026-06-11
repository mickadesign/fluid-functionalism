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
  "alert-dialog",
  "button",
  "checkbox-group",
  "dialog",
  "radio-group",
  "slider",
  "switch",
  "tabs",
  "tooltip",
];
