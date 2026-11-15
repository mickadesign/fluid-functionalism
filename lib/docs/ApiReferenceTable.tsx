"use client";

import { useMemo, useRef } from "react";
import { useDataTable, DataTable, DataTableSearch, type ColumnDef } from "@/components/ui/data-table";
import { fontWeights } from "@/registry/default/lib/font-weight";
import type { ApiTable } from "@/lib/docs/api/types";
import { Description } from "@/lib/docs/PropsTable";

/** A row of the reference: a group (a component, a hook) with its props
 *  under it, or one prop. */
interface ApiRow {
  id: string;
  name: string;
  type: string;
  default: string;
  description: string;
  children?: ApiRow[];
}

const columns: ColumnDef<ApiRow>[] = [
  {
    accessorKey: "name",
    header: "Prop",
    cell: ({ row }) =>
      row.original.children ? (
        <span className="text-foreground" style={{ fontVariationSettings: fontWeights.semibold }}>
          {row.original.name}
          {/* How much is under it, while it is closed. */}
          {!row.getIsExpanded() && (
            <span className="ml-2 font-mono text-site-caption text-muted-foreground" style={{ fontVariationSettings: fontWeights.normal }}>
              {row.original.children.length}
            </span>
          )}
        </span>
      ) : (
        <span className="font-mono text-site-caption text-foreground">{row.original.name}</span>
      ),
    // 24px past what its names need: the longest sat tight against Type.
    meta: { filter: false, lines: "wrap", className: "min-w-55" },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <span className="font-mono text-site-caption [overflow-wrap:anywhere]">{row.original.type}</span>,
    meta: { filter: false, lines: "wrap", className: "min-w-32 text-muted-foreground" },
  },
  {
    accessorKey: "default",
    header: "Default",
    cell: ({ row }) => <span className="font-mono text-site-caption [overflow-wrap:anywhere]">{row.original.default}</span>,
    // A floor: "the page size" on three lines read as a column squeezed.
    meta: { filter: false, lines: "wrap", className: "min-w-20 text-muted-foreground" },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => <Description text={row.original.description} />,
    meta: { filter: false, lines: "wrap", className: "w-full min-w-48 text-muted-foreground" },
  },
];

/** A long API reference as the library's own DataTable: each group is a
 *  row that opens into its props (sub-rows), the ones marked
 *  `collapsed: true` closed at first, and one search covers them all. */
export function ApiReferenceTable({ groups }: { groups: ApiTable[] }) {
  const data = useMemo<ApiRow[]>(
    () =>
      groups.map((group) => ({
        id: group.title,
        name: group.title,
        type: "",
        default: "",
        description: group.description ?? "",
        children: group.props.map((prop) => ({
          id: `${group.title}/${prop.name}`,
          name: prop.name,
          type: prop.type,
          default: prop.default ?? "",
          description: prop.description,
        })),
      })),
    [groups]
  );
  const table = useDataTable({
    data,
    columns,
    getRowId: (row) => row.id,
    getSubRows: (row) => row.children,
    // Every group on one page.
    pageSize: groups.length,
    enableSorting: false,
    enableColumnPinning: false,
    initialState: {
      expanded: Object.fromEntries(groups.filter((g) => g.collapsed !== true).map((g) => [g.title, true])),
    },
  });
  const rootRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={rootRef} className="flex w-full flex-col gap-2">
      <div className="flex justify-end">
        <DataTableSearch table={table} placeholder="Search the API…" />
      </div>
      <DataTable
        table={table}
        resizeColumns
        empty={{ title: "No props match" }}
        // A group opens from anywhere on its row, through its own chevron,
        // so it moves the way the table opens rows.
        onRowClick={(row) => {
          if (!row.getCanExpand()) return;
          rootRef.current
            ?.querySelector<HTMLElement>(`tbody tr[data-row-id="${CSS.escape(row.id)}"] button[aria-expanded]`)
            ?.click();
        }}
      />
    </div>
  );
}
