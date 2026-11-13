"use client";

import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, PresenceContext, animate, motion, usePresence, useReducedMotion } from "motion/react";
import { spring } from "@/lib/springs";
import {
  useDataTable,
  DataTable,
  DataTableColumnHeader,
  DataTableTitle,
  DataTableSearch,
  DataTableFilters,
  DataTableFilterChips,
  DataTableViewOptions,
  DataTablePagination,
  DataTableSelectionBar,
  selectColumn,
  rowActionsColumn,
  rowHandleColumn,
  useUndoableRows,
  type ColumnDef,
} from "@/registry/default/data-table";
import type { Row, TableState } from "@tanstack/react-table";
import { TooltipGroup } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { MenuItem } from "@/registry/default/menu-item";
import { showUndoToast } from "@/lib/docs/settings-toast";
import { Badge } from "@/registry/default/badge";
import { Switch } from "@/registry/radix/switch";
import {
  PLAY_SWITCH,
  PlayDivider,
  PlaySection,
  PlayField,
  PlaySelect,
  PlaygroundPanel,
} from "@/lib/docs/playground";
import { componentList } from "@/lib/docs/components";
import { API_REFERENCE } from "@/lib/docs/api";
import {
  DUAL_FLAVOR_SLUGS,
  FLAVORED_SINGLE_SOURCE_SLUGS,
  FLUID_HOVER_SLUGS,
} from "@/lib/dual-flavor-slugs.mjs";
import { useIcons } from "@/lib/icon-context";
import { cn } from "@/lib/utils";
import { useShape } from "@/lib/shape-context";
import { useSize, typeClass } from "@/lib/size-context";
import type { PlaygroundProps } from "./types";
import { ViewTabs } from "./view-tabs";
import {
  DATA_TABLE_DEFAULT_CODE,
  DATA_TABLE_PROPS_OPTIONS,
  DATA_TABLE_TAG_OPTIONS,
  dataTableTagsFor,
  DATA_TABLE_PRESET_DEF,
  DEFAULT_DATA_TABLE_STATE,
  decodeDataTablePreset,
  encodeDataTablePreset,
  type DataTableLines,
  type DataTablePlayState,
  type DataTableSearchMode,
} from "@/lib/preset/data-table-options";
import { GetCodeDialog, usePresetGlobals, usePresetUrlSync } from "@/lib/docs/preset-ui";
import { PRESET_GLOBAL_KEYS } from "@/lib/preset/sidebar-options";
import { omit } from "@/lib/omit";

// ── DataTable playground ─────────────────────────────────
// The library describing itself: one row per component, with its props
// count (from the same API tables the docs render), the primitives it
// installs on, whether it uses fluid hover, and the day it was added. The
// controls switch each optional part on and off.

/** The day each component first landed in the repo (its first registry
 *  file in git history). Snapshot: add a row when a component ships. */
const ADDED: Record<string, string> = {
  accordion: "2026-02-27",
  "ask-user-questions": "2026-05-16",
  badge: "2026-03-09",
  banner: "2026-09-29",
  button: "2026-02-16",
  calendar: "2026-10-19",
  card: "2026-07-20",
  "carousel-dots": "2026-09-25",
  "chat-message": "2026-05-28",
  checkbox: "2026-11-04",
  "checkbox-group": "2026-02-16",
  "color-picker": "2026-04-24",
  combobox: "2026-09-06",
  "command-menu": "2026-09-08",
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
    summary: description,
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

// Formatted by hand, not with the viewer's time zone: an ISO day read as a
// local Date can land on the previous day and break hydration.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function formatDay(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export const PRIMITIVE_COLOR = { "Radix + Base UI": "blue", None: "gray" } as const;

// The select editor's options carry the badge colors, so its menu shows
// each option's dot.
const PRIMITIVE_OPTIONS = (Object.keys(PRIMITIVE_COLOR) as Primitives[]).map((value) => ({
  value,
  color: PRIMITIVE_COLOR[value],
}));

const CHIP_RADIUS = { pill: "rounded-full", rounded: "rounded-md", sharp: "rounded-[1px]" };

/** A row's tags as chips that only read: the tags editor's chips, less the
 *  ✕. They sit where the editor's do, so switching editing on moves none. */
function TagChips({ tags, wrap }: { tags: string[]; wrap: boolean }) {
  const shape = useShape();
  const compact = useSize().variant === "compact";
  return (
    <span
      className={cn(
        "flex min-w-0 items-center gap-1",
        wrap
          ? // Wrapped, the chips stack; 2px back so the first sits where the
            // editor's does in its taller field.
            "-my-0.5 flex-wrap"
          : // One line: the 24px chips overhang the line box, and one cut at
            // the cell's edge fades out, as the editor's do.
            "h-[1lh] overflow-x-clip [mask-image:linear-gradient(to_right,black_calc(100%-16px),transparent)]"
      )}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className={cn(
            "inline-flex shrink-0 items-center bg-hover px-2 text-foreground",
            CHIP_RADIUS[shape.variant],
            compact ? "h-5" : "h-6",
            typeClass("caption", compact ? "compact" : "default")
          )}
        >
          {tag}
        </span>
      ))}
    </span>
  );
}

const INSTALL_URL = "https://www.fluidfunctionalism.com/r";

type Lines = DataTableLines;

type Icons = ReturnType<typeof useIcons>;

