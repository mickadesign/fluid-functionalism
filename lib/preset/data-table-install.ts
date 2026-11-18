// ---------------------------------------------------------------------------
// Install-grade code generation for DataTable presets. Emits a compilable
// component that is the playground's preview for the encoded state, part
// for part: the same rows (the library's own catalog), cells, toolbar,
// saved views (rename, delete, reorder), undoable edits and deletes with
// their toast, selection actions, empty states and first-load skeleton.
// Two helper files ship as they are on the site (the views' tabs, the undo
// toast), so those can't drift from what the playground runs.
// tests/preset-data-table.test.mjs compiles the output across the state
// space through a real ts.createProgram over the project tsconfig.
// ---------------------------------------------------------------------------

import type { PresetFile } from "./sidebar-install";
import type { PresetGenerator } from "./light-generators";
import {
  type DataTablePreset,
  DATA_TABLE_PROPS_OPTIONS,
  DATA_TABLE_PAGE_SIZES,
  DATA_TABLE_PRESET_NOTE,
  DATA_TABLE_TAG_OPTIONS,
  dataTablePresetHelpers,
} from "./data-table-options";
import { buildRows, type ComponentRow } from "@/lib/docs/playgrounds/data-table-rows";
import { NEW_ITEM_DIALOG_SOURCE, UNDO_TOAST_SOURCE, VIEW_TABS_SOURCE } from "./data-table-sources.generated";

const SITE = "https://www.fluidfunctionalism.com";

const PRIMITIVE_COLOR: Record<string, string> = {
  "Radix + Base UI": "blue",
  None: "gray",
};

/** One row as source text, its parts under it when sub-rows are on. */
function rowSource(r: ComponentRow, tree: boolean): string {
  const fields = [
    `slug: ${JSON.stringify(r.slug)}`,
    `name: ${JSON.stringify(r.name)}`,
    `summary: ${JSON.stringify(r.summary)}`,
    `website: ${JSON.stringify(r.website)}`,
    `primitives: ${JSON.stringify(r.primitives)}`,
    `props: ${r.props}`,
    `fluidHover: ${r.fluidHover}`,
    `added: ${JSON.stringify(r.added)}`,
    `tags: ${JSON.stringify(r.tags)}`,
  ];
  if (tree && r.subRows?.length) fields.push(`subRows: [${r.subRows.map((sub) => rowSource(sub, false)).join(", ")}]`);
  return `{ ${fields.join(", ")} }`;
}

