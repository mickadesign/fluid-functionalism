// The DataTable playground's rows: the library describing itself, one row
// per component. Pure data (no React), so the playground and the preset's
// install generator read the same rows: an install shows what the
// playground shows.
import { componentList } from "@/lib/docs/components";
import { API_REFERENCE } from "@/lib/docs/api";
import {
  DUAL_FLAVOR_SLUGS,
  FLAVORED_SINGLE_SOURCE_SLUGS,
  FLUID_HOVER_SLUGS,
} from "@/lib/dual-flavor-slugs.mjs";
import { dataTableTagsFor } from "@/lib/preset/data-table-options";

/** The day each component first landed in the repo (its first registry
 *  file in git history). Snapshot: add a row when a component ships. */
export const ADDED: Record<string, string> = {
  accordion: "2026-02-27",
  "ask-user-questions": "2026-05-16",
  badge: "2026-03-09",
  banner: "2026-09-29",
  breadcrumb: "2026-11-08",
  button: "2026-02-16",
  calendar: "2026-10-19",
  card: "2026-07-20",
  "carousel-dots": "2026-09-25",
  "chat-message": "2026-05-28",
  checkbox: "2026-11-04",
  "checkbox-group": "2026-02-16",
  "code-block": "2026-11-14",
  "color-picker": "2026-04-24",
  combobox: "2026-09-06",
  "command-menu": "2026-09-08",
  "context-menu": "2026-11-10",
  "data-table": "2026-11-08",
  "date-picker": "2026-10-19",
  dialog: "2026-02-16",
  dropdown: "2026-02-16",
  field: "2026-11-04",
  input: "2026-11-04",
  "input-copy": "2026-04-03",
  "input-group": "2026-02-16",
  "input-message": "2026-05-16",
  "radio-group": "2026-02-16",
  select: "2026-03-09",
  sidebar: "2026-08-17",
  slider: "2026-03-06",
  switch: "2026-02-16",
  table: "2026-02-16",
  tabs: "2026-04-05",
  textarea: "2026-11-04",
  "thinking-indicator": "2026-02-16",
  "thinking-steps": "2026-04-08",
  tooltip: "2026-03-06",
};

type Primitives = "Radix + Base UI" | "None";

export type ComponentRow = {
  slug: string;
  name: string;
  summary: string;
  website: string;
  primitives: Primitives;
  props: number;
  fluidHover: boolean;
  added: string;
  tags: string[];
  /** The component's parts (its API tables), with sub-rows on. */
  subRows?: ComponentRow[];
};

const dual = new Set<string>(DUAL_FLAVOR_SLUGS);
// Built on both primitives through other parts: the same tag as a
// component with a file per flavor.
const flavoredSingle = new Set<string>(FLAVORED_SINGLE_SOURCE_SLUGS);
const fluid = new Set<string>(FLUID_HOVER_SLUGS);

export function buildRows(): ComponentRow[] {
  return componentList.map(({ slug, name, description }) => ({
    slug,
    name,
    // No em dash in the table (the house style): the catalog's older
    // descriptions still carry a few.
    summary: description.replace(/\s—\s/g, ": "),
    website: `fluidfunctionalism.com/docs/${slug}`,
    primitives: dual.has(slug) || flavoredSingle.has(slug) ? "Radix + Base UI" : "None",
    props: (API_REFERENCE[slug] ?? []).reduce((sum, table) => sum + table.props.length, 0),
    fluidHover: fluid.has(slug),
    added: ADDED[slug] ?? "",
    tags: dataTableTagsFor(slug),
    subRows: partsOf(slug, name),
  }));
}

/** A component's parts, from the same API tables the docs render: one row
 *  per table (DropdownMenu, DropdownTrigger…), when it has more than one. */
function partsOf(slug: string, name: string): ComponentRow[] | undefined {
  const tables = API_REFERENCE[slug] ?? [];
  if (tables.length < 2) return undefined;
  const fluidHover = fluid.has(slug);
  const primitives: Primitives = dual.has(slug) || flavoredSingle.has(slug) ? "Radix + Base UI" : "None";
  return tables.map((t) => ({
    slug: `${slug}/${t.title}`,
    name: t.title,
    summary: `Part of ${name}.`,
    website: `fluidfunctionalism.com/docs/${slug}`,
    primitives,
    props: t.props.length,
    fluidHover,
    added: ADDED[slug] ?? "",
    tags: [],
  }));
}
