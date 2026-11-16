// The API reference of /docs/data-table: its PropsTables and the API section
// of /docs/data-table.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const useDataTableProps: PropDef[] = [
  { name: "data", type: "TData[]", description: "The rows. Keep the array stable (state or `useMemo`)." },
  { name: "columns", type: "ColumnDef<TData>[]", description: "TanStack column definitions. Keep them stable too." },
  { name: "pageSize", type: "number", default: "10", description: "Rows per page." },
  { name: "filtersHidden", type: "boolean", default: "false", description: "Starts with the chips row hidden while filters are set, for a table that opens on a saved view." },
  { name: "getSubRows", type: "(row: TData) => TData[] | undefined", description: "Gives rows children: a chevron on the first column, `→` / `←` to open and close." },
  { name: "...options", type: "TableOptions<TData>", description: "Anything `useReactTable` takes, like `initialState`, `getRowId` or controlled state." },
];

export const dataTableProps: PropDef[] = [
  { name: "table", type: "Table<TData>", description: "What `useDataTable` returns." },
  { name: "size", type: '"default" | "compact"', description: "Pins every row to 36px or 28px. Omitted, rows follow the SizeProvider." },
  { name: "empty", type: "{ title?, description?, action? }", default: '{ title: "No results" }', description: "What an empty body says. It keeps a page of height, so nothing below moves. With filters set, it offers to clear them." },
  { name: "onRowClick", type: "(row: Row<TData>) => void", description: "Opens a row on click or Space. Clicks on its controls stay with them." },
  { name: "rowHover", type: "boolean", default: "by the table", description: "The hover fill on the row under the pointer. Unset, it shows where a row answers a click (opens, selects, has a menu, moves, edits) and not on a table that is only read." },
  { name: "resizeColumns", type: "boolean", default: "false", description: "Drag a header's right edge, or press `←` / `→` on it, to set a width. Double-click resets." },
  { name: "cellAlign", type: '"auto" | "center" | "top"', default: '"auto"', description: "Where content sits in a row. `auto` goes to the top once a column wraps." },
  { name: "loading", type: "boolean", default: "false", description: "A page of skeleton rows. Each fades out as its cell fades in." },
  { name: "loadingRows", type: "number", default: "the page size", description: "How many skeleton rows to show." },
  { name: "fill", type: "boolean", default: "false", description: "Fills a flex column: rows scroll under a sticky header, search and pages stay in view." },
  { name: "reorderColumns", type: "boolean", default: "false", description: "Drag a header to move its column, or press `Alt` + `←` / `→` on it." },
  { name: "onCellEdit", type: "({ row, columnId, value }) => void", description: "Turns on `meta.editor` and gets each change. Write `value` back to your data." },
  { name: "onRowReorder", type: "({ rows, target, place }) => void", description: "Rows move by the `rowHandleColumn()` handle or `Alt` + `↑` / `↓`. Write the order back with `moveRows(data, move)`." },
  { name: "onUndo", type: "() => void", description: "⌘Z (Ctrl+Z) while focus is in the table. Pass useUndoableRows' `undo`." },
  { name: "onRedo", type: "() => void", description: "⇧⌘Z (Ctrl+Shift+Z, Ctrl+Y) while focus is in the table. Pass useUndoableRows' `redo`." },
];

export const columnMetaProps: PropDef[] = [
  { name: "label", type: "string", description: "The column's name in the Columns menu." },
  { name: "className", type: "string", description: "Classes for the column's cells, like a width." },
  { name: "icon", type: "IconComponent", description: "A 14px icon before the header's title." },
  { name: "editor", type: '"text" | "number" | "date" | "tags" | { type, options?, creatable?, placeholder? } | { type: "select", options }', description: "Edits the column in place: text, a link, a number, a date, tags or a select." },
  { name: "lines", type: '1 | 2 | "wrap"', description: '`1` cuts text to a line, `2` stops after two, `"wrap"` lets it run.' },
  { name: "filter", type: '"text" | "number" | "date" | { type: "options", options } | false', description: "How DataTableFilters filters the column. Omitted, it follows the editor, then the values. `false` leaves it out." },
];