function dataTableDemoFile(p: DataTablePreset): string {
  const icons = p.headerIcons;
  // Saved views come with filters: they save what the filters set.
  const views = p.views && p.filters;
  const wrap = p.lines === "wrap";
  const lines = wrap ? `"wrap"` : "1";
  const edit = p.editable;
  const tree = p.expandable;
  const move = p.rowReorder;
  // Rows can be deleted from the row menu or the selection bar.
  const deletes = p.rowActions || p.selection;
  // Rows that change (edits, moves, deletes) are undoable steps.
  const held = deletes || edit || move || p.newItem;
  const toast = deletes || views;
  // The selection bar's actions carry icons too.
  const iconSet = icons || p.selection;
  // Rows moved by hand start unsorted: under a sort, a move first asks to
  // remove it.
  const sorting = move ? "[]" : `[{ id: "added", desc: true }]`;
  // The tabs start where the first data column's text does: past the
  // handles (20px) and the boxes (28px).
  const gutter = move && p.selection ? "pl-12" : p.selection ? "pl-7" : move ? "pl-5" : "";
  const tools = [p.filters, p.viewMenu, p.filter !== "none"].filter(Boolean).length;
  const providers: [string, string][] = [];
  if (p.shape !== "rounded") providers.push(["ShapeProvider", ` defaultShape="${p.shape}"`]);
  if (p.size === "compact") providers.push(["SizeProvider", ` size="compact"`]);

  const parts = [
    "useDataTable",
    "DataTable",
    "DataTableColumnHeader",
    ...(p.title ? ["DataTableTitle"] : []),
    ...(p.filter !== "none" ? ["DataTableSearch"] : []),
    ...(p.filters ? ["DataTableFilters", "DataTableFilterChips"] : []),
    ...(p.viewMenu ? ["DataTableViewOptions"] : []),
    ...(p.pagination ? ["DataTablePagination"] : []),
    ...(p.selection ? ["DataTableSelectionBar", "selectColumn"] : []),
    ...(p.rowActions ? ["rowActionsColumn"] : []),
    ...(move ? ["rowHandleColumn", "moveRows"] : []),
    ...(held ? ["useUndoableRows"] : []),
    "type ColumnDef",
    ...(views ? ["type TableState"] : []),
  ];
  const react = [
    "startTransition",
    ...(deletes ? ["useCallback"] : []),
    "useEffect",
    "useMemo",
    ...(deletes ? ["useRef"] : []),
    "useState",
  ];
  const icon = (name: string) => (icons ? `, icon: icons[${JSON.stringify(name)}]` : "");
  const l: string[] = [];

  l.push(`"use client";`);
  l.push(``);
  l.push(`import { ${react.join(", ")} } from "react";`);
  if (views && !p.title) {
    l.push(`import { AnimatePresence, motion } from "motion/react";`);
    l.push(`import { spring } from "@/lib/springs";`);
  }
  l.push(`import {`);
  l.push(`  ${parts.join(",\n  ")},`);
  l.push(`} from "@/components/ui/data-table";`);
  if (p.rowActions) l.push(`import { MenuItem } from "@/components/ui/menu-item";`);
  l.push(`import { Badge } from "@/components/ui/badge";`);
  if (tools > 1) l.push(`import { TooltipGroup } from "@/components/ui/tooltip";`);
  if (views || held) l.push(`import { Button } from "@/components/ui/button";`);
  if (iconSet) l.push(`import { useIcons } from "@/lib/icon-context";`);
  l.push(`import { ${providers.some(([n]) => n === "ShapeProvider") ? "ShapeProvider, " : ""}useShape } from "@/lib/shape-context";`);
  l.push(`import { ${providers.some(([n]) => n === "SizeProvider") ? "SizeProvider, " : ""}typeClass, useSize } from "@/lib/size-context";`);
  l.push(`import { cn } from "@/lib/utils";`);
  if (views) l.push(`import { ${p.title ? "RowReveal, " : ""}ViewTabs } from "@/components/data-table-view-tabs";`);
  if (toast) l.push(`import { UndoToaster, showUndoToast } from "@/components/undo-toast";`);
  if (p.newItem) l.push(`import { NewItemDialog, newRow, useShowAddedRow, type NewItemValues } from "@/components/data-table-new-item";`);
  l.push(``);
  l.push(`type Row = {`);
  l.push(`  slug: string;`);
  l.push(`  name: string;`);
  l.push(`  summary: string;`);
  l.push(`  website: string;`);
  l.push(`  primitives: string;`);
  l.push(`  props: number;`);
  l.push(`  fluidHover: boolean;`);
  l.push(`  added: string;`);
  l.push(`  tags: string[];`);
  if (tree) l.push(`  subRows?: Row[];`);
  l.push(`};`);
  l.push(``);
  l.push(`// The playground's rows: the library describing itself. Replace with your own data.`);
  l.push(`const ROWS: Row[] = [`);
  for (const r of buildRows()) l.push(`  ${rowSource(r, tree)},`);
  l.push(`];`);
  l.push(``);
  if (deletes) {
    l.push(`const SITE = ${JSON.stringify(SITE)};`);
    l.push(``);
  }
  l.push(`const PRIMITIVE_COLOR = {`);
  for (const [k, v] of Object.entries(PRIMITIVE_COLOR)) l.push(`  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
  l.push(`} as const;`);
  l.push(`// The select editor's and the filter's options carry the badge colors,`);
  l.push(`// so their menus show each option's dot.`);
  l.push(`const PRIMITIVE_OPTIONS = Object.entries(PRIMITIVE_COLOR).map(([value, color]) => ({ value, color }));`);
  if (p.newItem) l.push(`/** The tags the New item dialog offers. */`, `const TAG_OPTIONS = ${JSON.stringify(DATA_TABLE_TAG_OPTIONS)};`);
  l.push(``);
  l.push(`// A day as the date editor writes it (Wed Nov 4, the year only outside`);
  l.push(`// this one), so a date reads the same whether its cell edits or not.`);
  l.push(`// By hand, not with the viewer's time zone: an ISO day read as a local`);
  l.push(`// Date can land on the day before.`);
  l.push(`const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];`);
  l.push(`const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];`);
  l.push(`function formatDay(iso: string) {`);
  l.push(`  if (!iso) return "";`);
  l.push(`  const [y, m, d] = iso.split("-").map(Number);`);
  l.push(`  const day = DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];`);
  l.push(`  const year = y === new Date().getUTCFullYear() ? "" : \`, \${y}\`;`);
  l.push(`  return \`\${day} \${MONTHS[m - 1]} \${d}\${year}\`;`);
  l.push(`}`);
  l.push(``);
  l.push(`const CHIP_RADIUS = { pill: "rounded-full", rounded: "rounded-md", sharp: "rounded-[1px]" };`);
  l.push(``);
  l.push(`/** A row's tags as chips that only read: the tags editor's chips, less`);
  l.push(` *  the ✕. They sit where the editor's do, so editing moves none. */`);
  l.push(`function TagChips({ tags }: { tags: string[] }) {`);
  l.push(`  const shape = useShape();`);
  l.push(`  const compact = useSize().variant === "compact";`);
  l.push(`  return (`);
  l.push(`    <span`);
  l.push(
    wrap
      ? // Wrapped, the chips stack; 2px back so the first sits where the
        // editor's does in its taller field.
        `      className="-my-0.5 flex min-w-0 flex-wrap items-center gap-1"`
      : // One line: the 24px chips overhang the line box, and one cut at
        // the cell's edge fades out, as the editor's do.
        `      className="flex h-[1lh] min-w-0 items-center gap-1 overflow-x-clip [mask-image:linear-gradient(to_right,black_calc(100%-16px),transparent)]"`
  );
  l.push(`    >`);
  l.push(`      {tags.map((tag) => (`);
  l.push(`        <span`);
  l.push(`          key={tag}`);
  l.push(`          className={cn(`);
  l.push(`            "inline-flex shrink-0 items-center bg-hover px-2 text-foreground",`);
  l.push(`            CHIP_RADIUS[shape.variant],`);
  l.push(`            compact ? "h-5" : "h-6",`);
  l.push(`            typeClass("caption", compact ? "compact" : "default")`);
  l.push(`          )}`);
  l.push(`        >`);
  l.push(`          {tag}`);
  l.push(`        </span>`);
  l.push(`      ))}`);
  l.push(`    </span>`);
  l.push(`  );`);
  l.push(`}`);
  l.push(``);
  if (deletes) {
    l.push(`/** The rows without these slugs${tree ? ", at any depth" : ""}. */`);
    l.push(`function removeRows(list: Row[], slugs: readonly string[]): Row[] {`);
    if (tree) {
      l.push(`  return list`);
      l.push(`    .filter((r) => !slugs.includes(r.slug))`);
      l.push(`    .map((r) => (r.subRows ? { ...r, subRows: removeRows(r.subRows, slugs) } : r));`);
    } else l.push(`  return list.filter((r) => !slugs.includes(r.slug));`);
    l.push(`}`);
    l.push(``);
  }
  if (edit) {
    l.push(`/** Writes one edit into the rows${tree ? ", a sub-row's into its parent's parts" : ""}. */`);
    l.push(`function updateRow(list: Row[], slug: string, key: string, value: unknown): Row[] {`);
    if (tree) {
      l.push(`  return list.map((r) =>`);
      l.push(`    r.slug === slug ? { ...r, [key]: value } : r.subRows ? { ...r, subRows: updateRow(r.subRows, slug, key, value) } : r`);
      l.push(`  );`);
    } else l.push(`  return list.map((r) => (r.slug === slug ? { ...r, [key]: value } : r));`);
    l.push(`}`);
    l.push(``);
  }
  if (views) {
    l.push(`// Saved views: the table's state, named. Kept in memory here: keep them`);
    l.push(`// wherever the app keeps settings (the URL, storage, your database).`);
    l.push(`type SavedView = {`);
    l.push(`  /** Stable through renames and reorders: the tab's key. */`);
    l.push(`  id: number;`);
    l.push(`  name: string;`);
    l.push(`  state: Pick<TableState, "columnFilters" | "globalFilter" | "sorting" | "columnOrder" | "columnVisibility">;`);
    l.push(`};`);
    l.push(``);
    l.push(`/** The "All" view: how the table starts. */`);
    l.push(`const START_VIEW: SavedView["state"] = {`);
    l.push(`  columnFilters: [],`);
    l.push(`  globalFilter: "",`);
    l.push(`  sorting: ${sorting},`);
    l.push(`  columnOrder: [],`);
    l.push(`  columnVisibility: { fluidHover: false },`);
    l.push(`};`);
    l.push(``);
    l.push(`/** JSON with sorted keys, so two states compare by their values. */`);
    l.push(`function stableJson(value: unknown): string {`);
    l.push(`  return JSON.stringify(value, (_, v) =>`);
    l.push(`    v && typeof v === "object" && !Array.isArray(v)`);
    l.push(`      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))`);
    l.push(`      : v`);
    l.push(`  );`);
    l.push(`}`);
    l.push(``);
    l.push(`/** Only the hidden columns: an empty visibility and one listing every`);
    l.push(` *  column as shown say the same thing. */`);
    l.push(`const hiddenOnly = (visibility: Record<string, boolean> | undefined) =>`);
    l.push(`  Object.keys(visibility ?? {}).filter((id) => visibility?.[id] === false).sort();`);
    l.push(``);
  }

  l.push(`export function DataTableDemo() {`);
  l.push(`  // Opens on its skeleton: the columns are measured in the page's fonts,`);
  l.push(`  // so the rows land once those have, and nothing shifts after.`);
  l.push(`  const [loading, setLoading] = useState(true);`);
  l.push(`  useEffect(() => {`);
  l.push(`    let live = true;`);
  l.push(`    const land = () => {`);
  l.push(`      if (live) startTransition(() => setLoading(false));`);
  l.push(`    };`);
  l.push(`    if (document.fonts) document.fonts.ready.then(land, land);`);
  l.push(`    else land();`);
  l.push(`    return () => {`);
  l.push(`      live = false;`);
  l.push(`    };`);
  l.push(`  }, []);`);
  l.push(``);
  if (held) {
    l.push(`  // Edits, moves and deletes are undoable steps: ⌘Z / ⇧⌘Z in the table.`);
    l.push(`  const history = useUndoableRows<Row>(ROWS, { getId: (r) => r.slug });`);
    l.push(`  const rows = history.rows;`);
  }
  if (deletes) {
    l.push(`  // A delete says what went, with its way back to before it. The step`);
    l.push(`  // count is read through a ref: as a dependency it would rebuild the`);
    l.push(`  // columns, and with them every cell, on each edit.`);
    l.push(`  const { apply, undoTo, stepCount } = history;`);
    l.push(`  const stepCountRef = useRef(stepCount);`);
    l.push(`  useEffect(() => {`);
    l.push(`    stepCountRef.current = stepCount;`);
    l.push(`  });`);
    l.push(`  const deleteRows = useCallback(`);
    l.push(`    (slugs: string[], label: string) => {`);
    l.push(`      const before = stepCountRef.current;`);
    l.push(`      apply(label, (old) => removeRows(old, slugs));`);
    l.push(`      showUndoToast(label, () => undoTo(before));`);
    l.push(`    },`);
    l.push(`    [apply, undoTo]`);
    l.push(`  );`);
  }
  if (iconSet) l.push(`  const icons = useIcons();`);
  if (held || iconSet) l.push(``);

  // ── Columns ──────────────────────────────────────────────────────────────
  const deps = [...(icons ? ["icons"] : []), ...(p.rowActions ? ["deleteRows"] : [])];
  l.push(`  const columns = useMemo<ColumnDef<Row>[]>(`);
  l.push(`    () => [`);
  const c: string[] = [];
  if (move) c.push(`rowHandleColumn<Row>(),`);
  if (p.selection) c.push(`selectColumn<Row>(),`);
  c.push(`{`);
  c.push(`  accessorKey: "name",`);
  c.push(`  header: ({ column }) => <DataTableColumnHeader column={column} title="Component" />,`);
  c.push(`  enableHiding: false,`);
  c.push(`  meta: { label: "Component", lines: ${lines}${icon("square-library")}${edit ? `, editor: "text"` : ""} },`);
  c.push(`},`);
  c.push(`{`);
  c.push(`  accessorKey: "primitives",`);
  c.push(`  header: ({ column }) => <DataTableColumnHeader column={column} title="Primitives" />,`);
  c.push(`  cell: ({ row }) => (`);
  c.push(`    // The 24px badge overhangs the line box instead of growing the row.`);
  c.push(`    <span className="flex h-[1lh] min-w-0 items-center">`);
  c.push(`      <Badge`);
  c.push(`        variant="ghost"`);
  c.push(`        color={PRIMITIVE_COLOR[row.original.primitives as keyof typeof PRIMITIVE_COLOR] ?? "gray"}`);
  c.push(`      >`);
  c.push(`        {row.original.primitives}`);
  c.push(`      </Badge>`);
  c.push(`    </span>`);
  c.push(`  ),`);
  c.push(`  meta: {`);
  c.push(`    label: "Primitives"${icon("folder")},`);
  if (edit) c.push(`    editor: { type: "select", options: PRIMITIVE_OPTIONS },`);
  c.push(`    filter: { type: "options", options: PRIMITIVE_OPTIONS },`);
  c.push(`  },`);
  c.push(`},`);
  c.push(`{`);
  c.push(`  // Hidden at first: it shows from the Columns menu.`);
  c.push(`  accessorKey: "fluidHover",`);
  c.push(`  header: "Fluid hover",`);
  c.push(`  cell: ({ row }) => (row.original.fluidHover ? "Yes" : "No"),`);
  c.push(`  meta: { label: "Fluid hover"${icon("star")} },`);
  c.push(`},`);
  c.push(`{`);
  c.push(`  accessorKey: "props",`);
  c.push(`  header: ({ column }) => <DataTableColumnHeader column={column} title="Props" />,`);
  c.push(
    `  meta: { label: "Props", className: "tabular-nums"${icon("sliders-horizontal")}${edit ? `, editor: { type: "number", options: [${DATA_TABLE_PROPS_OPTIONS.join(", ")}] }` : ""} },`
  );
  c.push(`},`);
  c.push(`{`);
  c.push(`  accessorKey: "added",`);
  c.push(`  header: ({ column }) => <DataTableColumnHeader column={column} title="Added" />,`);
  c.push(`  cell: ({ row }) => formatDay(row.original.added),`);
  c.push(`  // A floor of 112px: the column never gets narrower than a whole date.`);
  c.push(
    `  meta: { label: "Added", className: "min-w-28 tabular-nums whitespace-nowrap"${icon("calendar")}${edit ? `, editor: "date"` : ""} },`
  );
  c.push(`},`);
  c.push(`{`);
  c.push(`  accessorKey: "tags",`);
  c.push(`  header: "Tags",`);
  c.push(`  enableSorting: false,`);
  c.push(`  // Read only, the tags editor's chips without their ✕.${edit ? " Editing swaps in the editor, which draws its own." : ""}`);
  c.push(`  cell: ({ row }) => <TagChips tags={row.original.tags} />,`);
  c.push(`  meta: {`);
  c.push(`    label: "Tags",`);
  c.push(`    className: "min-w-56"${icon("tag")},`);
  if (wrap) c.push(`    // Text wrap wraps the chips too, so none is cut at the edge.`, `    lines: "wrap",`);
  if (edit) c.push(`    editor: { type: "tags", options: ${JSON.stringify(DATA_TABLE_TAG_OPTIONS)}, creatable: true },`);
  c.push(`  },`);
  c.push(`},`);
  c.push(`{`);
  c.push(`  accessorKey: "website",`);
  c.push(`  header: "Website",`);
  c.push(`  // Left blank, no link: an empty one would still be a tab stop.`);
  c.push(`  cell: ({ row }) => row.original.website && (`);
  c.push(`    <a`);
  c.push(`      href={\`https://\${row.original.website}\`}`);
  c.push(`      // A new tab: the table keeps its state (selection, filters, edits).`);
  c.push(`      target="_blank"`);
  c.push(`      rel="noreferrer"`);
  c.push(`      // The cell cuts what runs past it, a focus ring included: the link`);
  c.push(`      // ${wrap ? "draws its ring inside its box." : "cuts its own text short and draws its ring inside that box."}`);
  c.push(
    `      className="${wrap ? "" : "inline-block max-w-full truncate align-bottom "}underline decoration-foreground/30 underline-offset-2 transition-colors duration-80 hover:decoration-foreground focus-visible:outline-offset-[-1px]"`
  );
  c.push(`    >`);
  c.push(`      {row.original.website}`);
  c.push(`    </a>`);
  c.push(`  ),`);
  c.push(`  // Room for most of the URL before it cuts short.`);
  c.push(
    `  meta: { label: "Website", lines: ${lines}, className: "min-w-60"${icon("link")}${edit ? `, editor: { type: "text", link: true }` : ""} },`
  );
  c.push(`},`);
  c.push(`{`);
  c.push(`  accessorKey: "summary",`);
  c.push(`  header: "Summary",`);
  c.push(`  // Last of the data columns: it takes the width left, at least 256px.`);
  c.push(`  meta: { label: "Summary", className: "w-full min-w-64", lines: ${lines}${icon("file")}${edit ? `, editor: "text"` : ""} },`);
  c.push(`},`);
  if (p.rowActions) {
    c.push(`rowActionsColumn<Row>((row) => (`);
    c.push(`  <>`);
    c.push(`    <MenuItem`);
    c.push(`      index={0}`);
    c.push(`      label="Open docs"`);
    c.push(`      onSelect={() => window.open(\`\${SITE}/docs/\${row.original.slug.split("/")[0]}\`, "_blank", "noreferrer")}`);
    c.push(`    />`);
    c.push(`    <MenuItem`);
    c.push(`      index={1}`);
    c.push(`      label="Copy install command"`);
    c.push(`      // A part (a sub-row) installs with its component.`);
    c.push(`      onSelect={() => navigator.clipboard?.writeText(\`npx shadcn@latest add \${SITE}/r/\${row.original.slug.split("/")[0]}.json\`)}`);
    c.push(`    />`);
    c.push(`    <MenuItem`);
    c.push(`      index={2}`);
    c.push(`      label="Delete"`);
    c.push(`      destructive`);
    c.push(`      onSelect={() => deleteRows([row.original.slug], \`Deleted \${row.original.name}\`)}`);
    c.push(`    />`);
    c.push(`  </>`);
    c.push(`)),`);
  }
  for (const line of c) l.push(`      ${line}`);
  l.push(`    ],`);
  l.push(`    [${deps.join(", ")}]`);
  l.push(`  );`);
  l.push(``);

  // ── Table ────────────────────────────────────────────────────────────────
  l.push(`  const table = useDataTable({`);
  l.push(`    data: ${held ? "rows" : "ROWS"},`);
  l.push(`    columns,`);
  l.push(`    pageSize: ${p.pagination ? p.pageSize : "10_000"},`);
  l.push(`    getRowId: (row) => row.slug,`);
  if (tree) l.push(`    getSubRows: (row) => row.subRows,`);
  // No sticky left columns: no Freeze item in the header menus either.
  if (!p.pinning) l.push(`    enableColumnPinning: false,`);
  l.push(`    initialState: {`);
  if (!move) l.push(`      sorting: ${sorting},`);
  l.push(`      columnVisibility: { fluidHover: false },`);
  if (p.pinning !== p.pinRight) {
    // Sticky on one side only: the left the boxes and the first column,
    // the right the row menus.
    const left = p.pinning ? [...(move ? [`"drag"`] : []), ...(p.selection ? [`"select"`] : []), `"name"`] : [];
    const right = p.pinRight && p.rowActions ? [`"actions"`] : [];
    l.push(`      columnPinning: { left: [${left.join(", ")}], right: [${right.join(", ")}] },`);
  }
  l.push(`    },`);
  l.push(`  });`);
  l.push(``);
  if (p.newItem) {
    l.push(`  // A row from the New item dialog, an undoable step like an edit or a`);
    l.push(`  // delete. The table's sort places it; the page it lands on comes up.`);
    l.push(`  const showAdded = useShowAddedRow(table);`);
    l.push(`  const addRow = (values: NewItemValues) => {`);
    l.push(`    const row = newRow(values, history.rows);`);
    l.push(`    history.apply(\`Added \${values.name}\`, (old) => [row, ...old]);`);
    l.push(`    showAdded(row.slug);`);
    l.push(`  };`);
    l.push(``);
  }

  if (views) {
    l.push(`  const [views, setViews] = useState<SavedView[]>([]);`);
    l.push(`  const [viewIndex, setViewIndex] = useState(0);`);
    l.push(`  const openView = (i: number) => {`);
    l.push(`    const view = i === 0 ? START_VIEW : views[i - 1]?.state;`);
    l.push(`    if (!view) return;`);
    l.push(`    table.captureLayout();`);
    l.push(`    table.setState((old) => ({ ...old, ...view, pagination: { ...old.pagination, pageIndex: 0 } }));`);
    l.push(`    setViewIndex(i);`);
    l.push(`  };`);
    l.push(`  // A view just saved opens for naming in its tab.`);
    l.push(`  const [nameNext, setNameNext] = useState<number | null>(null);`);
    l.push(`  const deleteView = (at: number) => {`);
    l.push(`    const view = views[at];`);
    l.push(`    if (!view) return;`);
    l.push(`    setViews((old) => old.filter((_, i) => i !== at));`);
    l.push(`    openView(0);`);
    l.push(`    // Its way back: the view returns to its place, open.`);
    l.push(`    showUndoToast(\`Deleted \${view.name}\`, () => {`);
    l.push(`      setViews((old) => [...old.slice(0, at), view, ...old.slice(at)]);`);
    l.push(`      table.setState((old) => ({ ...old, ...view.state, pagination: { ...old.pagination, pageIndex: 0 } }));`);
    l.push(`      setViewIndex(at + 1);`);
    l.push(`    });`);
    l.push(`  };`);
    l.push(`  const saveView = () => {`);
    l.push(`    const { columnFilters, globalFilter, sorting, columnOrder, columnVisibility } = table.getState();`);
    l.push(`    const name = \`View \${views.length + 1}\`;`);
    l.push(`    const id = views.reduce((max, v) => Math.max(max, v.id), 0) + 1;`);
    l.push(`    setViews((old) => [...old, { id, name, state: { columnFilters, globalFilter, sorting, columnOrder, columnVisibility } }]);`);
    l.push(`    setViewIndex(views.length + 1);`);
    l.push(`    // Ask for its name in place, on the new tab.`);
    l.push(`    setNameNext(views.length + 1);`);
    l.push(`  };`);
    l.push(`  // A tab dragged (or Alt + ← / →) to another place: its view moves, and`);
    l.push(`  // the open view stays open wherever it lands.`);
    l.push(`  const moveView = (from: number, to: number) => {`);
    l.push(`    setViews((old) => {`);
    l.push(`      const next = [...old];`);
    l.push(`      const [moved] = next.splice(from - 1, 1);`);
    l.push(`      next.splice(to - 1, 0, moved);`);
    l.push(`      return next;`);
    l.push(`    });`);
    l.push(`    setViewIndex((cur) =>`);
    l.push(`      cur === from ? to : cur > Math.min(from, to) && cur <= Math.max(from, to) ? cur + (from < to ? -1 : 1) : cur`);
    l.push(`    );`);
    l.push(`  };`);
    l.push(`  // Save view shows once the table differs from the open view.`);
    l.push(`  const viewChanged = (() => {`);
    l.push(`    const open = viewIndex === 0 ? START_VIEW : views[viewIndex - 1]?.state;`);
    l.push(`    if (!open) return true;`);
    l.push(`    const now = table.getState();`);
    l.push(`    const same = (a: unknown, b: unknown) => stableJson(a) === stableJson(b);`);
    l.push(`    return !(`);
    l.push(`      same(now.columnFilters, open.columnFilters) &&`);
    l.push(`      same(now.globalFilter ?? "", open.globalFilter ?? "") &&`);
    l.push(`      same(now.sorting, open.sorting) &&`);
    l.push(`      same(now.columnOrder, open.columnOrder) &&`);
    l.push(`      same(hiddenOnly(now.columnVisibility), hiddenOnly(open.columnVisibility))`);
    l.push(`    );`);
    l.push(`  })();`);
    l.push(`  // A lone "All" tab says nothing: the tabs wait for the first saved view.`);
    l.push(`  const tabsShown = views.length > 0;`);
    l.push(`  const viewTabs = (`);
    l.push(`    <ViewTabs`);
    l.push(`      first="All"`);
    l.push(`      views={views}`);
    l.push(`      selected={viewIndex}`);
    l.push(`      onSelect={openView}`);
    l.push(`      onRename={(at, name) => setViews((old) => old.map((v, i) => (i === at ? { ...v, name } : v)))}`);
    l.push(`      onDelete={deleteView}`);
    l.push(`      onMove={moveView}`);
    l.push(`      nameRequest={nameNext}`);
    l.push(`      onNameRequested={() => setNameNext(null)}`);
    if (gutter) l.push(`      // Past the leading columns the tabs start where the first data column does.`, `      className="${gutter}"`);
    l.push(`    />`);
    l.push(`  );`);
    l.push(``);
  }

  // ── Render ───────────────────────────────────────────────────────────────
  l.push(`  return (`);
  let ind = `    `;
  for (const [name, props] of providers) {
    l.push(`${ind}<${name}${props}>`);
    ind += `  `;
  }
  const o: string[] = [];
  o.push(`<div className="flex w-full flex-col gap-2">`);
  if (p.title || tools > 0 || views || p.newItem) {
    // The title, then the tools at the right end, on one row.
    // 12px under a title (the stack's 8px plus 4), a step off the table.
    o.push(`  <div className="${p.title ? "mb-1 " : ""}flex flex-wrap items-center gap-1">`);
    if (p.title) o.push(`    <DataTableTitle table={table}>Components</DataTableTitle>`);
    if (views && !p.title) {
      o.push(`    {/* No title: the views share the row with the tools. They fade in`);
      o.push(`        with the first saved view (the row is already there, so nothing`);
      o.push(`        moves) and scroll sideways inside their share. */}`);
      o.push(`    <div className="min-w-0 flex-1">`);
      o.push(`      <AnimatePresence initial={false}>`);
      o.push(`        {tabsShown && (`);
      o.push(`          <motion.div`);
      o.push(`            key="views"`);
      o.push(`            initial={{ opacity: 0 }}`);
      o.push(`            animate={{ opacity: 1 }}`);
      o.push(`            exit={{ opacity: 0, transition: spring.fast.exit }}`);
      o.push(`            transition={spring.fast}`);
      o.push(`          >`);
      o.push(`            {viewTabs}`);
      o.push(`          </motion.div>`);
      o.push(`        )}`);
      o.push(`      </AnimatePresence>`);
      o.push(`    </div>`);
    } else if (!p.title) {
      // No title and no views: the same share of the row, empty, pushes the
      // tools to the right end.
      o.push(`    <div className="min-w-0 flex-1" />`);
    } else o.push(`    <span className="ml-auto" />`);
    // Two icons or more share one tooltip bubble that glides between them.
    const tool: string[] = [];
    if (p.filters) tool.push(`<DataTableFilters table={table} />`);
    if (p.viewMenu) tool.push(`<DataTableViewOptions table={table} />`);
    if (p.filter === "column") tool.push(`<DataTableSearch table={table} column="name" placeholder="Search components…" />`);
    else if (p.filter === "all") tool.push(`<DataTableSearch table={table} placeholder="Search all columns…" />`);
    // With the New item button, the tools and it hold one row: an open
    // search narrows rather than pushing the button onto a line of its own,
    // and on a narrow screen they move under the title together.
    const pad = p.newItem ? "  " : "";
    if (p.newItem) o.push(`    <div className="flex min-w-0 flex-1 basis-72 items-center justify-end gap-1">`);
    if (tool.length > 1) {
      o.push(`${pad}    <TooltipGroup>`);
      tool.forEach((t) => o.push(`${pad}      ${t}`));
      o.push(`${pad}    </TooltipGroup>`);
    } else tool.forEach((t) => o.push(`${pad}    ${t}`));
    if (p.newItem) {
      // The New item button closes the row, 8px past the icons, and opens
      // a dialog with a field per column.
      o.push(`      <NewItemDialog`);
      o.push(`        title="New component"`);
      o.push(`        primitiveOptions={PRIMITIVE_COLOR}`);
      o.push(`        // The fields follow the columns as they're arranged now.`);
      o.push(`        order={[...table.getLeftLeafColumns(), ...table.getCenterLeafColumns(), ...table.getRightLeafColumns()].map((c) => c.id)}`);
      o.push(`        tagOptions={TAG_OPTIONS}`);
      o.push(`        className="ml-1 shrink-0"`);
      o.push(`        onAdd={addRow}`);
      o.push(`      />`);
      o.push(`    </div>`);
    }
    o.push(`  </div>`);
  }
  if (views && p.title) {
    o.push(`  {/* Under the title the views get a row of their own, which springs open`);
    o.push(`      with the first saved view. */}`);
    o.push(`  <RowReveal show={tabsShown}>{viewTabs}</RowReveal>`);
  }
  if (p.filters && views) {
    o.push(`  {/* Save view after the chips' +, once the table differs from the open view. */}`);
    o.push(`  <DataTableFilterChips table={table}>`);
    o.push(`    {viewChanged && (`);
    o.push(`      <Button variant="ghost" onClick={saveView}>`);
    o.push(`        Save view`);
    o.push(`      </Button>`);
    o.push(`    )}`);
    o.push(`  </DataTableFilterChips>`);
  } else if (p.filters) o.push(`  <DataTableFilterChips table={table} />`);
  o.push(`  <DataTable`);
  o.push(`    table={table}`);
  if (p.resize) o.push(`    resizeColumns`);
  if (p.reorder) o.push(`    reorderColumns`);
  if (p.align !== "auto") o.push(`    cellAlign="${p.align}"`);
  if (p.rowHover !== "auto") o.push(p.rowHover === "on" ? `    rowHover` : `    rowHover={false}`);
  o.push(`    loading={loading}`);
  o.push(`    // A screenful of skeletons, not one per row of a long page.`);
  o.push(`    loadingRows={${p.pagination ? Math.min(Number(p.pageSize), 20) : 20}}`);
  o.push(`    empty={`);
  if (held) {
    o.push(`      rows.length === 0`);
    o.push(`        ? {`);
    o.push(`            title: "No components left",`);
    o.push(`            description: "Undo brings back what you deleted.",`);
    o.push(`            action: history.canUndo ? (`);
    o.push(`              <Button variant="ghost" size="compact" onClick={history.undo}>`);
    o.push(`                Undo`);
    o.push(`              </Button>`);
    o.push(`            ) : undefined,`);
    o.push(`          }`);
    o.push(`        : table.getState().columnFilters.length > 0`);
    o.push(`          ? { title: "No components match" }`);
    o.push(`          : { title: "No components match", description: "Try a name like Dialog or Tabs." }`);
  } else {
    o.push(`      table.getState().columnFilters.length > 0`);
    o.push(`        ? { title: "No components match" }`);
    o.push(`        : { title: "No components match", description: "Try a name like Dialog or Tabs." }`);
  }
  o.push(`    }`);
  if (edit) {
    o.push(`    onCellEdit={({ row, columnId, value }) =>`);
    o.push(`      history.apply(`);
    o.push(`        \`Edited \${row.original.name}\`,`);
    o.push(`        (old) => updateRow(old, row.original.slug, columnId, value),`);
    o.push(`        // One cell typed in a burst is one step.`);
    o.push(`        \`\${row.original.slug}:\${columnId}\``);
    o.push(`      )`);
    o.push(`    }`);
  }
  if (move) {
    o.push(`    // Drag a handle, or Alt + ↑ / ↓ on a row. Under a sort, the table asks to remove it first.`);
    o.push(`    onRowReorder={(move) =>`);
    o.push(`      history.apply(`);
    o.push(`        move.rows.length === 1 ? \`Moved \${move.rows[0].original.name}\` : \`Moved \${move.rows.length} rows\`,`);
    o.push(`        (old) => moveRows(old, move)`);
    o.push(`      )`);
    o.push(`    }`);
  }
  if (held) {
    o.push(`    onUndo={history.undo}`);
    o.push(`    onRedo={history.redo}`);
  }
  o.push(`  />`);
  if (p.pagination) o.push(`  <DataTablePagination table={table} pageSizes={[${DATA_TABLE_PAGE_SIZES.join(", ")}]} />`);
  if (p.selection) {
    o.push(`  {/* Floats over the table while rows are selected: ⌘K opens the actions. */}`);
    o.push(`  <DataTableSelectionBar`);
    o.push(`    table={table}`);
    o.push(`    actions={(picked) => [`);
    o.push(`      {`);
    o.push(`        value: "delete",`);
    o.push(`        label: picked.length === 1 ? "Delete" : \`Delete \${picked.length} rows\`,`);
    o.push(`        icon: icons.x,`);
    o.push(`        destructive: true,`);
    o.push(`        onSelect: () => {`);
    o.push(`          deleteRows(`);
    o.push(`            picked.map((r) => r.original.slug),`);
    o.push(`            picked.length === 1 ? \`Deleted \${picked[0].original.name}\` : \`Deleted \${picked.length} rows\``);
    o.push(`          );`);
    o.push(`          table.resetRowSelection();`);
    o.push(`        },`);
    o.push(`      },`);
    o.push(`      {`);
    o.push(`        value: "install",`);
    o.push(`        label: "Copy install command",`);
    o.push(`        icon: icons.copy,`);
    o.push(`        onSelect: () =>`);
    o.push(`          navigator.clipboard?.writeText(`);
    o.push(`            // Each component once: parts (sub-rows) install with theirs.`);
    o.push(`            \`npx shadcn@latest add \${[...new Set(picked.map((r) => r.original.slug.split("/")[0]))].map((slug) => \`\${SITE}/r/\${slug}.json\`).join(" ")}\``);
    o.push(`          ),`);
    o.push(`      },`);
    o.push(`      {`);
    o.push(`        value: "names",`);
    o.push(`        label: "Copy names",`);
    o.push(`        icon: icons.file,`);
    o.push(`        onSelect: () => navigator.clipboard?.writeText(picked.map((r) => r.original.name).join("\\n")),`);
    o.push(`      },`);
    o.push(`    ]}`);
    o.push(`  />`);
  }
  if (toast) {
    o.push(`  {/* Where the undo toasts show. Mount it once per app: move it to your`);
    o.push(`      layout if another part of the app uses the same toast. */}`);
    o.push(`  <UndoToaster />`);
  }
  o.push(`</div>`);
  for (const line of o) l.push(`${ind}${line}`);
  for (const [name] of [...providers].reverse()) {
    ind = ind.slice(2);
    l.push(`${ind}</${name}>`);
  }
  l.push(`  );`);
  l.push(`}`);
  return l.join("\n") + "\n";
}

