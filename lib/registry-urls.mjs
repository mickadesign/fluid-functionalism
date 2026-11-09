// Bundler-safe registry dependency-URL resolution, shared by the dynamic
// preset route (which can't import scripts/postbuild-registry.mjs — that
// script touches the filesystem at module scope). The postbuild keeps its
// own resolver; tests/preset-route.test.mjs asserts the two agree for every
// item × flavor, so they cannot drift.
import { DUAL_FLAVOR_SLUGS } from "./dual-flavor-slugs.mjs";

export const REGISTRY_BASE_URL = "https://www.fluidfunctionalism.com/r";

/**
 * Build a depUrl(dep, flavor) resolver from the registry manifest's items.
 *  - Dual-flavour deps and single-source deps that carry flavoured payload
 *    variants resolve to the matching flavour subpath.
 *  - Other custom deps resolve to the flat URL.
 *  - Anything not in the manifest (e.g. "utils") stays a plain name for the
 *    default shadcn registry.
 */
export function buildDepResolver(items) {
  const dual = new Set(DUAL_FLAVOR_SLUGS);
  const names = new Set(
    items
      .filter((i) => typeof i.name === "string")
      .map((i) => i.name.replace(/-base$/, ""))
  );
  const flavoredSingleSource = new Set(
    items
      .filter(
        (i) =>
          typeof i.name === "string" &&
          !i.name.endsWith("-base") &&
          !dual.has(i.name) &&
          (i.registryDependencies ?? []).some((d) => dual.has(d))
      )
      .map((i) => i.name)
  );
  return function depUrl(dep, flavor /* 'flat' | 'radix' | 'base' */) {
    // "utils" ships in the manifest too, but the postbuild deliberately
    // leaves it a plain name (the default shadcn registry provides it).
    if (dep === "utils" || !names.has(dep)) return dep;
    if (dual.has(dep) || flavoredSingleSource.has(dep)) {
      if (flavor === "base") return `${REGISTRY_BASE_URL}/base/${dep}.json`;
      if (flavor === "radix") return `${REGISTRY_BASE_URL}/radix/${dep}.json`;
    }
    return `${REGISTRY_BASE_URL}/${dep}.json`;
  };
}

/**
 * Every item whose install pulls in fluid hover: `use-fluid-hover` itself and
 * everything that depends on it, directly or through another item. Each has
 * a standard-hover payload under `r/standard/` (same path below it), whose
 * dependencies swap fluid hover for standard hover. Flavours share a name
 * here (`dropdown-base` counts as `dropdown`).
 */
export function fluidHoverClosure(items) {
  const deps = new Map();
  for (const item of items) {
    if (typeof item.name !== "string" || item.name.endsWith("-standard")) continue;
    const name = item.name.replace(/-base$/, "");
    const set = deps.get(name) ?? new Set();
    for (const dep of item.registryDependencies ?? []) set.add(dep);
    deps.set(name, set);
  }
  const closure = new Set(["use-fluid-hover"]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const [name, set] of deps) {
      if (closure.has(name)) continue;
      if ([...set].some((dep) => closure.has(dep))) {
        closure.add(name);
        grew = true;
      }
    }
  }
  return closure;
}

/**
 * The standard-hover twin of a registry URL: `r/<path>` becomes
 * `r/standard/<path>` when the item at the end of the path is in `closure`.
 * Anything else (a plain shadcn name, an item without fluid hover) is left
 * alone.
 */
export function standardHoverUrl(url, closure) {
  const prefix = `${REGISTRY_BASE_URL}/`;
  if (typeof url !== "string" || !url.startsWith(prefix)) return url;
  const rel = url.slice(prefix.length);
  if (rel.startsWith("standard/")) return url;
  const name = rel.split("/").pop().replace(/\.json$/, "");
  return closure.has(name) ? `${prefix}standard/${rel}` : url;
}
