import {
  DUAL_FLAVOR_SLUGS as DUAL_FLAVOR_SLUG_LIST,
  FLAVORED_SINGLE_SOURCE_SLUGS as FLAVORED_SINGLE_SOURCE_LIST,
} from "./dual-flavor-slugs.mjs";

/** The primitive library a component is installed for. */
export type Base = "radix" | "base";

/**
 * Slugs of components that have both a Radix and a Base UI flavour.
 * Single source of truth lives in `./dual-flavor-slugs.mjs` so the postbuild
 * registry script (Node, mjs) can read the same list.
 */
export const DUAL_FLAVOR_SLUGS: Set<string> = new Set(DUAL_FLAVOR_SLUG_LIST);

/** Single-source components that ship flavoured payloads because they
 *  depend on a dual-flavour one (see lib/dual-flavor-slugs.mjs). */
export const FLAVORED_SINGLE_SOURCE_SLUGS: Set<string> = new Set(FLAVORED_SINGLE_SOURCE_LIST);

/**
 * Build the full registry install URL for a given slug + currently-selected
 * base. A dual-flavour component has a Base UI source of its own; a
 * single-source component that depends on one (a command menu over the
 * Dialog) has a `base/` payload whose dependencies resolve to the Base UI
 * flavours. Everything else (Badge, Table, etc.) has one payload, and the
 * base is ignored.
 */
export function installUrl(slug: string, base: Base): string {
  if (
    base === "base" &&
    (DUAL_FLAVOR_SLUGS.has(slug) || FLAVORED_SINGLE_SOURCE_SLUGS.has(slug))
  ) {
    return `https://www.fluidfunctionalism.com/r/base/${slug}.json`;
  }
  return `https://www.fluidfunctionalism.com/r/${slug}.json`;
}
