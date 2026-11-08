"use client";

import { useState } from "react";
import {
  useDataTable,
  DataTable,
  DataTableColumnHeader,
  DataTableSearch,
  DataTableViewOptions,
  DataTablePagination,
  selectColumn,
  rowActionsColumn,
  type ColumnDef,
} from "@/components/ui/data-table";
import { MenuItem } from "@/components/ui/menu-item";
import { Badge } from "@/registry/default/badge";
import { Button } from "@/components/ui/button";

export type Payment = {
  id: string;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
  amount: number;
};

export const PAYMENTS: Payment[] = [
  { id: "m5gr84i9", status: "success", email: "ken99@example.com", amount: 316 },
  { id: "3u1reuv4", status: "success", email: "abe45@example.com", amount: 242 },
  { id: "derv1ws0", status: "processing", email: "monserrat44@example.com", amount: 837 },
  { id: "5kma53ae", status: "success", email: "silas22@example.com", amount: 874 },
  { id: "bhqecj4p", status: "failed", email: "carmella@example.com", amount: 721 },
  { id: "p0r8xk2d", status: "pending", email: "nadia.r@example.com", amount: 129 },
  { id: "w7t2lq9z", status: "success", email: "omar.f@example.com", amount: 560 },
  { id: "c4n6vb1y", status: "processing", email: "lea.m@example.com", amount: 98 },
  { id: "h2j8sd5k", status: "failed", email: "theo@example.com", amount: 415 },
  { id: "q9z3mf7w", status: "success", email: "ines.b@example.com", amount: 1290 },
  { id: "x1c5gt8r", status: "pending", email: "yuki@example.com", amount: 64 },
  { id: "k6v2pn4e", status: "success", email: "arjun.k@example.com", amount: 705 },
];

const STATUS_COLOR = {
  pending: "gray",
  processing: "blue",
  success: "green",
  failed: "red",
} as const;

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const columns: ColumnDef<Payment>[] = [
  selectColumn<Payment>(),
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      // The 24px badge overhangs the 20px line box instead of growing the row.
      return (
        <span className="flex h-[1lh] items-center">
          <Badge variant="ghost" color={STATUS_COLOR[status]}>
            {status[0].toUpperCase() + status.slice(1)}
          </Badge>
        </span>
      );
    },
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
      <MenuItem
        index={0}
        label="Copy payment ID"
        onSelect={() => navigator.clipboard?.writeText(row.original.id)}
      />
      <MenuItem index={1} label="View customer" />
      <MenuItem index={2} label="View payment details" />
    </>
  )),
];

/** The full example: search, Columns menu, selection, sorting, row menus and
 *  pagination over the payments above. */
export function PaymentsTable() {
  const [data] = useState(PAYMENTS);
  const table = useDataTable({ data, columns, pageSize: 5, getRowId: (row) => row.id });

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <DataTableSearch table={table} column="email" placeholder="Search emails…" />
        <DataTableViewOptions table={table} className="ml-auto" />
      </div>
      <DataTable table={table} resizeColumns reorderColumns />
      <DataTablePagination table={table} />
    </div>
  );
}

const sortOnlyColumns: ColumnDef<Payment>[] = [
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => row.original.status[0].toUpperCase() + row.original.status.slice(1),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => currency.format(row.original.amount),
  },
];

/** Sorting alone: no toolbar, no pagination, every row on one page. */
export function SortableTable() {
  const [data] = useState(() => PAYMENTS.slice(0, 5));
  const table = useDataTable({ data, columns: sortOnlyColumns });
  return <DataTable table={table} />;
}

/** A search over every column, and an empty state when nothing matches. */
export function SearchTable() {
  const [data] = useState(() => PAYMENTS.slice(0, 4));
  const table = useDataTable({ data, columns: sortOnlyColumns });
  return (
    <div className="flex w-full flex-col gap-3">
      <DataTableSearch table={table} placeholder="Search payments…" />
      <DataTable
        table={table}
        empty={{ title: "No payments match", description: "Try an email, a status, or an amount." }}
      />
    </div>
  );
}

/** Skeleton rows while a request runs: Reload plays a 1.5s fetch. */
export function LoadingTable() {
  const [data] = useState(() => PAYMENTS.slice(0, 5));
  const [loading, setLoading] = useState(false);
  const table = useDataTable({ data, columns: sortOnlyColumns });
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex justify-end">
        <Button
          variant="tertiary"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 1500);
          }}
        >
          Reload
        </Button>
      </div>
      <DataTable table={table} loading={loading} loadingRows={5} />
    </div>
  );
}
