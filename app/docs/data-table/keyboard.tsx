"use client";

import { Fragment, useRef } from "react";
import { useDataTable, DataTable, type ColumnDef } from "@/components/ui/data-table";
import { KeyCaps } from "@/lib/key-cap";
import { fontWeights } from "@/registry/default/lib/font-weight";

// The DataTable page's keys, grouped by what they act on. Each row is its
// keys as caps (the one key cap design) and what they do, in a DataTable
// whose groups are rows over their shortcuts, so the section reads as a
// reference to scan rather than a paragraph to parse.
//
// A shortcut is a list of combos that do the same thing; a combo is a list
// of keys pressed together. [["↑"], ["↓"]] reads "↑ / ↓"; [["Shift", "↑"]]
// reads as two caps side by side.

type Shortcut = { keys: string[][]; does: string };

const GROUPS: { title: string; where: string; shortcuts: Shortcut[] }[] = [
  {
    title: "Rows",
    where: "On a row, or with the pointer over one",
    shortcuts: [
      { keys: [["↑"], ["↓"]], does: "The row above or below." },
      { keys: [["Home"], ["End"]], does: "The first or the last row." },
      { keys: [["↓"]], does: "From the search or a header: into the first row." },
    ],
  },
  {
    title: "Selection",
    where: "With a selection column",
    shortcuts: [
      { keys: [["X"], ["Enter"]], does: "Selects or clears the row." },
      { keys: [["Shift", "↑"], ["Shift", "↓"]], does: "Grows or shrinks the selection from where it started." },
      { keys: [["⌘", "A"]], does: "Selects every row, on every page, with the pointer anywhere over the table." },
      { keys: [["Space"], ["Enter"]], does: "On the header's box: selects or clears every row." },
      { keys: [["Esc"]], does: "Clears the selection." },
      { keys: [["⌘", "K"]], does: "Opens the selection's actions." },
    ],
  },
  {
    title: "Sub-rows",
    where: "On a row that opens",
    shortcuts: [
      { keys: [["→"]], does: "Opens the row, then steps into it." },
      { keys: [["←"]], does: "Closes the row, or steps back to its parent." },
      { keys: [["Enter"], ["Space"]], does: "Opens and closes it, where rows neither select nor click." },
    ],
  },
  {
    title: "Editing",
    where: "In an editable cell",
    shortcuts: [
      { keys: [["Enter"], ["Esc"]], does: "Leaves the field and keeps what you typed." },
      { keys: [["F2"]], does: "Edits a link." },
      { keys: [["⌘", "Z"]], does: "Takes back the last change." },
      { keys: [["⇧", "⌘", "Z"]], does: "Brings it back." },
    ],
  },
  {
    title: "Moving rows",
    where: "With row reordering",
    shortcuts: [
      { keys: [["Alt", "↑"], ["Alt", "↓"]], does: "Moves the selected rows a place, else the row under the pointer or holding focus." },
      { keys: [["Esc"]], does: "During a drag: puts the row back." },
    ],
  },
  {
    title: "Columns",
    where: "On a header",
    shortcuts: [
      { keys: [["Alt", "←"], ["Alt", "→"]], does: "Moves the column." },
      { keys: [["←"], ["→"]], does: "On a column's edge: steps its width by 16px." },
    ],
  },
];

/** A row of the table: a group with its shortcuts under it, or one
 *  shortcut. */
interface KeyRow {
  id: string;
  /** A group's title; empty on a shortcut. */
  title: string;
  keys: string[][];
  /** A group's context line, or what a shortcut does. */
  does: string;
  /** Every key as text, so a search or a reader finds "Shift". */
  text: string;
  children?: KeyRow[];
}

const ROWS: KeyRow[] = GROUPS.map((group) => ({
  id: group.title,
  title: group.title,
  keys: [],
  does: group.where,
  text: group.title,
  children: group.shortcuts.map((shortcut, i) => ({
    id: `${group.title}/${i}`,
    title: "",
    keys: shortcut.keys,
    does: shortcut.does,
    text: shortcut.keys.map((combo) => combo.join(" ")).join(" / "),
  })),
}));

const columns: ColumnDef<KeyRow>[] = [
  {
    accessorKey: "text",
    header: "Keys",
    cell: ({ row }) =>
      row.original.children ? (
        <span className="text-foreground" style={{ fontVariationSettings: fontWeights.semibold }}>
          {row.original.title}
        </span>
      ) : (
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          {row.original.keys.map((combo, c) => (
            <Fragment key={c}>
              {c > 0 && <span className="text-site-caption text-muted-foreground">/</span>}
              <KeyCaps keys={combo} />
            </Fragment>
          ))}
        </span>
      ),
    meta: { filter: false, className: "min-w-52 whitespace-nowrap" },
  },
  {
    accessorKey: "does",
    header: "What it does",
    meta: { filter: false, lines: "wrap", className: "w-full text-muted-foreground" },
  },
];

/** The page's keys as the table they belong to: each group a row that
 *  opens into its shortcuts (sub-rows), all open, in one column of rows.
 *  (Six lists side by side in two columns read as two unrelated halves.) */
export function KeyboardShortcuts() {
  const table = useDataTable({
    data: ROWS,
    columns,
    getRowId: (row) => row.id,
    getSubRows: (row) => row.children,
    pageSize: ROWS.length,
    enableSorting: false,
    enableColumnPinning: false,
    initialState: { expanded: true },
  });
  const rootRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={rootRef} className="flex flex-col gap-4">
      <DataTable
        table={table}
        // A group opens and closes from anywhere on its row, through its
        // own chevron, so it moves the way the table opens rows.
        onRowClick={(row) => {
          if (!row.getCanExpand()) return;
          rootRef.current
            ?.querySelector<HTMLElement>(`tbody tr[data-row-id="${CSS.escape(row.id)}"] button[aria-expanded]`)
            ?.click();
        }}
      />
      <p className="text-site-caption text-muted-foreground">
        ⌘ is Ctrl on Windows and Linux. A row under the pointer counts as focused, so you can point at
        one and carry on from the keyboard.
      </p>
    </div>
  );
}