export const columnHeaderProps: PropDef[] = [
  { name: "column", type: "Column<TData>", description: "The header's column." },
  { name: "title", type: "string", description: "The label. Sorts on click when the column can." },
];

export const searchProps: PropDef[] = [
  { name: "table", type: "Table<TData>", description: "What `useDataTable` returns." },
  { name: "column", type: "string", description: "The column to search. Omitted, it searches them all." },
  { name: "placeholder", type: "string", default: '"Search…"', description: "Also the field's accessible name." },
  { name: "collapsible", type: "boolean", default: "true", description: "Rests as a search button that opens into the field. `false` keeps the field open." },
  { name: "width", type: "number", default: "224", description: "The open field's width, in px." },
  { name: "size", type: '"default" | "compact"', description: "Pins the field to one size step." },
];

export const undoableRowsProps: PropDef[] = [
  { name: "useUndoableRows(initial, { getId, limit? })", type: "hook", description: "Rows you change through it, each change a step (the last 100 by default). `reset(rows)` starts over." },
  { name: "→ rows", type: "T[]", description: "Pass to useDataTable's `data`." },
  { name: "→ edit(id, change, label?)", type: "function", description: "Merges `change` into a row. Typing in one cell within 1s is one step." },
  { name: "→ remove(ids, label?) / insert(items, index?, label?)", type: "function", description: "Deletes or adds rows as one step, labelled \"Deleted 3 rows\" by default." },
  { name: "→ apply(label, change)", type: "function", description: "Any change as one step: `change(rows)` returns the new rows." },
  { name: "→ undo / redo / canUndo / canRedo", type: "function / boolean", description: "Pass undo and redo to DataTable's onUndo and onRedo." },
  { name: "→ stepCount / undoTo(count)", type: "number / function", description: "Read `stepCount` before a change; `undoTo(it)` goes back to before that change." },
  { name: "→ lastStep", type: "string | undefined", description: "The label of the step undo would take back." },
];

export const titleProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "The table's name on the toolbar's row, at the page-title size." },
  { name: "table", type: "Table<TData>", description: "With a selection column, the title steps in 28px to start where the first data column does." },
  { name: "as", type: '"h1" | "h2" | "h3"', default: '"h1"', description: "The heading level. Use a lower one under a page that already has an h1." },
  { name: "size", type: '"default" | "compact"', description: "Pins the heading to one size step." },
];

export const filtersProps: PropDef[] = [
  { name: "table", type: "Table<TData>", description: "What `useDataTable` returns. The menu lists the columns that can filter. While filters are set, the button shows and hides the chips row." },
  { name: "size", type: '"default" | "compact"', description: "Pins the button and its menu to one size step." },
  { name: "className", type: "string", description: "Classes for the button's box." },
];

export const filterChipsProps: PropDef[] = [
  { name: "table", type: "Table<TData>", description: "What `useDataTable` returns. One chip per filter and a + to add one, on their own row. Renders nothing while no filter is set." },
  { name: "size", type: '"default" | "compact"', description: "Pins the chips to one size step." },
  { name: "className", type: "string", description: "Classes for the row." },
  { name: "children", type: "ReactNode", description: "Actions about the table's state (a Save view button), after the +. They don't bring the row: with no filter set it stays away." },
];

export const viewOptionsProps: PropDef[] = [
  { name: "table", type: "Table<TData>", description: "What `useDataTable` returns. Lists the columns that can hide, under a Wrap text switch." },
  { name: "label", type: "string", default: '"Columns"', description: "The button's accessible name, tooltip and menu title." },
  { name: "size", type: '"default" | "compact"', description: "Pins the button and the menu to one size step." },
];