function buildColumns(o: {
  /** Drag handles, left of the boxes. */
  rowReorder: boolean;
  selection: boolean;
  rowActions: boolean;
  lines: Lines;
  /** The icon set, when headers show icons. */
  icons: Icons | null;
  editable: boolean;
  /** Deletes a row (and its parts), as an undoable step. */
  onDelete: (row: ComponentRow) => void;
}): ColumnDef<ComponentRow>[] {
  const icon = (name: keyof Icons) => (o.icons ? o.icons[name] : undefined);
  // Text wrap on wraps every text column; off, names and links keep one
  // line and the Summary two.
  const wrap = o.lines === "wrap";
  const lines = wrap ? "wrap" : 1;
  return [
    ...(o.rowReorder ? [rowHandleColumn<ComponentRow>()] : []),
    ...(o.selection ? [selectColumn<ComponentRow>()] : []),
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Component" />,
      meta: { label: "Component", lines, icon: icon("square-library"), editor: o.editable ? "text" : undefined },
      enableHiding: false,
    },
    {
      accessorKey: "primitives",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Primitives" />,
      cell: ({ row }) => (
        // The 24px badge overhangs the line box instead of growing the row.
        <span className="flex h-[1lh] min-w-0 items-center">
          <Badge variant="ghost" color={PRIMITIVE_COLOR[row.original.primitives]}>
            {row.original.primitives}
          </Badge>
        </span>
      ),
      meta: {
        label: "Primitives",
        icon: icon("folder"),
        editor: o.editable ? { type: "select", options: PRIMITIVE_OPTIONS } : undefined,
        // The filter lists them with their badge's dot.
        filter: { type: "options", options: PRIMITIVE_OPTIONS },
      },
    },
    {
      accessorKey: "fluidHover",
      header: "Fluid hover",
      cell: ({ row }) => (row.original.fluidHover ? "Yes" : "No"),
      meta: { label: "Fluid hover", icon: icon("star") },
    },
    {
      accessorKey: "props",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Props" />,
      meta: {
        label: "Props",
        className: "tabular-nums",
        icon: icon("sliders-horizontal"),
        editor: o.editable ? { type: "number", options: DATA_TABLE_PROPS_OPTIONS } : undefined,
      },
    },
    {
      accessorKey: "added",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Added" />,
      cell: ({ row }) => formatDay(row.original.added),
      meta: {
        label: "Added",
        className: "tabular-nums whitespace-nowrap",
        icon: icon("calendar"),
        editor: o.editable ? "date" : undefined,
      },
    },
    {
      accessorKey: "tags",
      header: "Tags",
      enableSorting: false,
      // Read only, the same chips without their ✕. Editing swaps in the
      // tags editor, which draws its own.
      cell: ({ row }) => <TagChips tags={row.original.tags} wrap={wrap} />,
      meta: {
        label: "Tags",
        className: "min-w-56",
        icon: icon("tag"),
        // Text wrap wraps the chips too, so none is cut at the edge.
        lines: wrap ? "wrap" : undefined,
        editor: o.editable ? { type: "tags", options: DATA_TABLE_TAG_OPTIONS, creatable: true } : undefined,
      },
    },
    {
      accessorKey: "website",
      header: "Website",
      cell: ({ row }) => (
        <a
          href={`/docs/${row.original.slug.split("/")[0]}`}
          // A new tab: the table keeps its state (selection, filters, edits).
          target="_blank"
          rel="noreferrer"
          className="underline decoration-foreground/30 underline-offset-2 transition-colors duration-80 hover:decoration-foreground"
        >
          {row.original.website}
        </a>
      ),
      // Room for most of the URL before it cuts short.
      meta: {
        label: "Website",
        lines,
        className: "min-w-60",
        icon: icon("link"),
        // The text follows the link; beside it, the cell edits.
        editor: o.editable ? { type: "text", link: true } : undefined,
      },
    },
    {
      accessorKey: "summary",
      header: "Summary",
      // Last of the data columns, so it takes whatever width is left, and
      // at least 256px of it: past that the table scrolls sideways.
      meta: {
        label: "Summary",
        className: "w-full min-w-64",
        lines: wrap ? "wrap" : 1,
        icon: icon("file"),
        editor: o.editable ? "text" : undefined,
      },
    },
    ...(o.rowActions
      ? [
          rowActionsColumn<ComponentRow>((row) => (
            <>
              <MenuItem
                index={0}
                label="Open docs"
                onSelect={() => window.location.assign(`/docs/${row.original.slug}`)}
              />
              <MenuItem
                index={1}
                label="Copy install command"
                onSelect={() =>
                  navigator.clipboard?.writeText(
                    `npx shadcn@latest add ${INSTALL_URL}/${row.original.slug}.json`
                  )
                }
              />
              <MenuItem index={2} label="Delete" destructive onSelect={() => o.onDelete(row.original)} />
            </>
          )),
        ]
      : []),
  ];
}

/** Writes one edit into the rows, a sub-row's into its parent's parts. */
/** The rows without these slugs, at any depth. */
function removeRows(list: ComponentRow[], slugs: readonly string[]): ComponentRow[] {
  return list
    .filter((r) => !slugs.includes(r.slug))
    .map((r) => (r.subRows ? { ...r, subRows: removeRows(r.subRows, slugs) } : r));
}

/** The top-level rows with these slugs moved before or after another. By
 *  slug: with sub-rows off the table holds copies of the rows. */
function moveBySlug(list: ComponentRow[], slugs: readonly string[], target: string, place: "before" | "after"): ComponentRow[] {
  const moved = list.filter((r) => slugs.includes(r.slug));
  const rest = list.filter((r) => !slugs.includes(r.slug));
  const at = rest.findIndex((r) => r.slug === target);
  if (at < 0) return list;
  const index = place === "before" ? at : at + 1;
  return [...rest.slice(0, index), ...moved, ...rest.slice(index)];
}

/** The leading columns' gutter: the tabs start where the first data
 *  column's text does, past the handles and the boxes. */
function gutterClass(o: { rowReorder: boolean; selection: boolean }) {
  return o.rowReorder && o.selection ? "pl-12" : o.selection ? "pl-7" : o.rowReorder ? "pl-5" : undefined;
}

function updateRow(list: ComponentRow[], slug: string, key: string, value: unknown): ComponentRow[] {
  return list.map((r) =>
    r.slug === slug
      ? { ...r, [key]: value }
      : r.subRows
        ? { ...r, subRows: updateRow(r.subRows, slug, key, value) }
        : r
  );
}

// ── State ────────────────────────────────────────────────

// The rail's state lives with the preset codec (lib/preset), so the
// Get code dialog encodes exactly what the preview shows.
type FilterMode = DataTableSearchMode;
type PlayState = DataTablePlayState;
const DEFAULT_STATE: PlayState = DEFAULT_DATA_TABLE_STATE;

