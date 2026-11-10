// ---------------------------------------------------------------------------
// Install-grade code generation for DataTable presets. Emits ONE compilable
// component reproducing what the playground preview renders for the encoded
// state: the same search, menus, selection, row menu, pagination, column
// resizing and reordering, text fitting, alignment and header icons, over a
// fixed sample of rows to replace with real data.
// tests/preset-data-table.test.mjs compiles the output across the state
// space through a real ts.createProgram over the project tsconfig.
// ---------------------------------------------------------------------------

import type { PresetFile } from "./sidebar-install";
import type { PresetGenerator } from "./generators";
import {
  type DataTablePreset,
  DATA_TABLE_PROPS_OPTIONS,
  DATA_TABLE_SAMPLE_PARTS,
  DATA_TABLE_SAMPLE_ROWS,
  DATA_TABLE_TAG_OPTIONS,
  dataTableTagsFor,
} from "./data-table-options";

const PRIMITIVE_COLOR: Record<string, string> = {
  "Radix + Base UI": "blue",
  "Built on both": "purple",
  None: "gray",
};

function dataTableDemoFile(p: DataTablePreset): string {
  // A sample row's parts as its sub-rows, written inline.
  const partsOf = (r: (typeof DATA_TABLE_SAMPLE_ROWS)[number]) => {
    const parts = p.expandable ? DATA_TABLE_SAMPLE_PARTS[r.slug] : undefined;
    if (!parts) return "";
    const sub = parts.map(
      ([name, props]) =>
        `{ slug: ${JSON.stringify(`${r.slug}/${name}`)}, name: ${JSON.stringify(name)}, summary: ${JSON.stringify(`Part of ${r.name}.`)}, primitives: ${JSON.stringify(r.primitives)}, props: ${props}, added: ${JSON.stringify(r.added)}${p.editable ? ", tags: []" : ""} }`
    );
    return `, subRows: [${sub.join(", ")}]`;
  };
  const icons = p.headerIcons;
  const wrap = p.lines === "wrap";
  const lines = wrap ? `"wrap"` : "1";
  const summaryLines = wrap ? `"wrap"` : "2";
  const parts = [
    "useDataTable",
    "DataTable",
    "DataTableColumnHeader",
    ...(p.title ? ["DataTableTitle"] : []),
    ...(p.filter !== "none" ? ["DataTableSearch"] : []),
    ...(p.filters ? ["DataTableFilters"] : []),
    ...(p.viewMenu ? ["DataTableViewOptions"] : []),
    ...(p.pagination ? ["DataTablePagination"] : []),
    ...(p.selection ? ["DataTableSelectionBar"] : []),
    ...(p.selection ? ["selectColumn"] : []),
    ...(p.rowActions ? ["rowActionsColumn"] : []),
    "type ColumnDef",
  ];
  const icon = (name: string) => (icons ? `, icon: ${name}` : "");
  const l: string[] = [];

  const edit = p.editable;
  const tree = p.expandable;
  l.push(`"use client";`);
  l.push(``);
  if (edit) l.push(`import { useState } from "react";`);
  l.push(`import {`);
  l.push(`  ${parts.join(",\n  ")},`);
  l.push(`} from "@/components/ui/data-table";`);
  if (p.rowActions) l.push(`import { MenuItem } from "@/components/ui/menu-item";`);
  l.push(`import { Badge } from "@/components/ui/badge";`);
  if (icons) {
    l.push(
      `import { Calendar, File, Folder, Link, SlidersHorizontal, SquareLibrary } from "lucide-react";`
    );
  }
  l.push(``);
  l.push(`type Row = {`);
  l.push(`  slug: string;`);
  l.push(`  name: string;`);
  l.push(`  summary: string;`);
  l.push(`  primitives: string;`);
  l.push(`  props: number;`);
  l.push(`  added: string;`);
  if (edit) l.push(`  tags: string[];`);
  if (tree) l.push(`  subRows?: Row[];`);
  l.push(`};`);
  l.push(``);
  l.push(`// Sample rows in the playground's shape. Replace with your own data.`);
  l.push(`const ROWS: Row[] = [`);
  for (const r of DATA_TABLE_SAMPLE_ROWS) {
    l.push(
      `  { slug: ${JSON.stringify(r.slug)}, name: ${JSON.stringify(r.name)}, summary: ${JSON.stringify(r.summary)}, primitives: ${JSON.stringify(r.primitives)}, props: ${r.props}, added: ${JSON.stringify(r.added)}${edit ? `, tags: ${JSON.stringify(dataTableTagsFor(r.slug))}` : ""}${partsOf(r)} },`
    );
  }
  l.push(`];`);
  l.push(``);
  l.push(`const PRIMITIVE_COLOR = {`);
  for (const [k, v] of Object.entries(PRIMITIVE_COLOR)) l.push(`  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
  l.push(`} as const;`);
  l.push(``);
  l.push(`const columns: ColumnDef<Row>[] = [`);
  if (p.selection) l.push(`  selectColumn<Row>(),`);
  l.push(`  {`);
  l.push(`    accessorKey: "name",`);
  l.push(`    header: ({ column }) => <DataTableColumnHeader column={column} title="Component" />,`);
  l.push(`    enableHiding: false,`);
  l.push(`    meta: { label: "Component", lines: ${lines}${icon("SquareLibrary")}${edit ? `, editor: "text"` : ""} },`);
  l.push(`  },`);
  l.push(`  {`);
  l.push(`    accessorKey: "primitives",`);
  l.push(`    header: ({ column }) => <DataTableColumnHeader column={column} title="Primitives" />,`);
  l.push(`    cell: ({ row }) => (`);
  l.push(`      // The 24px badge overhangs the line box instead of growing the row.`);
  l.push(`      <span className="flex h-[1lh] items-center">`);
  l.push(`        <Badge`);
  l.push(`          variant="ghost"`);
  l.push(`          color={PRIMITIVE_COLOR[row.original.primitives as keyof typeof PRIMITIVE_COLOR] ?? "gray"}`);
  l.push(`        >`);
  l.push(`          {row.original.primitives}`);
  l.push(`        </Badge>`);
  l.push(`      </span>`);
  l.push(`    ),`);
  l.push(
    `    meta: { label: "Primitives"${icon("Folder")}${edit ? `, editor: { type: "select", options: [${Object.entries(PRIMITIVE_COLOR).map(([value, color]) => `{ value: ${JSON.stringify(value)}, color: ${JSON.stringify(color)} as const }`).join(", ")}] }` : ""} },`
  );
  l.push(`  },`);
  l.push(`  {`);
  l.push(`    accessorKey: "props",`);
  l.push(`    header: ({ column }) => <DataTableColumnHeader column={column} title="Props" />,`);
  l.push(
    `    meta: { label: "Props", className: "tabular-nums"${icon("SlidersHorizontal")}${edit ? `, editor: { type: "number", options: ${JSON.stringify(DATA_TABLE_PROPS_OPTIONS).replace(/,/g, ", ")} }` : ""} },`
  );
  l.push(`  },`);
  l.push(`  {`);
  l.push(`    accessorKey: "added",`);
  l.push(`    header: ({ column }) => <DataTableColumnHeader column={column} title="Added" />,`);
  l.push(`    meta: { label: "Added", className: "tabular-nums whitespace-nowrap"${icon("Calendar")}${edit ? `, editor: "date"` : ""} },`);
  l.push(`  },`);
  if (edit) {
    l.push(`  {`);
    l.push(`    accessorKey: "tags",`);
    l.push(`    header: "Tags",`);
    l.push(`    enableSorting: false,`);
    l.push(
      `    meta: { label: "Tags", className: "min-w-56", editor: { type: "tags", options: ${JSON.stringify(DATA_TABLE_TAG_OPTIONS).replace(/,/g, ", ")}, creatable: true } },`
    );
    l.push(`  },`);
  }
  l.push(`  {`);
  l.push(`    accessorKey: "slug",`);
  l.push(`    header: "Website",`);
  l.push(`    cell: ({ row }) => (`);
  l.push(`      <a`);
  l.push(`        href={\`/docs/\${row.original.slug}\`}`);
  l.push(`        className="underline decoration-foreground/30 underline-offset-2 transition-colors duration-80 hover:decoration-foreground"`);
  l.push(`      >`);
  l.push(`        {\`/docs/\${row.original.slug}\`}`);
  l.push(`      </a>`);
  l.push(`    ),`);
  l.push(`    meta: { label: "Website", lines: ${lines}, className: "min-w-60"${icon("Link")} },`);
  l.push(`  },`);
  l.push(`  {`);
  l.push(`    accessorKey: "summary",`);
  l.push(`    header: "Summary",`);
  l.push(`    // Last of the data columns: it takes the width left, at least 256px.`);
  l.push(`    meta: { label: "Summary", className: "w-full min-w-64", lines: ${summaryLines}${icon("File")}${edit ? `, editor: "text"` : ""} },`);
  l.push(`  },`);
  if (p.rowActions) {
    l.push(`  rowActionsColumn<Row>((row) => (`);
    l.push(`    <>`);
    l.push(`      <MenuItem index={0} label="Open docs" onSelect={() => window.location.assign(\`/docs/\${row.original.slug}\`)} />`);
    l.push(`      <MenuItem index={1} label="Copy slug" onSelect={() => navigator.clipboard?.writeText(row.original.slug)} />`);
    l.push(`    </>`);
    l.push(`  )),`);
  }
  l.push(`];`);
  l.push(``);
  l.push(`export function DataTableDemo() {`);
  if (edit) {
    l.push(`  // The table shows what your data holds: each edit writes back here.`);
    l.push(`  const [rows, setRows] = useState(ROWS);`);
    if (tree) {
      l.push(`  // A sub-row's edit lands in its parent's subRows.`);
      l.push(`  const update = (list: Row[], slug: string, key: string, value: unknown): Row[] =>`);
      l.push(`    list.map((r) =>`);
      l.push(`      r.slug === slug`);
      l.push(`        ? { ...r, [key]: value }`);
      l.push(`        : r.subRows ? { ...r, subRows: update(r.subRows, slug, key, value) } : r`);
      l.push(`    );`);
    }
  }
  l.push(`  const table = useDataTable({`);
  l.push(`    data: ${edit ? "rows" : "ROWS"},`);
  l.push(`    columns,`);
  l.push(`    pageSize: ${p.pagination ? p.pageSize : "ROWS.length"},`);
  l.push(`    getRowId: (row) => row.slug,`);
  if (tree) l.push(`    getSubRows: (row) => row.subRows,`);
  if (!p.pinning) l.push(`    enableColumnPinning: false,`);
  l.push(`    initialState: { sorting: [{ id: "added", desc: true }] },`);
  l.push(`  });`);
  l.push(``);
  l.push(`  return (`);
  l.push(`    <div className="flex w-full flex-col gap-3">`);
  if (p.title) l.push(`      <DataTableTitle>Components</DataTableTitle>`);
  if (p.filter !== "none" || p.filters || p.viewMenu) {
    l.push(`      <div className="flex flex-wrap items-center gap-2">`);
    if (p.filters) l.push(`        <DataTableFilters table={table} />`);
    l.push(`        <div className="ml-auto flex items-center gap-1">`);
    if (p.viewMenu) l.push(`          <DataTableViewOptions table={table} />`);
    if (p.filter === "column") {
      l.push(`          <DataTableSearch table={table} column="name" placeholder="Search components…" />`);
    } else if (p.filter === "all") {
      l.push(`          <DataTableSearch table={table} placeholder="Search all columns…" />`);
    }
    l.push(`        </div>`);
    l.push(`      </div>`);
  }
  const tableProps = [
    "table={table}",
    ...(p.resize ? ["resizeColumns"] : []),
    ...(p.reorder ? ["reorderColumns"] : []),
    ...(p.align !== "auto" ? [`cellAlign="${p.align}"`] : []),
  ];
  if (edit) {
    l.push(`      <DataTable`);
    for (const prop of tableProps) l.push(`        ${prop}`);
    l.push(`        onCellEdit={({ row, columnId, value }) =>`);
    l.push(
      tree
        ? `          setRows((old) => update(old, row.original.slug, columnId, value))`
        : `          setRows((old) => old.map((r) => (r.slug === row.original.slug ? { ...r, [columnId]: value } : r)))`
    );
    l.push(`        }`);
    l.push(`      />`);
  } else l.push(`      <DataTable ${tableProps.join(" ")} />`);
  if (p.pagination) l.push(`      <DataTablePagination table={table} />`);
  if (p.selection) {
    l.push(`      {/* Floats over the table while rows are selected: \u2318K opens the actions. */}`);
    l.push(`      <DataTableSelectionBar`);
    l.push(`        table={table}`);
    l.push(`        actions={(rows) => [`);
    l.push(`          {`);
    l.push(`            value: "slugs",`);
    l.push(`            label: "Copy slugs",`);
    l.push(`            onSelect: () => navigator.clipboard?.writeText(rows.map((r) => r.original.slug).join("\\n")),`);
    l.push(`          },`);
    l.push(`          {`);
    l.push(`            value: "names",`);
    l.push(`            label: "Copy names",`);
    l.push(`            onSelect: () => navigator.clipboard?.writeText(rows.map((r) => r.original.name).join("\\n")),`);
    l.push(`          },`);
    l.push(`        ]}`);
    l.push(`      />`);
  }
  l.push(`    </div>`);
  l.push(`  );`);
  l.push(`}`);
  return l.join("\n") + "\n";
}

export function generateDataTablePresetFiles(p: DataTablePreset): PresetFile[] {
  return [
    {
      path: "components/data-table-demo.tsx",
      type: "registry:component",
      target: "components/data-table-demo.tsx",
      content: dataTableDemoFile(p),
    },
  ];
}

/** Registry dependencies the generated file needs, as plain names. The
 *  route flavors them: data-table pulls dual-flavor parts, so it resolves to
 *  the chosen flavor's payload. */
export function dataTablePresetRegistryDeps(_p: DataTablePreset): string[] {
  return ["utils", "data-table", "badge"];
}

/** npm dependencies beyond what registryDependencies pull transitively. */
export function dataTablePresetNpmDeps(p: DataTablePreset): string[] {
  return p.headerIcons ? ["lucide-react"] : [];
}

export const DATA_TABLE_PRESET_GENERATOR: PresetGenerator = {
  title: "DataTable (playground preset)",
  description:
    "A data table generated from a fluidfunctionalism.com playground configuration: the exact variant you built, installable.",
  files: (p) => generateDataTablePresetFiles(p as unknown as DataTablePreset),
  registryDeps: (p) => dataTablePresetRegistryDeps(p as unknown as DataTablePreset),
  npmDeps: (p) => dataTablePresetNpmDeps(p as unknown as DataTablePreset),
};