export const rowActionsProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "`MenuItem`s, each with its `index`." },
  { name: "label", type: "string", default: '"Row actions"', description: "The ⋯ button's accessible name." },
];

export const paginationProps: PropDef[] = [
  { name: "table", type: "Table<TData>", description: "What `useDataTable` returns." },
  { name: "pageSizes", type: "number[]", default: "[10, 20, 50]", description: "The rows-per-page choices. An empty array hides the select." },
  { name: "size", type: '"default" | "compact"', description: "Pins the text and arrows to one size step." },
];

export const selectionBarProps: PropDef[] = [
  { name: "table", type: "Table<TData>", description: "What `useDataTable` returns. Shows while any row is selected." },
  { name: "actions", type: "CommandMenuItemData[] | (rows: Row<TData>[]) => CommandMenuItemData[]", description: "The ⌘K menu's actions, or a function that builds them from the selected rows." },
  { name: "shortcut", type: "string | null", default: '"mod+k"', description: "Opens the actions while rows are selected. `null` binds nothing." },
  { name: "placeholder", type: "string", default: '"Act on 3 rows…"', description: "The menu field's placeholder." },
  { name: "size", type: '"default" | "compact"', description: "Pins the bar to one size step." },
];

// The ready-made columns and what goes with them, as one group: each was
// a heading over a single row.
export const columnHelperProps: PropDef[] = [
  { name: "selectColumn()", type: "ColumnDef<TData>", description: "A first column of checkboxes. The header box selects every row the search leaves, on every page." },
  { name: "rowHandleColumn()", type: "ColumnDef<TData>", description: "A first column of drag handles, before `selectColumn()`. Rows move once DataTable has `onRowReorder`." },
  { name: "moveRows(data, move)", type: "TData[]", description: "`data` with a move from `onRowReorder` applied: the moved rows, in order, right before or after the target." },
  { name: "rowActionsColumn(items)", type: "ColumnDef<TData>", description: "A last column of ⋯ menus. `items(row)` returns the row's `MenuItem`s; a right-click on the row opens them too." },
];

/** The page's tables, the ones every table needs first and open; the rest
 *  start closed on the page (the Markdown lists them all), ordered by how
 *  often they are reached for. */
export const apiReference: ApiTable[] = [
  { title: "useDataTable", description: "The hook that builds the table: rows, columns and state.", props: useDataTableProps, collapsed: false },
  { title: "DataTable", description: "The table itself, with the parts you turn on.", props: dataTableProps, collapsed: false },
  { title: "Column meta", description: "Per-column settings, on a column's `meta`.", props: columnMetaProps, collapsed: false },
  { title: "DataTableColumnHeader", description: "A header that opens its column's menu.", props: columnHeaderProps, collapsed: true },
  { title: "DataTableTitle", description: "The table's heading, on the toolbar's row.", props: titleProps, collapsed: true },
  { title: "DataTableSearch", description: "A search field for one column or all of them.", props: searchProps, collapsed: true },
  { title: "DataTableFilters", description: "The button that adds a filter.", props: filtersProps, collapsed: true },
  { title: "DataTableFilterChips", description: "The filters set, one chip each, on their own row.", props: filterChipsProps, collapsed: true },
  { title: "DataTablePagination", description: "Rows per page and the page arrows.", props: paginationProps, collapsed: true },
  { title: "DataTableSelectionBar", description: "The floating bar that acts on the selected rows.", props: selectionBarProps, collapsed: true },
  { title: "DataTableViewOptions", description: "The Columns menu: show, hide and wrap.", props: viewOptionsProps, collapsed: true },
  { title: "useUndoableRows", description: "Rows with undo and redo, one step per change.", props: undoableRowsProps, collapsed: true },
  { title: "Column helpers", description: "Ready-made columns: boxes, drag handles, row menus.", props: columnHelperProps, collapsed: true },
  { title: "DataTableRowActions", description: "The ⋯ menu in a row.", props: rowActionsProps, collapsed: true },
];
