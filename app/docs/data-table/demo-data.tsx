"use client";

import { useEffect, useRef, useState } from "react";
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
import { clickStep, glideStep, useLoop, usePlayback, useScriptCursor } from "@/app/docs/skill/hero-shared";
import { CursorLayer, GLIDE, retypeSteps, useHoldHeight, useScriptFocus } from "./scripted";

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
  // Left alone, the section plays itself: a cursor opens a header's menu
  // and picks a sort, three times: Amount turns over, Status takes the
  // sort, Amount takes it back. A menu takes focus when it opens, so the
  // script only opens one while nobody else holds focus, and hands focus
  // back to the page after each pick.
  const { rootRef, playing, bind } = usePlayback();
  const on = playing && ready;
  const focus = useScriptFocus(rootRef, bind);
  // The menu renders in a portal: the cursor hovers it too.
  const cursor = useScriptCursor(rootRef, on, "[role=menu]");
  const menuItem = (n: number) =>
    focus.scripting.current ? document.querySelectorAll<HTMLElement>("[role=menu] [role^=menuitem]")[n] : undefined;
  const pick = (column: string, item: number, holdMs: number) => {
    const header = `thead th[data-column-id=${column}] button[aria-haspopup]`;
    return [
      ...clickStep(
        cursor,
        header,
        0,
        () => {
          if (focus.take()) rootRef.current?.querySelector<HTMLElement>(header)?.click();
        },
        450
      ),
      {
        ms: GLIDE + 350,
        run: () => {
          const el = menuItem(item);
          if (el) cursor.goto(el);
        },
      },
      {
        ms: 120,
        run: () => {
          const el = menuItem(item);
          if (!el) return;
          cursor.click();
          el.click();
        },
      },
      // The closing menu sends focus to its header; back to the page.
      { ms: holdMs, run: focus.giveBack },
    ];
  };
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(settle.current), []);
  useLoop(on, [...pick("amount", 0, 1500), ...pick("status", 0, 1500), ...pick("amount", 1, 2000)], () => {
    if (!focus.scripting.current) return;
    // A visitor took over with the script's menu open: close it, then
    // hand focus back once the menu has returned it.
    document
      .querySelector("[role=menu]")
      ?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    settle.current = setTimeout(focus.giveBack, 100);
  });
  return (
    <div ref={rootRef} className="flex w-full flex-col gap-2" {...focus.bind}>
      <CursorLayer rootRef={rootRef} cursor={cursor} playing={on} />
      {/* h3 here: the docs section above is the h2. */}
      <DataTableTitle as="h3" table={table} className="mb-1 font-heading-display">Payments</DataTableTitle>
      <DataTable table={table} loading={!ready} loadingRows={5} />
    </div>
  );
}

/** A search over every column, and an empty state when nothing matches. */
export function SearchTable() {
  const [data] = useState(() => PAYMENTS.slice(0, 6));
  const table = useDataTable({ data, columns: sortOnlyColumns });
  const ready = useFontsReady();
  // Left alone, the section plays itself: a cursor clicks the field and
  // types a search that leaves 3 rows, one that leaves none, then clears
  // it. The field's text is set without taking focus. Every row shows at
  // rest and the demo keeps that height, so the page below it stays put.
  const { rootRef, playing, bind } = usePlayback();
  const on = playing && ready;
  const cursor = useScriptCursor(rootRef, on);
  useHoldHeight(rootRef);
  const field = () => rootRef.current?.querySelector<HTMLInputElement>("input[type=search]");
  useLoop(on, [
    glideStep(cursor, "input[type=search]", 0),
    { ms: 300, run: () => cursor.click() },
    ...retypeSteps(field, "", "success", 1800),
    ...retypeSteps(field, "success", "refund", 2000),
    ...retypeSteps(field, "refund", "", 1800),
  ]);
  return (
    <div ref={rootRef} className="flex w-full flex-col gap-2" {...bind}>
      <CursorLayer rootRef={rootRef} cursor={cursor} playing={on} />
      <div className="mb-1 flex flex-wrap items-center gap-1">
        <DataTableTitle as="h3" table={table} className="font-heading-display">Payments</DataTableTitle>
        <span className="ml-auto" />
        {/* Always open: the script types into it. */}
        <DataTableSearch table={table} placeholder="Search payments…" collapsible={false} />
      </div>
      <DataTable
        table={table}
        loading={!ready}
        loadingRows={6}
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