function pick<T>(options: readonly T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

/** The pins a one-sided setting keeps, as code: the boxes and the first
 *  column on the left, the row menus on the right. */
export function pinningCode(o: Pick<PlayState, "pinning" | "pinRight" | "selection" | "rowActions" | "rowReorder">) {
  const left = o.pinning ? [...(o.rowReorder ? [`"drag"`] : []), ...(o.selection ? [`"select"`] : []), `"name"`] : [];
  const right = o.pinRight && o.rowActions ? [`"actions"`] : [];
  return `{ left: [${left.join(", ")}], right: [${right.join(", ")}] }`;
}

export function buildDataTablePlaygroundCode(o: PlayState): string {
  const parts = [
    "useDataTable",
    "DataTable",
    "DataTableColumnHeader",
    ...(o.title ? ["DataTableTitle"] : []),
    ...(o.filter !== "none" ? ["DataTableSearch"] : []),
    ...(o.filters ? ["DataTableFilters", "DataTableFilterChips"] : []),
    ...(o.viewMenu ? ["DataTableViewOptions"] : []),
    ...(o.rowActions ? ["rowActionsColumn"] : []),
    ...(o.pagination ? ["DataTablePagination"] : []),
    ...(o.selection ? ["DataTableSelectionBar"] : []),
    ...(o.selection ? ["selectColumn"] : []),
    ...(o.rowReorder ? ["rowHandleColumn", "moveRows"] : []),
    "type ColumnDef",
  ];
  // Saved views come with filters: they save what the filters set.
  const views = o.views && o.filters;
  // Rows that change (edits, moves) live in state.
  const held = o.editable || o.rowReorder;
  // Rows moved by hand start unsorted: under a sort, a move first asks to
  // remove it.
  const sorting = o.rowReorder ? "[]" : `[{ id: "added", desc: true }]`;
  const gutter = gutterClass(o);
  const viewTabsCode = [
    `    <Tabs selectedIndex={viewIndex} onSelect={openView} aria-label="Views">`,
    `      {["All", ...views.map((v) => v.name)].map((name, i) => (`,
    `        <TabsItem key={name} index={i} label={name} />`,
    `      ))}`,
    `    </Tabs>`,
  ];
  const toolbar = o.filter !== "none" || o.filters || o.viewMenu || views;
  // Two icons or more on the row share one gliding tooltip bubble.
  const grouped = [o.filters, o.viewMenu, o.filter !== "none"].filter(Boolean).length > 1;
  const filter =
    o.filter === "column"
      ? `    <DataTableSearch table={table} column="name" placeholder="Search components…" />`
      : `    <DataTableSearch table={table} placeholder="Search all columns…" />`;
  return [
    `import {`,
    `  ${parts.join(", ")},`,
    `} from "./components";`,
    ...(o.rowActions ? [`import { MenuItem, Badge } from "./components";`] : [`import { Badge } from "./components";`]),
    ...(views ? [`import { Button, Tabs, TabsItem, type TableState } from "./components";`] : []),
    ...(grouped ? [`import { TooltipGroup } from "./components";`] : []),
    ...(o.headerIcons
      ? [`import { SquareLibrary, Folder, Star, SlidersHorizontal, Calendar, Tag, Link, File } from "lucide-react";`]
      : []),
    ``,
    `const columns: ColumnDef<ComponentRow>[] = [`,
    ...(o.rowReorder ? [`  rowHandleColumn<ComponentRow>(),`] : []),
    ...(o.selection ? [`  selectColumn<ComponentRow>(),`] : []),
    `  {`,
    `    accessorKey: "name",`,
    `    header: ({ column }) => <DataTableColumnHeader column={column} title="Component" />,`,
    `    enableHiding: false,`,
    ...(o.headerIcons || o.editable
      ? [`    meta: { ${[`lines: ${o.lines === "wrap" ? `"wrap"` : 1}`, o.headerIcons && "icon: SquareLibrary", o.editable && `editor: "text"`].filter(Boolean).join(", ")} },`]
      : [`    meta: { lines: ${o.lines === "wrap" ? `"wrap"` : 1} },`]),
    `  },`,
    `  {`,
    `    accessorKey: "primitives",`,
    `    header: ({ column }) => <DataTableColumnHeader column={column} title="Primitives" />,`,
    `    cell: ({ row }) => <Badge variant="ghost" color="blue">{row.original.primitives}</Badge>,`,
    ...(o.headerIcons || o.editable
      ? [
          `    meta: { ${[o.headerIcons && "icon: Folder", o.editable &&
              `editor: { type: "select", options: [{ value: "Radix + Base UI", color: "blue" }, { value: "None", color: "gray" }] }`].filter(Boolean).join(", ")} },`,
        ]
      : []),
    `  },`,
    `  { accessorKey: "fluidHover", header: "Fluid hover"${o.headerIcons ? ", meta: { icon: Star }" : ""} },`,
    `  {`,
    `    accessorKey: "props",`,
    `    header: ({ column }) => <DataTableColumnHeader column={column} title="Props" />,`,
    ...(o.headerIcons || o.editable
      ? [
          `    meta: { ${[o.headerIcons && "icon: SlidersHorizontal", o.editable && `editor: { type: "number", options: [${DATA_TABLE_PROPS_OPTIONS.join(", ")}] }`].filter(Boolean).join(", ")} },`,
        ]
      : []),
    `  },`,
    `  {`,
    `    accessorKey: "added",`,
    `    header: ({ column }) => <DataTableColumnHeader column={column} title="Added" />,`,
    ...(o.headerIcons || o.editable
      ? [`    meta: { ${[o.headerIcons && "icon: Calendar", o.editable && `editor: "date"`].filter(Boolean).join(", ")} },`]
      : []),
    `  },`,
    `  {`,
    `    accessorKey: "tags",`,
    `    header: "Tags",`,
    `    enableSorting: false,`,
    `    cell: ({ row }) => <TagChips tags={row.original.tags} />,`,
    `    meta: { className: "min-w-56"${o.headerIcons ? ", icon: Tag" : ""}${o.lines === "wrap" ? ', lines: "wrap"' : ""}${o.editable ? `, editor: { type: "tags", options: [${DATA_TABLE_TAG_OPTIONS.map((t) => `"${t}"`).join(", ")}], creatable: true }` : ""} },`,
    `  },`,
    `  {`,
    `    accessorKey: "website",`,
    `    header: "Website",`,
    `    cell: ({ row }) => <a href={row.original.href}>{row.original.website}</a>,`,
    `    meta: { className: "min-w-60", lines: ${o.lines === "wrap" ? `"wrap"` : 1}${o.headerIcons ? ", icon: Link" : ""}${o.editable ? `, editor: { type: "text", link: true }` : ""} },`,
    `  },`,
    `  {`,
    `    accessorKey: "summary",`,
    `    header: "Summary",`,
    `    meta: { className: "w-full min-w-64", lines: ${o.lines === "wrap" ? `"wrap"` : 1}${o.headerIcons ? ", icon: File" : ""}${o.editable ? `, editor: "text"` : ""} },`,
    `  },`,
    ...(o.rowActions
      ? [
          `  rowActionsColumn<ComponentRow>((row) => (`,
          `    <>`,
          `      <MenuItem index={0} label="Open docs" onSelect={() => openDocs(row.original)} />`,
          `      <MenuItem index={1} label="Copy install command" onSelect={() => copyInstall(row.original)} />`,
          `    </>`,
          `  )),`,
        ]
      : []),
    `];`,
    ``,
    ...(held ? [`const [rows, setRows] = useState(components);`, ``] : []),
    `const table = useDataTable({`,
    `  data: ${held ? "rows" : "components"},`,
    `  columns,`,
    `  pageSize: ${o.pagination ? o.pageSize : "components.length"},`,
    ...(o.expandable ? [`  // A row with parts opens into them.`, `  getSubRows: (row) => row.subRows,`] : []),
    ...(!o.pinning
      ? [`  // No sticky left columns, and no Freeze item in the header menus.`, `  enableColumnPinning: false,`]
      : []),
    `  initialState: {`,
    ...(o.rowReorder ? [] : [`    sorting: ${sorting},`]),
    `    columnVisibility: { fluidHover: false },`,
    ...(o.pinning !== o.pinRight ? [`    // Sticky on one side only.`, `    columnPinning: ${pinningCode(o)},`] : []),
    `  },`,
    `});`,
    ``,
    ...(views
      ? [
          `// Saved views: the table's state, named (filters, search, sort, columns).`,
          `const [views, setViews] = useState<{ name: string; state: Partial<TableState> }[]>([]);`,
          `const [viewIndex, setViewIndex] = useState(0);`,
          `const allView = { columnFilters: [], globalFilter: "", sorting: ${sorting}, columnOrder: [], columnVisibility: { fluidHover: false } };`,
          `const openView = (i: number) => {`,
          `  const view = i === 0 ? allView : views[i - 1].state;`,
          `  table.setState((old) => ({ ...old, ...view, pagination: { ...old.pagination, pageIndex: 0 } }));`,
          `  setViewIndex(i);`,
          `};`,
          `const saveView = () => {`,
          `  const { columnFilters, globalFilter, sorting, columnOrder, columnVisibility } = table.getState();`,
          `  setViews((old) => [...old, { name: \`View \${old.length + 1}\`, state: { columnFilters, globalFilter, sorting, columnOrder, columnVisibility } }]);`,
          `  setViewIndex(views.length + 1);`,
          `};`,
          `// Save view shows once the table differs from the open view.`,
          `const viewKeys = ["columnFilters", "globalFilter", "sorting", "columnOrder", "columnVisibility"] as const;`,
          `const snapshot = (state: Partial<TableState>) => JSON.stringify(viewKeys.map((key) => state[key] ?? null));`,
          `const changed = snapshot(table.getState()) !== snapshot(viewIndex === 0 ? allView : views[viewIndex - 1].state);`,
          ``,
        ]
      : []),
    `<div className="flex flex-col gap-2">`,
    ...(toolbar || o.title
      ? [
          `  <div className="${o.title ? "mb-1 " : ""}flex flex-wrap items-center gap-1">`,
          ...(o.title ? [`    <DataTableTitle table={table}>Components</DataTableTitle>`] : []),
          // Without a title the saved views share the tools' row.
          ...(views && !o.title
            ? [
                `    <div className="min-w-0 flex-1${gutter ? ` ${gutter}` : ""}">`,
                `      {views.length > 0 && (`,
                ...viewTabsCode.map((line) => `    ${line}`),
                `      )}`,
                `    </div>`,
              ]
            : [`    <span className="ml-auto" />`]),
          ...(grouped ? [`    <TooltipGroup>`] : []),
          ...[
            ...(o.filters ? [`    <DataTableFilters table={table} />`] : []),
            ...(o.viewMenu ? [`    <DataTableViewOptions table={table} />`] : []),
            ...(o.filter !== "none" ? [filter] : []),
          ].map((line) => (grouped ? `  ${line}` : line)),
          ...(grouped ? [`    </TooltipGroup>`] : []),
          `  </div>`,
        ]
      : []),
    ...(views && o.title
      ? [
          `  {views.length > 0 && (`,
          ...(gutter ? [`    <div className="${gutter}">`] : []),
          ...viewTabsCode.map((line) => (gutter ? `  ${line}` : line)),
          ...(gutter ? [`    </div>`] : []),
          `  )}`,
        ]
      : []),
    ...(o.filters
      ? views
        ? [
            `  {/* Save view after the chips' + Add filter, with the first filter. */}`,
            `  <DataTableFilterChips table={table}>`,
            `    {changed && <Button variant="ghost" size="compact" onClick={saveView}>Save view</Button>}`,
            `  </DataTableFilterChips>`,
          ]
        : [`  <DataTableFilterChips table={table} />`]
      : []),
    ...(held
      ? [
          `  <DataTable`,
          `    table={table}${o.resize ? " resizeColumns" : ""}${o.reorder ? " reorderColumns" : ""}${o.align !== "auto" ? ` cellAlign="${o.align}"` : ""}`,
          ...(o.editable
            ? [
                `    // Each edit writes back to your data; the table shows what it holds.`,
                `    onCellEdit={({ row, columnId, value }) =>`,
                `      setRows((old) => old.map((r) => (r.slug === row.original.slug ? { ...r, [columnId]: value } : r)))`,
                `    }`,
              ]
            : []),
          ...(o.rowReorder
            ? [
                `    // Drag a handle, or Alt + ↑ / ↓ on a row. Under a sort, the table asks to remove it first.`,
                `    onRowReorder={(move) => setRows((old) => moveRows(old, move))}`,
              ]
            : []),
          `  />`,
        ]
      : [
          `  <DataTable table={table}${o.resize ? " resizeColumns" : ""}${o.reorder ? " reorderColumns" : ""}${o.align !== "auto" ? ` cellAlign="${o.align}"` : ""} />`,
        ]),
    ...(o.pagination ? [`  <DataTablePagination table={table} />`] : []),
    ...(o.selection
      ? [
          `  <DataTableSelectionBar`,
          `    table={table}`,
          `    actions={(rows) => [`,
          `      { value: "install", label: "Copy install command", onSelect: () => copyInstall(rows) },`,
          `      { value: "names", label: "Copy names", onSelect: () => copyNames(rows) },`,
          `    ]}`,
          `  />`,
        ]
      : []),
    `</div>`,
  ].join("\n");
}

/** The selection bar's actions, for the selected components. */
function selectionActions(rows: Row<ComponentRow>[], icons: Icons, onDelete: (rows: Row<ComponentRow>[]) => void) {
  return [
    {
      value: "delete",
      label: rows.length === 1 ? "Delete" : `Delete ${rows.length} rows`,
      icon: icons.x,
      destructive: true,
      onSelect: () => onDelete(rows),
    },
    {
      value: "install",
      label: "Copy install command",
      icon: icons.copy,
      onSelect: () =>
        navigator.clipboard?.writeText(
          `npx shadcn@latest add ${rows.map((r) => `${INSTALL_URL}/${r.original.slug}.json`).join(" ")}`
        ),
    },
    {
      value: "names",
      label: "Copy names",
      icon: icons.file,
      onSelect: () => navigator.clipboard?.writeText(rows.map((r) => r.original.name).join("\n")),
    },
  ];
}

// ── Saved views ──────────────────────────────────────────

type SavedView = {
  /** Stable through renames and reorders: the tab's key, so a dragged tab
   *  (and its focus) moves with its view. */
  id: number;
  name: string;
  state: Pick<TableState, "columnFilters" | "globalFilter" | "sorting" | "columnOrder" | "columnVisibility">;
};

/** JSON with sorted keys, so two states compare by their values. */
function stableJson(value: unknown): string {
  return JSON.stringify(value, (_, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v
  );
}

/** Only the hidden columns: an empty visibility and one listing every
 *  column as shown say the same thing. */
const visibleOnly = (visibility: Record<string, boolean> | undefined) =>
  Object.keys(visibility ?? {}).filter((id) => visibility?.[id] === false).sort();

/** The "All" view: the table as it starts. */
const ALL_VIEW: SavedView["state"] = {
  columnFilters: [],
  globalFilter: "",
  sorting: [{ id: "added", desc: true }],
  columnOrder: [],
  columnVisibility: { fluidHover: false },
};

// ── Playground ───────────────────────────────────────────

/** The views' tab row as it comes and goes (the first saved view, the
 *  last deleted): its height springs from 0 and back, measured, never
 *  "auto", with the column's gap folded in, so the table glides. The same
 *  reveal DataTableFilterChips gives its row. */
function RowReveal({ show, children }: { show: boolean; children: ReactNode }) {
  return <AnimatePresence initial={false}>{show && <RowRevealPart key="row">{children}</RowRevealPart>}</AnimatePresence>;
}

function RowRevealPart({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isPresent, safeToRemove] = usePresence();
  const initial = useContext(PresenceContext)?.initial;
  const reduceMotion = useReducedMotion();
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (isPresent && initial === false) return;
    const gap = Number.parseFloat(getComputedStyle(el.parentElement ?? el).rowGap) || 0;
    const height = el.offsetHeight;
    if (reduceMotion) {
      const fade = animate(el, { opacity: isPresent ? [0, 1] : 0 }, { duration: 0.12 });
      if (!isPresent) fade.then(() => safeToRemove?.());
      return () => fade.stop();
    }
    // clip, not hidden: hidden makes the row a scroll container, and a
    // field focused inside it as it grows (a new chip's input, a view's
    // name) scrolled the row to show it, shifting its content, which then
    // jumped back when the clip came off.
    el.style.overflow = "clip";
    // The start, set before this frame paints: animate() only applies its
    // first keyframe on the next one, which showed the row whole for a frame.
    if (isPresent) {
      el.style.height = "0px";
      el.style.marginTop = `${-gap}px`;
      el.style.opacity = "0";
    }
    const run = isPresent
      ? animate(el, { height: [0, height], marginTop: [-gap, 0], opacity: [0, 1] }, { ...spring.moderate })
      : animate(el, { height: [height, 0], marginTop: [0, -gap], opacity: [1, 0] }, { ...spring.moderate, ...spring.moderate.exit });
    const clear = () => {
      el.style.height = "";
      el.style.marginTop = "";
      el.style.overflow = "";
      el.style.opacity = "";
    };
    run.then(() => (isPresent ? clear() : safeToRemove?.()));
    // Stopped early (a re-run, Strict Mode's double effect): back to its
    // natural size, so the next run measures the real height.
    return () => {
      run.stop();
      if (isPresent) clear();
    };
  }, [isPresent]); // runs as it enters and as it leaves
  return <div ref={ref}>{children}</div>;
}

