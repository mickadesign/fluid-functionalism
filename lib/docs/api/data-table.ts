// The API reference of /docs/data-table: its PropsTables and the API section
// of /docs/data-table.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const useDataTableProps: PropDef[] = [
  { name: "data", type: "TData[]", description: "The rows. Keep the array stable (state or useMemo), or TanStack recomputes every render." },
  { name: "columns", type: "ColumnDef<TData>[]", description: "TanStack column definitions. Same identity rule as data." },
  { name: "pageSize", type: "number", default: "10", description: "Rows per page." },
  { name: "getSubRows", type: "(row: TData) => TData[] | undefined", description: "Gives rows children: the first data column gets a chevron and an indent, \u2192 / \u2190 open and close from a focused row, and a page keeps its parents however many children they open. TanStack's own option, passed through." },
  { name: "...options", type: "TableOptions<TData>", description: "Anything useReactTable accepts: initialState, controlled state with its on*Change handlers, getRowId, enableRowSelection. The core, sorted, filtered and paginated row models come set." },
];

export const dataTableProps: PropDef[] = [
  { name: "table", type: "Table<TData>", description: "What useDataTable returns." },
  { name: "size", type: '"default" | "compact"', description: "Pins every row to one step of the size ladder (36px or 28px). Omitted, rows follow the surrounding SizeProvider." },
  { name: "empty", type: "{ title?, description?, action? }", default: '{ title: "No results" }', description: "What the body says with no rows. It holds a page of height, so a filter that empties the table doesn't move what sits below." },
  { name: "onRowClick", type: "(row: Row<TData>) => void", description: "Makes body rows clickable. Clicks on a control inside the row (a checkbox, a menu) are left to that control, and clicks in a portalled popup (the row menu) don't count. Space on a focused row opens it, and so does Enter when there is no selection column (with one, Enter and X select)." },
  { name: "resizeColumns", type: "boolean", default: "false", description: "A handle on each header's right edge: drag it, or focus it and press ← / →, to set the width; double-click resets it. Columns start at the widths the table lays out on its own (or their size). The last resizable one takes the rest, and its handle sets the least it takes; a wider table scrolls sideways with faded edges. Fixed columns set enableResizing: false and a size." },
  { name: "cellAlign", type: '"auto" | "center" | "top"', default: '"auto"', description: "Where cell content sits in its row. Auto puts it along the top while a visible column runs past one line (lines: 2, \"wrap\", or the Columns menu's Wrap text), centered otherwise." },
  { name: "loading", type: "boolean", default: "false", description: "Shows a page of skeleton rows the size of real ones, timed by @fluid/reveal (data under 160ms never shows one). Set it back to false with the data in place: each skeleton fades out as its cell fades in." },
  { name: "loadingRows", type: "number", default: "the page size", description: "How many skeleton rows to show while loading." },
  { name: "fill", type: "boolean", default: "false", description: "Fills the height of a flex column parent: the table's box takes the room left and scrolls both ways under a sticky header, so search above and pagination below stay in view." },
  { name: "reorderColumns", type: "boolean", default: "false", description: "Drag a data column's header to move it, or press Alt + ← / → from a focused header. Selection and action columns hold their place." },  { name: "onCellEdit", type: "({ row, columnId, value }) => void", description: "Turns on the editors of columns with meta.editor and gets each change as it's made. Write value back to your data. While an editor has focus the rows keep their order; they settle once focus leaves." },
];

export const columnMetaProps: PropDef[] = [
  { name: "label", type: "string", description: "The column's name in the Columns menu. Defaults to a string header, then the column id." },
  { name: "className", type: "string", description: "Classes for the column's header and body cells, e.g. a width." },
  { name: "icon", type: "IconComponent", description: "An icon before the header's title, 14px in the header's muted color. Drawn for a string header and inside DataTableColumnHeader's sort button." },
  { name: "editor", type: '"text" | "number" | "date" | "tags" | { type, options?, creatable?, placeholder? } | { type: "select", options }', description: 'Makes the column editable when DataTable has onCellEdit: a text field, a number field with a list of options that takes any number typed, a date picker, a chips field over options (creatable adds what is typed), or a select: the cell itself becomes the trigger of a menu of options. The editor draws the cell in place of cell.' },
  { name: "lines", type: '1 | 2 | "wrap"', description: 'How text fits the column: 1 cuts it to one line with an ellipsis, 2 stops it after two, "wrap" lets it run. Give the column room with className: "w-full".' },
];

