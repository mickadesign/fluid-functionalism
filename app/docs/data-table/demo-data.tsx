"use client";

import { useState } from "react";
import {
  useDataTable,
  DataTable,
  DataTableColumnHeader,
  DataTableSearch,
  DataTableTitle,
  type ColumnDef,
} from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useFontsReady } from "@/lib/docs/use-fonts-ready";

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

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

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
  // Opens sorted, so the arrow and the order show.
  const table = useDataTable({ data, columns: sortOnlyColumns, initialState: { sorting: [{ id: "amount", desc: true }] } });
  // Skeleton rows until the fonts are in: see useFontsReady.
  const ready = useFontsReady();
  return (
    <div className="flex w-full flex-col gap-2">
      {/* h3 here: the docs section above is the h2. */}
      <DataTableTitle as="h3" table={table} className="mb-1 font-heading-display">Payments</DataTableTitle>
      <DataTable table={table} loading={!ready} loadingRows={5} />
    </div>
  );
}

/** A search over every column, and an empty state when nothing matches. */
export function SearchTable() {
  const [data] = useState(() => PAYMENTS.slice(0, 6));
  // Opens on a search, so the field is open and the rows it leaves show.
  const table = useDataTable({ data, columns: sortOnlyColumns, initialState: { globalFilter: "success" } });
  const ready = useFontsReady();
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="mb-1 flex flex-wrap items-center gap-1">
        <DataTableTitle as="h3" table={table} className="font-heading-display">Payments</DataTableTitle>
        <span className="ml-auto" />
        <DataTableSearch table={table} placeholder="Search payments…" />
      </div>
      <DataTable
        table={table}
        loading={!ready}
        // As many as the search it opens on leaves.
        loadingRows={3}
        empty={{ title: "No payments match", description: "Try an email, a status, or an amount." }}
      />
    </div>
  );
}

/** Skeleton rows while a request runs. The section opens held in loading,
 *  so the skeletons can be looked at; the button lands the data, then
 *  starts the load again. */
export function LoadingTable() {
  const [data] = useState(() => PAYMENTS.slice(0, 5));
  const [loading, setLoading] = useState(true);
  const table = useDataTable({ data, columns: sortOnlyColumns });
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="mb-1 flex flex-wrap items-center gap-1">
        <DataTableTitle as="h3" table={table} className="font-heading-display">Payments</DataTableTitle>
        <span className="ml-auto" />
        <Button variant="tertiary" onClick={() => setLoading((on) => !on)}>
          {loading ? "Finish loading" : "Load again"}
        </Button>
      </div>
      <DataTable table={table} loading={loading} loadingRows={5} />
    </div>
  );
}
