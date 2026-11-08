"use client";

import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { useIcon } from "@/lib/icon-context";
import { PropsTable } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { apiReference } from "@/lib/docs/api/data-table";
import { PlaygroundLayout } from "@/lib/docs/playground";
import { DataTablePlayground } from "@/lib/docs/playgrounds/data-table";
import { PaymentsTable, SortableTable, SearchTable, LoadingTable } from "./demo-data";

const fullCode = `import {
  useDataTable, DataTable, DataTableColumnHeader,
  DataTableSearch, DataTableViewOptions, DataTablePagination,
  selectColumn, rowActionsColumn, type ColumnDef,
} from "./components";
import { MenuItem, Badge } from "./components";

type Payment = {
  id: string;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
  amount: number;
};

const columns: ColumnDef<Payment>[] = [
  selectColumn<Payment>(),
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge variant="ghost" color="green">{row.original.status}</Badge>,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    meta: { label: "Email" },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => currency.format(row.original.amount),
    meta: { label: "Amount" },
  },
  rowActionsColumn<Payment>((row) => (
    <>
      <MenuItem index={0} label="Copy payment ID" onSelect={() => copy(row.original.id)} />
      <MenuItem index={1} label="View customer" />
      <MenuItem index={2} label="View payment details" />
    </>
  )),
];

const table = useDataTable({ data: payments, columns, pageSize: 5 });

<div className="flex flex-col gap-3">
  <div className="flex items-center gap-2">
    <DataTableSearch table={table} column="email" placeholder="Search emails…" />
    <DataTableViewOptions table={table} className="ml-auto" />
  </div>
  <DataTable
    table={table}
    resizeColumns
    reorderColumns
    onRowClick={(row) => row.toggleSelected()}
  />
  <DataTablePagination table={table} />
</div>`;

const sortCode = `import { useDataTable, DataTable, DataTableColumnHeader, type ColumnDef } from "./components";

const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
  },
];

const table = useDataTable({ data: payments, columns });

<DataTable table={table} />`;

const searchCode = `import { useDataTable, DataTable, DataTableSearch } from "./components";

const table = useDataTable({ data: payments, columns });

<div className="flex flex-col gap-3">
  {/* No column: the field searches every column. */}
  <DataTableSearch table={table} placeholder="Search payments…" />
  <DataTable
    table={table}
    empty={{ title: "No payments match", description: "Try an email, a status, or an amount." }}
  />
</div>`;

const loadingCode = `import { useDataTable, DataTable } from "./components";

const { data, isLoading } = useYourRequest();
const table = useDataTable({ data: data ?? [], columns });

// Skeleton rows the size of real ones; set loading back to false with the
// data in place and each cell crossfades from its skeleton.
<DataTable table={table} loading={isLoading} loadingRows={5} />`;

// ── Playground ───────────────────────────────────────────

function DataTablePlaygroundSection() {
  const ReloadIcon = useIcon("rotate-ccw");
  return (
    <DataTablePlayground>
      {({ preview, controls, code, onExpandedChange, onReplay }) => (
        <PlaygroundLayout
          expandable
          onExpandedChange={onExpandedChange}
          label="Customize DataTable"
          controls={controls}
          preview={
            <ComponentPreview
              code={code}
              padding="none"
              align="top"
              playbackButton={
                onReplay && { icon: <ReloadIcon size={16} strokeWidth={1.5} />, tooltip: "Reload data", onClick: onReplay }
              }
            >
              {preview}
            </ComponentPreview>
          }
        />
      )}
    </DataTablePlayground>
  );
}

export default function DataTableDoc() {
  return (
    <DocPage
      title="DataTable"
      slug="data-table"
      description="TanStack Table on the fluid hover Table: sorting, search, column resizing and reordering, row selection, and pagination, each part optional."
    >
      <DocSection title="Playground">
        <DataTablePlaygroundSection />
      </DocSection>

      <DocSection title="All parts">
        <p className="text-site-body text-muted-foreground">
          Every part on one table. TanStack Table holds the state and each part reads and sets it, so you
          keep the ones you need. Select a few rows, sort by amount, hide a column, drag a header to move
          its column or its right edge to resize it, or open a row&apos;s menu.
        </p>
        <ComponentPreview code={fullCode}>
          <PaymentsTable />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Sorting">
        <p className="text-site-body text-muted-foreground">
          A column header sorts ascending, then descending, then clears. Shift-click a second header
          to sort by both. The arrow turns over instead of swapping.
        </p>
        <ComponentPreview code={sortCode}>
          <div className="w-full">
            <SortableTable />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Search and empty">
        <p className="text-site-body text-muted-foreground">
          Without a column, the search covers them all. When nothing matches, the body keeps its
          height and says so.
        </p>
        <ComponentPreview code={searchCode}>
          <SearchTable />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Loading">
        <p className="text-site-body text-muted-foreground">
          While a request runs, each cell holds a skeleton the size of its text. When the data lands,
          every skeleton fades out as its cell fades in, so nothing jumps and no cell sits empty.
          Requests that finish within 160ms never show one.
        </p>
        <ComponentPreview code={loadingCode}>
          <LoadingTable />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Keyboard">
        <ul className="text-site-body text-muted-foreground flex list-disc flex-col gap-1 pl-5">
          <li>↑ / ↓ move to the same column in the row above or below; Home / End jump to the first or last row.</li>
          <li>Shift + ↑ / ↓ carries the selection along, like Shift-clicking a box selects every row since the last one clicked.</li>
          <li>⌘A / Ctrl+A selects every row on the page; Esc clears the selection.</li>
          <li>With onRowClick, the rows are one Tab stop: ↑ / ↓ and Home / End move between them, Enter or Space opens one.</li>
          <li>Alt + ← / → on a focused header moves its column; ← / → on a focused resize handle steps its width by 16px.</li>
        </ul>
      </DocSection>

      <DocSection title="API Reference">
        <PropsTable groups={apiReference} />
      </DocSection>
    </DocPage>
  );
}