export function generateDataTablePresetFiles(p: DataTablePreset): PresetFile[] {
  const { views, toast } = dataTablePresetHelpers(p);
  return [
    // First: the file to import and render. The rest support it.
    {
      path: "components/data-table-demo.tsx",
      type: "registry:component",
      target: "components/data-table-demo.tsx",
      content: dataTableDemoFile(p),
    },
    ...(views
      ? [
          {
            path: "components/data-table-view-tabs.tsx",
            type: "registry:component" as const,
            target: "components/data-table-view-tabs.tsx",
            content: VIEW_TABS_SOURCE,
          },
        ]
      : []),
    ...(p.newItem
      ? [
          {
            path: "components/data-table-new-item.tsx",
            type: "registry:component" as const,
            target: "components/data-table-new-item.tsx",
            content: NEW_ITEM_DIALOG_SOURCE,
          },
        ]
      : []),
    ...(toast
      ? [
          {
            path: "components/undo-toast.tsx",
            type: "registry:component" as const,
            target: "components/undo-toast.tsx",
            content: UNDO_TOAST_SOURCE,
          },
        ]
      : []),
  ];
}

/** Registry dependencies the generated files need, as plain names. The
 *  route flavors them: data-table pulls dual-flavor parts, so it resolves to
 *  the chosen flavor's payload. */
