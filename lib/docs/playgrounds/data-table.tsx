"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  useUndoableRows,
  type ColumnDef,
} from "@/registry/default/data-table";
import type { Row, TableState } from "@tanstack/react-table";
import { Tabs, TabsItem } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { fieldTouchClass } from "@/lib/size-context";
import { Button } from "@/components/ui/button";
import { MenuItem } from "@/registry/default/menu-item";
import { showUndoToast } from "@/lib/docs/settings-toast";
import { Badge } from "@/registry/default/badge";
import { Switch } from "@/registry/radix/switch";
import {
  PLAY_SWITCH,
  PlayDivider,
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
import type { PlaygroundProps } from "./types";
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

type Primitives = "Radix + Base UI" | "Built on both" | "None";

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
const flavoredSingle = new Set<string>(FLAVORED_SINGLE_SOURCE_SLUGS);
const fluid = new Set<string>(FLUID_HOVER_SLUGS);

export function buildRows(): ComponentRow[] {
  return componentList.map(({ slug, name, description }) => ({
    slug,
    name,
    summary: description,
    website: `fluidfunctionalism.com/docs/${slug}`,
    primitives: dual.has(slug) ? "Radix + Base UI" : flavoredSingle.has(slug) ? "Built on both" : "None",
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
  const primitives: Primitives = dual.has(slug) ? "Radix + Base UI" : flavoredSingle.has(slug) ? "Built on both" : "None";
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

export const PRIMITIVE_COLOR = { "Radix + Base UI": "blue", "Built on both": "purple", None: "gray" } as const;

// The select editor's options carry the badge colors, so its menu shows
// each option's dot.
const PRIMITIVE_OPTIONS = (Object.keys(PRIMITIVE_COLOR) as Primitives[]).map((value) => ({
  value,
  color: PRIMITIVE_COLOR[value],
}));

const INSTALL_URL = "https://www.fluidfunctionalism.com/r";

type Lines = DataTableLines;

type Icons = ReturnType<typeof useIcons>;

function buildColumns(o: {
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
        <span className="flex h-[1lh] items-center">
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
    ...(o.editable
      ? [
          {
            accessorKey: "tags",
            header: "Tags",
            enableSorting: false,
            meta: {
              label: "Tags",
              className: "min-w-56",
              icon: icon("tag"),
              editor: { type: "tags", options: DATA_TABLE_TAG_OPTIONS, creatable: true },
            },
          } satisfies ColumnDef<ComponentRow>,
        ]
      : []),
    {
      accessorKey: "website",
      header: "Website",
      cell: ({ row }) => (
        <a
          href={`/docs/${row.original.slug.split("/")[0]}`}
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
        lines: wrap ? "wrap" : 2,
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
export function pinningCode(o: Pick<PlayState, "pinning" | "pinRight" | "selection" | "rowActions">) {
  const left = o.pinning ? [...(o.selection ? [`"select"`] : []), `"name"`] : [];
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
    "type ColumnDef",
  ];
  // Saved views come with filters: they save what the filters set.
  const views = o.views && o.filters;
  const toolbar = o.filter !== "none" || o.filters || o.viewMenu || views;
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
    ...(o.headerIcons
      ? [`import { SquareLibrary, Folder, Star, SlidersHorizontal, Calendar, ${o.editable ? "Tag, " : ""}Link, File } from "lucide-react";`]
      : []),
    ``,
    `const columns: ColumnDef<ComponentRow>[] = [`,
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
              `editor: { type: "select", options: [{ value: "Radix + Base UI", color: "blue" }, { value: "Built on both", color: "purple" }, { value: "None", color: "gray" }] }`].filter(Boolean).join(", ")} },`,
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
    ...(o.editable
      ? [
          `  {`,
          `    accessorKey: "tags",`,
          `    header: "Tags",`,
          `    enableSorting: false,`,
          `    meta: { className: "min-w-56"${o.headerIcons ? ", icon: Tag" : ""}, editor: { type: "tags", options: [${DATA_TABLE_TAG_OPTIONS.map((t) => `"${t}"`).join(", ")}], creatable: true } },`,
          `  },`,
        ]
      : []),
    `  {`,
    `    accessorKey: "website",`,
    `    header: "Website",`,
    `    cell: ({ row }) => <a href={row.original.href}>{row.original.website}</a>,`,
    `    meta: { className: "min-w-60", lines: ${o.lines === "wrap" ? `"wrap"` : 1}${o.headerIcons ? ", icon: Link" : ""}${o.editable ? `, editor: { type: "text", link: true }` : ""} },`,
    `  },`,
    `  {`,
    `    accessorKey: "summary",`,
    `    header: "Summary",`,
    `    meta: { className: "w-full min-w-64", lines: ${o.lines === "wrap" ? `"wrap"` : 2}${o.headerIcons ? ", icon: File" : ""}${o.editable ? `, editor: "text"` : ""} },`,
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
    ...(o.editable ? [`const [rows, setRows] = useState(components);`, ``] : []),
    `const table = useDataTable({`,
    `  data: ${o.editable ? "rows" : "components"},`,
    `  columns,`,
    `  pageSize: ${o.pagination ? o.pageSize : "components.length"},`,
    ...(o.expandable ? [`  // A row with parts opens into them.`, `  getSubRows: (row) => row.subRows,`] : []),
    ...(!o.pinning && !o.pinRight
      ? [`  // No sticky edge columns when the table scrolls sideways.`, `  enableColumnPinning: false,`]
      : []),
    `  initialState: {`,
    `    sorting: [{ id: "added", desc: true }],`,
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
          `const allView = { columnFilters: [], globalFilter: "", sorting: [{ id: "added", desc: true }], columnOrder: [], columnVisibility: { fluidHover: false } };`,
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
          ``,
        ]
      : []),
    `<div className="flex flex-col gap-2">`,
    ...(toolbar || o.title
      ? [
          `  <div className="flex flex-wrap items-center gap-1">`,
          ...(o.title ? [`    <DataTableTitle table={table}>Components</DataTableTitle>`] : []),
          `    <span className="ml-auto" />`,
          ...(o.filters ? [`    <DataTableFilters table={table} />`] : []),
          ...(o.viewMenu ? [`    <DataTableViewOptions table={table} />`] : []),
          ...(o.filter !== "none" ? [filter] : []),
          `  </div>`,
        ]
      : []),
    ...(views
      ? [
          `  <div className="flex items-center gap-1">`,
          `    <Tabs size="compact" selectedIndex={viewIndex} onSelect={openView} aria-label="Views">`,
          `      {["All", ...views.map((v) => v.name)].map((name, i) => (`,
          `        <TabsItem key={name} index={i} label={name} />`,
          `      ))}`,
          `    </Tabs>`,
          `  </div>`,
        ]
      : []),
    ...(o.filters
      ? views
        ? [
            `  {/* Save view at the far right of the filters' row, with the first filter. */}`,
            `  <DataTableFilterChips table={table}>`,
            `    <Button variant="ghost" size="compact" onClick={saveView}>Save view</Button>`,
            `  </DataTableFilterChips>`,
          ]
        : [`  <DataTableFilterChips table={table} />`]
      : []),
    ...(o.editable
      ? [
          `  <DataTable`,
          `    table={table}${o.resize ? " resizeColumns" : ""}${o.reorder ? " reorderColumns" : ""}${o.align !== "auto" ? ` cellAlign="${o.align}"` : ""}`,
          `    // Each edit writes back to your data; the table shows what it holds.`,
          `    onCellEdit={({ row, columnId, value }) =>`,
          `      setRows((old) => old.map((r) => (r.slug === row.original.slug ? { ...r, [columnId]: value } : r)))`,
          `    }`,
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
  const deleteRows = useCallback(
    (slugs: string[], label: string) => {
      applyStep(label, (old) => removeRows(old, slugs));
      showUndoToast(label, () => undoTo(stepCount));
    },
    [applyStep, undoTo, stepCount]
  );
  // Sub-rows on, the rows carry their parts; off, they're left out (a new
  // array, so the table builds its rows again).
  const tableData = useMemo(
    () => (state.expandable ? data : data.map((r) => ({ ...r, subRows: undefined }))),
    [data, state.expandable]
  );
  const icons = useIcons();
  const columns = useMemo(
    () =>
      buildColumns({
        selection: state.selection,
        rowActions: state.rowActions,
        lines: state.lines,
        icons: state.headerIcons ? icons : null,
        editable: state.editable,
        onDelete: (row) => deleteRows([row.slug], `Deleted ${row.name}`),
      }),
    [state.selection, state.rowActions, state.lines, state.headerIcons, state.editable, icons, deleteRows]
  );

  const table = useDataTable({
    data: tableData,
    columns,
    pageSize: Number(DEFAULT_STATE.pageSize),
    getRowId: (row) => row.slug,
    getSubRows: (row) => row.subRows,
    initialState: {
      sorting: [{ id: "added", desc: true }],
      columnVisibility: { fluidHover: false },
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
    // The Tags column comes and goes with editing: the widths are read
    // again, so it starts at its own width rather than none.
    // Header icons widen the headers: the widths are read again too.
    if (!next.resize || next.editable !== prev.editable || next.headerIcons !== prev.headerIcons)
      table.resetColumnSizing();
    if (!next.expandable) table.resetExpanded();
    if (!next.reorder) table.resetColumnOrder();
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
    });

  // ── Saved views ────────────────────────────────────────
  // A view is the table's state, named: its filters, search, sort, column
  // order and visible columns. "All" is the table as it starts. Kept in
  // memory: a refresh starts over.
  const [views, setViews] = useState<SavedView[]>([]);
  const [viewIndex, setViewIndex] = useState(0);
  const openView = (i: number) => {
    const view = i === 0 ? ALL_VIEW : views[i - 1]?.state;
    if (!view) return;
    table.captureLayout();
    table.setState((old) => ({ ...old, ...view, pagination: { ...old.pagination, pageIndex: 0 } }));
    setViewIndex(i);
  };
  // Naming a view happens in place: a field laid over its tab, the text
  // selected. Saving opens it on the new tab; clicking the open tab again
  // opens it to rename. Enter or a click away keeps the name, Esc keeps the
  // old one, and the field's × deletes the view.
  const tabsRef = useRef<HTMLDivElement>(null);
  const [naming, setNaming] = useState<{
    at: number;
    draft: string;
    rect: { left: number; top: number; minWidth: number; height: number };
  } | null>(null);
  const nameView = (i: number, name: string) => {
    const box = tabsRef.current;
    const tab = box?.querySelectorAll<HTMLElement>("[role=tab]")[i];
    if (!box || !tab) return;
    const b = box.getBoundingClientRect();
    const r = tab.getBoundingClientRect();
    setNaming({ at: i - 1, draft: name, rect: { left: r.left - b.left, top: r.top - b.top, minWidth: r.width, height: r.height } });
  };
  // A view saved this render gets its field once its tab is there.
  const [nameNext, setNameNext] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (nameNext === null) return;
    nameView(nameNext, views[nameNext - 1]?.name ?? "");
    setNameNext(null);
    // nameView reads the tabs just rendered; it runs once per request.
  }, [nameNext]);
  // The field takes focus with its name selected, once per opening.
  const nameRef = useRef<HTMLInputElement>(null);
  const namingAt = naming?.at ?? null;
  useLayoutEffect(() => {
    if (namingAt === null) return;
    nameRef.current?.focus();
    nameRef.current?.select();
  }, [namingAt]);
  const commitName = () => {
    if (!naming) return;
    const name = naming.draft.trim();
    if (name) setViews((old) => old.map((v, i) => (i === naming.at ? { ...v, name } : v)));
    setNaming(null);
  };
  // (The tabs fire no change for the tab already open: its own click does.)
  const renameView = (i: number) => {
    if (i !== viewIndex || i === 0) return;
    nameView(i, views[i - 1]?.name ?? "");
  };
  const deleteView = () => {
    setNaming(null);
    const at = viewIndex - 1;
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
    const open = viewIndex === 0 ? ALL_VIEW : views[viewIndex - 1]?.state;
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

  // Saved tabs reorder by dragging ("All" stays first): past 4px a press
  // turns into a drag, and the tab swaps places as the pointer crosses a
  // neighbor's middle. A drag doesn't count as the click that renames.
  const dragged = useRef(false);
  const onTabsPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || naming) return;
    const box = tabsRef.current;
    const tabEls = () => [...(box?.querySelectorAll<HTMLElement>("[role=tab]") ?? [])];
    let from = tabEls().findIndex((t) => t.contains(e.target as Node));
    if (from < 1) return;
    const startX = e.clientX;
    dragged.current = false;
    const move = (ev: PointerEvent) => {
      if (!dragged.current && Math.abs(ev.clientX - startX) < 4) return;
      dragged.current = true;
      const els = tabEls();
      const to = els.findIndex((t, i) => {
        if (i < 1 || i === from) return false;
        const r = t.getBoundingClientRect();
        return i > from ? ev.clientX > r.left + r.width / 2 : ev.clientX < r.left + r.width / 2;
      });
      if (to < 1) return;
      const a = from - 1;
      const b = to - 1;
      setViews((old) => {
        const next = [...old];
        const [moved] = next.splice(a, 1);
        next.splice(b, 0, moved);
        return next;
      });
      // The open view stays open wherever it lands.
      setViewIndex((cur) => (cur === from ? to : cur > Math.min(from, to) && cur <= Math.max(from, to) ? cur + (from < to ? -1 : 1) : cur));
      from = to;
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      // After the click this release may fire, so a drag that ends off its
      // tab doesn't swallow the next click.
      setTimeout(() => (dragged.current = false), 0);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const tools = state.filter !== "none" || state.filters || state.viewMenu || showViews;
  // One row: the title on the left; the Filter button, the Columns button
  // and the search at the right end. Added filters sit on their own row
  // under it, above the table.
  const toolbar = (state.title || tools) && (
    <div className="flex flex-wrap items-center gap-1">
      {state.title && <DataTableTitle table={table}>Components</DataTableTitle>}
      <span className="ml-auto" />
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
    </div>
  );

  const body = (
    <div className={cn("flex w-full flex-col gap-2", expanded && "h-full")}>
      {toolbar}
      {showViews && (
        // The views as subtle tabs, stepped in with the title past a
        // selection column.
        <div ref={tabsRef} className={cn("relative flex items-center gap-1", state.selection && "pl-9")}>
          <Tabs
            size="compact"
            selectedIndex={viewIndex}
            onSelect={(i) => !dragged.current && openView(i)}
            onPointerDownCapture={onTabsPointerDown}
            aria-label="Views"
          >
            {[{ id: 0, name: "All" }, ...views].map(({ id, name }, i) => (
              <TabsItem
                key={id}
                index={i}
                label={name}
                className={i > 0 ? "touch-none" : undefined}
                onClick={() => {
                  // The click a drag ends with doesn't rename.
                  if (dragged.current) {
                    dragged.current = false;
                    return;
                  }
                  renameView(i);
                }}
              />
            ))}
          </Tabs>
          {naming && (
            // The name field, laid over its tab and growing with the name.
            <span
              className="absolute z-10 flex items-center rounded-full border border-border bg-background pr-0.5 text-site-caption shadow-sm"
              style={{ left: naming.rect.left, top: naming.rect.top, minWidth: naming.rect.minWidth, height: naming.rect.height }}
            >
              <input
                ref={nameRef}
                aria-label="View name"
                value={naming.draft}
                onChange={(e) => setNaming({ ...naming, draft: e.target.value })}
                onBlur={(e) => {
                  // Leaving for the field's own ×: that click decides.
                  if (e.relatedTarget?.closest("[data-view-delete]")) return;
                  commitName();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitName();
                  if (e.key === "Escape") setNaming(null);
                }}
                // 16px on touch screens, so iOS doesn't zoom into the field.
                className={cn("h-full min-w-0 bg-transparent pl-3 text-foreground outline-none [field-sizing:content]", fieldTouchClass)}
              />
              <Tooltip content="Delete view">
                <button
                  type="button"
                  data-view-delete=""
                  aria-label="Delete view"
                  onClick={deleteView}
                  className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground outline-none hover:bg-hover hover:text-destructive"
                >
                  <icons.x size={14} strokeWidth={1.5} />
                </button>
              </Tooltip>
            </span>
          )}
        </div>
      )}
      {state.filters && (
        // Save view at the far right of the filters' row: it shows with the
        // first filter, since there's nothing to save before.
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
        empty={{ title: "No components match", description: "Try a name like Dialog or Tabs." }}
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
          label="Columns menu"
          checked={state.viewMenu}
          onToggle={() => set("viewMenu", !state.viewMenu)}
          className={PLAY_SWITCH}
        />
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
          label="Loading"
          checked={loading}
          onToggle={() => {
            if (reloadTimer.current) clearTimeout(reloadTimer.current);
            setLoading(!loading);
          }}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Header icons"
          checked={state.headerIcons}
          onToggle={() => set("headerIcons", !state.headerIcons)}
          className={PLAY_SWITCH}
        />
        <PlayDivider />
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
