"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  useDataTable,
  DataTable,
  DataTableColumnHeader,
  DataTableTitle,
  DataTableSearch,
  DataTableFilters,
  DataTableViewOptions,
  DataTablePagination,
  DataTableSelectionBar,
  selectColumn,
  rowActionsColumn,
  useUndoableRows,
  type ColumnDef,
} from "@/registry/default/data-table";
import type { Row } from "@tanstack/react-table";
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

export function buildDataTablePlaygroundCode(o: PlayState): string {
  const parts = [
    "useDataTable",
    "DataTable",
    "DataTableColumnHeader",
    ...(o.title ? ["DataTableTitle"] : []),
    ...(o.filter !== "none" ? ["DataTableSearch"] : []),
    ...(o.filters ? ["DataTableFilters"] : []),
    ...(o.viewMenu ? ["DataTableViewOptions"] : []),
    ...(o.rowActions ? ["rowActionsColumn"] : []),
    ...(o.pagination ? ["DataTablePagination"] : []),
    ...(o.selection ? ["DataTableSelectionBar"] : []),
    ...(o.selection ? ["selectColumn"] : []),
    "type ColumnDef",
  ];
  const toolbar = o.filter !== "none" || o.filters || o.viewMenu;
  const filter =
    o.filter === "column"
      ? `      <DataTableSearch table={table} column="name" placeholder="Search components…" />`
      : `      <DataTableSearch table={table} placeholder="Search all columns…" />`;
  return [
    `import {`,
    `  ${parts.join(", ")},`,
    `} from "./components";`,
    ...(o.rowActions ? [`import { MenuItem, Badge } from "./components";`] : [`import { Badge } from "./components";`]),
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
    ...(o.pinning ? [] : [`  // No sticky edge columns when the table scrolls sideways.`, `  enableColumnPinning: false,`]),
    `  initialState: {`,
    `    sorting: [{ id: "added", desc: true }],`,
    `    columnVisibility: { fluidHover: false },`,
    `  },`,
    `});`,
    ``,
    `<div className="flex flex-col gap-3">`,
    ...(o.title ? [`  <DataTableTitle>Components</DataTableTitle>`] : []),
    ...(toolbar
      ? [
          `  <div className="flex flex-wrap items-center gap-2">`,
          ...(o.filters ? [`    <DataTableFilters table={table} />`] : []),
          `    <div className="ml-auto flex items-center gap-1">`,
          ...(o.viewMenu ? [`      <DataTableViewOptions table={table} />`] : []),
          ...(o.filter !== "none" ? [filter] : []),
          `    </div>`,
          `  </div>`,
        ]
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
    if (animate) table.captureLayout();
    if (next.filter !== prev.filter) {
      table.resetColumnFilters();
      table.setGlobalFilter("");
    }
    if (!next.selection) table.resetRowSelection();
    if (!next.viewMenu) table.resetColumnVisibility();
    // The Tags column comes and goes with editing: the widths are read
    // again, so it starts at its own width rather than none.
    if (!next.resize || next.editable !== prev.editable) table.resetColumnSizing();
    if (!next.expandable) table.resetExpanded();
    if (!next.reorder) table.resetColumnOrder();
    if (!next.filters) table.resetColumnFilters();
    if (next.pinning !== prev.pinning)
      table.setColumnPinning(next.pinning ? table.initialState.columnPinning : { left: [], right: [] });
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
      title: Math.random() > 0.3,
    });

  const toolbar = (state.filter !== "none" || state.filters || state.viewMenu) && (
    <div className="flex flex-wrap items-center gap-2">
      {state.filters && <DataTableFilters table={table} />}
      {/* The Columns button, then the search, at the right end. */}
      <div className="ml-auto flex items-center gap-1">
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
    </div>
  );

  const body = (
    <div className={cn("flex w-full flex-col gap-3", expanded && "h-full")}>
      {state.title && <DataTableTitle>Components</DataTableTitle>}
      {toolbar}
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
          label="Sticky columns"
          checked={state.pinning}
          onToggle={() => set("pinning", !state.pinning)}
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