export const columnHeaderProps: PropDef[] = [
  { name: "column", type: "Column<TData>", description: "The header context's column." },
  { name: "title", type: "string", description: "The label. A column that can't sort renders it alone." },
];

export const searchProps: PropDef[] = [
  { name: "table", type: "Table<TData>", description: "What useDataTable returns." },
  { name: "column", type: "string", description: "The column id to search. Omitted, the field searches every column." },
  { name: "placeholder", type: "string", default: '"Search…"', description: "Also the field's accessible name, without the ellipsis. The field is ghost: no hairline, the hover fill on hover and while focused." },
  { name: "size", type: '"default" | "compact"', description: "Pins the field to one step of the size ladder." },
];

export const viewOptionsProps: PropDef[] = [
  { name: "table", type: "Table<TData>", description: "What useDataTable returns. The menu lists every accessor column that can hide, under a Wrap text switch that wraps every column with meta.lines (useDataTable tables only)." },
  { name: "label", type: "string", default: '"Columns"', description: "The icon button's accessible name, its tooltip, and the menu's title." },
  { name: "size", type: '"default" | "compact"', description: "Pins the icon button and the menu rows to one step of the size ladder." },
];

export const rowActionsProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "MenuItems, numbered from 0 with index." },
  { name: "label", type: "string", default: '"Row actions"', description: "The ⋯ button's accessible name." },
];

export const paginationProps: PropDef[] = [
  { name: "table", type: "Table<TData>", description: "What useDataTable returns." },
  { name: "pageSizes", type: "number[]", default: "[10, 20, 50]", description: "The choices in the borderless rows-per-page select; the current page size is always among them. An empty array hides it." },
  { name: "size", type: '"default" | "compact"', description: "Pins the text and arrow buttons to one step of the size ladder." },
];

export const selectionBarProps: PropDef[] = [
  { name: "table", type: "Table<TData>", description: "The table from useDataTable. The bar shows while any row is selected, on any page." },
  { name: "actions", type: "CommandMenuItemData[] | (rows: Row<TData>[]) => CommandMenuItemData[]", description: "What the Actions menu lists, or a function that builds it from the selected rows. Without any, the bar shows the count and the clear button only." },
  { name: "shortcut", type: "string | null", default: '"mod+k"', description: "Opens the actions while rows are selected; the page's own palette keeps the combo otherwise. null binds nothing." },
  { name: "placeholder", type: "string", default: '"Act on 3 rows…"', description: "The menu field's placeholder." },
  { name: "size", type: '"default" | "compact"', description: "Pins the bar to one step of the size ladder." },
];

export const rowActionsColumnProps: PropDef[] = [
  { name: "rowActionsColumn<TData>(items, { label? })", type: "ColumnDef<TData>", description: "A last column for DataTableRowActions. items(row) returns its MenuItems. Sized and padded so the \u22ef lines up with the Columns button and the page arrows; never sorted, hidden or resized." },
];

export const selectColumnProps: PropDef[] = [
  { name: "selectColumn<TData>()", type: "ColumnDef<TData>", description: "A checkbox column to put first in columns. The header box selects every row on the page, shows a dash while only some are, and names its next click in a tooltip with the count it acts on (Select all 10 / Unselect all 10)." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "useDataTable", props: useDataTableProps },
  { title: "DataTable", props: dataTableProps },
  { title: "Column meta", props: columnMetaProps },
  { title: "DataTableColumnHeader", props: columnHeaderProps },
  { title: "DataTableSearch", props: searchProps },
  { title: "DataTableViewOptions", props: viewOptionsProps },
  { title: "DataTableRowActions", props: rowActionsProps },
  { title: "DataTablePagination", props: paginationProps },
  { title: "DataTableSelectionBar", props: selectionBarProps },
  { title: "selectColumn", props: selectColumnProps },
  { title: "rowActionsColumn", props: rowActionsColumnProps },
];