export function dataTablePresetRegistryDeps(p: DataTablePreset): string[] {
  const views = p.views && p.filters;
  const toast = p.rowActions || p.selection || views;
  return [
    "utils",
    "data-table",
    "badge",
    "shape-context",
    "size-context",
    ...(p.headerIcons || p.selection || views || p.newItem ? ["icon-context"] : []),
    ...(p.newItem
      ? ["dialog", "field", "input", "textarea", "select", "switch", "date-picker", "combobox", "scroll-area"]
      : []),
    ...(views || p.rowActions || p.selection || p.editable || p.rowReorder || p.newItem ? ["button"] : []),
    ...(views ? ["tabs", "tooltip", "springs"] : []),
    ...(toast ? ["key-cap", "font-weight", "command-menu"] : []),
  ];
}

/** npm dependencies beyond what registryDependencies pull transitively. */
export function dataTablePresetNpmDeps(p: DataTablePreset): string[] {
  const views = p.views && p.filters;
  return p.rowActions || p.selection || views ? ["sonner"] : [];
}

export const DATA_TABLE_PRESET_GENERATOR: PresetGenerator = {
  title: "DataTable (playground preset)",
  description:
    "A data table generated from a fluidfunctionalism.com playground configuration: the exact variant you built, installable.",
  files: (p) => generateDataTablePresetFiles(p as unknown as DataTablePreset),
  registryDeps: (p) => dataTablePresetRegistryDeps(p as unknown as DataTablePreset),
  npmDeps: (p) => dataTablePresetNpmDeps(p as unknown as DataTablePreset),
  helpers: (p) =>
    generateDataTablePresetFiles(p as unknown as DataTablePreset)
      .slice(1)
      .map((file) => file.target),
  note: DATA_TABLE_PRESET_NOTE,
};