export function DataTablePlayground({ children }: PlaygroundProps) {
  const [state, setState] = useState<PlayState>(DEFAULT_STATE);
  // The settings as of the latest change, for callbacks that outlive the
  // render they were made in.
  const stateRef = useRef(state);
  // Loading: held by the switch, or played as a 1.5s fetch by the preview's
  // reload button, so the skeleton-to-data hand-over can be watched.
  const [loading, setLoading] = useState(false);
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reload = () => {
    if (reloadTimer.current) clearTimeout(reloadTimer.current);
    setLoading(true);
    reloadTimer.current = setTimeout(() => setLoading(false), 1500);
  };
  // Expanded, the table fills the layer's height (search and pagination
  // pinned, the rows scrolling between them).
  const [expanded, setExpanded] = useState(false);
  // Edits and deletes are undoable steps (⌘Z / ⇧⌘Z in the table). Nothing
  // is saved: a refresh brings every row back.
  const history = useUndoableRows(buildRows, { getId: (r) => r.slug });
  const data = history.rows;
  const { apply: applyStep, undoTo, stepCount } = history;
  // A delete says what went, with its way back to before it.
  // Read through a ref: the step count changes with every edit, and as a
  // dependency it rebuilt this, then the columns (their Delete item calls
  // it), then every cell of the table, on each one.
  const stepCountRef = useRef(stepCount);
  useEffect(() => {
    stepCountRef.current = stepCount;
  });
  const deleteRows = useCallback(
    (slugs: string[], label: string) => {
      const before = stepCountRef.current;
      applyStep(label, (old) => removeRows(old, slugs));
      showUndoToast(label, () => undoTo(before));
    },
    [applyStep, undoTo]
  );
  // Sub-rows on, the rows carry their parts; off, they're left out (a new
  // array, so the table builds its rows again).
  // One copy per row, kept: a new copy of every row on every edit would
  // tell the table every record had changed, and it would render them all.
  const flatRows = useRef(new WeakMap<ComponentRow, ComponentRow>());
  const tableData = useMemo(
    () =>
      state.expandable
        ? data
        : data.map((r) => {
            let flat = flatRows.current.get(r);
            if (!flat) flatRows.current.set(r, (flat = { ...r, subRows: undefined }));
            return flat;
          }),
    [data, state.expandable]
  );
  const icons = useIcons();
  const columns = useMemo(
    () =>
      buildColumns({
        rowReorder: state.rowReorder,
        selection: state.selection,
        rowActions: state.rowActions,
        lines: state.lines,
        icons: state.headerIcons ? icons : null,
        editable: state.editable,
        onDelete: (row) => deleteRows([row.slug], `Deleted ${row.name}`),
      }),
    [state.rowReorder, state.selection, state.rowActions, state.lines, state.headerIcons, state.editable, icons, deleteRows]
  );

  const table = useDataTable({
    data: tableData,
    columns,
    pageSize: Number(DEFAULT_STATE.pageSize),
    getRowId: (row) => row.slug,
    getSubRows: (row) => row.subRows,
    // Off with the sticky left columns: the header menus drop Freeze.
    enableColumnPinning: state.pinning,
    initialState: {
      sorting: [{ id: "added", desc: true }],
      columnVisibility: { fluidHover: false },
      // Set by hand rather than left to useDataTable, which pins nothing
      // when the table starts with pinning off.
      columnPinning: { left: ["drag", "select", "name"], right: ["actions"] },
    },
  });

  // Each change lands on TanStack's state as well as the playground's, so
  // nothing hidden keeps acting: a cleared filter, a dropped selection.
  const apply = (next: PlayState, { animate = true }: { animate?: boolean } = {}) => {
    // Compared with the latest settings, not this render's: apply also runs
    // from callbacks set up earlier (the expand / collapse).
    const prev = stateRef.current;
    stateRef.current = next;
    // Columns, wrapping and alignment changes below animate from here; the
    // expand / collapse swap doesn't, since the layer's own motion carries
    // it (a row-height spring there let the table overflow the shrinking box).
    // Header icons don't either: they change every width at once, and cells
    // sliding in from their old places while the widths snap read as a
    // glitch.
    if (animate && next.headerIcons === prev.headerIcons) table.captureLayout();
    if (next.filter !== prev.filter) {
      table.resetColumnFilters();
      table.setGlobalFilter("");
    }
    if (!next.selection) table.resetRowSelection();
    if (!next.viewMenu) table.resetColumnVisibility();
    // Header icons widen the headers: the widths are read again too.
    // Sub-rows widen the first column to fit their names: read again too.
    if (!next.resize || next.headerIcons !== prev.headerIcons || next.expandable !== prev.expandable)
      table.resetColumnSizing();
    if (!next.expandable) table.resetExpanded();
    if (!next.reorder) table.resetColumnOrder();
    // Rows moved by hand start unsorted (under a sort, a move first asks
    // to remove it);
    // off, the starting sort comes back.
    if (next.rowReorder !== prev.rowReorder) table.setSorting(next.rowReorder ? [] : ALL_VIEW.sorting);
    if (!next.filters) table.resetColumnFilters();
    // Each side sticks on its own: the left the boxes and the first
    // column, the right the row menus (useDataTable's own pins).
    if (next.pinning !== prev.pinning || next.pinRight !== prev.pinRight)
      table.setColumnPinning({
        left: next.pinning ? (table.initialState.columnPinning.left ?? []) : [],
        right: next.pinRight ? (table.initialState.columnPinning.right ?? []) : [],
      });
    // The Text wrap switch sets the columns' own lines; a wrap chosen in the
    // Columns menu would otherwise sit on top of it.
    if (next.lines !== prev.lines)
      for (const id of ["name", "website", "summary"]) table.setColumnLines(id, undefined);
    table.setPageSize(next.pagination ? Number(next.pageSize) : data.length);
    table.setPageIndex(0);
    setState(next);
  };
  const set = <K extends keyof PlayState>(key: K, value: PlayState[K]) =>
    apply({ ...stateRef.current, [key]: value });

  // ── Get code (presets) ─────────────────────────────────
  const globals = usePresetGlobals();
  const presetCode = encodeDataTablePreset({ ...state, ...globals });
  usePresetUrlSync(presetCode, DATA_TABLE_DEFAULT_CODE, (raw) => {
    const res = decodeDataTablePreset(raw);
    // The globals stay with the site settings; the rail takes the rest.
    if (res.ok) apply(omit(res.preset, PRESET_GLOBAL_KEYS) as PlayState, { animate: false });
  });

  const randomize = () =>
    apply({
      filter: pick(["column", "column", "all", "none"] as const),
      viewMenu: Math.random() > 0.3,
      selection: Math.random() > 0.3,
      rowActions: Math.random() > 0.3,
      pagination: Math.random() > 0.2,
      pageSize: pick(["5", "10", "20"] as const),
      resize: Math.random() > 0.3,
      reorder: Math.random() > 0.3,
      lines: pick(["2", "wrap"] as const),
      align: pick(["auto", "auto", "center", "top"] as const),
      headerIcons: Math.random() > 0.3,
      editable: Math.random() > 0.5,
      expandable: Math.random() > 0.5,
      filters: Math.random() > 0.5,
      pinning: Math.random() > 0.3,
      pinRight: Math.random() > 0.3,
      title: Math.random() > 0.3,
      views: Math.random() > 0.3,
      rowReorder: Math.random() > 0.7,
    });

  // ── Saved views ────────────────────────────────────────
  // A view is the table's state, named: its filters, search, sort, column
  // order and visible columns. "All" is the table as it starts. Kept in
  // memory: a refresh starts over.
  const [views, setViews] = useState<SavedView[]>([]);
  const [viewIndex, setViewIndex] = useState(0);
  // "All" is unsorted while rows move by hand.
  const allView = state.rowReorder ? { ...ALL_VIEW, sorting: [] } : ALL_VIEW;
  const openView = (i: number) => {
    const view = i === 0 ? allView : views[i - 1]?.state;
    if (!view) return;
    table.captureLayout();
    table.setState((old) => ({ ...old, ...view, pagination: { ...old.pagination, pageIndex: 0 } }));
    setViewIndex(i);
  };
  // A view just saved opens for naming in its tab (ViewTabs).
  const [nameNext, setNameNext] = useState<number | null>(null);
  const deleteView = (at: number) => {
    const view = views[at];
    if (!view) return;
    setViews((old) => old.filter((_, i) => i !== at));
    openView(0);
    // Its way back: the view returns to its place, open.
    showUndoToast(`Deleted ${view.name}`, () => {
      setViews((old) => [...old.slice(0, at), view, ...old.slice(at)]);
      table.setState((old) => ({ ...old, ...view.state, pagination: { ...old.pagination, pageIndex: 0 } }));
      setViewIndex(at + 1);
    });
  };
  const saveView = () => {
    const { columnFilters, globalFilter, sorting, columnOrder, columnVisibility } = table.getState();
    const name = `View ${views.length + 1}`;
    const id = (views.reduce((max, v) => Math.max(max, v.id), 0) || 0) + 1;
    setViews((old) => [...old, { id, name, state: { columnFilters, globalFilter, sorting, columnOrder, columnVisibility } }]);
    setViewIndex(views.length + 1);
    // Ask for its name in place, on the new tab.
    setNameNext(views.length + 1);
  };

  // Saved views come with filters: they save what the filters set.
  const showViews = state.views && state.filters;
  // Save view shows once the table differs from the open view: there's
  // nothing new to save before.
  const viewChanged = (() => {
    const open = viewIndex === 0 ? allView : views[viewIndex - 1]?.state;
    if (!open) return true;
    const now = table.getState();
    const same = (a: unknown, b: unknown) => stableJson(a) === stableJson(b);
    return !(
      same(now.columnFilters, open.columnFilters) &&
      same(now.globalFilter ?? "", open.globalFilter ?? "") &&
      same(now.sorting, open.sorting) &&
      same(now.columnOrder, open.columnOrder) &&
      same(visibleOnly(now.columnVisibility), visibleOnly(open.columnVisibility))
    );
  })();

  // A tab dragged (or Alt + ← / →) to another place: its view moves, and
  // the open view stays open wherever it lands.
  const moveView = (from: number, to: number) => {
    setViews((old) => {
      const next = [...old];
      const [moved] = next.splice(from - 1, 1);
      next.splice(to - 1, 0, moved);
      return next;
    });
    setViewIndex((cur) =>
      cur === from ? to : cur > Math.min(from, to) && cur <= Math.max(from, to) ? cur + (from < to ? -1 : 1) : cur
    );
  };
  // The views as subtle tabs. A lone "All" tab says nothing, so they wait
  // for the first saved view. Past a selection column they start where the
  // first data column does, 28px in, like the title and the chips: the edge
  // they share with the table when there are no boxes.
  const tabsShown = showViews && views.length > 0;
  const viewTabs = (
    <ViewTabs
      first="All"
      views={views}
      selected={viewIndex}
      onSelect={openView}
      onRename={(at, name) => setViews((old) => old.map((v, i) => (i === at ? { ...v, name } : v)))}
      onDelete={deleteView}
      onMove={moveView}
      nameRequest={nameNext}
      onNameRequested={() => setNameNext(null)}
      className={gutterClass(state)}
    />
  );
  const tools = state.filter !== "none" || state.filters || state.viewMenu || showViews;
  // One row: the title on the left (or, without one, the saved views); the
  // Filter button, the Columns button and the search at the right end.
  // Added filters sit on their own row under it, above the table.
  const toolbar = (state.title || tools) && (
    // 12px under the title (the stack's 8px plus 4): the heading stands a
    // step off the table, while the tabs, chips and table keep 8px between
    // them as one unit.
    <div className={cn("flex flex-wrap items-center gap-1", state.title && "mb-1")}>
      {/* font-heading-display: the site's Heading font setting reaches the
          title (a site class, so the generated code leaves it out). */}
      {state.title && (
        <DataTableTitle table={table} className="font-heading-display">
          Components
        </DataTableTitle>
      )}
      {state.title ? (
        <span className="ml-auto" />
      ) : (
        // No title: the views share the row with the tools, tabs from the
        // left edge and the icons at the right end. They fade in with the
        // first saved view (the row is already there, so nothing moves),
        // and scroll sideways inside their share once they outgrow it.
        <div className="min-w-0 flex-1">
          <AnimatePresence initial={false}>
            {tabsShown && (
              <motion.div
                key="views"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: spring.fast.exit }}
                transition={spring.fast}
              >
                {viewTabs}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      {/* The icons share one tooltip bubble that glides between them. */}
      <TooltipGroup>
        {state.filters && <DataTableFilters table={table} />}
        {state.viewMenu && <DataTableViewOptions table={table} />}
        {state.filter !== "none" && (
          <DataTableSearch
            // Remounts the field when the mode flips, so it starts empty.
            key={state.filter}
            table={table}
            column={state.filter === "column" ? "name" : undefined}
            placeholder={state.filter === "column" ? "Search components…" : "Search all columns…"}
          />
        )}
      </TooltipGroup>
    </div>
  );

  const filterCount = table.getState().columnFilters.length;

  const body = (
    <div className={cn("flex w-full flex-col gap-2", expanded && "h-full")}>
      {toolbar}
      {/* Under a title the views get a row of their own; without one they
          sit on the tools' row (see the toolbar). */}
      {state.title && <RowReveal show={tabsShown}>{viewTabs}</RowReveal>}
      {state.filters && (
        // Save view after the chips' + Add filter, once the table differs
        // from the open view. The row is the filters': with none set it
        // stays away, and a moved column alone doesn't bring it.
        <DataTableFilterChips table={table}>
          {showViews && viewChanged && (
            <Button variant="ghost" size="compact" onClick={saveView}>
              Save view
            </Button>
          )}
        </DataTableFilterChips>
      )}
      <DataTable
        table={table}
        resizeColumns={state.resize}
        reorderColumns={state.reorder}
        cellAlign={state.align}
        fill={expanded}
        loading={loading}
        // With filters set, the table's own default says to remove one and
        // offers Clear filter(s); a search alone gets a different word.
        // Every row deleted reads as that, with its way back; a search or
        // filters that find nothing say so instead.
        empty={
          data.length === 0
            ? {
                title: "No components left",
                description: "Undo brings back what you deleted.",
                action: history.canUndo ? (
                  <Button variant="ghost" size="compact" onClick={history.undo}>
                    Undo
                  </Button>
                ) : undefined,
              }
            : filterCount > 0
              ? { title: "No components match" }
              : { title: "No components match", description: "Try a name like Dialog or Tabs." }
        }
        onCellEdit={
          state.editable
            ? ({ row, columnId, value }) =>
                history.apply(
                  `Edited ${row.original.name}`,
                  (old) => updateRow(old, row.original.slug, columnId, value),
                  `${row.original.slug}:${columnId}`
                )
            : undefined
        }
        onRowReorder={
          state.rowReorder
            ? (move) =>
                history.apply(
                  move.rows.length === 1 ? `Moved ${move.rows[0].original.name}` : `Moved ${move.rows.length} rows`,
                  (old) => moveBySlug(old, move.rows.map((r) => r.original.slug), move.target.original.slug, move.place)
                )
            : undefined
        }
        onUndo={history.undo}
        onRedo={history.redo}
      />
      {state.pagination && <DataTablePagination table={table} />}
      {state.selection && (
        <DataTableSelectionBar
          table={table}
          actions={(rows) =>
            selectionActions(rows, icons, (picked) => {
              deleteRows(
                picked.map((r) => r.original.slug),
                picked.length === 1 ? `Deleted ${picked[0].original.name}` : `Deleted ${picked.length} rows`
              );
              table.resetRowSelection();
            })
          }
        />
      )}
    </div>
  );

  // The rail redraws only when its own settings do, not on every change to
  // the table's state (a Shift + arrow step re-rendered every control).
  // Its handlers read the latest settings through stateRef.
  const controls = useMemo(
    () => (
      <PlaygroundPanel onShuffle={randomize}>
        <PlaySection label="Top bar" />
        <Switch
          label="Title"
          checked={state.title}
          onToggle={() => set("title", !state.title)}
          className={PLAY_SWITCH}
        />
        <PlayField label="Search">
          <PlaySelect
            value={state.filter}
            onChange={(v) => set("filter", v as FilterMode)}
            options={[
              { value: "column", label: "By name" },
              { value: "all", label: "Every column" },
              { value: "none", label: "None" },
            ]}
          />
        </PlayField>
        <Switch
          label="Filters"
          checked={state.filters}
          onToggle={() => set("filters", !state.filters)}
          className={PLAY_SWITCH}
        />
        {/* Saved views save what the filters set: off without them. */}
        <Switch
          label="Saved views"
          checked={state.views && state.filters}
          disabled={!state.filters}
          onToggle={() => set("views", !state.views)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Columns menu"
          checked={state.viewMenu}
          onToggle={() => set("viewMenu", !state.viewMenu)}
          className={PLAY_SWITCH}
        />
        <PlayDivider />
        <PlaySection label="Columns" />
        <Switch
          label="Header icons"
          checked={state.headerIcons}
          onToggle={() => set("headerIcons", !state.headerIcons)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Resize columns"
          checked={state.resize}
          onToggle={() => set("resize", !state.resize)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Reorder columns"
          checked={state.reorder}
          onToggle={() => set("reorder", !state.reorder)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Sticky left columns"
          checked={state.pinning}
          onToggle={() => set("pinning", !state.pinning)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Sticky right column"
          checked={state.pinRight}
          onToggle={() => set("pinRight", !state.pinRight)}
          className={PLAY_SWITCH}
        />
        <PlayDivider />
        <PlaySection label="Rows" />
        <Switch
          label="Row selection"
          checked={state.selection}
          onToggle={() => set("selection", !state.selection)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Row actions"
          checked={state.rowActions}
          onToggle={() => set("rowActions", !state.rowActions)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Reorder rows"
          checked={state.rowReorder}
          onToggle={() => set("rowReorder", !state.rowReorder)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Sub-rows"
          checked={state.expandable}
          onToggle={() => set("expandable", !state.expandable)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Editable cells"
          checked={state.editable}
          onToggle={() => set("editable", !state.editable)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Text wrap"
          checked={state.lines === "wrap"}
          onToggle={() => set("lines", state.lines === "wrap" ? "2" : "wrap")}
          className={PLAY_SWITCH}
        />
        <PlayField label="Cell alignment">
          <PlaySelect
            value={state.align}
            onChange={(v) => set("align", v as PlayState["align"])}
            options={[
              { value: "auto", label: "Auto" },
              { value: "center", label: "Center" },
              { value: "top", label: "Top" },
            ]}
          />
        </PlayField>
        <Switch
          label="Pagination"
          checked={state.pagination}
          onToggle={() => set("pagination", !state.pagination)}
          className={PLAY_SWITCH}
        />
        <PlayField label="Rows per page" disabled={!state.pagination}>
          <PlaySelect
            value={state.pageSize}
            onChange={(v) => set("pageSize", v as PlayState["pageSize"])}
            options={[
              { value: "5", label: "5" },
              { value: "10", label: "10" },
              { value: "20", label: "20" },
            ]}
          />
        </PlayField>
        <Switch
          label="Loading"
          checked={loading}
          onToggle={() => {
            if (reloadTimer.current) clearTimeout(reloadTimer.current);
            setLoading(!loading);
          }}
          className={PLAY_SWITCH}
        />
        <PlayDivider />
        {/* shadcn's preset principle: the exact configuration above, as a
            stateless code the registry can turn into an installable block. */}
        <GetCodeDialog def={DATA_TABLE_PRESET_DEF} code={presetCode} />
      </PlaygroundPanel>
    ),
    [state, loading, presetCode]
  );

  // Expanded, the table has the window's height to fill: 20 rows a page,
  // the size before restored once it settles back on the page.
  const sizeBeforeExpand = useRef<PlayState["pageSize"] | null>(null);
  const onExpandedChange = (next: boolean) => {
    setExpanded(next);
    const latest = stateRef.current;
    if (next) {
      sizeBeforeExpand.current = latest.pageSize;
      apply({ ...latest, pagination: true, pageSize: "20" }, { animate: false });
    } else if (sizeBeforeExpand.current) {
      apply({ ...latest, pageSize: sizeBeforeExpand.current }, { animate: false });
      sizeBeforeExpand.current = null;
    }
  };

  return children({
    onExpandedChange,
    onReplay: reload,
    preview: <div className={cn("w-full px-4 py-8 sm:px-6", expanded && "h-full")}>{body}</div>,
    demoPreview: <div className="w-full">{body}</div>,
    demoMaxWidth: 640,
    controls,
    code: buildDataTablePlaygroundCode(state),
  });
}
