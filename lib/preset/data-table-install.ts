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
import { type DataTablePreset, DATA_TABLE_SAMPLE_ROWS } from "./data-table-options";

const PRIMITIVE_COLOR: Record<string, string> = {
  "Radix + Base UI": "blue",
  "Built on both": "purple",
  None: "gray",
};

function dataTableDemoFile(p: DataTablePreset): string {
  const icons = p.headerIcons;
  const lines = p.lines === "wrap" ? `"wrap"` : p.lines;
  const parts = [
    "useDataTable",
    "DataTable",
    "DataTableColumnHeader",
    ...(p.filter !== "none" ? ["DataTableSearch"] : []),
    ...(p.viewMenu ? ["DataTableViewOptions"] : []),
    ...(p.pagination ? ["DataTablePagination"] : []),
    ...(p.selection ? ["selectColumn"] : []),
    ...(p.rowActions ? ["rowActionsColumn"] : []),
    "type ColumnDef",
  ];
  const icon = (name: string) => (icons ? `, icon: ${name}` : "");
  const l: string[] = [];

  l.push(`"use client";`);
  l.push(``);
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
  l.push(`};`);
  l.push(``);
  l.push(`// Sample rows in the playground's shape. Replace with your own data.`);
  l.push(`const ROWS: Row[] = [`);
  for (const r of DATA_TABLE_SAMPLE_ROWS) {
    l.push(
      `  { slug: ${JSON.stringify(r.slug)}, name: ${JSON.stringify(r.name)}, summary: ${JSON.stringify(r.summary)}, primitives: ${JSON.stringify(r.primitives)}, props: ${r.props}, added: ${JSON.stringify(r.added)} },`
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
  l.push(`    meta: { label: "Component"${icon("SquareLibrary")} },`);
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
  l.push(`    meta: { label: "Primitives"${icon("Folder")} },`);
  l.push(`  },`);
  l.push(`  {`);
  l.push(`    accessorKey: "props",`);
  l.push(`    header: ({ column }) => <DataTableColumnHeader column={column} title="Props" />,`);
  l.push(`    meta: { label: "Props", className: "tabular-nums"${icon("SlidersHorizontal")} },`);
  l.push(`  },`);
  l.push(`  {`);
  l.push(`    accessorKey: "added",`);
  l.push(`    header: ({ column }) => <DataTableColumnHeader column={column} title="Added" />,`);
  l.push(`    meta: { label: "Added", className: "tabular-nums whitespace-nowrap"${icon("Calendar")} },`);
  l.push(`  },`);
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
  l.push(`    meta: { label: "Website", lines: 1, className: "min-w-60"${icon("Link")} },`);
  l.push(`  },`);
  l.push(`  {`);
  l.push(`    accessorKey: "summary",`);
  l.push(`    header: "Summary",`);
  l.push(`    // Last of the data columns: it takes the width left, at least 256px.`);
  l.push(`    meta: { label: "Summary", className: "w-full min-w-64", lines: ${lines}${icon("File")} },`);
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
  l.push(`  const table = useDataTable({`);
  l.push(`    data: ROWS,`);
  l.push(`    columns,`);
  l.push(`    pageSize: ${p.pagination ? p.pageSize : "ROWS.length"},`);
  l.push(`    getRowId: (row) => row.slug,`);
  l.push(`    initialState: { sorting: [{ id: "added", desc: true }] },`);
  l.push(`  });`);
  l.push(``);
  l.push(`  return (`);
  l.push(`    <div className="flex w-full flex-col gap-3">`);
  if (p.filter !== "none" || p.viewMenu) {
    l.push(`      <div className="flex items-center gap-2">`);
    if (p.filter === "column") {
      l.push(`        <DataTableSearch table={table} column="name" placeholder="Search components…" />`);
    } else if (p.filter === "all") {
      l.push(`        <DataTableSearch table={table} placeholder="Search all columns…" />`);
    }
    if (p.viewMenu) l.push(`        <DataTableViewOptions table={table} className="ml-auto" />`);
    l.push(`      </div>`);
  }
  const tableProps = [
    "table={table}",
    ...(p.resize ? ["resizeColumns"] : []),
    ...(p.reorder ? ["reorderColumns"] : []),
    ...(p.align !== "auto" ? [`cellAlign="${p.align}"`] : []),
  ];
  l.push(`      <DataTable ${tableProps.join(" ")} />`);
  if (p.pagination) l.push(`      <DataTablePagination table={table} />`);
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
