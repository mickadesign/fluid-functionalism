"use client";

import {
  Fragment,
  createContext,
  forwardRef,
  memo,
  useContext,
  useEffect,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type HTMLAttributes,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type TouchEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type Row,
  type RowData,
  type Table as TanStackTable,
  type TableOptions,
} from "@tanstack/react-table";
import { createPortal, flushSync } from "react-dom";
import {
  AnimatePresence,
  animate,
  motion,
  Reorder,
  useDragControls,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { cn } from "@/lib/utils";
import { fontWeights } from "@/lib/font-weight";
import { useShape } from "@/lib/shape-context";
import { spring } from "@/lib/springs";
import { useIcons, type IconComponent } from "@/lib/icon-context";
import { SizeProvider, typeClass, useSize, type SizeVariant } from "@/lib/size-context";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownContent,
  DropdownLabel,
  DropdownSeparator,
  DropdownMenu,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { MenuItem } from "@/components/ui/menu-item";
import { useFluidHover } from "@/hooks/use-fluid-hover";
import { FluidHoverHighlight } from "@/components/ui/fluid-hover-highlight";
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Tooltip } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import {
  Combobox,
  ComboboxChips,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  CommandMenu,
  CommandMenuDialog,
  CommandMenuEmpty,
  CommandMenuFooter,
  CommandMenuInput,
  CommandMenuList,
  CommandMenuShortcut,
  type CommandMenuItemData,
} from "@/components/ui/command-menu";
import { Elevated } from "@/lib/elevated";
import { badgeColors, type BadgeColor } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// DataTable is TanStack Table drawn with the library's Table: the same fluid
// hover row highlight, plus sorting, search, column visibility, row
// selection and pagination. TanStack owns the state; these parts only read
// and set it, so any part can be left out or swapped for your own.
//
//   const table = useDataTable({ data, columns });
//   <DataTableSearch table={table} column="email" />
//   <DataTable table={table} />
//   <DataTablePagination table={table} />
// ---------------------------------------------------------------------------

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** The column's name in the Columns menu. Defaults to a string `header`,
     *  then the column id. */
    label?: string;
    /** Classes for the column's header and body cells, e.g. a width. */
    className?: string;
    /** How the column's text fits its width: `1` cuts it to one line with an
     *  ellipsis, `2` stops it after two, `"wrap"` lets it run. Give the
     *  column room with `className: "w-full"`; omitted, the text stays on
     *  one line (cut short when the table resizes). */
    lines?: 1 | 2 | "wrap";
    /** An icon before the header's title. DataTable draws it for a string
     *  `header`; DataTableColumnHeader draws it inside its sort button. */
    icon?: IconComponent;
    /** How DataTableFilters filters the column: `"text"` (contains),
     *  `"number"` (a min and a max), `"date"` (a range of days), options
     *  (pick any of them), or `false` to leave it out. Omitted, it follows
     *  the column's editor, then its values (numbers, ISO days, a few
     *  repeated strings, or text). */
    filter?: DataTableFilterKind | false;
    /** A row's menu items, opened from its ⋯ and by right-clicking the row
     *  (rowActionsColumn sets it). */
    rowMenu?: (row: Row<TData>) => ReactNode;
    /** Makes the column's cells editable when DataTable has `onCellEdit`:
     *  `"text"` a text field, `"number"` a field with a list of `options`
     *  that also takes any number typed, `"date"` a date picker, `"tags"` a
     *  chips field over `options` (`creatable` adds what's typed),
     *  `"select"` one of `options` from a menu. The editor draws the cell in
     *  place of the column's `cell`, except a select: its trigger shows the
     *  column's own cell (a badge stays a badge). */
    editor?: DataTableEditor;
  }
}

type DataTableEditor =
  | "text"
  | "number"
  | "date"
  | "tags"
  | {
      type: "text";
      placeholder?: string;
      /** Shows the value as a link at rest: a click on the text follows
       *  it, a click beside it edits (F2 from the focused link too).
       *  `true` links the value itself (https:// added when it has no
       *  scheme); a function builds the address. */
      link?: boolean | ((value: string) => string);
    }
  | { type: "number"; options?: readonly number[]; placeholder?: string }
  | { type: "date"; placeholder?: string }
  | { type: "tags"; options?: readonly string[]; creatable?: boolean; placeholder?: string }
  | { type: "select"; options: readonly DataTableSelectOption[] };

/** A select editor's option: a value, or a value with a Badge color that
 *  the menu shows as the option's dot (match the cell's badge). */
type DataTableSelectOption = string | { value: string; label?: string; color?: BadgeColor };

/** How a column filters (see `meta.filter`). */
type DataTableFilterKind =
  | "text"
  | "number"
  | "date"
  | { type: "options"; options: readonly DataTableSelectOption[] };

/** A column's filter value, as DataTableFilters sets it. A plain string
 *  (DataTableSearch on one column) means "contains". */
type DataTableFilterValue =
  | string
  | { kind: "text"; query: string }
  | { kind: "options"; values: string[] }
  | { kind: "number"; min?: number; max?: number }
  | { kind: "date"; from?: string; to?: string };

/** One edit, as DataTable's `onCellEdit` receives it. Write `value` into
 *  your data: the table shows what your data holds. */
interface DataTableCellEdit<TData> {
  row: Row<TData>;
  columnId: string;
  /** A string for text, a number (or null when emptied) for number, a Date
   *  (an ISO "YYYY-MM-DD" when the cell held a string) or null for date,
   *  a string[] for tags. */
  value: unknown;
}

// ── useDataTable ─────────────────────────────────────────

// TanStack hands back one table object for the table's whole life and
// mutates it, so a memoized part would never see a sort or a page turn.
// Every part that reads it opts out of the React Compiler ("use no memo").

type UseDataTableOptions<TData> = Omit<TableOptions<TData>, "getCoreRowModel"> & {
  /** Rows per page. @default 10 */
  pageSize?: number;
};

function defaultPinning<TData>(columns: ColumnDef<TData, unknown>[]) {
  const ids = columns.map((def) => def.id ?? ("accessorKey" in def ? String(def.accessorKey) : undefined));
  const first = ids.find((id) => id !== undefined && id !== "select" && id !== "actions");
  return {
    left: [...(ids.includes("select") ? ["select"] : []), ...(first ? [first] : [])],
    right: ids.includes("actions") ? ["actions"] : [],
  };
}

/** useReactTable with the row models every part here reads: sorted,
 *  filtered and paginated. Anything TanStack accepts still goes through. */
function useDataTable<TData>({ pageSize = 10, initialState, ...options }: UseDataTableOptions<TData>) {
  "use no memo";
  // eslint-disable-next-line react-hooks/incompatible-library -- handled below and by "use no memo" in each part
  const table = useReactTable<TData>({
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // Sub-rows (getSubRows): an open row shows its children under it, on
    // its own page (a page holds its parents, however many children they
    // open), and a search that matches a child keeps its parent.
    getExpandedRowModel: getExpandedRowModel(),
    paginateExpandedRows: false,
    filterFromLeafRows: true,
    // Every column sorts ascending first, numbers included (TanStack's own
    // default starts numbers descending), so a header click is predictable.
    sortDescFirst: false,
    // Widths follow the pointer while a resize handle is dragged.
    columnResizeMode: "onChange",
    ...options,
    // Every column filters the way DataTableFilters and DataTableSearch set
    // it, unless it brings its own filterFn.
    defaultColumn: { filterFn: dataTableFilterFn, ...options.defaultColumn },
    initialState: {
      // A wide table keeps its edges in view: the boxes and the first data
      // column on the left, the row menus on the right. They only stick
      // once the table scrolls sideways. Pass `columnPinning` to choose
      // others, or `enableColumnPinning: false` for none.
      columnPinning:
        options.enableColumnPinning === false ? { left: [], right: [] } : defaultPinning(options.columns),
      ...initialState,
      pagination: { pageIndex: 0, pageSize, ...initialState?.pagination },
    },
  });
  const state = table.getState();
  // A fresh view of the same table on every state change (its methods are
  // closures, so the prototype chain serves them unchanged). A parent built
  // with the React Compiler then re-renders the parts it passes it to.
  // Per-column text fitting chosen in the Columns menu, over each column's
  // own `meta.lines`. TanStack has no slot for it, so it lives here and
  // rides on the view below.
  const [columnLines, setLines] = useState<Record<string, ColumnLines>>({});
  // DataTable installs its layout snapshot here, so a change made outside
  // it (the Columns menu, Wrap text) can be animated.
  const captureRef = useRef<() => void>(() => {});
  // DataTable installs this, so a part outside it (the search field's ↓)
  // can hand focus to the rows.
  const focusRef = useRef<() => boolean>(() => false);
  const rootRef = useRef<() => HTMLElement | null>(() => null);
  // DataTableFilters installs this, so a header's menu can add a filter.
  const filterRef = useRef<((id: string) => void) | null>(null);
  return useMemo(
    () =>
      Object.assign(Object.create(table) as TanStackTable<TData>, {
        columnLines,
        _registerLayout: (capture: () => void) => {
          captureRef.current = capture;
        },
        captureLayout: () => captureRef.current(),
        _registerFocus: (focus: () => boolean) => {
          focusRef.current = focus;
        },
        focusFirstRow: () => focusRef.current(),
        _registerRoot: (get: () => HTMLElement | null) => {
          rootRef.current = get;
        },
        getRootElement: () => rootRef.current(),
        _registerFilters: (open: ((id: string) => void) | null) => {
          filterRef.current = open;
        },
        openFilter: (id: string) => {
          if (!filterRef.current) return false;
          filterRef.current(id);
          return true;
        },
        canOpenFilter: () => !!filterRef.current,
        setColumnLines: (id: string, lines: ColumnLines | undefined) => {
          captureRef.current();
          setLines((old) => {
            const next = { ...old };
            if (lines === undefined) delete next[id];
            else next[id] = lines;
            return next;
          });
        },
      }) as DataTableInstance<TData>,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- state is the trigger
    [table, state, columnLines]
  );
}

type ColumnLines = 1 | 2 | "wrap";

/** What useDataTable adds to TanStack's table: the Columns menu's
 *  per-column text fitting. */
interface DataTableExtras {
  columnLines: Record<string, ColumnLines>;
  /** Records the table's layout so the next change to it animates. Call it
   *  right before a change of your own (columns, wrapping, alignment). */
  captureLayout: () => void;
  /** @internal DataTable installs its layout snapshot here. */
  _registerLayout: (capture: () => void) => void;
  /** Moves focus to the first body row (or its first control). False when
   *  there is no row to focus. */
  focusFirstRow: () => boolean;
  /** @internal DataTable installs focusFirstRow here. */
  _registerFocus: (focus: () => boolean) => void;
  /** The table's outer box, once DataTable has mounted. */
  getRootElement: () => HTMLElement | null;
  /** @internal DataTable installs getRootElement here. */
  _registerRoot: (get: () => HTMLElement | null) => void;
  /** Overrides a column's `meta.lines`; `undefined` hands it back. */
  setColumnLines: (id: string, lines: ColumnLines | undefined) => void;
  /** Adds a filter on the column through DataTableFilters, its chip open.
   *  False when no DataTableFilters is mounted. */
  openFilter: (id: string) => boolean;
  /** Whether a DataTableFilters is mounted to add filters. */
  canOpenFilter: () => boolean;
  /** @internal DataTableFilters installs openFilter here. */
  _registerFilters: (open: ((id: string) => void) | null) => void;
}

type DataTableInstance<TData> = TanStackTable<TData> & DataTableExtras;

/** A column's text fitting: the menu's choice, else its own `meta.lines`.
 *  Parts accept a plain TanStack table too, which has no menu choices. */
function linesOf<TData>(table: TanStackTable<TData>, column: Column<TData, unknown>) {
  return (table as Partial<DataTableExtras>).columnLines?.[column.id] ?? column.columnDef.meta?.lines;
}

// ── DataTable ────────────────────────────────────────────

interface DataTableEmpty {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

interface DataTableProps<TData> {
  table: TanStackTable<TData>;
  /** Pins every row to one step of the size ladder (36px or 28px). Omitted,
   *  rows follow the surrounding SizeProvider. */
  size?: SizeVariant;
  /** What the body says with no rows. Defaults to "No results". */
  empty?: DataTableEmpty;
  /** Makes body rows clickable. Clicks on a control inside the row (the
   *  selection box, a row menu) don't count. The rows also become one tab
   *  stop: ↑ / ↓ and Home / End move between them, Enter or Space opens
   *  one. */
  onRowClick?: (row: Row<TData>) => void;
  /** Adds a handle on each header's right edge: drag it, or focus it and
   *  press ← / →, to set the column's width. Columns start at the widths the
   *  table lays out on its own (or their `size`); the last resizable one takes the
   *  rest, and a table wider than its box scrolls sideways. Double-click a
   *  handle to let its column share the free width again. */
  resizeColumns?: boolean;
  /** Lets data columns be dragged by their header to a new place, or moved
   *  with Alt + ← / → from a focused header. The selection and action
   *  columns stay where they are. */
  reorderColumns?: boolean;
  /** Where cell content sits in its row. `"auto"` puts it along the top
   *  while a visible column runs to more than one line (`lines: 2`,
   *  `"wrap"`, or wrapped from the Columns menu), centered otherwise.
   *  @default "auto" */
  cellAlign?: "auto" | "center" | "top";
  /** Shows a page of skeleton rows while the data loads (rows the size of
   *  real ones, so nothing shifts when it lands). Set it back to false with
   *  the data in place: each skeleton fades out as its cell fades in. Uses
   *  @fluid/reveal's skeleton timing: data under 160ms never shows one. */
  loading?: boolean;
  /** How many skeleton rows to show. @default the page size */
  loadingRows?: number;
  /** Fills the height of a flex column parent: the table's box takes the
   *  room left (min-h-0 flex-1), scrolls both ways, and its header row
   *  sticks to the top. For a table in a fixed-height panel, with the
   *  search above and the pagination below staying in view. */
  fill?: boolean;
  /** Turns on the editors of columns with `meta.editor`, and receives each
   *  change as it's made (a keystroke, a pick). While an editor has focus
   *  or an open popup, the rows hold their order, so a sorted column
   *  doesn't move the row from under you; they settle into place once
   *  focus leaves the table's editors. Escape only takes focus out of an
   *  editor (an open list or calendar closes first); what was typed
   *  stays. */
  onCellEdit?: (edit: DataTableCellEdit<TData>) => void;
  /** ⌘Z / Ctrl+Z while focus is in the table (a field being edited keeps
   *  its own undo). Pair with useUndoableRows. */
  onUndo?: () => void;
  /** ⇧⌘Z / Ctrl+Shift+Z / Ctrl+Y while focus is in the table. */
  onRedo?: () => void;
  className?: string;
}

// The skeleton → data hand-over: reveal-swap's fade on spring.moderate, with
// room to finish before the cells drop their skeletons.
const SWAP_MS = 400;

// Skeleton bars vary in width like real text does; a fixed cycle keeps
// server and client renders identical.
const SKELETON_WIDTHS = [72, 56, 88, 64, 48, 80, 60];

// Skeleton corners follow the shape setting, as the controls they stand in
// for do: the checkbox's own radius for its square, and for text bars the
// shape's character (rounded, a full pill, or sharp's 1px).
const SKELETON_BOX_RADIUS = { rounded: "rounded-[5px]", pill: "rounded-[5px]", sharp: "rounded-none" } as const;
const SKELETON_BOX_RADIUS_COMPACT = { rounded: "rounded-[4px]", pill: "rounded-[4px]", sharp: "rounded-none" } as const;
const SKELETON_BAR_RADIUS = { rounded: "rounded-[3px]", pill: "rounded-full", sharp: "rounded-[1px]" } as const;

/** Columns whose content is text to fade in (the selection and row-menu
 *  columns hold controls with hit areas that must not be clipped). */
const textCell = (columnId: string) => columnId !== "select" && columnId !== "actions";

/** A cell's skeleton: the checkbox's square in the selection column, nothing
 *  for the row menu, otherwise a bar centered in the line box (a skeleton
 *  the size of the text it stands in for). */
function skeletonFor(
  columnId: string,
  row: number,
  col: number,
  shape: keyof typeof SKELETON_BAR_RADIUS,
  compact: boolean
) {
  if (columnId === "actions") return null;
  return (
    <span key="skeleton" className="flex h-[1lh] items-center">
      {columnId === "select" ? (
        // The Checkbox's own size and corners on each step (16px / 5px,
        // 14px / 4px compact, square when sharp).
        <Skeleton
          className={cn(
            compact ? "size-[14px]" : "size-4",
            (compact ? SKELETON_BOX_RADIUS_COMPACT : SKELETON_BOX_RADIUS)[shape]
          )}
        />
      ) : (
        <Skeleton
          className={cn("h-2.5", SKELETON_BAR_RADIUS[shape])}
          style={{ width: `${SKELETON_WIDTHS[(row * 3 + col) % SKELETON_WIDTHS.length]}%` }}
        />
      )}
    </span>
  );
}

// Clicks that land on a control in the row belong to that control.
const CONTROL =
  "button, a, input, select, textarea, [role=checkbox], [role=menuitem], [data-select-hit]";


// The header press fill's corners, per shape: the shape's item radius, as
// the ghost uses (literal classes, so Tailwind sees them).
const PRESS_RADIUS = {
  rounded: "after:rounded-lg",
  pill: "after:rounded-[20px]",
  sharp: "after:rounded-[1px]",
} as const;

// A drag starts once the pointer has travelled this far, so a plain click
// on a header still sorts.
const DRAG_THRESHOLD = 4;
// Edge auto-scroll while a header is dragged: within this many px of the
// table's left or right edge (the edge fade's width), the table scrolls up
// to this many px a second, faster nearer the edge. Time-based, so a slow
// frame rate scrolls as far; one step covers at most EDGE_SCROLL_MAX_DT ms.
const EDGE_SCROLL_BAND = 48;
const EDGE_SCROLL_SPEED = 720;
const EDGE_SCROLL_MAX_DT = 50;
// Keyboard resizing moves a column this many px per arrow press.
const RESIZE_STEP = 16;
const MIN_COLUMN_WIDTH = 48;

/** How wide a header's own content is (text or elements), leaving out the
 *  resize handle and the drop marker. */
function headerWidth(th: HTMLElement) {
  let left = Infinity;
  let right = -Infinity;
  const range = document.createRange();
  th.childNodes.forEach((node) => {
    if (node instanceof HTMLElement && node.hasAttribute("data-resize-handle")) return;
    range.selectNode(node);
    const r = range.getBoundingClientRect();
    if (r.width === 0) return;
    left = Math.min(left, r.left);
    right = Math.max(right, r.right);
  });
  return right > left ? right - left : 0;
}

/** The `size` a column definition sets itself (TanStack fills in 150 for
 *  the rest), looked up by id through any column groups. */
function ownSize<TData>(defs: ColumnDef<TData, unknown>[], id: string): number | undefined {
  for (const def of defs) {
    const own = def.id ?? ("accessorKey" in def ? String(def.accessorKey) : undefined);
    if (own === id) return def.size;
    if ("columns" in def && def.columns) {
      const found = ownSize(def.columns, id);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

// The most width a column takes for its content alone: past this, its
// text wraps or cuts short rather than crowd the columns beside it.
const NATURAL_CAP = 240;

/** What a header's menu acts on: the table, and whether its columns move. */
const HeaderMenuContext = createContext<{
  table: TanStackTable<unknown>;
  reorder: boolean;
} | null>(null);

// The table last clicked or focused, for the page-level undo keys.
let lastUsedTable: HTMLElement | null = null;

/** Data columns (with an accessor) move; selection and action columns hold
 *  their place at the ends, and pinned columns at theirs. */
const canReorder = <TData,>(column: Column<TData, unknown>) =>
  column.accessorFn !== undefined && !column.getIsPinned();

/** Moves `id` before or after `refId` among the reorderable columns, leaving
 *  every other column in its slot. */
function moveColumn<TData>(
  table: TanStackTable<TData>,
  id: string,
  refId: string,
  place: "before" | "after"
) {
  if (id === refId) return;
  const all = table.getAllLeafColumns();
  const order = columnOrderOf(table);
  const movable = new Set(all.filter(canReorder).map((c) => c.id));
  const slots = order.filter((c) => movable.has(c) && c !== id);
  const at = slots.indexOf(refId);
  if (at === -1) return;
  slots.splice(place === "before" ? at : at + 1, 0, id);
  let next = 0;
  table.setColumnOrder(order.map((c) => (movable.has(c) ? slots[next++] : c)));
}

function DataTable<TData>({
  table,
  size,
  empty,
  onRowClick,
  resizeColumns = false,
  reorderColumns = false,
  cellAlign = "auto",
  fill = false,
  loading = false,
  loadingRows,
  onCellEdit,
  onUndo,
  onRedo,
  className,
}: DataTableProps<TData>) {
  "use no memo";
  // While a cell is being edited the rows hold the order they had when the
  // editing began (each one read fresh, so edits still show); the sort,
  // search and paging catch up once focus leaves the editors.
  const [heldOrder, setHeldOrder] = useState<string[] | null>(null);
  const liveRows = table.getRowModel().rows;
  const rows = heldOrder
    ? heldOrder.flatMap((id) => {
        const row = table.getCoreRowModel().rowsById[id];
        return row ? [row] : [];
      })
    : liveRows;
  const visible = table.getVisibleLeafColumns();
  const columnCount = visible.length;
  // The last resizable column takes whatever width is left, so fixed
  // columns after it (a row menu) keep theirs.
  // Taller rows read best from the top line down.
  const alignTop =
    cellAlign === "top" ||
    (cellAlign === "auto" &&
      visible.some((c) => {
        const l = linesOf(table, c);
        return l === 2 || l === "wrap";
      }));
  const flexId = [...visible].reverse().find((c) => c.getCanResize())?.id;
  // What a body row's cells depend on beyond the row itself: the visible
  // columns in order and how each fits its text. Rows re-render when this,
  // their record, their selection or the columns change, and not on every
  // state change of the table (a Shift + arrow step re-rendered every cell,
  // editors and all).
  const layoutKey = visible.map((c) => `${c.id}:${linesOf(table, c) ?? ""}`).join("|");
  // An empty body holds a page's worth of rows (as many as were showing
  // before the filter emptied it), so the pagination under the table stays
  // put while a filter runs dry.
  const heldRows = Math.max(
    1,
    Math.min(table.getState().pagination.pageSize, table.getPreFilteredRowModel().rows.length)
  );

  // Loading → loaded: for one fade, the real rows keep the skeletons in
  // their cells (see the body). Tracked during render, from the previous
  // value, so the first loaded frame already has them.
  const [prevLoading, setPrevLoading] = useState(loading);
  const [swapping, setSwapping] = useState(false);
  if (prevLoading !== loading) {
    setPrevLoading(loading);
    setSwapping(!loading);
  }
  useEffect(() => {
    if (!swapping) return;
    const id = setTimeout(() => setSwapping(false), SWAP_MS);
    return () => clearTimeout(id);
  }, [swapping]);
  const skeletonRows = loadingRows ?? table.getState().pagination.pageSize;


  // The header being dragged, and where it would land.
  const [drag, setDrag] = useState<{ id: string; refId: string; place: "before" | "after" } | null>(
    null
  );
  const headRowRef = useRef<HTMLTableRowElement>(null);
  const sizeClasses = useSize(size);
  const shape = useShape();
  // A copy of the dragged header that follows the pointer, at 80%. Its position is
  // written straight to the element, so a drag doesn't re-render the table
  // on every move, only when the landing spot changes.
  const [ghost, setGhost] = useState<{
    label: string;
    icon?: IconComponent;
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const ghostRef = useRef<HTMLDivElement>(null);

  const dropTarget = (x: number, id: string) => {
    const heads = Array.from(
      headRowRef.current?.querySelectorAll<HTMLElement>("th[data-reorderable]") ?? []
    );
    const before = heads.find((th) => {
      const r = th.getBoundingClientRect();
      return x < r.left + r.width / 2;
    });
    const ref = before ?? heads[heads.length - 1];
    const refId = ref?.dataset.columnId ?? id;
    return { id, refId, place: before ? ("before" as const) : ("after" as const) };
  };

  // Layout changes animate (FLIP): a reorder, a column shown or hidden, a
  // change to how text wraps. Whatever makes the change first calls
  // `captureLayout()` (moveColumn here; the Columns menu and Wrap text via
  // useDataTable), which records each header's left edge (offsetLeft,
  // which ignores transforms), each row's top and the box's height. The
  // commit that follows plays the difference: moved headers and cells slide
  // to 0 on spring.moderate, a column that just appeared fades in, rows
  // slide to their new tops, and the box springs between heights so the
  // pagination under it glides. Nothing is measured on other renders.
  const reduceMotion = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  // The scroll box, as state too: expanding a preview (or any remount)
  // gives the table a new one, and the effects that listen to it follow.
  const [wrapEl, setWrapEl] = useState<HTMLDivElement | null>(null);
  const setWrap = useCallback((node: HTMLDivElement | null) => {
    wrapRef.current = node;
    setWrapEl(node);
  }, []);
  const snapshot = useRef<{
    lefts: Map<string, number>;
    tops: Map<string, number>;
    height: number;
  } | null>(null);
  const captureLayout = () => {
    const wrap = wrapRef.current;
    if (!wrap || reduceMotion) return;
    const lefts = new Map<string, number>();
    wrap.querySelectorAll<HTMLElement>("thead th[data-column-id]").forEach((th) => {
      lefts.set(th.dataset.columnId!, th.offsetLeft);
    });
    const tops = new Map<string, number>();
    wrap.querySelectorAll<HTMLElement>("tbody tr[data-row-id]").forEach((tr) => {
      tops.set(tr.dataset.rowId!, tr.offsetTop);
    });
    snapshot.current = { lefts, tops, height: wrap.offsetHeight };
  };
  // Parts outside the table (the Columns menu) reach it through the table.
  // Undo keys from the page too: a row menu, the selection bar or a toast
  // can hand focus back to the page after an action, and ⌘Z should still
  // take it back. Only the table used last answers, and only while nothing
  // else holds focus (a field keeps its own undo).
  const undoRef = useRef({ onUndo, onRedo });
  useLayoutEffect(() => {
    undoRef.current = { onUndo, onRedo };
  });
  const hasUndo = !!(onUndo || onRedo);
  useEffect(() => {
    const root = wrapEl;
    if (!hasUndo || !root) return;
    const use = (e: Event) => {
      const target = e.target as Element | null;
      if (target && root.contains(target)) lastUsedTable = root;
      // Menus, dialogs and toasts the table opened keep it the one in use.
      else if (!target?.closest?.("[role=menu], [role=dialog], [role=listbox], [data-sonner-toast]"))
        if (lastUsedTable === root) lastUsedTable = null;
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (lastUsedTable !== root || e.defaultPrevented) return;
      if (document.activeElement && document.activeElement !== document.body) return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.altKey) return;
      const letter = e.key.toLowerCase();
      const { onUndo: undo, onRedo: redo } = undoRef.current;
      if (((letter === "z" && e.shiftKey) || (letter === "y" && e.ctrlKey && !e.metaKey)) && redo) {
        e.preventDefault();
        redo();
      } else if (letter === "z" && !e.shiftKey && undo) {
        e.preventDefault();
        undo();
      }
    };
    document.addEventListener("pointerdown", use, true);
    document.addEventListener("focusin", use, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", use, true);
      document.removeEventListener("focusin", use, true);
      document.removeEventListener("keydown", onKey);
      if (lastUsedTable === root) lastUsedTable = null;
    };
  }, [hasUndo, wrapEl]);

  // Filled, the header's hairline shows once the rows have scrolled: the
  // viewport marks the root, without a re-render on every scroll.
  useEffect(() => {
    const root = wrapRef.current;
    const viewport = root?.querySelector<HTMLElement>("[data-slot=scroll-area-viewport]");
    if (!fill || !root || !viewport) return;
    const mark = () => root.toggleAttribute("data-scrolled", viewport.scrollTop > 0);
    mark();
    viewport.addEventListener("scroll", mark, { passive: true });
    return () => {
      viewport.removeEventListener("scroll", mark);
      root.removeAttribute("data-scrolled");
    };
  }, [fill, wrapEl]);

  // Opening and closing sub-rows: rows below jump to their new places in
  // one frame, with the selection fill and the highlight (Table snaps them
  // on a new snapKey), and only the rows that appear fade in. A slide here
  // left the fills, keyed by position, springing apart from the rows.
  const [expandTick, setExpandTick] = useState(0);
  const fadeFrom = useRef<Set<string> | null>(null);
  const toggleExpanded = (row: Row<TData>, open?: boolean) => {
    fadeFrom.current = new Set(rows.map((r) => r.id));
    setExpandTick((t) => t + 1);
    row.toggleExpanded(open);
  };
  const toggleRef = useRef(toggleExpanded);
  useLayoutEffect(() => {
    toggleRef.current = toggleExpanded;
  });
  useLayoutEffect(() => {
    const seen = fadeFrom.current;
    if (!seen) return;
    fadeFrom.current = null;
    if (reduceMotion) return;
    wrapRef.current?.querySelectorAll<HTMLElement>("tbody tr[data-row-id]").forEach((tr) => {
      if (seen.has(tr.dataset.rowId!)) return;
      animate(tr, { opacity: [0, 1] }, spring.moderate).then(() => {
        tr.style.opacity = "";
      });
    });
  });
  const [stableToggle] = useState(() => (row: Row<unknown>, open?: boolean) =>
    toggleRef.current(row as Row<TData>, open)
  );

  // Editors hold the row order while they have focus (see heldOrder). A
  // count, since the next editor takes focus before the last one lets go.
  // Each editor that lets go records the layout and catches the order up,
  // so its row glides to its sorted place as soon as you leave it, even
  // into another cell (which then holds the order from there).
  const holds = useRef(0);
  const editing: EditContextValue = {
    hold: () => {
      if (holds.current++ === 0) setHeldOrder(rows.map((r) => r.id));
    },
    release: () => {
      if (--holds.current > 0) {
        captureLayout();
        setHeldOrder(table.getRowModel().rows.map((r) => r.id));
        return;
      }
      holds.current = 0;
      captureLayout();
      setHeldOrder(null);
    },
    commit: (row, columnId, value) =>
      onCellEdit?.({ row: row as Row<TData>, columnId, value }),
  };

  // One context value for the table's life, reading the latest handlers,
  // so memoized rows (and their editors) don't re-render for a new object.
  const editingRef = useRef(editing);
  useLayoutEffect(() => {
    editingRef.current = editing;
  });
  const [stableEditing] = useState<EditContextValue>(() => ({
    hold: () => editingRef.current.hold(),
    release: () => editingRef.current.release(),
    commit: (row, columnId, value) => editingRef.current.commit(row, columnId, value),
  }));

  const registerLayout = (table as Partial<DataTableExtras>)._registerLayout;
  useLayoutEffect(() => {
    registerLayout?.(captureLayout);
  });
  useLayoutEffect(() => {
    const before = snapshot.current;
    const wrap = wrapRef.current;
    if (!before || !wrap) return;
    snapshot.current = null;
    wrap
      .querySelectorAll<HTMLElement>("th[data-column-id], td[data-column-id]")
      .forEach((el) => {
        const id = el.dataset.columnId!;
        const old = before.lefts.get(id);
        if (old === undefined) {
          animate(el, { opacity: [0, 1] }, spring.moderate).then(() => {
            el.style.opacity = "";
          });
          return;
        }
        const th = wrap.querySelector<HTMLElement>(`thead th[data-column-id="${CSS.escape(id)}"]`);
        const dx = th ? old - th.offsetLeft : 0;
        if (!dx) return;
        animate(el, { x: [dx, 0] }, spring.moderate).then(() => {
          el.style.transform = "";
        });
      });
    wrap.querySelectorAll<HTMLElement>("tbody tr[data-row-id]").forEach((tr) => {
      const old = before.tops.get(tr.dataset.rowId!);
      // A row that wasn't there (a sub-row just opened) fades in where it
      // lands while the rows below slide down to make room.
      if (old === undefined) {
        animate(tr, { opacity: [0, 1] }, spring.moderate).then(() => {
          tr.style.opacity = "";
        });
        return;
      }
      const dy = old - tr.offsetTop;
      if (!dy) return;
      animate(tr, { y: [dy, 0] }, spring.moderate).then(() => {
        tr.style.transform = "";
      });
    });
    const height = wrap.offsetHeight;
    // A filled box's height is its parent's; only a free one springs.
    if (!fill && before.height && before.height !== height) {
      animate(wrap, { height: [before.height, height] }, spring.moderate).then(() => {
        wrap.style.height = "";
      });
    }
  });

  // A drag's window listeners, removed if the table goes away mid-drag.
  const dragCleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => dragCleanup.current?.(), []);

  const startDrag = (
    e: PointerEvent<HTMLTableCellElement>,
    id: string,
    label: string,
    icon: IconComponent | undefined
  ) => {
    if (e.button !== 0 || (e.target as Element).closest("[data-resize-handle]")) return;
    const startX = e.clientX;
    const rect = e.currentTarget.getBoundingClientRect();
    let moved = false;
    let target: ReturnType<typeof dropTarget> | null = null;
    let lastX = startX;
    let frame = 0;
    const viewport = wrapRef.current?.querySelector<HTMLElement>(
      "[data-slot=scroll-area-viewport]"
    );
    // Places the ghost for a pointer x and finds where it would land.
    const place = (clientX: number) => {
      // The ghost stays within the table's visible box: it stops at the left
      // and right edges, and the landing spot follows where it stopped.
      const box = wrapRef.current?.getBoundingClientRect();
      let dx = clientX - startX;
      if (box) dx = Math.min(Math.max(dx, box.left - rect.left), box.right - rect.right);
      if (ghostRef.current) ghostRef.current.style.transform = `translateX(${dx}px)`;
      const next = dropTarget(startX + dx, id);
      if (!target || next.refId !== target.refId || next.place !== target.place) setDrag(next);
      target = next;
    };
    // Near an edge of a table that scrolls sideways, the table scrolls that
    // way, so a column can be carried to one that's out of view (narrow
    // screens). The closer to the edge, the faster, inside the same band the
    // edge fade uses; the landing spot is found again as columns slide by.
    let lastTime = 0;
    const edgeScroll = (now: number) => {
      frame = requestAnimationFrame(edgeScroll);
      const dt = lastTime ? Math.min(now - lastTime, EDGE_SCROLL_MAX_DT) : 16;
      lastTime = now;
      const box = wrapRef.current?.getBoundingClientRect();
      if (!viewport || !box) return;
      const fromLeft = lastX - box.left;
      const fromRight = box.right - lastX;
      const pull = (d: number) => Math.min(1, Math.max(0, (EDGE_SCROLL_BAND - d) / EDGE_SCROLL_BAND));
      const speed = (d: number) => Math.round((EDGE_SCROLL_SPEED * pull(d) * dt) / 1000);
      const step = fromLeft < EDGE_SCROLL_BAND ? -speed(fromLeft) : fromRight < EDGE_SCROLL_BAND ? speed(fromRight) : 0;
      if (!step) return;
      const before = viewport.scrollLeft;
      viewport.scrollLeft += step;
      if (viewport.scrollLeft !== before) place(lastX);
    };
    const onMove = (ev: globalThis.PointerEvent) => {
      if (!moved && Math.abs(ev.clientX - startX) < DRAG_THRESHOLD) return;
      if (!moved) {
        moved = true;
        setGhost({ label, icon, top: rect.top, left: rect.left, width: rect.width, height: rect.height });
        frame = requestAnimationFrame(edgeScroll);
      }
      lastX = ev.clientX;
      place(lastX);
    };
    const detach = () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      dragCleanup.current = null;
    };
    const onUp = () => {
      detach();
      setDrag(null);
      setGhost(null);
      if (!moved) return;
      // The drag ends on the header, whose click would sort it.
      // Swallowed for this one gesture only: a drop outside the header
      // fires no click, so the guard comes off on the next tick.
      const swallow = (ev: Event) => ev.stopPropagation();
      window.addEventListener("click", swallow, { capture: true, once: true });
      setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 0);
      if (target) {
        captureLayout();
        moveColumn(table, target.id, target.refId, target.place);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    dragCleanup.current = detach;
  };

  const moveByKey = (e: KeyboardEvent<HTMLTableCellElement>, id: string) => {
    if (!e.altKey || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
    const ids = visible.filter(canReorder).map((c) => c.id);
    const i = ids.indexOf(id);
    const refId = ids[e.key === "ArrowLeft" ? i - 1 : i + 1];
    if (!refId) return;
    e.preventDefault();
    captureLayout();
    moveColumn(table, id, refId, e.key === "ArrowLeft" ? "before" : "after");
  };

  // Columns start at their content's width. Each column is measured once
  // per page of rows at its widest on one line, header included, and
  // capped at NATURAL_CAP (a column's min width, or its header, can take
  // it past). Those widths fill the box; the column that takes the rest (a
  // `w-full` one, or the last resizable) gets what's left over. Short of
  // room, the columns that can shrink give it up together, none narrower
  // than its header, and past that the table scrolls sideways instead of
  // cutting a name in two. A column `size` always wins.
  // With resizeColumns the widths seed the sizing once and are yours from
  // there; without, they follow the box as it resizes.
  const sizing = table.getState().columnSizing;
  const seeded = Object.keys(sizing).length > 0;
  const restId = resizeColumns
    ? flexId
    : (visible.find((c) => /(^|\s)w-full(\s|$)/.test(c.columnDef.meta?.className ?? ""))?.id ??
      [...visible].reverse().find((c) => c.accessorFn !== undefined)?.id);
  const natural = useRef<{ id: string; width: number; floor: number; fixed: boolean }[] | null>(null);
  const [fitted, setFitted] = useState<Record<string, number> | null>(null);
  const fit = useCallback(() => {
    const cols = natural.current;
    const viewport = wrapRef.current?.querySelector<HTMLElement>("[data-slot=scroll-area-viewport]");
    if (!cols || !viewport) return null;
    const total = cols.reduce((sum, c) => sum + c.width, 0);
    const deficit = total - viewport.clientWidth;
    const give = cols.reduce((sum, c) => sum + (c.fixed ? 0 : c.width - c.floor), 0);
    const share = deficit > 0 && give > 0 ? Math.min(1, deficit / give) : 0;
    return Object.fromEntries(
      cols.map((c) => [c.id, Math.round(c.fixed ? c.width : c.width - (c.width - c.floor) * share)])
    );
  }, []);
  const pageKey = rows.map((r) => r.id).join(",");
  useLayoutEffect(() => {
    if (resizeColumns && seeded) return;
    const tableNode = wrapRef.current?.querySelector<HTMLTableElement>("table");
    const ths = headRowRef.current?.querySelectorAll<HTMLElement>("th[data-column-id]");
    // Nothing measured (no visible columns yet): setting empty widths
    // would only re-render into this same effect, forever.
    if (!tableNode || !ths?.length) return;
    // Measured at max-content, every cell on one line, in one synchronous
    // pass that never paints.
    const saved = tableNode.style.cssText;
    tableNode.style.cssText = "table-layout:auto;width:max-content;min-width:0";
    tableNode.setAttribute("data-measuring", "");
    natural.current = Array.from(ths).map((th) => {
      const id = th.dataset.columnId!;
      const column = table.getColumn(id);
      const css = getComputedStyle(th);
      const pad = parseFloat(css.paddingLeft) + parseFloat(css.paddingRight);
      const head = headerWidth(th) + pad;
      const floor = Math.ceil(Math.max(head, parseFloat(css.minWidth) || 0));
      const content = th.getBoundingClientRect().width;
      const size = ownSize(table.options.columns, id);
      const own = size !== undefined || !column?.getCanResize();
      return {
        id,
        width: size !== undefined ? size : Math.ceil(own ? content : Math.max(Math.min(content, NATURAL_CAP), floor)),
        floor,
        // Pinned columns keep theirs too: scrolling, not cutting, makes room.
        fixed: own || !!column?.getIsPinned(),
      };
    });
    tableNode.removeAttribute("data-measuring");
    tableNode.style.cssText = saved;
    if (resizeColumns) {
      const widths = fit();
      if (widths) table.setColumnSizing((old) => ({ ...widths, ...old }));
      return;
    }
    // Without resizing, the widths follow the box. The observer reports
    // the box once on observing too, before the next paint.
    const viewport = wrapRef.current?.querySelector<HTMLElement>("[data-slot=scroll-area-viewport]");
    if (!viewport) return;
    const observer = new ResizeObserver(() => {
      const widths = fit();
      if (widths) setFitted((old) => (JSON.stringify(old) === JSON.stringify(widths) ? old : widths));
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [resizeColumns, seeded, table, fit, pageKey, layoutKey, sizeClasses.variant, wrapEl]);
  const sized = resizeColumns ? seeded : fitted !== null;
  const widthOf = (id: string, size: number) => (resizeColumns ? size : (fitted?.[id] ?? undefined));
  // Pinned columns stick to their edge, each offset by the pinned columns
  // between it and the edge. Unsized (before the widths are measured),
  // nothing sticks.
  const pinWidth = (column: Column<TData, unknown>) =>
    (resizeColumns ? column.getSize() : fitted?.[column.id]) ?? 0;
  const pinsKey = sized
    ? [
        ...table.getLeftVisibleLeafColumns().map((c) => `l:${c.id}:${pinWidth(c)}`),
        ...table.getRightVisibleLeafColumns().map((c) => `r:${c.id}:${pinWidth(c)}`),
      ].join("|")
    : "";
  const pins = useMemo(() => {
    const map: Record<string, PinInfo> = {};
    if (!pinsKey) return map;
    const lefts = pinsKey.split("|").filter((p) => p.startsWith("l:")).map((p) => p.split(":"));
    const rights = pinsKey.split("|").filter((p) => p.startsWith("r:")).map((p) => p.split(":"));
    let at = 0;
    lefts.forEach(([, id, w], i) => {
      map[id] = { side: "left", offset: at, edge: i === lefts.length - 1, outer: i === 0 && visible[0]?.id === id };
      at += Number(w);
    });
    at = 0;
    [...rights].reverse().forEach(([, id, w], i) => {
      map[id] = { side: "right", offset: at, edge: i === rights.length - 1, outer: i === 0 && visible[visible.length - 1]?.id === id };
      at += Number(w);
    });
    return map;
    // visible is read for the outer column only, which pinsKey's order settles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinsKey]);
  const pinnedLeft = pinsKey.includes("l:");
  const pinnedRight = pinsKey.includes("r:");
  // Where the table sits in its sideways scroll, on the root, for the
  // pinned cells: opaque (with copies of the row fills) and edged with a
  // hairline only while content passes under them.
  useEffect(() => {
    const root = wrapRef.current;
    const viewport = root?.querySelector<HTMLElement>("[data-slot=scroll-area-viewport]");
    if (!root || !viewport) return;
    const mark = () => {
      const max = viewport.scrollWidth - viewport.clientWidth;
      root.toggleAttribute("data-x-start", viewport.scrollLeft > 0.5);
      root.toggleAttribute("data-x-end", max - viewport.scrollLeft > 0.5);
    };
    mark();
    viewport.addEventListener("scroll", mark, { passive: true });
    const observer = new ResizeObserver(mark);
    observer.observe(viewport);
    const content = viewport.firstElementChild;
    if (content) observer.observe(content);
    return () => {
      viewport.removeEventListener("scroll", mark);
      observer.disconnect();
    };
    // Re-run once the widths are in, and for a new scroll box.
  }, [sized, wrapEl]);
  // Keys, like a spreadsheet's rows (Google Sheets, Gmail):
  //   ↓ on a header  the first row
  //   ↑ / ↓          the row above / below; Home / End the first / last.
  //                  From a control (checkbox, link, row menu) it's the same
  //                  column's control in that row
  //   Shift + ↑ ↓    grows or shrinks the selection from where it started
  //   X / Enter      selects or clears the focused row (from the row or
  //                  its checkbox). Without a selection column, Enter
  //                  opens the row (onRowClick)
  //   Space          opens the row (onRowClick), else selects it
  //   Enter / Space  on a row that can't be opened or selected, opens or
  //                  closes its sub-rows
  //   ⌘A / Ctrl+A    selects every row, on every page
  //   Esc            clears the selection
  // Rows are focusable whenever they can be selected, opened or expanded,
  // so navigation never depends on a selection column: one tab stop for
  // the body (the row last focused, else the first). A hovered
  // row counts as focused while nothing else is (see below).
  const hasSelection = table.getAllLeafColumns().some((c) => c.id === "select");
  const rowsFocusable = hasSelection || !!onRowClick || table.getCanSomeRowsExpand();
  // The far end of a Shift + arrow range, so the next step can shrink it.
  const rangeHead = useRef<string | null>(null);
  const extendTo = (fromId: string, toId: string) => {
    const anchor = selectionAnchors.get(table.getState) ?? fromId;
    const ids = rows.map((r) => r.id);
    const span = (a: string, b: string) => {
      const i = ids.indexOf(a);
      const j = ids.indexOf(b);
      return i === -1 || j === -1 ? [] : ids.slice(Math.min(i, j), Math.max(i, j) + 1);
    };
    const before = new Set(span(anchor, rangeHead.current ?? fromId));
    const after = new Set(span(anchor, toId));
    table.setRowSelection((old) => {
      const next = { ...old };
      for (const id of before) if (!after.has(id)) delete next[id];
      for (const id of after) next[id] = true;
      return next;
    });
    selectionAnchors.set(table.getState, anchor);
    rangeHead.current = toId;
  };
  const toggleRow = (id: string) => {
    const row = rows.find((r) => r.id === id);
    if (!row?.getCanSelect()) return;
    row.toggleSelected();
    selectionAnchors.set(table.getState, id);
    rangeHead.current = null;
  };
  const focusFirstRow = () => {
    const tr = wrapRef.current?.querySelector<HTMLElement>("tbody tr[data-row-id]");
    if (!tr) return false;
    const target = rowsFocusable
      ? tr
      : tr.querySelector<HTMLElement>('button, a[href], input, [role=checkbox], [tabindex]:not([tabindex="-1"])');
    if (!target) return false;
    target.focus();
    return true;
  };
  const onBodyKeyDown = (e: KeyboardEvent<HTMLTableElement>) => {
    const target = e.target as HTMLElement;
    // Typing in a field (a search, an editable cell) keeps its keys.
    if (target.closest("input, textarea, select, [contenteditable=true]")) return;
    const mod = e.metaKey || e.ctrlKey;
    const letter = e.key.toLowerCase();
    if (mod && !e.altKey && ((letter === "z" && e.shiftKey) || (letter === "y" && e.ctrlKey && !e.metaKey)) && onRedo) {
      e.preventDefault();
      onRedo();
      return;
    }
    if (mod && !e.altKey && !e.shiftKey && letter === "z" && onUndo) {
      e.preventDefault();
      onUndo();
      return;
    }
    if (hasSelection && mod && !e.altKey && e.key.toLowerCase() === "a") {
      e.preventDefault();
      selectAllRows(table, true);
      return;
    }
    if (hasSelection && e.key === "Escape" && Object.keys(table.getState().rowSelection).length) {
      e.preventDefault();
      table.resetRowSelection();
      rangeHead.current = null;
      return;
    }
    if (mod || e.altKey) return;
    if (target.closest("thead")) {
      // A header steps down into the rows.
      if (e.key === "ArrowDown" && focusFirstRow()) e.preventDefault();
      return;
    }
    const tr = target.closest<HTMLTableRowElement>("tbody tr[data-row-id]");
    if (!tr) return;
    const id = tr.dataset.rowId!;
    const onRow = target === tr;
    // The row's checkbox (or its cell) toggles like the row itself; Enter
    // on a link or the row menu keeps its own meaning.
    const onBox = !!target.closest("[role=checkbox], [data-select-hit]");
    const key = e.key.toLowerCase();
    if (hasSelection && !e.repeat && (key === "x" || (key === "enter" && (onRow || onBox)))) {
      e.preventDefault();
      toggleRow(id);
      return;
    }
    if (onRow && (e.key === "Enter" || e.key === " ") && !e.repeat) {
      const row = rows.find((r) => r.id === id);
      if (!row) return;
      if (onRowClick) {
        e.preventDefault();
        onRowClick(row);
      } else if (e.key === " " && hasSelection) {
        e.preventDefault();
        toggleRow(id);
      } else if (row.getCanExpand()) {
        // Nothing else to do with the row: the key opens or closes it.
        e.preventDefault();
        toggleExpanded(row, !row.getIsExpanded());
      }
      return;
    }
    // Sub-rows, as in a tree: → opens a row, or steps into its first child
    // once open; ← closes it, or steps up to its parent.
    if (onRow && !e.shiftKey && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      const row = rows.find((r) => r.id === id);
      if (!row) return;
      const step = (to: Element | null | undefined) => {
        if (!(to instanceof HTMLElement)) return;
        e.preventDefault();
        to.focus({ preventScroll: true });
        revealRow(to, fill ? (wrapRef.current?.querySelector("thead")?.offsetHeight ?? 0) : 0);
      };
      if (e.key === "ArrowRight") {
        if (row.getCanExpand() && !row.getIsExpanded()) {
          e.preventDefault();
          toggleExpanded(row, true);
        } else if (row.getIsExpanded()) step(tr.nextElementSibling);
      } else if (row.getIsExpanded()) {
        e.preventDefault();
        toggleExpanded(row, false);
      } else if (row.parentId) {
        step(tr.parentElement?.querySelector(`tr[data-row-id="${CSS.escape(row.parentId)}"]`));
      }
      return;
    }
    if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) return;
    const bodyRows = Array.from((tr.parentElement as HTMLTableSectionElement).rows).filter(
      (r) => r.dataset.rowId
    );
    const from = bodyRows.indexOf(tr);
    const order =
      e.key === "ArrowUp"
        ? bodyRows.slice(0, from).reverse()
        : e.key === "ArrowDown"
          ? bodyRows.slice(from + 1)
          : e.key === "Home"
            ? bodyRows.slice(0, from)
            : bodyRows.slice(from + 1).reverse();
    // From the row itself, the next row; from a control, the same column's
    // control in the next row that has one.
    const col = target.closest("td")?.cellIndex ?? -1;
    const control = (r: HTMLTableRowElement): HTMLElement | null =>
      onRow
        ? r
        : (r.cells[col]?.querySelector<HTMLElement>(
            'button, a[href], input, [role=checkbox], [tabindex]:not([tabindex="-1"])'
          ) ?? null);
    const next = order.find((r) => control(r));
    if (!next) return;
    e.preventDefault();
    control(next)!.focus({ preventScroll: true });
    // Arrows keep one row ahead in view, so you see what's next before you
    // reach it; Home / End just bring their row in.
    const ahead =
      e.key === "ArrowUp" || e.key === "ArrowDown" ? (order[order.indexOf(next) + 1] ?? next) : next;
    revealRow(ahead, fill ? (wrapRef.current?.querySelector("thead")?.offsetHeight ?? 0) : 0);
    if (hasSelection && e.shiftKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      extendTo(id, next.dataset.rowId!);
    } else if (!e.shiftKey) {
      rangeHead.current = null;
    }
  };
  // A hovered row counts as focused: a row key moves focus to the row under
  // the pointer and runs there, so you can point at a row and carry on from
  // the keyboard. It applies while focus rests on the page (or a preview
  // frame around the table), or on a row or its controls when the pointer
  // has moved since the last key (a resting pointer doesn't pull focus back
  // while the keys walk away from it). Window capture, so the table answers
  // before page shortcuts; the original key stops and its replay starts
  // from the row.
  useEffect(() => {
    if (!rowsFocusable) return;
    // Read live, never captured: the ScrollArea root can remount (filling
    // switches its orientation), and a listener on the old one hears
    // nothing, which left hover pickup working only the first time.
    let pointerFresh = false;
    let last: { x: number; y: number } | null = null;
    // Only a real move counts: a scroll under a still pointer fires moves at
    // the same spot, and those mustn't hand the keys back to the hover.
    const onPointerMove = (e: globalThis.PointerEvent) => {
      if (last && last.x === e.clientX && last.y === e.clientY) return;
      last = { x: e.clientX, y: e.clientY };
      if (wrapRef.current?.contains(e.target as Node)) pointerFresh = true;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    const ROW_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "Enter", " ", "x", "X", "Escape", "a", "A"]);
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing || !ROW_KEYS.has(e.key)) return;
      const mod = e.metaKey || e.ctrlKey;
      // ⌘A / Ctrl+A is the only modified key; a bare A is the page's.
      if ((e.key === "a" || e.key === "A") !== mod || e.altKey) return;
      // Select-all and clear only when they'd do something, so Escape still
      // closes what the page has open.
      if (mod && !hasSelection) return;
      // X selects; without a selection column it's the page's.
      if ((e.key === "x" || e.key === "X") && !hasSelection) return;
      if (e.key === "Escape" && !(hasSelection && Object.keys(table.getState().rowSelection).length)) return;
      const wrap = wrapRef.current;
      if (!wrap) return;
      const active = document.activeElement as HTMLElement | null;
      const resting = !active || active === document.body || active.contains(wrap);
      // Focus on a row or a control in one (not a field being typed in).
      const inRows =
        !!active?.closest("tbody tr[data-row-id]") &&
        wrap.contains(active) &&
        !active.closest("input, textarea, select, [contenteditable=true]");
      const tr = wrap.querySelector<HTMLElement>("tbody tr[data-row-id]:hover");
      const fresh = pointerFresh;
      pointerFresh = false;
      if (!tr || !(resting || (inRows && fresh && !tr.contains(active)))) return;
      e.preventDefault();
      e.stopPropagation();
      tr.focus({ preventScroll: true });
      tr.dispatchEvent(
        new globalThis.KeyboardEvent("keydown", {
          key: e.key,
          code: e.code,
          shiftKey: e.shiftKey,
          metaKey: e.metaKey,
          ctrlKey: e.ctrlKey,
          bubbles: true,
          cancelable: true,
        })
      );
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("pointermove", onPointerMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- table is one object for its life
  }, [rowsFocusable, hasSelection]);
  // The table scrolling sideways while an editor's popup is open (a menu,
  // a list, a calendar) closes the popup, as Esc would, rather than let it
  // ride its trigger out of the table's box. The reveal's own scroll (an
  // editor bringing its cell into view) doesn't count.
  useEffect(() => {
    const viewport = wrapRef.current?.querySelector<HTMLElement>("[data-slot=scroll-area-viewport]");
    if (!viewport) return;
    let x = viewport.scrollLeft;
    const onScroll = () => {
      if (viewport.scrollLeft === x) return;
      x = viewport.scrollLeft;
      if (holds.current === 0) return;
      if (performance.now() - Number(viewport.dataset.revealedAt ?? 0) < 400) return;
      const active = document.activeElement;
      if (!active || wrapRef.current?.contains(active)) {
        // Focus on the trigger (a menu that keeps focus there) or nowhere.
        const open = wrapRef.current?.querySelector<HTMLElement>("tbody [aria-expanded=true]");
        open?.dispatchEvent(new globalThis.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        return;
      }
      active.dispatchEvent(new globalThis.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    };
    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => viewport.removeEventListener("scroll", onScroll);
  });

  const registerFocus = (table as Partial<DataTableExtras>)._registerFocus;
  const registerRoot = (table as Partial<DataTableExtras>)._registerRoot;
  useLayoutEffect(() => {
    registerFocus?.(focusFirstRow);
    registerRoot?.(() => wrapRef.current);
  });

  // With sub-rows, the first data column carries the chevron and the
  // indent.
  const expanderId = table.getCanSomeRowsExpand()
    ? visible.find((c) => c.accessorFn !== undefined)?.id
    : undefined;

  const headerMenu = useMemo(
    () => ({ table: table as TanStackTable<unknown>, reorder: reorderColumns }),
    [table, reorderColumns]
  );
  // The row a right-click opened the menu for.
  const rowMenu = table.getAllLeafColumns().find((c) => c.columnDef.meta?.rowMenu)?.columnDef.meta?.rowMenu;
  const [menuRowId, setMenuRowId] = useState<string | null>(null);
  const menuRow = menuRowId ? table.getCoreRowModel().rowsById[menuRowId] : undefined;

  const tableEl = (
    <EditContext.Provider value={stableEditing}>
    <Table
      size={size}
      // Selected rows on this page get CheckboxGroup's merged fill.
      selectedIndices={rows.flatMap((row, i) => (row.getIsSelected() ? [i] : []))}
      snapKey={expandTick}
      hideHeadHighlight={!!drag}
      // The skeleton rows are aria-hidden; this tells assistive tech the
      // table is loading rather than empty.
      aria-busy={loading || undefined}
      onKeyDown={onBodyKeyDown}
      // Fixed layout keeps the widths you set. The min width is every
      // column's width summed, so past the box the table scrolls instead of
      // crushing the column that takes the rest.
      className={cn(
        sized && "table-fixed",
        // Most of the gap between box and text (8px of its 12) belongs to
        // the column after the boxes, not the boxes: its header fill then
        // starts 8px before the label instead of on it.
        "[&_[data-column-id=select]+[data-column-id]]:pl-2",
        // Measuring (see `natural`): every cell at its one-line width.
        "[&[data-measuring]_:is(th,td)]:!w-auto [&[data-measuring]_:is(th,td)]:!max-w-none [&[data-measuring]_*]:!whitespace-nowrap",
        // The sub-row guides start from the first column's left padding.
        sizeClasses.variant === "compact" ? "[--expander-pl:10px]" : "[--expander-pl:12px]",
        "[&_[data-column-id=select]+[data-column-id]]:[--expander-pl:8px]",
        className
      )}
      style={
        sized
          ? {
              minWidth: resizeColumns
                ? table.getTotalSize()
                : Object.values(fitted ?? {}).reduce((sum, w) => sum + w, 0),
            }
          : undefined
      }
    >
      <HeaderMenuContext.Provider value={headerMenu}>
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          // Sticky header rows ride above the body rows (both z-10 by
          // default, and later rows would paint over earlier ones).
          <TableRow key={group.id} ref={headRowRef} className={fill ? "z-20" : undefined}>
            {group.headers.map((header, headerIndex) => {
              const column = header.column;
              const meta = column.columnDef.meta;
              const sorted = column.getIsSorted();
              const movable = reorderColumns && !header.isPlaceholder && canReorder(column);
              // The flex column has a handle too: its width is the least it
              // takes, so dragging it wider grows the table.
              const resizable = resizeColumns && column.getCanResize();
              const label = meta?.label ?? (typeof column.columnDef.header === "string" ? column.columnDef.header : column.id);
              const dropSide = drag && drag.refId === column.id && drag.id !== column.id ? drag.place : undefined;
              return (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  // Headers that act join the header row's gliding fill (a
                  // filled table's sticky headers paint over it, so they
                  // keep a fill of their own).
                  hoverIndex={!fill && (movable || column.getCanSort()) ? headerIndex : undefined}
                  aria-sort={
                    sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined
                  }
                  data-column-id={column.id}
                  data-reorderable={movable || undefined}
                  data-drop={dropSide}
                  data-dragging={drag?.id === column.id || undefined}
                  onPointerDown={movable ? (e) => startDrag(e, column.id, label, meta?.icon) : undefined}
                  onKeyDown={movable ? (e) => moveByKey(e, column.id) : undefined}
                  // A column with no width of its own (one shown after the
                  // widths were read) shares what's left with the flex one.
                  style={{
                    ...(sized &&
                    column.id !== restId &&
                    (resizeColumns
                      ? column.id in sizing || column.columnDef.size !== undefined
                      : fitted?.[column.id] !== undefined)
                      ? { width: widthOf(column.id, header.getSize()) }
                      : undefined),
                    ...pinProps(pins[column.id]).style,
                  }}
                  className={cn(
                    // Headers step back to muted so the content leads.
                    "group/th relative text-muted-foreground",
                    pinProps(pins[column.id]).className,
                    // Filled, the header stays put while the rows scroll,
                    // and once they do, a hairline in the rows' rule color
                    // (accent/40) separates it from the rows passing under.
                    fill && [
                      "sticky top-0 bg-background transition-shadow duration-80",
                      "group-data-scrolled/scroll:shadow-[inset_0_-1px_0_color-mix(in_oklab,var(--accent)_40%,transparent)]",
                    ],
                    movable && "touch-none select-none",
                    // The dragged header's label lifts out into the ghost, so
                    // its slot shows empty; a 2px accent bar marks where it
                    // lands.
                    "data-dragging:[&>*:not([data-resize-handle])]:invisible",
                    "before:pointer-events-none before:absolute before:inset-y-1.5 before:w-0.5 before:rounded-full before:bg-[var(--fluid-accent,#6B97FF)] before:opacity-0",
                    "data-[drop=before]:before:-left-px data-[drop=before]:before:opacity-100",
                    "data-[drop=after]:before:-right-px data-[drop=after]:before:opacity-100",
                    // A header that sorts or moves behaves like a ghost
                    // Button: its label lifts from muted to foreground on
                    // hover. Its fill is the header row's gliding one,
                    // which Table turns --active while pressed: one surface.
                    (movable || column.getCanSort()) &&
                      "hover:text-foreground transition-colors duration-80",
                    // Filled, the sticky header paints over that fill, so
                    // the cell draws its own, the same way: --hover, then
                    // --active, clear of the header's bottom line. Once it
                    // drags, the ghost takes over and the slot stays empty.
                    fill &&
                      (movable || column.getCanSort()) && [
                        "after:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:bottom-px after:-z-10 after:bg-transparent after:transition-[background-color] after:duration-80",
                        "not-data-dragging:hover:after:bg-hover not-data-dragging:active:after:bg-active",
                        PRESS_RADIUS[shape.variant],
                      ],
                    meta?.className
                  )}
                >
                  {pins[column.id] && (
                    <PinLayers pin={pins[column.id]}>
                      {/* Opaque, a pinned header covers the row's gliding
                          fill: it draws its own, the same way. */}
                      {!fill && (movable || column.getCanSort()) && (
                        <span
                          className={cn(
                            "absolute inset-x-0 top-0 bottom-px bg-transparent transition-[background-color] duration-80",
                            "group-hover/th:bg-hover group-active/th:bg-active",
                            shape.bg
                          )}
                        />
                      )}
                    </PinLayers>
                  )}
                  {header.isPlaceholder ? null : typeof column.columnDef.header === "string" &&
                    meta?.icon ? (
                    <HeaderLabel icon={meta.icon} title={column.columnDef.header} />
                  ) : (
                    flexRender(column.columnDef.header, header.getContext())
                  )}
                  {resizable && (
                    <ResizeHandle
                      label={label}
                      width={header.getSize()}
                      resizing={column.getIsResizing()}
                      onStart={(e) => {
                        // The flex column can render wider than its size (it
                        // fills the box). Starting from its size would make
                        // the first pixels of a drag do nothing, so it takes
                        // its rendered width first.
                        if (column.id === flexId) {
                          const th = (e.currentTarget as HTMLElement).closest("th");
                          const rendered = Math.round(th?.getBoundingClientRect().width ?? 0);
                          if (rendered > header.getSize())
                            flushSync(() =>
                              table.setColumnSizing((old) => ({ ...old, [column.id]: rendered }))
                            );
                        }
                        header.getResizeHandler()(e);
                      }}
                      onReset={() => column.resetSize()}
                      onStep={(delta) =>
                        table.setColumnSizing((old) => ({
                          ...old,
                          [column.id]: Math.max(MIN_COLUMN_WIDTH, header.getSize() + delta),
                        }))
                      }
                    />
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      </HeaderMenuContext.Provider>
      <TableBody>
        {loading ? (
          // Loading: a page of rows the real rows' size, each cell holding a
          // skeleton bar in a reveal-swap (the reveal's delayed fade-in and
          // pulse). The rows that replace them draw their own fading
          // skeleton (see the swap below).
          Array.from({ length: skeletonRows }, (_, i) => (
            <TableRow key={`row-${i}`} aria-hidden>
              {visible.map((column, c) => (
                <TableCell
                  key={column.id}
                  data-column-id={column.id}
                  className={cn("text-foreground", column.columnDef.meta?.className)}
                >
                  <span key="skeleton" className="reveal-swap">
                    {skeletonFor(column.id, i, c, shape.variant, sizeClasses.variant === "compact")}
                  </span>
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : rows.length > 0 ? (
          rows.map((row, i) => (
            <DataTableBodyRow
              // Keyed by record, so state in a cell (an open row menu, a
              // consumer's own input, focus) stays with its row through a
              // sort, a search or a page turn.
              key={row.id}
              table={table}
              row={row}
              i={i}
              selected={row.getIsSelected()}
              runStart={row.getIsSelected() && !rows[i - 1]?.getIsSelected()}
              runEnd={row.getIsSelected() && !rows[i + 1]?.getIsSelected()}
              pins={pins}
              menuOpen={menuRowId === row.id}
              someSelected={row.getIsSomeSelected()}
              expanded={row.getIsExpanded()}
              expanderId={expanderId}
              onToggleExpand={stableToggle}
              columns={table.options.columns}
              layoutKey={layoutKey}
              onRowClick={onRowClick}
              rowsFocusable={rowsFocusable}
              editable={!!onCellEdit}
              sized={sized}
              alignTop={alignTop}
              swapping={swapping}
              compact={sizeClasses.variant === "compact"}
              shapeVariant={shape.variant}
            />
          ))
        ) : (
          <TableEmpty
            columns={columnCount}
            rows={heldRows}
            title={empty?.title ?? "No results"}
            description={empty?.description}
            action={empty?.action}
          />
        )}
      </TableBody>
    </Table>
    </EditContext.Provider>
  );

  return (
    <>
      {/* The library's ScrollArea: a table wider than its box scrolls
          sideways under the system's thumb (4px, low contrast, widening on
          hover; native scrolling on touch screens), and both edges fade
          while there's more to that side. Filled, it scrolls both ways
          under a sticky header. Its root clips, so a height that eases
          never flashes a scrollbar. */}
      {pinnedLeft || pinnedRight ? (
        <style href="ff-data-table-pin" precedence="default">
          {PIN_CSS}
        </style>
      ) : null}
      <ScrollArea
        ref={setWrap}
        orientation={fill ? "both" : "horizontal"}
        className={cn("group/pin w-full", fill && "group/scroll min-h-0 flex-1")}
        // The edges fade while there's more to that side, except a pinned
        // side: its columns stay put, and a hairline marks the edge.
        viewportClassName={cn(
          "scroll-fade-x",
          pinnedLeft && pinnedRight && "[mask-image:none]! [-webkit-mask-image:none]!",
          pinnedLeft &&
            !pinnedRight &&
            "[mask-image:linear-gradient(to_right,#000_calc(100%-var(--scroll-fade-size)),rgba(0,0,0,var(--sf-end))_100%)]! [-webkit-mask-image:linear-gradient(to_right,#000_calc(100%-var(--scroll-fade-size)),rgba(0,0,0,var(--sf-end))_100%)]!",
          !pinnedLeft &&
            pinnedRight &&
            "[mask-image:linear-gradient(to_right,rgba(0,0,0,var(--sf-start))_0,#000_var(--scroll-fade-size))]! [-webkit-mask-image:linear-gradient(to_right,rgba(0,0,0,var(--sf-start))_0,#000_var(--scroll-fade-size))]!"
        )}
      >
        {rowMenu ? (
          // Right-clicking a row (or Shift + F10 on a focused one) opens
          // its ⋯ menu's items at the pointer. The selection stays as it is.
          <ContextMenu onOpenChange={(open) => !open && setMenuRowId(null)}>
            <ContextMenuTrigger
              className="contents"
              filter={(target) => !!target.closest("tbody tr[data-row-id]")}
              onContextMenu={(e) => {
                const tr = (e.target as Element).closest<HTMLElement>("tbody tr[data-row-id]");
                setMenuRowId(tr?.dataset.rowId ?? null);
              }}
              onKeyDown={(e) => {
                const tr = (e.target as Element).closest<HTMLElement>("tbody tr[data-row-id]");
                if (tr) setMenuRowId(tr.dataset.rowId ?? null);
              }}
            >
              {tableEl}
            </ContextMenuTrigger>
            <ContextMenuContent className="w-56">{menuRow && rowMenu(menuRow)}</ContextMenuContent>
          </ContextMenu>
        ) : (
          tableEl
        )}
      </ScrollArea>
      {ghost &&
        createPortal(
          <div
            ref={ghostRef}
            aria-hidden
            className={cn(
              // The pressed header, lifted: the same --active fill over the
              // page background (opaque, so the table doesn't show through
              // the 80%), no border, no shadow.
              "pointer-events-none fixed z-[var(--z-popover,60)] flex items-center bg-background bg-[linear-gradient(var(--active),var(--active))] text-foreground opacity-80",
              sizeClasses.variant === "compact" ? "px-2.5" : "px-3",
              sizeClasses.text,
              shape.item
            )}
            style={{
              top: ghost.top,
              left: ghost.left,
              width: ghost.width,
              height: ghost.height,
              fontVariationSettings: fontWeights.semibold,
            }}
          >
            <span className="min-w-0 truncate">
              <HeaderLabel icon={ghost.icon} title={ghost.label} />
            </span>
          </div>,
          document.body
        )}
    </>
  );
}

interface ResizeHandleProps {
  label: string;
  width: number;
  resizing: boolean;
  onStart: (event: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => void;
  onReset: () => void;
  onStep: (delta: number) => void;
}

/** An 8px grab strip over the header's right edge, showing a 1px rule on
 *  hover, focus and drag. A separator, so keyboard users can size it too. */
function ResizeHandle({ label, width, resizing, onStart, onReset, onStep }: ResizeHandleProps) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${label}`}
      aria-valuenow={Math.round(width)}
      aria-valuemin={MIN_COLUMN_WIDTH}
      tabIndex={0}
      data-resize-handle=""
      data-resizing={resizing || undefined}
      onMouseDown={onStart}
      onTouchStart={onStart}
      onDoubleClick={onReset}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        // Plain arrows only: Alt + arrow belongs to the header (it moves the
        // column), and ⌘ / Ctrl / Shift stay with the browser and the OS.
        if (e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        // Handled here, so the header's own keys don't see it too.
        e.stopPropagation();
        onStep(e.key === "ArrowLeft" ? -RESIZE_STEP : RESIZE_STEP);
      }}
      className="group/resize absolute inset-y-0 -right-1 z-20 w-2 cursor-col-resize touch-none select-none outline-none"
    >
      <span
        className={cn(
          "absolute inset-y-1.5 left-1/2 w-px -translate-x-1/2 transition-colors duration-80",
          "bg-transparent group-hover/resize:bg-foreground/40 group-focus-visible/resize:bg-[var(--focus-ring,#6B97FF)] group-data-resizing/resize:bg-foreground/60"
        )}
      />
    </div>
  );
}

/** A header's icon and title. The 14px icon sits 4px before the title in
 *  the header's own muted color, so it labels without competing. */
function HeaderLabel({ icon, title }: { icon?: IconComponent; title: ReactNode }) {
  if (!icon) return <>{title}</>;
  return (
    <span className="inline-flex items-center gap-1 align-top">
      <Icon14 icon={icon} />
      {title}
    </span>
  );
}

function Icon14({ icon: Icon }: { icon: IconComponent }) {
  return <Icon size={14} aria-hidden className="shrink-0" />;
}

// ── DataTableColumnHeader ────────────────────────────────

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
}

// The sort glyph swaps like every icon swap in the library: the arriving
// glyph rides the fast tier, the leaving one its exit, with a touch of blur.
const SHOWN = { opacity: 1, scale: 1, filter: "blur(0px)" };
const HIDDEN = { opacity: 0, scale: 0.6, filter: "blur(4px)" };
const enter = { type: "tween" as const, duration: spring.fast.duration, ease: "easeOut" as const };
const leave = { type: "tween" as const, ...spring.fast.exit, ease: "easeIn" as const };

/** A column's header: its title, and a menu on click with what the column
 *  can do (sort either way, add a filter, move left or right, freeze the
 *  columns up to it). Shift-click still adds the column to the sort.
 *  Columns that can do none of it render the title alone. */
function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  "use no memo";
  const icons = useIcons();
  const Unsorted = icons["chevrons-up-down"];
  const Arrow = icons["arrow-up"];
  const ctx = useContext(HeaderMenuContext);
  const table = ctx?.table as TanStackTable<TData> | undefined;
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const icon = column.columnDef.meta?.icon;
  const col = column as unknown as Column<TData, unknown>;
  const canSort = column.getCanSort();
  const canFilter = !!table && (table as Partial<DataTableExtras>).canOpenFilter?.() && column.getCanFilter();
  // Moving follows the table's reorderColumns; the neighbors are the
  // visible columns that move too.
  const movable = !!table && !!ctx?.reorder && canReorder(col);
  const order = movable ? table!.getVisibleLeafColumns().filter(canReorder).map((c) => c.id) : [];
  const at = order.indexOf(column.id);
  const canPin = !!table && column.getCanPin() && column.getIsPinned() !== "right";
  const leftPins = table?.getState().columnPinning.left ?? [];
  const frozenHere = leftPins[leftPins.length - 1] === column.id;
  const hasMenu = !!table && (canSort || canFilter || movable || canPin);

  const sorted = column.getIsSorted();
  const label = (
    <>
      {icon && <Icon14 icon={icon} />}
      {title}
    </>
  );
  if (!hasMenu && !canSort)
    return (
      <span className={className}>
        <HeaderLabel icon={icon} title={title} />
      </span>
    );

  const move = (place: "before" | "after") => {
    const refId = order[place === "before" ? at - 1 : at + 1];
    if (!table || !refId) return;
    (table as Partial<DataTableExtras>).captureLayout?.();
    moveColumn(table, column.id, refId, place);
  };
  const freeze = () => {
    if (!table) return;
    (table as Partial<DataTableExtras>).captureLayout?.();
    if (frozenHere) {
      // Unfreeze: the selection boxes stay put, the rest scroll.
      table.setColumnPinning((old) => ({ ...old, left: old.left?.includes("select") && column.id !== "select" ? ["select"] : [] }));
      return;
    }
    const right = new Set(table.getState().columnPinning.right ?? []);
    const ids = table.getVisibleLeafColumns().map((c) => c.id).filter((id) => !right.has(id));
    table.setColumnPinning((old) => ({ ...old, left: ids.slice(0, ids.indexOf(column.id) + 1) }));
  };

  const items: { label: string; icon?: IconComponent; onSelect: () => void; disabled?: boolean }[] = [];
  if (canSort) {
    items.push(
      { label: "Sort ascending", icon: icons["arrow-up"], onSelect: () => column.toggleSorting(false) },
      { label: "Sort descending", icon: icons["arrow-down"], onSelect: () => column.toggleSorting(true) }
    );
    if (sorted) items.push({ label: "Clear sort", icon: icons.x, onSelect: () => column.clearSorting() });
  }
  if (canFilter) items.push({ label: "Filter", icon: icons.search, onSelect: () => (table as Partial<DataTableExtras>).openFilter?.(column.id) });
  if (movable) {
    items.push(
      { label: "Move left", icon: icons["arrow-left"], onSelect: () => move("before"), disabled: at <= 0 },
      { label: "Move right", icon: icons["arrow-right"], onSelect: () => move("after"), disabled: at === -1 || at >= order.length - 1 }
    );
  }
  if (canPin) items.push({ label: frozenHere ? "Unfreeze columns" : "Freeze up to here", icon: icons["panel-left"], onSelect: freeze });

  const button = (
    <button
      ref={buttonRef}
      type="button"
      aria-haspopup={hasMenu ? "menu" : undefined}
      aria-expanded={hasMenu ? menuOpen : undefined}
      onClick={(e) => {
        // Shift-click adds the column to the sort, as before; a plain click
        // opens the column's menu.
        if (e.shiftKey && canSort) column.toggleSorting(undefined, true);
        else if (hasMenu) setMenuOpen(true);
        else column.toggleSorting();
      }}
      className={cn(
        "group/sort inline-flex cursor-pointer items-center gap-1 rounded-[4px] align-top outline-none transition-colors duration-80",
        // The sorted column reads at full contrast, its icon and label with
        // the arrow, so the sort shows from across the table.
        (sorted || menuOpen) && "text-foreground",
        "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      {label}
      {canSort && (
        // One 14px cell for both glyphs, so the label never shifts. The
        // arrow turns over for descending instead of swapping glyphs.
        <span
          aria-hidden
          className={cn(
            "grid size-3.5 shrink-0 transition-colors duration-80",
            sorted ? "text-foreground" : "text-muted-foreground group-hover/sort:text-foreground"
          )}
        >
          <motion.span
            className="col-start-1 row-start-1 flex"
            initial={false}
            animate={sorted ? HIDDEN : SHOWN}
            transition={sorted ? leave : enter}
          >
            <Unsorted size={14} />
          </motion.span>
          <motion.span
            className="col-start-1 row-start-1 flex"
            initial={false}
            animate={sorted ? { ...SHOWN, rotate: sorted === "desc" ? 180 : 0 } : { ...HIDDEN, rotate: 0 }}
            transition={sorted ? { ...enter, rotate: spring.moderate } : leave}
          >
            <Arrow size={14} />
          </motion.span>
        </span>
      )}
    </button>
  );
  if (!hasMenu) return button;

  return (
    <>
      {button}
      {/* The menu opens from the whole header cell: a hidden trigger over
          it that never takes the pointer, so a press can still start a
          column drag and only a click opens the menu. */}
      <DropdownMenu
        open={menuOpen}
        onOpenChange={(next) => {
          setMenuOpen(next);
          // Focus returns to the header, not the hidden trigger.
          if (!next) requestAnimationFrame(() => buttonRef.current?.focus({ preventScroll: true }));
        }}
      >
        <DropdownTrigger
          render={
            <button
              type="button"
              tabIndex={-1}
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-0"
            />
          }
        />
        <DropdownContent align="start" sideOffset={2} className="w-52">
          {items.map((item, i) => (
            <MenuItem
              key={item.label}
              index={i}
              icon={item.icon}
              label={item.label}
              disabled={item.disabled}
              onSelect={item.onSelect}
            />
          ))}
        </DropdownContent>
      </DropdownMenu>
    </>
  );
}

// ── Selection column ─────────────────────────────────────

// The row a range starts from, per table. Keyed by the table's getState
// function, the one object the table keeps for its whole life (the view
// useDataTable hands out is new on every change).
const selectionAnchors = new WeakMap<object, string>();

/** Scrolls a row into view vertically, by as little as it takes, in its
 *  nearest scrolling box (a filled table's viewport, a panel) or the page.
 *  `topInset` keeps it clear of a sticky header. Measured by hand rather
 *  than scrollIntoView, which would also slide a wide table sideways. */
function revealRow(row: HTMLElement, topInset: number) {
  let box: HTMLElement | null = row.parentElement;
  while (box && box !== document.body && box !== document.documentElement) {
    const overflow = getComputedStyle(box).overflowY;
    if ((overflow === "auto" || overflow === "scroll") && box.scrollHeight > box.clientHeight) break;
    box = box.parentElement;
  }
  const r = row.getBoundingClientRect();
  if (box && box !== document.body && box !== document.documentElement) {
    const b = box.getBoundingClientRect();
    const top = b.top + topInset;
    if (r.top < top) box.scrollTop -= top - r.top;
    else if (r.bottom > b.bottom) box.scrollTop += r.bottom - b.bottom;
    return;
  }
  if (r.top < 0) window.scrollBy(0, r.top);
  else if (r.bottom > window.innerHeight) window.scrollBy(0, r.bottom - window.innerHeight);
}

/** Selects (or clears) every row on the page from one row to another. */
function selectRange<TData>(table: TanStackTable<TData>, fromId: string, toId: string, value: boolean) {
  const ids = table.getRowModel().rows.map((row) => row.id);
  const a = ids.indexOf(fromId);
  const b = ids.indexOf(toId);
  if (a === -1 || b === -1) return;
  const range = ids.slice(Math.min(a, b), Math.max(a, b) + 1);
  table.setRowSelection((old) => {
    const next = { ...old };
    for (const id of range) {
      if (value) next[id] = true;
      else delete next[id];
    }
    return next;
  });
}

/** The whole selection cell is the box's hit area: padding included, from
 *  the row's top rule to its bottom one. It cancels the cell's padding with
 *  negative margins and puts it back as its own, so the row keeps its size.
 *  `group/field` lets the box darken its border while the area is hovered,
 *  as it does inside a Field. */
interface SelectHitProps extends HTMLAttributes<HTMLSpanElement> {
  disabled?: boolean;
  onToggle: () => void;
}

// forwardRef and a props spread, so it can be a Tooltip's trigger: the
// tooltip hands its hover and focus handlers and its ref through here.
const SelectHit = forwardRef<HTMLSpanElement, SelectHitProps>(
  ({ disabled, onToggle, onClick, className, children, ...props }, ref) => (
    <span
      ref={ref}
      data-select-hit=""
      {...props}
      onClick={(e) => {
        onClick?.(e);
        // The box handles its own clicks; this catches the rest of the cell.
        // A handler above that took the click (a range) prevents it.
        if (disabled || e.defaultPrevented || (e.target as Element).closest("[role=checkbox]"))
          return;
        onToggle();
      }}
      className={cn(
        "group/field -mx-2 my-[calc(-1*var(--table-cell-py))] flex select-none px-2 py-(--table-cell-py)",
        !disabled && "cursor-pointer",
        className
      )}
    >
      {/* The box is shorter than the line box, so it sits in a 1lh cell to
          keep the row on the ladder. */}
      <span className="flex h-[1lh] items-center">{children}</span>
    </span>
  )
);
SelectHit.displayName = "SelectHit";

/** A selection box shows only where it's wanted: on the row under the
 *  pointer or holding focus, on a checked (or, in the header, partly
 *  checked) box, and always on touch screens, which have no hover. A
 *  selection doesn't bring the rest up. The cell still takes the click
 *  while the box is hidden. */
const SELECT_REVEAL =
  "opacity-0 transition-opacity duration-80 group-hover/row:opacity-100 group-focus-within/row:opacity-100 has-[[aria-checked=true],[aria-checked=mixed]]:opacity-100 [@media(hover:none)]:opacity-100";

/** The selectable rows the search leaves, sub-rows included, on every page. */
function selectableRows<TData>(table: TanStackTable<TData>) {
  return table.getFilteredRowModel().flatRows.filter((r) => r.getCanSelect());
}

/** One state update for the whole result, whatever its size. */
function selectAllRows<TData>(table: TanStackTable<TData>, value: boolean) {
  const rows = selectableRows(table);
  table.setRowSelection((prev) => {
    const next = { ...prev };
    for (const r of rows) {
      if (value) next[r.id] = true;
      else delete next[r.id];
    }
    return next;
  });
}

/** A ready-made first column of checkboxes: one per row, and a header box
 *  that selects every row the search leaves, on every page (a dash while
 *  only some are). Each
 *  box answers a click anywhere in its cell. Put it first in your
 *  `columns`. */
function selectColumn<TData>(): ColumnDef<TData> {
  return {
    id: "select",
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    // 8px before the 16px box, so its focus ring never meets the row's edge
    // (or the scroll box's clip), and 4px after it; the next column's 8px
    // left padding makes 12px from box to text.
    size: 28,
    // w-0 shrinks the column to the box and its padding. The row
    // dividers start after it: the cell's own transparent bottom border
    // wins the collapsed-border conflict with the row's, so no line runs
    // above or below a box.
    meta: { className: "w-0 pl-2 pr-1 border-b border-b-transparent" },
    header: ({ table }) => {
      // Every row the search leaves, on every page: a page is a view, not
      // a scope, so "all" means the whole result.
      const rows = selectableRows(table);
      const all = rows.length > 0 && rows.every((r) => r.getIsSelected());
      const some = !all && rows.some((r) => r.getIsSelected());
      // Counted so "all" never reads as more (or fewer) than it is: the
      // top-level rows, the number the footer shows.
      const count = table.getFilteredRowModel().rows.filter((r) => r.getCanSelect()).length;
      return (
        // The tooltip names what the next click does: a dash selects the
        // rest, a check clears it. Its trigger is the hit area, not the
        // box, so it works whichever primitive the box is built on.
        <Tooltip content={`${all ? "Unselect" : "Select"} all ${count}`} side="top">
          <SelectHit className={SELECT_REVEAL} onToggle={() => selectAllRows(table, !all)}>
            <Checkbox
              aria-label="Select all rows"
              checked={all}
              indeterminate={some}
              onCheckedChange={(checked) => selectAllRows(table, checked)}
            />
          </SelectHit>
        </Tooltip>
      );
    },
    cell: ({ row, table }) => (
      <SelectHit
        className={SELECT_REVEAL}
        disabled={!row.getCanSelect()}
        onToggle={() => row.toggleSelected()}
        // Shift-click selects (or clears) every row from the last one
        // clicked to this one, to match this row's new state.
        onClick={(e) => {
          const anchor = selectionAnchors.get(table.getState);
          // A range needs its anchor on this page; otherwise the click is a
          // plain toggle (and becomes the new anchor).
          const onPage =
            !!anchor && table.getRowModel().rows.some((r) => r.id === anchor);
          if (e.shiftKey && anchor && onPage && anchor !== row.id) {
            e.preventDefault();
            selectRange(table, anchor, row.id, !row.getIsSelected());
          }
          selectionAnchors.set(table.getState, row.id);
        }}
      >
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          // Some of its sub-rows picked, not all: the dash.
          indeterminate={!row.getIsSelected() && row.getIsSomeSelected()}
          disabled={!row.getCanSelect()}
          onCheckedChange={(checked) => row.toggleSelected(checked)}
        />
      </SelectHit>
    ),
  };
}


// ── Sub-rows ─────────────────────────────────────────────

/** How far each level of sub-rows steps in: a child's chevron starts where
 *  its parent's ends, so the guide line runs clear of it. */
const SUB_ROW_INDENT = 16;

// A row whose right-click menu is open holds the hover fill in its own
// cells, rounded at its ends like the highlight.
const MENU_ROW = {
  rounded: "[&>td]:bg-hover [&>td:first-child]:rounded-l-lg [&>td:last-child]:rounded-r-lg",
  pill: "[&>td]:bg-hover [&>td:first-child]:rounded-l-[20px] [&>td:last-child]:rounded-r-[20px]",
  sharp: "[&>td]:bg-hover [&>td:first-child]:rounded-l-[1px] [&>td:last-child]:rounded-r-[1px]",
} as const;

interface PinInfo {
  side: "left" | "right";
  /** Px from its edge: the pinned columns' widths between. */
  offset: number;
  /** The pinned column nearest the scrolling ones: it carries the hairline. */
  edge: boolean;
  /** The table's first (or last) column: its fills round like the row's. */
  outer: boolean;
}

// Corner radii for a pinned cell's fills on the table's outer edge, per
// shape, matching the row highlight and selection (literal classes, so
// Tailwind sees them).
const PIN_RADIUS = {
  left: { rounded: "rounded-l-lg", pill: "rounded-l-[20px]", sharp: "rounded-l-[1px]" },
  right: { rounded: "rounded-r-lg", pill: "rounded-r-[20px]", sharp: "rounded-r-[1px]" },
  tl: { rounded: "rounded-tl-lg", pill: "rounded-tl-[20px]", sharp: "rounded-tl-[1px]" },
  bl: { rounded: "rounded-bl-lg", pill: "rounded-bl-[20px]", sharp: "rounded-bl-[1px]" },
  tr: { rounded: "rounded-tr-lg", pill: "rounded-tr-[20px]", sharp: "rounded-tr-[1px]" },
  br: { rounded: "rounded-br-lg", pill: "rounded-br-[20px]", sharp: "rounded-br-[1px]" },
} as const;

/** A pinned cell's classes and offset. It sticks always (a no-op until
 *  the table scrolls), and its layers (PinLayers) show only while content
 *  passes under it: `--ff-pin` turns 1 then. A scroll-driven animation sets
 *  it (PIN_CSS), in the same frame as the scroll; without one (Firefox),
 *  the root's data-x-start / data-x-end do, a frame late. */
function pinProps(pin: PinInfo | undefined) {
  if (!pin) return { className: undefined, style: undefined };
  const left = pin.side === "left";
  return {
    className: cn(
      "sticky z-[1] [--ff-pin:0]",
      left ? "ff-pin-l group-data-x-start/pin:[--ff-pin:1]" : "ff-pin-r group-data-x-end/pin:[--ff-pin:1]"
    ),
    style: left ? { left: pin.offset } : { right: pin.offset },
  };
}

// The scroll-driven half of pinning: a pinned cell's `--ff-pin` flips to 1
// once the table has scrolled 1px past its side, read from the scroll box's
// own timeline, so the cell turns opaque in the frame the content moves
// (a scroll event lands a frame later, and the content shows through).
// Rendered once per page (React hoists and dedupes it by href).
const PIN_CSS = `
@keyframes ff-pin-on { from { --ff-pin: 0 } to { --ff-pin: 1 } }
@keyframes ff-pin-off { from { --ff-pin: 1 } to { --ff-pin: 0 } }
@supports (animation-timeline: scroll()) {
  .ff-pin-l { animation: ff-pin-on linear both; animation-timeline: scroll(nearest inline); animation-range: 0px 2px; }
  .ff-pin-r { animation: ff-pin-off linear both; animation-timeline: scroll(nearest inline); animation-range: calc(100% - 2px) 100%; }
}`;

/** A pinned cell's own surface while content passes under it: the page
 *  background, what the row's fills (drawn behind the table) would show
 *  through it, and the hairline at the pinned columns' edge. All of it
 *  fades with `--ff-pin`; none of it glides (the row's own fill does that
 *  under them, at rest). */
function PinLayers({ pin, children }: { pin: PinInfo; children?: ReactNode }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 -z-[1] opacity-(--ff-pin)">
      <span className="absolute inset-0 bg-background" />
      {children}
      {pin.edge && (
        // A collapsed-border table paints no shadow on its cells: the rule
        // is a span inside the edge cell, in the rows' rule color.
        <span className={cn("absolute inset-y-0 w-px bg-accent/40", pin.side === "left" ? "right-0" : "left-0")} />
      )}
    </span>
  );
}

/** A pinned body cell's layers: the selection, and the hover over it. */
function PinFills({
  pin,
  selected,
  runStart,
  runEnd,
  shapeVariant,
}: {
  pin: PinInfo;
  selected: boolean;
  runStart: boolean;
  runEnd: boolean;
  shapeVariant: keyof typeof SKELETON_BAR_RADIUS;
}) {
  const left = pin.side === "left";
  return (
    <PinLayers pin={pin}>
      {selected && (
        <span
          className={cn(
            "absolute inset-0 bg-active",
            pin.outer && runStart && PIN_RADIUS[left ? "tl" : "tr"][shapeVariant],
            pin.outer && runEnd && PIN_RADIUS[left ? "bl" : "br"][shapeVariant]
          )}
        />
      )}
      <span
        className={cn(
          "absolute inset-0 bg-hover opacity-0 transition-opacity duration-80 group-[.is-active]/row:opacity-100",
          pin.outer && PIN_RADIUS[left ? "left" : "right"][shapeVariant]
        )}
      />
    </PinLayers>
  );
}

/** The tree lines under an open row: one 1px rule per depth, dropped from
 *  the center of the parent's chevron through every row below it, so a
 *  sub-row reads as its parent's without a fill of its own (a fill would
 *  cover the hover and selection drawn behind the table). Placed from the
 *  cell's left padding, `--expander-pl`, which the table sets. */
function SubRowGuides({ row, expanded, alignTop }: { row: Row<unknown>; expanded: boolean; alignTop: boolean }) {
  const x = (depth: number) => `calc(var(--expander-pl) + ${depth * SUB_ROW_INDENT + 7.5}px)`;
  const rule = "pointer-events-none absolute w-px bg-border";
  return (
    <>
      {Array.from({ length: row.depth }, (_, d) => (
        <span key={d} aria-hidden className={cn(rule, "-top-px bottom-0")} style={{ left: x(d) }} />
      ))}
      {expanded && row.subRows.length > 0 && (
        // From 6px under the open chevron to the row's bottom.
        <span
          aria-hidden
          className={cn(rule, "bottom-0", alignTop ? "top-[calc(var(--table-cell-py)+0.5lh+14px)]" : "top-[calc(50%+14px)]")}
          style={{ left: x(row.depth) }}
        />
      )}
    </>
  );
}

/** The chevron that opens a row's sub-rows. Not a tab stop: from the row,
 *  → opens and ← closes. Turns a quarter on spring.fast. */
function ExpandToggle({
  expanded,
  count,
  sharp,
  onToggle,
}: {
  expanded: boolean;
  /** How many sub-rows it opens: the tooltip names the next click with
   *  it, as the select-all box does with its rows. */
  count: number;
  sharp: boolean;
  onToggle: () => void;
}) {
  const icons = useIcons();
  const Chevron = icons["chevron-right"];
  const action = expanded ? "Collapse" : "Expand";
  return (
    <Tooltip content={`${action} ${count}`} side="top">
    <button
      type="button"
      tabIndex={-1}
      aria-expanded={expanded}
      aria-label={`${action} ${count} ${count === 1 ? "sub-row" : "sub-rows"}`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        // 16px, its hit area 4px wider each way; above an editor's reach.
        "relative z-[1] flex size-4 shrink-0 items-center justify-center text-muted-foreground outline-none",
        "after:absolute after:-inset-1 transition-colors duration-80 hover:bg-hover hover:text-foreground",
        sharp ? "rounded-[1px]" : "rounded-[4px]"
      )}
    >
      <motion.span
        className="flex"
        initial={false}
        animate={{ rotate: expanded ? 90 : 0 }}
        transition={spring.fast}
      >
        <Chevron size={14} strokeWidth={1.75} />
      </motion.span>
    </button>
    </Tooltip>
  );
}

// ── Body row ─────────────────────────────────────────────

interface DataTableBodyRowProps<TData> {
  table: TanStackTable<TData>;
  row: Row<TData>;
  i: number;
  selected: boolean;
  /** Selected, and the first (or last) of its run: its pinned fills round. */
  runStart: boolean;
  runEnd: boolean;
  /** The pinned columns, by id. Stable until a pin or its width changes. */
  pins: Record<string, PinInfo>;
  /** Its right-click menu is open: it stays lit while the pointer is on
   *  the menu. */
  menuOpen: boolean;
  /** Compared only: some, not all, of its sub-rows are selected. */
  someSelected: boolean;
  expanded: boolean;
  /** The column that carries the chevron and the indent, with sub-rows. */
  expanderId: string | undefined;
  /** Stable for the table's life. */
  onToggleExpand: (row: Row<unknown>) => void;
  /** Compared only: new column definitions redraw the cells. */
  columns: unknown;
  /** Compared only: the visible columns and their text fitting. */
  layoutKey: string;
  onRowClick?: (row: Row<TData>) => void;
  rowsFocusable: boolean;
  editable: boolean;
  sized: boolean;
  alignTop: boolean;
  swapping: boolean;
  compact: boolean;
  shapeVariant: keyof typeof SKELETON_BAR_RADIUS;
}

/** One body row. Memoized: it redraws when its record (a new row object),
 *  its selection, the columns, their layout or the table's look change, not
 *  on every change to the table's state. A cell that reads other table
 *  state should live in a column you redefine when that state changes. */
const DataTableBodyRow = memo(
  forwardRef<HTMLTableRowElement, DataTableBodyRowProps<unknown>>(function DataTableBodyRow(
    {
      table,
      row,
      i,
      selected,
      runStart,
      runEnd,
      pins,
      menuOpen,
      expanded,
      expanderId,
      onToggleExpand,
      onRowClick,
      rowsFocusable,
      editable,
      sized,
      alignTop,
      swapping,
      compact,
      shapeVariant,
    },
    ref
  ) {
    "use no memo";
    return (
    <TableRow
      ref={ref}
      data-row-id={row.id}
      index={i}
      data-state={selected ? "selected" : undefined}
      onClick={
        onRowClick
          ? (e: MouseEvent<HTMLTableRowElement>) => {
              // React carries clicks up from portals (the row menu's
              // popup) to this row; only clicks inside the row's own
              // DOM count, and not those on a control in it.
              if (!e.currentTarget.contains(e.target as Node)) return;
              if ((e.target as Element).closest(CONTROL)) return;
              onRowClick(row);
            }
          : undefined
      }
      // Rows that select or open are one tab stop for the whole body
      // (roving: the row last focused, else the first), so they have
      // a keyboard path without a stop per row. The stop moves in
      // the DOM, not in state: a re-render of every row on every
      // arrow press is what made held keys drag.
      tabIndex={rowsFocusable ? (i === 0 ? 0 : -1) : undefined}
      onFocus={
        rowsFocusable
          ? (e: FocusEvent<HTMLTableRowElement>) => {
              const tr = e.currentTarget;
              if (e.target !== tr || tr.tabIndex === 0) return;
              tr.parentElement
                ?.querySelectorAll<HTMLElement>("tr[data-row-id][tabindex='0']")
                .forEach((other) => (other.tabIndex = -1));
              tr.tabIndex = 0;
            }
          : undefined
      }
      className={cn(
        onRowClick && "cursor-pointer",
        rowsFocusable && "outline-none",
        menuOpen && MENU_ROW[shapeVariant],
        // Rows each stack on their own (z-10); the one holding a raised
        // editor lifts above the rows after it, so the field covers them.
        "has-[[data-cell-expanded]]:z-30",
        // A focused row looks hovered: Table moves its highlight to
        // it, and its checkbox takes the hover border, in place of
        // a blue ring around the row or the box.
        "[&_[role=checkbox]:focus-visible]:ring-0",
        "[&:is(:focus-visible,:has(:focus-visible))_[role=checkbox]]:border-foreground/40"
      )}
    >
      {row.getVisibleCells().map((cell, c) => {
        const meta = cell.column.columnDef.meta;
        const lines = linesOf(table, cell.column);
        const editor = editable ? meta?.editor : undefined;
        const rendered = editor ? (
          <EditableCell
            editor={editor}
            row={row}
            columnId={cell.column.id}
            label={meta?.label ?? (typeof cell.column.columnDef.header === "string" ? cell.column.columnDef.header : cell.column.id)}
            lines={lines}
            value={cell.getValue()}
            display={
              typeof editor === "object" && editor.type === "select"
                ? flexRender(cell.column.columnDef.cell, cell.getContext())
                : undefined
            }
          />
        ) : (
          flexRender(cell.column.columnDef.cell, cell.getContext())
        );
        // line-clamp needs a block of its own; a cell isn't one.
        const fitted =
          lines === 2 ? (
            <div className="line-clamp-2 [overflow-wrap:anywhere]">{rendered}</div>
          ) : (
            rendered
          );
        // With sub-rows, the first data column indents by depth and leads
        // with the chevron (or its width, so siblings' text lines up).
        const content =
          cell.column.id === expanderId ? (
            <span
              className="flex min-w-0 items-center gap-1"
              style={row.depth ? { paddingLeft: row.depth * SUB_ROW_INDENT } : undefined}
            >
              {row.getCanExpand() ? (
                <ExpandToggle
                  expanded={expanded}
                  count={row.subRows.length}
                  sharp={shapeVariant === "sharp"}
                  onToggle={() => onToggleExpand(row as Row<unknown>)}
                />
              ) : (
                <span aria-hidden className="size-4 shrink-0" />
              )}
              <span
                className={cn(
                  "min-w-0 flex-1",
                  // An editor cuts its own text short, and its raised field
                  // must reach past this box.
                  !editor && (lines === 1 || (sized && lines === undefined)) && "truncate"
                )}
              >
                {fitted}
              </span>
            </span>
          ) : (
            fitted
          );
        return (
          <TableCell
            key={cell.column.id}
            data-column-id={cell.column.id}
            className={cn(
              // Content reads at full strength, above the muted
              // headers.
              "text-foreground",
              // Anchors the skeleton that fades over it on landing, and
              // the sub-row guides.
              (swapping || cell.column.id === expanderId) && "relative",
              pinProps(pins[cell.column.id]).className,
              alignTop && "align-top",
              // A narrowed column cuts its text short instead of
              // wrapping it onto a second line.
              (lines === 1 || (sized && lines === undefined)) && "truncate",
              // Long unbroken text (a URL) breaks anywhere rather
              // than running out of its column.
              lines === "wrap" && "whitespace-normal [overflow-wrap:anywhere]",
              // max-w-0 keeps long text from setting the column's
              // width, so it fits the room the column is given.
              lines !== undefined && "max-w-0",
              // An editor raised past the column shows over its neighbors.
              "has-[[data-cell-expanded]]:overflow-visible",
              // The whole cell is the editor's: a row grown by a
              // wrapped neighbor leaves room under the field, and a
              // press there edits too (see pressCellEditor).
              editor && (editorType(editor) === "text" ? "cursor-text" : "cursor-pointer"),
              meta?.className
            )}
            onClick={editor ? pressCellEditor : undefined}
            style={pinProps(pins[cell.column.id]).style}
          >
            {pins[cell.column.id] && (
              <PinFills
                pin={pins[cell.column.id]}
                selected={selected}
                runStart={runStart}
                runEnd={runEnd}
                shapeVariant={shapeVariant}
              />
            )}
            {cell.column.id === expanderId && <SubRowGuides row={row} expanded={expanded} alignTop={alignTop} />}
            {swapping && (
              // The hand-over: a skeleton over the cell's content box,
              // shown at once (its delayed reveal and pulse turned
              // off, since this row is new) and fading out as the
              // content fades in under it, so the cell is never empty
              // and the content keeps its real layout the whole time.
              <span
                key="skeleton"
                aria-hidden
                className="pointer-events-none absolute inset-0 animate-[reveal-out_120ms_ease-in_forwards] [&_[data-slot=skeleton]]:animate-none"
                style={{ padding: "inherit" }}
              >
                {skeletonFor(cell.column.id, i, c, shapeVariant, compact)}
              </span>
            )}
            {textCell(cell.column.id) && !editor ? (
              // Text sits in a block that carries the cell's fitting
              // (a block child escapes the cell's own ellipsis), so
              // it can fade in on landing. Clipped sideways only, so
              // a 24px badge still overhangs its 20px line.
              <span
                key="content"
                className={cn(
                  "block",
                  (lines === 1 || (sized && lines === undefined)) &&
                    "overflow-x-clip text-ellipsis whitespace-nowrap",
                  lines === "wrap" && "whitespace-normal [overflow-wrap:anywhere]",
                  // 160ms in, the moderate tier (CSS can't take the
                  // spring token).
                  swapping && "animate-[reveal-preset_160ms_ease-out_both]"
                )}
              >
                {content}
              </span>
            ) : (
              <Fragment key="content">{content}</Fragment>
            )}
          </TableCell>
        );
      })}
    </TableRow>);
  }),
  (a, b) =>
    a.row === b.row &&
    a.i === b.i &&
    a.selected === b.selected &&
    a.someSelected === b.someSelected &&
    a.expanded === b.expanded &&
    a.expanderId === b.expanderId &&
    a.columns === b.columns &&
    a.layoutKey === b.layoutKey &&
    a.onRowClick === b.onRowClick &&
    a.rowsFocusable === b.rowsFocusable &&
    a.editable === b.editable &&
    a.sized === b.sized &&
    a.alignTop === b.alignTop &&
    a.swapping === b.swapping &&
    a.compact === b.compact &&
    a.shapeVariant === b.shapeVariant
) as <TData>(props: DataTableBodyRowProps<TData>) => ReactNode;

// ── Editable cells ───────────────────────────────────────

interface EditContextValue {
  hold: () => void;
  release: () => void;
  commit: (row: Row<unknown>, columnId: string, value: unknown) => void;
}

const EditContext = createContext<EditContextValue | null>(null);

/** Holds the table's row order while the editor has focus, or a popup of
 *  its open (a calendar, a list). React carries focus events up from
 *  portals, so focus moving into the editor's popup reads as staying in.
 *  Leaving is checked a beat later: a closing popup hands focus back to
 *  its trigger after it has left. */
function useEditHold(ctx: EditContextValue, ref: RefObject<HTMLDivElement | null>) {
  "use no memo";
  const active = useRef(false);
  const open = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const enter = () => {
    clearTimeout(timer.current);
    if (active.current) return;
    active.current = true;
    ctx.hold();
  };
  const check = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const inside = !!ref.current?.contains(document.activeElement);
      if (!active.current || open.current || inside) return;
      active.current = false;
      ctx.release();
    }, 60);
  };
  // An editor that goes away mid-edit (its row filtered or paged out)
  // gives its hold back.
  const release = ctx.release;
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (active.current) release();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on unmount
    []
  );
  return {
    onFocus: enter,
    onBlur: check,
    onOpenChange: (next: boolean) => {
      open.current = next;
      if (next) enter();
      else check();
    },
  };
}

const editorType = (e: DataTableEditor) => (typeof e === "string" ? e : e.type);
interface EditorOptions {
  placeholder?: string;
  link?: boolean | ((value: string) => string);
  options?: readonly (number | string | Exclude<DataTableSelectOption, string>)[];
  creatable?: boolean;
}
const editorOptions = (e: DataTableEditor): EditorOptions =>
  typeof e === "string" ? {} : (e as EditorOptions);
const itemText = (item: string | { value: string }) => (typeof item === "string" ? item : item.value);

/** "YYYY-MM-DD" read as that day where the viewer is (not UTC midnight,
 *  which lands on the day before west of Greenwich), or a Date as is. */
function toDate(value: unknown): Date | undefined {
  if (value instanceof Date) return value;
  if (typeof value !== "string" || !value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : undefined;
}

function toIsoDay(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Controls that carry their own field (Combobox, DatePicker) sit in the
// row's full height, reaching into the cell's padding just far enough that
// their text (or first chip) starts where the column's text does. The reach
// is each control's own inset less the cell's (12px, 10px compact).
// A control fills the row's height, so a focus ring drawn outside it would
// be cut by the cell's clip: rings inside the cell draw inset.
const CELL_CONTROL =
  "-my-(--table-cell-py) flex min-w-0 items-center [&>*]:min-w-0 [&>*]:flex-1 [&_:focus-visible]:ring-inset";
// The Combobox editors drop their field's ring and fills, like the text
// field: the cell's own text, with the text cursor.
const BARE_FIELD =
  "ring-transparent hover:ring-transparent hover:bg-transparent focus-within:ring-transparent focus-within:bg-transparent cursor-text";

const CELL_REACH = {
  // Combobox field: 10px in (8px compact).
  number: { default: "-mx-2.5", compact: "-mx-2" },
  // Ghost date trigger: 8px in (6px compact).
  date: { default: "-mx-2", compact: "-mx-1.5" },
  // Chips field: 10px in, the first chip pulled 4px back (8px, 4px compact).
  tags: { default: "-mx-1.5", compact: "-mx-1" },
} as const;

/** Esc in an editor only takes focus out of it: what was typed stays (it
 *  was written as it was typed), and nothing else hears the key (the
 *  selection, the page's own Escape). An editor whose popup is open (a
 *  list, a calendar, a menu) closes it first, and keys that come up from
 *  the popup itself are left to it. */
function blurOnEscape(e: KeyboardEvent<HTMLElement>) {
  if (e.key !== "Escape" || e.defaultPrevented) return;
  const target = e.target as HTMLElement;
  if (!e.currentTarget.contains(target) || target.getAttribute("aria-expanded") === "true") return;
  e.preventDefault();
  e.stopPropagation();
  target.blur();
}

/** An editor taking focus brings its whole cell into the table's visible
 *  box first (sideways, by as little as it takes), so a cell half scrolled
 *  out of view never opens its menu or calendar beside the table, past the
 *  edge of whatever holds it. */
function revealCell(e: FocusEvent<HTMLElement> | PointerEvent<HTMLElement>) {
  const td = (e.target as HTMLElement).closest("td");
  const viewport = td?.closest<HTMLElement>("[data-slot=scroll-area-viewport]");
  if (!td || !viewport) return;
  const r = td.getBoundingClientRect();
  const v = viewport.getBoundingClientRect();
  // Clear of the edge fade too, on a side the table can still scroll to:
  // a cell under the fade reads as out of view.
  const fade = parseFloat(getComputedStyle(viewport).getPropertyValue("--scroll-fade-size")) || 48;
  const max = viewport.scrollWidth - viewport.clientWidth;
  const left = v.left + (viewport.scrollLeft > 0 ? fade : 0);
  const right = v.right - (viewport.scrollLeft < max - 1 ? fade : 0);
  let delta = 0;
  if (r.left < left) delta = r.left - left;
  else if (r.right > right) delta = Math.min(r.right - right, r.left - left);
  if (!delta) return;
  viewport.dataset.revealedAt = String(performance.now());
  viewport.scrollLeft = Math.max(0, Math.min(max, viewport.scrollLeft + delta));
}

/** A click in an editable cell that missed its editor (the room a taller
 *  row leaves under it, or its padding) presses the editor itself: a
 *  field takes focus with the caret at the end, a trigger (or a
 *  combobox's field) gets the press sequence a real click on it would,
 *  so every menu, list and calendar opens however its primitive listens
 *  (pointerdown or click). */
const CELL_EDITOR_TARGETS = [
  "textarea",
  'input:not([type=hidden]):not([tabindex="-1"])',
  "[role=textbox]",
  "[role=combobox]",
  "[aria-haspopup]",
  "button",
];
function pressCellEditor(e: React.MouseEvent<HTMLElement>) {
  const target = e.target as Element;
  if (e.button !== 0 || e.defaultPrevented) return;
  if (target.closest("input, textarea, button, a[href], [role=textbox], [role=combobox], [role=checkbox], [aria-haspopup]"))
    return;
  // A raised field or an open popup already has the cell's attention.
  if (e.currentTarget.querySelector("[data-cell-expanded]")) return;
  // An editor that takes the click on its own box (a link's "beside the
  // text") hears it there.
  if (target.closest("[data-cell-editor]")) return;
  const own = e.currentTarget.querySelector<HTMLElement>("[data-cell-editor]");
  if (own) {
    e.preventDefault();
    own.click();
    return;
  }
  let field: HTMLElement | null = null;
  for (const selector of CELL_EDITOR_TARGETS) {
    field = e.currentTarget.querySelector<HTMLElement>(selector);
    if (field) break;
  }
  if (!field) return;
  e.preventDefault();
  // Checked inline (not through a const) so TypeScript narrows `field`.
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
    field.focus();
    const end = field.value.length;
    field.setSelectionRange?.(end, end);
    // A combobox's field (number, tags) goes on to open its list.
    if (field.getAttribute("role") !== "combobox") return;
  }
  const r = field.getBoundingClientRect();
  const at = { bubbles: true, cancelable: true, composed: true, button: 0, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
  field.dispatchEvent(new globalThis.PointerEvent("pointerdown", { ...at, pointerType: "mouse", isPrimary: true }));
  field.dispatchEvent(new globalThis.MouseEvent("mousedown", at));
  field.focus();
  field.dispatchEvent(new globalThis.PointerEvent("pointerup", { ...at, pointerType: "mouse", isPrimary: true }));
  field.dispatchEvent(new globalThis.MouseEvent("mouseup", at));
  field.dispatchEvent(new globalThis.MouseEvent("click", at));
}

function EditableCell<TData>(props: Parameters<typeof EditorBody<TData>>[0]) {
  return (
    // A box of no layout of its own, there to hear Escape from any editor
    // and to bring the cell into view as one takes focus.
    <div
      className="contents"
      onKeyDown={blurOnEscape}
      onFocus={revealCell}
      // Safari doesn't focus a button on click: the press brings it in too.
      onPointerDownCapture={revealCell}
    >
      <EditorBody {...props} />
    </div>
  );
}

function EditorBody<TData>({
  editor,
  row,
  columnId,
  label,
  lines,
  value,
  display,
}: {
  editor: DataTableEditor;
  row: Row<TData>;
  columnId: string;
  /** The editor's name: its column's (the table gives the row). */
  label: string;
  /** The column's text fitting: 2 lines or "wrap" edit in a textarea. */
  lines: ColumnLines | undefined;
  value: unknown;
  /** A select's trigger: the column's own cell. */
  display?: ReactNode;
}) {
  "use no memo";
  const ctx = useContext(EditContext)!;
  const boxRef = useRef<HTMLDivElement>(null);
  const hold = useEditHold(ctx, boxRef);
  const sizeClasses = useSize();
  const step = sizeClasses.variant === "compact" ? "compact" : "default";
  const commit = (next: unknown) => ctx.commit(row as Row<unknown>, columnId, next);
  const type = editorType(editor);
  const options = editorOptions(editor);
  // The table's visible box, caught as the editor takes focus (before any
  // popup of its opens), so the popup stays inside it rather than reaching
  // past the edge of whatever holds the table.
  const [boundary, setBoundary] = useState<Element | null>(null);
  const onFocus = () => {
    hold.onFocus();
    setBoundary(boxRef.current?.closest("[data-slot=scroll-area]") ?? null);
  };
  const onBlur = hold.onBlur;

  // A link keeps its own field (the text follows the link) at any lines.
  if (type === "text" && !options.link && (lines === 2 || lines === "wrap")) {
    return (
      <div ref={boxRef} onFocus={onFocus} onBlur={onBlur} className="min-w-0">
        <WrappingField
          label={label}
          value={value == null ? "" : String(value)}
          placeholder={options.placeholder}
          maxLines={lines === 2 ? 2 : undefined}
          onChange={commit}
          onKeyDown={(e) => {
            // One paragraph: Enter finishes, as in the one-line field.
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLTextAreaElement).blur();
            }
          }}
        />
      </div>
    );
  }

  if (type === "text" && options.link) {
    const text = value == null ? "" : String(value);
    const link = options.link;
    return (
      <LinkField
        boxRef={boxRef}
        onFocus={onFocus}
        onBlur={onBlur}
        label={label}
        value={text}
        href={typeof link === "function" ? link(text) : /^[a-z][a-z\d+.-]*:/i.test(text) ? text : `https://${text}`}
        placeholder={options.placeholder}
        onChange={commit}
      />
    );
  }

  if (type === "text") {
    return (
      <div ref={boxRef} onFocus={onFocus} onBlur={onBlur} className="relative h-[1lh] min-w-0">
        <PlainTextField
          label={label}
          value={value == null ? "" : String(value)}
          placeholder={options.placeholder}
          onChange={commit}
        />
      </div>
    );
  }

  if (type === "select") {
    return (
      <SelectEditor
        boxRef={boxRef}
        hold={hold}
        onFocus={onFocus}
        onBlur={onBlur}
        value={value == null ? "" : String(value)}
        options={(options.options as readonly DataTableSelectOption[] | undefined) ?? []}
        label={label}
        display={display}
        boundary={boundary}
        onChange={commit}
      />
    );
  }

  if (type === "number") {
    return (
      <NumberEditor
        boundary={boundary}
        reach={CELL_REACH.number[step]}
        boxRef={boxRef}
        onFocus={onFocus}
        onBlur={onBlur}
        value={typeof value === "number" ? value : null}
        options={options.options as readonly number[] | undefined}
        placeholder={options.placeholder}
        label={label}
        onChange={commit}
      />
    );
  }

  if (type === "date") {
    const date = toDate(value);
    return (
      <div ref={boxRef} onFocus={onFocus} onBlur={onBlur} className={cn(CELL_CONTROL, CELL_REACH.date[step])}>
        <DatePicker
          variant="ghost"
          aria-label={label}
          value={date}
          placeholder={options.placeholder}
          onOpenChange={hold.onOpenChange}
          onValueChange={(next) => {
            const day = next instanceof Date ? next : undefined;
            commit(day ? (typeof value === "string" ? toIsoDay(day) : day) : null);
          }}
          className="min-w-0"
        />
      </div>
    );
  }

  return (
    <TagsEditor
      boundary={boundary}
      reach={CELL_REACH.tags[step]}
      boxRef={boxRef}
      onFocus={onFocus}
      onBlur={onBlur}
      value={Array.isArray(value) ? (value as string[]) : []}
      options={(options.options as readonly string[] | undefined) ?? []}
      creatable={!!options.creatable}
      placeholder={options.placeholder}
      label={label}
      onChange={commit}
    />
  );
}

// ── One-line text editors ──

/** The widest a raised cell editor grows; longer text wraps inside it. */
const EXPANDED_MAX = 400;

let measureCtx: CanvasRenderingContext2D | null | undefined;

/** The width of a value on one line, in the field's own font. */
function textWidth(el: HTMLElement, text: string) {
  if (measureCtx === undefined) measureCtx = document.createElement("canvas").getContext("2d");
  if (!measureCtx) return 0;
  const cs = getComputedStyle(el);
  measureCtx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  return measureCtx.measureText(text).width;
}

/** A one-line cell's editor while it has focus: a bare textarea on the
 *  cell's own line while the text fits; once it's wider than the cell, a
 *  raised field over the cells beside and below (a hairline, the card
 *  fill, the shape's corners) as wide as the text up to 400px, past which
 *  the text wraps and the field grows down. Its first line stays exactly
 *  where the cell's text was. Enter finishes. */
function CellTextEditor({
  label,
  value,
  placeholder,
  onChange,
  onDone,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onDone: () => void;
}) {
  const sizeClasses = useSize();
  const shape = useShape();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  // Sized from the text, in the handlers that change it: no extra render.
  const measure = (el: HTMLTextAreaElement) => {
    const room = el.parentElement?.clientWidth ?? 0;
    const text = textWidth(el, el.value || el.placeholder);
    // 8px of padding a side, the 1px hairline, room for the caret.
    if (text <= room) setWidth(null);
    else setWidth(Math.min(EXPANDED_MAX, Math.max(room + 18, Math.ceil(text) + 22)));
  };
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    measure(el);
  }, []);
  // The raised field's height follows its wrapped text.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "";
    if (width !== null) el.style.height = `${el.scrollHeight}px`;
  }, [value, width]);
  const raised = width !== null;
  return (
    <textarea
      ref={ref}
      rows={1}
      aria-label={label}
      value={value}
      placeholder={placeholder}
      data-cell-expanded={raised || undefined}
      onChange={(e) => {
        measure(e.currentTarget);
        onChange(e.target.value);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onDone();
        }
      }}
      onBlur={onDone}
      style={raised ? { width } : undefined}
      className={cn(
        "block min-w-0 resize-none overflow-hidden text-foreground outline-none placeholder:text-muted-foreground",
        raised
          ? [
              // Out 9px (8px padding, the hairline) and up to the row's top,
              // its padding putting the first line where the cell's was.
              "absolute -left-[9px] -top-(--table-cell-py) z-30 border border-border bg-card",
              "min-h-[calc(1lh+2*var(--table-cell-py))] px-2 py-[calc(var(--table-cell-py)-1px)]",
              "whitespace-pre-wrap [overflow-wrap:anywhere]",
              shape.input,
            ]
          : "h-[1lh] w-full whitespace-nowrap bg-transparent p-0",
        // The touch size keeps iOS from zooming into the field.
        sizeClasses.field
      )}
    />
  );
}

/** The one-line text editor: at rest the cell's own text, cut short with
 *  an ellipsis (a focusable span, so it never scrolls sideways); a click
 *  anywhere in the cell, or focus, swaps in the editor. */
function PlainTextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  return editing ? (
    <CellTextEditor
      label={label}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      onDone={() => setEditing(false)}
    />
  ) : (
    <span
      role="textbox"
      tabIndex={0}
      aria-label={label}
      aria-readonly={false}
      onFocus={() => setEditing(true)}
      // One line, cut short; an invisible layer over the row's full height
      // (its box is the editor's, not this clipped line) takes clicks
      // anywhere in the cell.
      className={cn(
        "block h-[1lh] cursor-text truncate outline-none",
        "before:absolute before:inset-x-0 before:-inset-y-(--table-cell-py) before:content-['']",
        !value && "text-muted-foreground"
      )}
    >
      {value || placeholder}
    </span>
  );
}

/** A text field that reads as a link at rest: a click on the text follows
 *  it, a click beside it (anywhere else in the cell, the right padding
 *  included) swaps in the editor with the caret at the end. F2 on the
 *  focused link edits too. Leaving the editor shows the link again. */
function LinkField({
  boxRef,
  onFocus,
  onBlur,
  label,
  value,
  href,
  placeholder,
  onChange,
}: {
  boxRef: RefObject<HTMLDivElement | null>;
  onFocus: () => void;
  onBlur: () => void;
  label: string;
  value: string;
  href: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const sizeClasses = useSize();
  const [editing, setEditing] = useState(false);
  return (
    <div
      ref={boxRef}
      onFocus={onFocus}
      onBlur={onBlur}
      data-cell-editor=""
      onClick={(e) => {
        if (!editing && !(e.target as Element).closest("a")) setEditing(true);
      }}
      // The row's full height and the cell's right padding, so a click
      // anywhere beside the text edits, even when a long address fills
      // the column.
      className={cn(
        "relative -my-(--table-cell-py) flex h-[calc(1lh+2*var(--table-cell-py))] min-w-0 cursor-text items-center",
        sizeClasses.variant === "compact" ? "-mr-2.5 pr-2.5" : "-mr-3 pr-3"
      )}
    >
      {editing ? (
        <div className="relative h-[1lh] min-w-0 flex-1">
          <CellTextEditor
            label={label}
            value={value}
            placeholder={placeholder}
            onChange={onChange}
            onDone={() => setEditing(false)}
          />
        </div>
      ) : (
        <a
          href={href}
          onKeyDown={(e) => {
            if (e.key === "F2") {
              e.preventDefault();
              setEditing(true);
            }
          }}
          aria-keyshortcuts="F2"
          className={cn(
            "min-w-0 cursor-pointer truncate underline decoration-foreground/30 underline-offset-2",
            "transition-colors duration-80 hover:decoration-foreground"
          )}
        >
          {value || placeholder}
        </a>
      )}
    </div>
  );
}

/** The text editor for a column that wraps: a bare textarea that grows
 *  with its text (to two lines for `lines: 2`, where the rest scrolls), so
 *  the cell keeps the shape it has at rest. Sized by hand: field-sizing
 *  isn't everywhere yet. */
function WrappingField({
  label,
  value,
  placeholder,
  maxLines,
  onChange,
  onKeyDown,
}: {
  label: string;
  value: string;
  placeholder?: string;
  maxLines?: number;
  onChange: (value: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  const sizeClasses = useSize();
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      aria-label={label}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      className={cn(
        // The row's padding moves inside, so the whole cell takes the click.
        "-my-(--table-cell-py) block w-full min-w-0 resize-none bg-transparent px-0 py-(--table-cell-py)",
        "cursor-text text-foreground outline-none placeholder:text-muted-foreground",
        "whitespace-normal [overflow-wrap:anywhere]",
        maxLines === 2 ? "max-h-[calc(2lh+2*var(--table-cell-py))] overflow-y-auto [scrollbar-width:none]" : "overflow-hidden",
        // The touch size keeps iOS from zooming into the field.
        sizeClasses.field
      )}
    />
  );
}

/** One of a list, from a menu: the trigger is the column's own cell (so a
 *  badge stays a badge, with the text cursor's place taken by the pointer),
 *  the menu checks the current option. The open menu holds the row order. */
function SelectEditor({
  boxRef,
  hold,
  onFocus,
  onBlur,
  value,
  options,
  label,
  display,
  boundary,
  onChange,
}: {
  boundary: Element | null;
  boxRef: RefObject<HTMLDivElement | null>;
  hold: ReturnType<typeof useEditHold>;
  onFocus: () => void;
  onBlur: () => void;
  value: string;
  options: readonly DataTableSelectOption[];
  label: string;
  display: ReactNode;
  onChange: (value: string) => void;
}) {
  "use no memo";
  const items = options.map((o) => (typeof o === "string" ? { value: o, label: o } : { label: o.value, ...o }));
  const checked = items.findIndex((o) => o.value === value);
  return (
    <div ref={boxRef} onFocus={onFocus} onBlur={onBlur} className={CELL_CONTROL}>
      <DropdownMenu onOpenChange={hold.onOpenChange}>
        <DropdownTrigger
          render={
            <button
              type="button"
              aria-label={`${label}: ${value}`}
              // The row's full height, so a click anywhere in the cell opens it.
              className="flex h-[calc(1lh+2*var(--table-cell-py))] w-full min-w-0 cursor-pointer items-center text-left outline-none"
            >
              {display ?? value}
            </button>
          }
        />
        <DropdownContent
          align="start"
          checkedIndex={checked === -1 ? undefined : checked}
          collisionBoundary={boundary}
          collisionPadding={4}
          className="w-56"
        >
          {items.map((option, i) => (
            <MenuItem
              key={option.value}
              index={i}
              label={option.label}
              // A badge's dot, in the Badge's own colors (gray reads as the
              // muted foreground there too), so the menu matches the cell.
              leading={
                "color" in option && option.color ? (
                  <span
                    aria-hidden
                    className="size-[7px] shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        option.color === "gray" ? "var(--muted-foreground)" : badgeColors[option.color],
                    }}
                  />
                ) : undefined
              }
              checked={option.value === value}
              onSelect={() => onChange(option.value)}
            />
          ))}
        </DropdownContent>
      </DropdownMenu>
    </div>
  );
}

function NumberEditor({
  boundary,
  reach,
  boxRef,
  onFocus,
  onBlur,
  value,
  options = [],
  placeholder,
  label,
  onChange,
}: {
  boundary: Element | null;
  reach: string;
  boxRef: RefObject<HTMLDivElement | null>;
  onFocus: () => void;
  onBlur: () => void;
  value: number | null;
  options?: readonly number[];
  placeholder?: string;
  label: string;
  onChange: (value: number | null) => void;
}) {
  "use no memo";
  // The list: the column's options, plus the cell's own value when it's
  // one of none of them, so the field can show it.
  const items = [...new Set([...options, ...(value === null ? [] : [value])])]
    .sort((a, b) => a - b)
    .map(String);
  return (
    <div
      ref={boxRef}
      onFocus={onFocus}
      onBlur={onBlur}
      className={cn(
        CELL_CONTROL,
        reach,
        // The text field takes the column's width rather than setting it.
        "[&_input]:w-0",
        // No chevron: the list opens as you type or press ↓.
        "[&_[aria-label=Open]]:hidden"
      )}
    >
      <Combobox
        items={items}
        value={value === null ? "" : String(value)}
        onValueChange={(v) => {
          const s = Array.isArray(v) ? v[0] : v;
          onChange(s === "" || s === undefined ? null : Number(s));
        }}
        // Any number typed is taken, not just the listed ones.
        onCreate={(query) => {
          const n = Number(query.replace(",", "."));
          return Number.isFinite(n) ? String(n) : undefined;
        }}
        createLabel={(query) => `Use ${query}`}
        // The whole list while the field still shows its own value (on
        // opening); numbers that start with what's typed after that.
        filter={(item, query) => {
          const q = query.trim();
          return q === "" || (value !== null && q === String(value)) || itemText(item).startsWith(q);
        }}
      >
        <ComboboxInput
          variant="borderless"
          aria-label={label}
          inputMode="decimal"
          // Typing replaces the number rather than adding to it.
          onFocus={(e) => e.currentTarget.select()}
          placeholder={placeholder ?? ""}
          className={cn("w-full min-w-0 tabular-nums", BARE_FIELD)}
        />
        <ComboboxContent collisionBoundary={boundary} collisionPadding={4}>
          <ComboboxEmpty>Type a number</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={itemText(item)} value={itemText(item)}>
                {itemText(item)}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

function TagsEditor({
  boundary,
  reach,
  boxRef,
  onFocus,
  onBlur,
  value,
  options,
  creatable,
  placeholder,
  label,
  onChange,
}: {
  boundary: Element | null;
  reach: string;
  boxRef: RefObject<HTMLDivElement | null>;
  onFocus: () => void;
  onBlur: () => void;
  value: string[];
  options: readonly string[];
  creatable: boolean;
  placeholder?: string;
  label: string;
  onChange: (value: string[]) => void;
}) {
  "use no memo";
  // Tags made here join the list for this table's life.
  const [made, setMade] = useState<string[]>([]);
  const items = [...new Set([...options, ...made, ...value])];
  return (
    <div
      ref={boxRef}
      onFocus={onFocus}
      onBlur={onBlur}
      className={cn(
        CELL_CONTROL,
        reach,
        // One line of chips, as tall as the row: the chip row scrolls
        // sideways instead of wrapping (the field follows its caret).
        "[&_.flex-wrap]:flex-nowrap [&_.flex-wrap]:overflow-x-auto [&_.flex-wrap]:[scrollbar-width:none]",
        "[&_[aria-label=Open]]:hidden"
      )}
    >
      <Combobox
        multiple
        items={items}
        value={value}
        onValueChange={(v) => onChange(Array.isArray(v) ? v : v ? [v] : [])}
        onCreate={
          creatable
            ? (query) => {
                setMade((old) => [...old, query]);
                return query;
              }
            : undefined
        }
      >
        <ComboboxChips
          variant="borderless"
          aria-label={label}
          placeholder={placeholder ?? ""}
          className={cn("w-full min-w-0", BARE_FIELD)}
        />
        <ComboboxContent collisionBoundary={boundary} collisionPadding={4}>
          <ComboboxEmpty>No tags match</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={itemText(item)} value={itemText(item)}>
                {itemText(item)}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

// ── DataTableSearch ──────────────────────────────────────

interface DataTableSearchProps<TData> {
  table: TanStackTable<TData>;
  /** The column id to search. Omitted, the field searches every column. */
  column?: string;
  placeholder?: string;
  /** Starts as a ghost search button that opens into the field, and
   *  closes back once the field is empty and loses focus. `false` keeps
   *  the field open. @default true */
  collapsible?: boolean;
  /** The open field's width, in px. @default 224 */
  width?: number;
  size?: SizeVariant;
  className?: string;
}

/** A search that narrows the rows as you type, by one column or all. It
 *  rests as a ghost icon button; a click opens it into the field (its width
 *  springs open from the button's), and an empty field closes on blur or
 *  Esc. The magnifying glass stays put through both. */
function DataTableSearch<TData>({
  table,
  column,
  placeholder = "Search…",
  collapsible = true,
  width = 224,
  size,
  className,
}: DataTableSearchProps<TData>) {
  "use no memo";
  const icons = useIcons();
  const SearchIcon = icons.search;
  const sizeClasses = useSize(size);
  const compact = sizeClasses.variant === "compact";
  const target = column ? table.getColumn(column) : undefined;
  const value = String((target ? target.getFilterValue() : table.getState().globalFilter) ?? "");
  const label = placeholder.replace(/…$/, "");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const reduceMotion = useReducedMotion();
  // A search with text stays open, whatever opened it.
  const expanded = !collapsible || open || value !== "";
  // Opened from the button: the field takes focus once it's live.
  const focusOnOpen = useRef(false);
  useEffect(() => {
    if (!expanded || !focusOnOpen.current) return;
    focusOnOpen.current = false;
    inputRef.current?.focus();
  }, [expanded]);
  // The button's square: the icon sits at its center, open or closed.
  const box = compact ? 28 : 36;

  const setValue = (next: string) => {
    if (target) target.setFilterValue(next);
    else table.setGlobalFilter(next);
    // A search that shrinks the rows starts over on the first page.
    table.setPageIndex(0);
  };

  return (
    <motion.span
      data-slot="data-table-search"
      className={cn("relative block min-w-0 shrink", className)}
      initial={false}
      animate={{ width: expanded ? width : box }}
      transition={reduceMotion ? { duration: 0 } : spring.moderate}
      style={{ maxWidth: "100%" }}
    >
      <SearchIcon
        size={sizeClasses.icon}
        strokeWidth={1.5}
        aria-hidden
        // Centered in the button's square (16px in 36, 14px in 28).
        className={cn(
          "pointer-events-none absolute top-1/2 z-[1] -translate-y-1/2 text-muted-foreground",
          compact ? "left-[7px]" : "left-2.5"
        )}
      />
      {!expanded && (
        <Tooltip content={label}>
          <Button
            variant="ghost"
            size={compact ? "icon-compact" : "icon"}
            aria-label={label}
            aria-expanded={false}
            className="absolute inset-0"
            onClick={() => {
              focusOnOpen.current = true;
              setOpen(true);
            }}
          />
        </Tooltip>
      )}
      <Input
        ref={inputRef}
        type="search"
        size={size}
        placeholder={placeholder}
        aria-label={label}
        tabIndex={expanded ? undefined : -1}
        aria-hidden={expanded ? undefined : true}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          if (collapsible && value === "") setOpen(false);
        }}
        onKeyDown={(e) => {
          // Esc clears the search and closes it.
          if (e.key === "Escape" && collapsible) {
            e.preventDefault();
            setValue("");
            setOpen(false);
            e.currentTarget.blur();
            return;
          }
          // ↓ steps from the search into the rows.
          if (e.key !== "ArrowDown" || e.altKey || e.metaKey || e.ctrlKey) return;
          if ((table as Partial<DataTableExtras>).focusFirstRow?.()) e.preventDefault();
        }}
        // The text starts after the icon and an 8px gap (6px compact).
        // Ghost, like the toolbar's buttons: no hairline at rest, the hover
        // fill on hover, and the fill held while focused so the field still
        // shows where typing goes. Closed, it's out of sight under the
        // button.
        className={cn(
          compact ? "pl-[28px]" : "pl-9",
          "border-transparent focus:border-transparent aria-invalid:focus:border-transparent focus:bg-hover focus:hover:bg-hover",
          !expanded && "pointer-events-none opacity-0"
        )}
      />
    </motion.span>
  );
}

// ── useUndoableRows ──────────────────────────────────────

interface UndoStep<T> {
  /** What the step did, for an Undo toast: "Deleted 3 rows". */
  label: string;
  before: T[];
  after: T[];
  /** Edits to one cell, typed in a burst, merge into one step. */
  mergeKey?: string;
  at: number;
}

interface UseUndoableRowsOptions<T> {
  /** A row's id, as getRowId gives it to the table. */
  getId: (row: T) => string;
  /** Steps kept to undo. @default 100 */
  limit?: number;
}

// A cell's keystrokes within this long of each other undo as one step.
const MERGE_MS = 1000;

/** Rows you can change and take back: every change through it is a step
 *  that undo reverses and redo plays again. A cell typed in a burst is one
 *  step, so ⌘Z takes back the word, not the last letter. Pass `rows` to
 *  useDataTable and `undo` / `redo` to DataTable's onUndo / onRedo. */
function useUndoableRows<T>(initial: T[] | (() => T[]), { getId, limit = 100 }: UseUndoableRowsOptions<T>) {
  const [state, setState] = useState(() => ({
    rows: typeof initial === "function" ? initial() : initial,
    past: [] as UndoStep<T>[],
    future: [] as UndoStep<T>[],
  }));

  const apply = useCallback(
    (label: string, change: (rows: T[]) => T[], mergeKey?: string) =>
      setState((s) => {
        const after = change(s.rows);
        if (after === s.rows) return s;
        const now = Date.now();
        const last = s.past[s.past.length - 1];
        if (mergeKey && last?.mergeKey === mergeKey && now - last.at < MERGE_MS)
          return { rows: after, past: [...s.past.slice(0, -1), { ...last, after, at: now }], future: [] };
        const step = { label, before: s.rows, after, mergeKey, at: now };
        return { rows: after, past: [...s.past, step].slice(-limit), future: [] };
      }),
    [limit]
  );

  const edit = useCallback(
    (id: string, change: Partial<T>, label = "Edited a row") =>
      apply(
        label,
        (rows) => rows.map((r) => (getId(r) === id ? { ...r, ...change } : r)),
        // One cell's burst merges: the same row and the same fields.
        `${id}:${Object.keys(change).sort().join(",")}`
      ),
    [apply, getId]
  );

  const remove = useCallback(
    (ids: readonly string[], label = `Deleted ${ids.length} ${ids.length === 1 ? "row" : "rows"}`) =>
      apply(label, (rows) => {
        const next = rows.filter((r) => !ids.includes(getId(r)));
        return next.length === rows.length ? rows : next;
      }),
    [apply, getId]
  );

  const insert = useCallback(
    (items: readonly T[], index?: number, label = `Added ${items.length} ${items.length === 1 ? "row" : "rows"}`) =>
      apply(label, (rows) => {
        const at = index === undefined ? rows.length : index;
        return [...rows.slice(0, at), ...items, ...rows.slice(at)];
      }),
    [apply]
  );

  const undo = useCallback(
    () =>
      setState((s) => {
        const step = s.past[s.past.length - 1];
        if (!step) return s;
        return { rows: step.before, past: s.past.slice(0, -1), future: [step, ...s.future] };
      }),
    []
  );

  const redo = useCallback(
    () =>
      setState((s) => {
        const step = s.future[0];
        if (!step) return s;
        return { rows: step.after, past: [...s.past, step], future: s.future.slice(1) };
      }),
    []
  );

  return {
    rows: state.rows,
    /** Any change, as one step: `change` gets the rows and returns new ones. */
    apply,
    edit,
    remove,
    insert,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    /** The step undo would take back, for a toast's text. */
    lastStep: state.past[state.past.length - 1]?.label,
  };
}

// ── DataTableTitle ───────────────────────────────────────

interface DataTableTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** The heading level. @default "h2" */
  as?: "h1" | "h2" | "h3";
  size?: SizeVariant;
}

/** The table's heading, above its toolbar: the title role of the type
 *  scale, semibold, as Dialog's title. Optional; give the table a name
 *  when the page doesn't already. */
function DataTableTitle({ as: Tag = "h2", size, className, style, ...props }: DataTableTitleProps) {
  const compact = useSize(size).variant === "compact";
  return (
    <Tag
      data-slot="data-table-title"
      className={cn(typeClass("title", compact ? "compact" : "default"), "text-foreground", className)}
      style={{ fontVariationSettings: fontWeights.semibold, ...style }}
      {...props}
    />
  );
}

// ── DataTableFilters ─────────────────────────────────────

/** A day as "YYYY-MM-DD", from a Date (its local day) or a string that
 *  starts with one. */
function dayOf(value: unknown): string | undefined {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : toIsoDay(value);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  return undefined;
}

/** The filterFn every column gets by default: it reads the shapes
 *  DataTableFilters sets (and a plain string, "contains"). An empty filter
 *  keeps every row, so a chip being filled in hides nothing yet. */
function dataTableFilterFn<TData>(row: Row<TData>, columnId: string, filter: DataTableFilterValue) {
  const value = row.getValue(columnId);
  if (filter == null) return true;
  if (typeof filter === "string" || filter.kind === "text") {
    const query = (typeof filter === "string" ? filter : filter.query).trim().toLowerCase();
    if (!query) return true;
    const text = Array.isArray(value) ? value.join(" ") : String(value ?? "");
    return text.toLowerCase().includes(query);
  }
  if (filter.kind === "options") {
    if (filter.values.length === 0) return true;
    const have = Array.isArray(value) ? value.map(String) : [String(value ?? "")];
    return have.some((v) => filter.values.includes(v));
  }
  if (filter.kind === "number") {
    if (filter.min === undefined && filter.max === undefined) return true;
    if (value === null || value === undefined || value === "") return false;
    const n = Number(value);
    if (Number.isNaN(n)) return false;
    return (filter.min === undefined || n >= filter.min) && (filter.max === undefined || n <= filter.max);
  }
  if (!filter.from && !filter.to) return true;
  const day = dayOf(value);
  if (!day) return false;
  return (!filter.from || day >= filter.from) && (!filter.to || day <= filter.to);
}

type ResolvedFilter =
  | { type: "text" | "number" | "date" }
  | { type: "options"; options: { value: string; label: string; color?: BadgeColor }[] };

const optionOf = (o: DataTableSelectOption) =>
  typeof o === "string" ? { value: o, label: o } : { value: o.value, label: o.label ?? o.value, color: o.color };

/** How a column filters: its `meta.filter`, else its editor, else what its
 *  values look like. */
function filterOf<TData>(table: TanStackTable<TData>, column: Column<TData, unknown>): ResolvedFilter | null {
  const meta = column.columnDef.meta;
  if (meta?.filter === false) return null;
  if (meta?.filter) {
    return typeof meta.filter === "string"
      ? { type: meta.filter }
      : { type: "options", options: meta.filter.options.map(optionOf) };
  }
  const editor = meta?.editor;
  if (editor) {
    const type = editorType(editor);
    if (type === "select" && typeof editor === "object" && "options" in editor && editor.options)
      return { type: "options", options: (editor.options as readonly DataTableSelectOption[]).map(optionOf) };
    if (type === "tags" && typeof editor === "object" && "options" in editor && editor.options?.length)
      return { type: "options", options: (editor.options as readonly string[]).map(optionOf) };
    if (type === "number" || type === "date") return { type };
    if (type === "text") return { type: "text" };
  }
  // Read from the data through the accessor, not a row model: building a
  // row model here, in a part that renders before DataTable, arms
  // TanStack's page reset during hydration and fires it on a table that
  // hasn't mounted yet.
  const accessor = column.accessorFn;
  if (!accessor) return { type: "text" };
  const values = table.options.data
    .slice(0, 500)
    .map((original, i) => accessor(original, i))
    .filter((v) => v !== null && v !== undefined && v !== "");
  if (values.length === 0) return { type: "text" };
  if (values.every((v) => typeof v === "number")) return { type: "number" };
  if (values.every((v) => dayOf(v) !== undefined)) return { type: "date" };
  const flat = values.flatMap((v) => (Array.isArray(v) ? v : [v]));
  if (flat.every((v) => typeof v === "string")) {
    const distinct = [...new Set(flat as string[])];
    // A few values, each repeated: a set to pick from rather than text.
    if (distinct.length <= 12 && distinct.length < flat.length)
      return { type: "options", options: distinct.sort().map((v) => ({ value: v, label: v })) };
  }
  return { type: "text" };
}

const emptyFilter = (type: ResolvedFilter["type"]): DataTableFilterValue =>
  type === "options"
    ? { kind: "options", values: [] }
    : type === "number"
      ? { kind: "number" }
      : type === "date"
        ? { kind: "date" }
        : { kind: "text", query: "" };

interface DataTableFiltersProps<TData> {
  table: TanStackTable<TData>;
  size?: SizeVariant;
  className?: string;
}

/** A Filter button that adds a filter on a column, and one chip per
 *  filter: the column, what it matches, the value, and × to remove it. Each
 *  column filters by its kind (see `meta.filter`): text it contains,
 *  options to pick, a number range, or a range of days. */
function DataTableFilters<TData>({ table, size, className }: DataTableFiltersProps<TData>) {
  "use no memo";
  const icons = useIcons();
  const Plus = icons.plus;
  const sizeClasses = useSize(size);
  const compact = sizeClasses.variant === "compact";
  // The chip just added opens its editor.
  const [added, setAdded] = useState<string | null>(null);

  const active = table
    .getState()
    .columnFilters.filter((f) => typeof f.value === "object" && f.value !== null && "kind" in f.value);
  const filterable = table
    .getAllLeafColumns()
    .filter((c) => c.accessorFn !== undefined && c.getCanFilter())
    .map((column) => ({ column, filter: filterOf(table, column) }))
    .filter((c): c is { column: Column<TData, unknown>; filter: ResolvedFilter } => c.filter !== null);
  const available = filterable.filter(({ column }) => !active.some((f) => f.id === column.id));

  const set = (column: Column<TData, unknown>, value: DataTableFilterValue | undefined) => {
    column.setFilterValue(value);
    table.setPageIndex(0);
  };

  // A header's menu adds a filter here: its chip opens (one already set
  // just opens again).
  const openRef = useRef<(id: string) => void>(() => {});
  useLayoutEffect(() => {
    openRef.current = (id) => {
      const entry = filterable.find(({ column }) => column.id === id);
      if (!entry) return;
      setAdded(id);
      if (!active.some((f) => f.id === id)) set(entry.column, emptyFilter(entry.filter.type));
    };
  });
  const register = (table as Partial<DataTableExtras>)._registerFilters;
  useEffect(() => {
    register?.((id) => openRef.current(id));
    return () => register?.(null);
  }, [register]);

  return (
    // display: contents, so the chips and the button join the toolbar's
    // own row and wrap with it (give the toolbar flex-wrap).
    <div data-slot="data-table-filters" className={cn("contents", className)}>
      {active.map((f) => {
        const entry = filterable.find(({ column }) => column.id === f.id);
        if (!entry) return null;
        return (
          <FilterChip
            key={f.id}
            label={columnLabel(entry.column)}
            filter={entry.filter}
            value={f.value as Exclude<DataTableFilterValue, string>}
            autoOpen={added === f.id}
            compact={compact}
            size={size}
            onChange={(value) => set(entry.column, value)}
            onRemove={() => set(entry.column, undefined)}
          />
        );
      })}
      {available.length > 0 && (
        <DropdownMenu size={size}>
          <DropdownTrigger
            render={
              <Button variant="ghost" size={compact ? "compact" : "default"} leadingIcon={Plus}>
                Filter
              </Button>
            }
          />
          <DropdownContent className="w-48">
            {available.map(({ column, filter }, i) => (
              <MenuItem
                key={column.id}
                index={i}
                icon={column.columnDef.meta?.icon}
                label={columnLabel(column)}
                onSelect={() => {
                  setAdded(column.id);
                  set(column, emptyFilter(filter.type));
                }}
              />
            ))}
          </DropdownContent>
        </DropdownMenu>
      )}
    </div>
  );
}

interface FilterChipProps {
  label: string;
  filter: ResolvedFilter;
  value: Exclude<DataTableFilterValue, string>;
  autoOpen: boolean;
  compact: boolean;
  size?: SizeVariant;
  onChange: (value: DataTableFilterValue) => void;
  onRemove: () => void;
}

// A chip's field: the chip's own text on no fill, so the chip reads as one
// phrase ("Name contains ada").
const CHIP_FIELD =
  "min-w-0 bg-transparent text-foreground outline-none placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none";

/** One filter: "Status is Active, Invited ×". */
function FilterChip({ label, filter, value, autoOpen, compact, size, onChange, onRemove }: FilterChipProps) {
  const icons = useIcons();
  const X = icons.x;
  const shape = useShape();
  const sizeClasses = useSize(size);
  const [open, setOpen] = useState(autoOpen);
  // The DatePicker field's recipe: a hairline box, its parts 2px inside
  // with corners nested in its radius (8 - 3 = 5px, 20 - 3 = 17px), and one
  // fluid hover gliding between the filter and its ×.
  const boxRef = useRef<HTMLSpanElement>(null);
  const hover = useFluidHover(boxRef, { axis: "x", gapClick: false });
  const { registerItem } = hover;
  const mainRef = useCallback((el: HTMLElement | null) => registerItem(0, el), [registerItem]);
  const clearRef = useCallback((el: HTMLElement | null) => registerItem(1, el), [registerItem]);
  const innerRadius = { rounded: "rounded-[5px]", pill: "rounded-[17px]", sharp: "rounded-none" }[shape.variant];
  const segment = cn(
    "relative z-[1] inline-flex h-full min-w-0 items-center gap-1 outline-none",
    compact ? "px-1.5" : "px-2",
    "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
    innerRadius
  );

  let op: string;
  let control: ReactNode;
  if (value.kind === "text") {
    op = "contains";
    control = (
      <input
        aria-label={`${label} contains`}
        autoFocus={autoOpen}
        value={value.query}
        placeholder="text"
        onChange={(e) => onChange({ kind: "text", query: e.target.value })}
        className={cn(CHIP_FIELD, sizeClasses.field, "w-24")}
      />
    );
  } else if (value.kind === "number") {
    op = "from";
    const num = (raw: string) => (raw === "" || Number.isNaN(Number(raw)) ? undefined : Number(raw));
    control = (
      <span className="flex items-center gap-1">
        <input
          type="number"
          inputMode="decimal"
          aria-label={`${label} from`}
          autoFocus={autoOpen}
          value={value.min ?? ""}
          placeholder="min"
          onChange={(e) => onChange({ ...value, min: num(e.target.value) })}
          className={cn(CHIP_FIELD, sizeClasses.field, "w-12")}
        />
        <span className="text-muted-foreground">to</span>
        <input
          type="number"
          inputMode="decimal"
          aria-label={`${label} to`}
          value={value.max ?? ""}
          placeholder="max"
          onChange={(e) => onChange({ ...value, max: num(e.target.value) })}
          className={cn(CHIP_FIELD, sizeClasses.field, "w-12")}
        />
      </span>
    );
  } else if (value.kind === "date") {
    op = "between";
    const range =
      value.from || value.to
        ? { from: value.from ? toDate(value.from) : undefined, to: value.to ? toDate(value.to) : undefined }
        : undefined;
    control = (
      <DatePicker
        mode="range"
        variant="ghost"
        size={size}
        aria-label={`${label} between`}
        value={range}
        placeholder="any day"
        onValueChange={(next) =>
          onChange({
            kind: "date",
            from: next?.from ? toIsoDay(next.from) : undefined,
            to: next?.to ? toIsoDay(next.to) : undefined,
          })
        }
        className="-my-1 min-w-0"
      />
    );
  } else {
    op = value.values.length > 1 ? "is any of" : "is";
    const options = filter.type === "options" ? filter.options : [];
    const picked = options.filter((o) => value.values.includes(o.value));
    const toggle = (v: string) =>
      onChange({
        kind: "options",
        values: value.values.includes(v) ? value.values.filter((x) => x !== v) : [...value.values, v],
      });
    control = (
      <DropdownMenu size={size} open={open} onOpenChange={setOpen}>
        <DropdownTrigger
          render={
            <button
              ref={mainRef}
              type="button"
              aria-label={`${label} ${op} ${picked.length ? picked.map((o) => o.label).join(", ") : "any"}`}
              className={cn(segment, "max-w-72 cursor-pointer")}
            >
              <Phrase label={label} op={op} />
              <span className={cn("truncate", picked.length ? "text-foreground" : "text-muted-foreground")}>
                {picked.length ? picked.map((o) => o.label).join(", ") : "any"}
              </span>
            </button>
          }
        />
        <DropdownContent
          className="w-48"
          checkedIndices={options.flatMap((o, i) => (value.values.includes(o.value) ? [i] : []))}
        >
          {options.map((o, i) => (
            <MenuItem
              key={o.value}
              index={i}
              label={o.label}
              checked={value.values.includes(o.value)}
              onSelect={() => toggle(o.value)}
            />
          ))}
        </DropdownContent>
      </DropdownMenu>
    );
  }

  return (
    <span
      ref={boxRef}
      data-slot="data-table-filter"
      className={cn(
        "relative inline-flex max-w-full items-center border border-border p-0.5 text-muted-foreground transition-colors duration-80",
        "focus-within:border-foreground/25",
        sizeClasses.control,
        sizeClasses.text,
        shape.input
      )}
      {...hover.handlers}
    >
      <FluidHoverHighlight hover={hover} className={cn("z-0", innerRadius)} />
      {value.kind === "options" ? (
        control
      ) : value.kind === "date" ? (
        // The DatePicker brings its own hover over its dates.
        <span className={cn(segment, "pr-0")}>
          <Phrase label={label} op={op} />
          {control}
        </span>
      ) : (
        // The phrase is the fields' label: a click anywhere in it types.
        <label ref={mainRef} className={cn(segment, "cursor-text")}>
          <Phrase label={label} op={op} />
          {control}
        </label>
      )}
      <button
        ref={clearRef}
        type="button"
        aria-label={`Remove the ${label} filter`}
        onClick={onRemove}
        className={cn(
          "relative z-[1] inline-flex h-full shrink-0 cursor-pointer items-center justify-center text-muted-foreground outline-none hover:text-foreground",
          "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
          compact ? "w-6" : "w-7",
          innerRadius
        )}
      >
        <X size={sizeClasses.icon} strokeWidth={1.5} />
      </button>
    </span>
  );
}

/** "Status is": the column in the foreground, what it matches muted. */
function Phrase({ label, op }: { label: string; op: string }) {
  return (
    <span className="shrink-0 whitespace-nowrap">
      <span className="text-foreground">{label}</span> {op}
    </span>
  );
}

// ── DataTableViewOptions ─────────────────────────────────

interface DataTableViewOptionsProps<TData> {
  table: TanStackTable<TData>;
  /** The icon button's accessible name, tooltip, and menu title.
   *  @default "Columns" */
  label?: string;
  size?: SizeVariant;
  className?: string;
}

/** A column's name in menus and filters: `meta.label`, a string header,
 *  or its id made readable ("lastActive" reads "Last active"). */
function columnLabel<TData>(column: Column<TData, unknown>) {
  const header = column.columnDef.header;
  if (column.columnDef.meta?.label) return column.columnDef.meta.label;
  if (typeof header === "string") return header;
  const words = column.id.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Every leaf column's id in display order: the saved columnOrder, then
 *  any columns it doesn't name, in definition order (TanStack's rule). */
function columnOrderOf<TData>(table: TanStackTable<TData>) {
  const all = table.getAllLeafColumns().map((c) => c.id);
  const saved = table.getState().columnOrder.filter((id) => all.includes(id));
  return [...saved, ...all.filter((id) => !saved.includes(id))];
}

/** Puts the given columns in this order, leaving every other column (the
 *  selection and action columns, any not listed) in its slot. */
function reorderColumns<TData>(table: TanStackTable<TData>, ids: string[]) {
  const order = columnOrderOf(table);
  const listed = new Set(ids);
  let next = 0;
  const reordered = order.map((c) => (listed.has(c) ? ids[next++] : c));
  if (reordered.join() === order.join()) return;
  (table as Partial<DataTableExtras>).captureLayout?.();
  table.setColumnOrder(reordered);
}

interface ColumnMenuRowProps<TData> {
  column: Column<TData, unknown>;
  index: number;
  onToggle: () => void;
  onMove: (delta: -1 | 1) => void;
  onDragEnd: () => void;
  /** The list a dragged row can't leave. */
  bounds: RefObject<HTMLDivElement | null>;
}

/** One row of the Columns menu: a grip to drag it by, the column's icon and
 *  name, and the check that shows or hides it. Rows spring between places
 *  on spring.fast while one is dragged. */
function ColumnMenuRow<TData>({
  column,
  index,
  onToggle,
  onMove,
  onDragEnd,
  bounds,
}: ColumnMenuRowProps<TData>) {
  const icons = useIcons();
  const Grip = icons["grip-vertical"];
  const controls = useDragControls();
  const y = useMotionValue(0);
  return (
    <Reorder.Item
      as="div"
      value={column.id}
      dragListener={false}
      dragControls={controls}
      style={{ y }}
      onDragEnd={() => {
        // Released, motion would settle the row with its own drag inertia (a
        // 750ms glide on a soft bounce), ignoring `transition`. Taking over
        // the row's y right after puts the drop on spring.fast, like the
        // swaps.
        animate(y, 0, spring.fast);
        onDragEnd();
      }}
      dragMomentum={false}
      // A row stays inside the list: no dragging past the first or last
      // row, and no rubber band beyond them.
      dragConstraints={bounds}
      dragElastic={0}
      // Rows travel one row height as they swap: the fast tier.
      transition={spring.fast}
      className="relative"
      // Capture, so Alt + ↑ / ↓ moves the row before the menu reads the
      // arrow as a move of focus.
      onKeyDownCapture={(e) => {
        if (!e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
        e.preventDefault();
        e.stopPropagation();
        onMove(e.key === "ArrowUp" ? -1 : 1);
      }}
    >
      <MenuItem
        index={index}
        icon={column.columnDef.meta?.icon}
        label={columnLabel(column)}
        checked={column.getIsVisible()}
        onSelect={onToggle}
        leading={
          <span
            aria-hidden
            onPointerDown={(e) => {
              e.preventDefault();
              controls.start(e);
            }}
            className="-ml-1 flex cursor-grab touch-none items-center text-muted-foreground transition-colors duration-80 hover:text-foreground active:cursor-grabbing"
          >
            <Grip size={14} />
          </span>
        }
      />
    </Reorder.Item>
  );
}

/** A menu that shows and hides columns. Lists every column that has an
 *  accessor and doesn't set `enableHiding: false`. */
function DataTableViewOptions<TData>({
  table,
  label = "Columns",
  size,
  className,
}: DataTableViewOptionsProps<TData>) {
  "use no memo";
  const icons = useIcons();
  const Sliders = icons["sliders-horizontal"];
  const compact = useSize(size).variant === "compact";
  // In the table's display order, so the list reads like the header row.
  const order = columnOrderOf(table);
  const columns = table
    .getAllLeafColumns()
    .filter((column) => column.accessorFn !== undefined && column.getCanHide())
    .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  // While a row is dragged, the order lives here and the menu alone
  // re-renders as rows swap; the table takes the new order once, on
  // release (re-laying the whole table on every swap made the drag lag).
  const [dragOrder, setDragOrder] = useState<string[] | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dragOrderRef = useRef<string[] | null>(null);
  const listed = dragOrder
    ? dragOrder.flatMap((id) => columns.filter((c) => c.id === id))
    : columns;
  const commitDrag = () => {
    const ids = dragOrderRef.current;
    dragOrderRef.current = null;
    setDragOrder(null);
    if (ids) reorderColumns(table, ids);
  };
  // Text columns (a `meta.lines` of their own) can be wrapped from here.
  // Hidden ones count too: the switch stays put while columns come and go,
  // so the rows under it never shift under their selection fills.
  const textColumns = columns.filter((column) => column.columnDef.meta?.lines !== undefined);
  const checked = listed.flatMap((column, i) => (column.getIsVisible() ? [i] : []));
  // One switch wraps every text column, or hands each its own lines back
  // (a column that wraps on its own drops to one line).
  const setLines = (table as Partial<DataTableExtras>).setColumnLines;
  const wrapped =
    textColumns.length > 0 && textColumns.every((column) => linesOf(table, column) === "wrap");
  const toggleWrap = () => {
    if (!setLines) return;
    for (const column of textColumns) {
      const own = column.columnDef.meta?.lines;
      if (wrapped) setLines(column.id, own === "wrap" ? 1 : undefined);
      else setLines(column.id, "wrap");
    }
  };

  // Closed while the menu is open: the menu is portalled, but React still
  // carries its pointer events up to the tooltip's wrapper, which would
  // reopen the tooltip over the menu with every move.
  const [open, setOpen] = useState(false);

  return (
    // The tooltip's trigger is a wrapper, not the button, so the button stays
    // the menu's own trigger in either primitive; hover and focus reach the
    // wrapper from it.
    <Tooltip content={label} forceOpen={open ? false : undefined}>
      <span className={cn("inline-flex", className)}>
        <DropdownMenu size={size} open={open} onOpenChange={setOpen}>
          <DropdownTrigger
            render={
              <Button variant="ghost" size={compact ? "icon-compact" : "icon"} aria-label={label}>
                <Sliders />
              </Button>
            }
          />
          <DropdownContent align="end" checkedIndices={checked}>
            {setLines && textColumns.length > 0 && (
              <>
                {/* A setting for the whole table, so it leads the menu. */}
                <Switch
                  label="Wrap text"
                  checked={wrapped}
                  onToggle={toggleWrap}
                  className="w-full flex-row-reverse justify-between px-2"
                />
                <DropdownSeparator />
              </>
            )}
            <DropdownLabel>{label}</DropdownLabel>
            {/* Rows sit in the table's column order and reorder it: drag a
                row by its grip (or Alt + ↑ / ↓ on a focused row) and the
                table's columns follow, live. */}
            <Reorder.Group
              as="div"
              axis="y"
              values={listed.map((column) => column.id)}
              onReorder={(ids: string[]) => {
                dragOrderRef.current = ids;
                setDragOrder(ids);
              }}
              // A real box (not `contents`), so it can bound the drag.
              ref={listRef}
              className="flex flex-col"
            >
              {listed.map((column, i) => (
                <ColumnMenuRow
                  key={column.id}
                  column={column}
                  index={i}
                  bounds={listRef}
                  onDragEnd={commitDrag}
                  onToggle={() => {
                    (table as Partial<DataTableExtras>).captureLayout?.();
                    column.toggleVisibility();
                  }}
                  onMove={(delta) => {
                    const ids = columns.map((c) => c.id);
                    const to = i + delta;
                    if (to < 0 || to >= ids.length) return;
                    [ids[i], ids[to]] = [ids[to], ids[i]];
                    reorderColumns(table, ids);
                  }}
                />
              ))}
            </Reorder.Group>
          </DropdownContent>
        </DropdownMenu>
      </span>
    </Tooltip>
  );
}

// ── DataTableRowActions ──────────────────────────────────

interface DataTableRowActionsProps {
  /** MenuItems, numbered from 0 with `index`. */
  children: ReactNode;
  /** The trigger's accessible name. @default "Row actions" */
  label?: string;
}

/** The ⋯ menu at the end of a row. Its 28px button overhangs the line box
 *  evenly, so the row keeps its height on either step of the ladder. */
function DataTableRowActions({ children, label = "Row actions" }: DataTableRowActionsProps) {
  const icons = useIcons();
  const More = icons["more-horizontal"];
  // Compact toolbar buttons are 28px, centered 14px from the edge; the row
  // button moves 4px out to stay under them (18px at the default step, with
  // rowActionsColumn's padding).
  const compact = useSize().variant === "compact";
  return (
    <span className={cn("flex h-[1lh] items-center justify-end", compact && "-mr-1")}>
      <DropdownMenu>
        <DropdownTrigger
          render={
            <Button variant="ghost" size="icon-compact" aria-label={label}>
              <More />
            </Button>
          }
        />
        {/* Short actions: the submenu width, not the 288px default. */}
        <DropdownContent align="end" className="w-56">
          {children}
        </DropdownContent>
      </DropdownMenu>
    </span>
  );
}

/** A ready-made last column for DataTableRowActions: 40px wide (8px, the
 *  28px button, 4px), so its ⋯ centers on the line the Columns button and
 *  the next-page arrow share; never sorted, hidden or resized. Put it last
 *  in your `columns`. */
function rowActionsColumn<TData>(
  items: (row: Row<TData>) => ReactNode,
  { label }: { label?: string } = {}
): ColumnDef<TData> {
  return {
    id: "actions",
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    size: 40,
    meta: { className: "w-0 pl-2 pr-1", rowMenu: items },
    cell: ({ row }) => <DataTableRowActions label={label}>{items(row)}</DataTableRowActions>,
  };
}

// ── DataTablePagination ──────────────────────────────────

interface DataTablePaginationProps<TData> {
  table: TanStackTable<TData>;
  /** The choices in the rows-per-page menu; an empty array hides it. The
   *  current page size is always among them. @default [10, 20, 50] */
  pageSizes?: number[];
  size?: SizeVariant;
  className?: string;
}

/** The row count (the page's against the whole, "10 / 35 rows", when
 *  there is more than one page; or the selection, once there is one) on
 *  the left, the page and the previous / next arrows on the right. */
const DEFAULT_PAGE_SIZES = [10, 20, 50];

function DataTablePagination<TData>({
  table,
  pageSizes = DEFAULT_PAGE_SIZES,
  size,
  className,
}: DataTablePaginationProps<TData>) {
  "use no memo";
  const sizeClasses = useSize(size);
  const icons = useIcons();
  const Prev = icons["arrow-left"];
  const Next = icons["arrow-right"];
  const iconSize = sizeClasses.variant === "compact" ? "icon-compact" : "icon";
  const total = table.getFilteredRowModel().rows.length;
  const selected = table.getFilteredSelectedRowModel().rows.length;
  const pageCount = Math.max(1, table.getPageCount());
  const page = Math.min(table.getState().pagination.pageIndex + 1, pageCount);
  const pageSize = table.getState().pagination.pageSize;
  const sizes = pageSizes.length
    ? [...new Set([...pageSizes, pageSize])].sort((a, b) => a - b)
    : [];

  const bar = (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 tabular-nums text-muted-foreground",
        sizeClasses.text,
        className
      )}
    >
      {/* 8px in, on the selection checkbox's line, like the search icon. */}
      <span aria-live="polite" className="pl-2">
        {selected > 0
          ? `${selected} of ${total} ${total === 1 ? "row" : "rows"} selected`
          : pageCount > 1
            ? // The rows this page shows against the result: "10 / 35 rows".
              `${Math.max(0, Math.min(pageSize, total - (page - 1) * pageSize))} / ${total} rows`
            : `${total} ${total === 1 ? "row" : "rows"}`}
      </span>
      {/* On a narrow bar the two groups wrap as wholes; their words don't. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 whitespace-nowrap">
        {sizes.length > 0 && (
          // A borderless select, so it reads as part of the sentence.
          <span className="flex items-center gap-1">
            Rows per page
            <Select value={String(pageSize)} onValueChange={(v) => table.setPageSize(Number(v))}>
              <SelectTrigger variant="borderless" aria-label="Rows per page" className="w-auto min-w-0 gap-1 px-2" />
              <SelectContent>
                {sizes.map((n, i) => (
                  <SelectItem key={n} value={String(n)} index={i}>
                    {String(n)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </span>
        )}
        <span className="flex items-center gap-1">
          <span>
            Page {page} of {pageCount}
          </span>
          <Tooltip content="Previous page">
            <Button
              variant="ghost"
              size={iconSize}
              aria-label="Previous page"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <Prev />
            </Button>
          </Tooltip>
          <Tooltip content="Next page">
            <Button
              variant="ghost"
              size={iconSize}
              aria-label="Next page"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <Next />
            </Button>
          </Tooltip>
        </span>
      </div>
    </div>
  );

  return size ? <SizeProvider size={size}>{bar}</SizeProvider> : bar;
}

// ── DataTableSelectionBar ────────────────────────────────

const subscribeNever = () => () => {};

/** How far the bar floats above the table's bottom edge, or the window's. */
const BAR_INSET = 20;

interface DataTableSelectionBarProps<TData> {
  table: TanStackTable<TData>;
  /** The actions its menu lists, or a function that builds them from the
   *  selected rows. Without any, the bar shows the count and the clear
   *  button only. */
  actions?: CommandMenuItemData[] | ((rows: Row<TData>[]) => CommandMenuItemData[]);
  /** The combo that opens the actions while rows are selected. null binds
   *  nothing. @default "mod+k" */
  shortcut?: string | null;
  /** The menu field's placeholder. @default "Act on 3 rows…" */
  placeholder?: string;
  /** Pins the bar to one step of the size ladder. */
  size?: SizeVariant;
  className?: string;
}

/** A bar that floats over the table while rows are selected: how many, an
 *  Actions button that opens a CommandMenu of what to do with them (⌘K),
 *  and a button that clears the selection (Esc). It sits centered on the
 *  table, near the window's bottom edge while the table runs past it, or
 *  its own bottom edge once that's in view, and takes no room in the page. */
function DataTableSelectionBar<TData>({
  table,
  actions,
  shortcut = "mod+k",
  placeholder,
  size,
  className,
}: DataTableSelectionBarProps<TData>) {
  "use no memo";
  const sizeClasses = useSize(size);
  const compact = sizeClasses.variant === "compact";
  const shape = useShape();
  const icons = useIcons();
  const XIcon = icons.x;
  const reduceMotion = useReducedMotion();
  const selected = table.getSelectedRowModel().rows;
  const count = selected.length;
  // The last count shown, so the bar keeps its number while it leaves.
  const [shown, setShown] = useState(count);
  if (count > 0 && count !== shown) setShown(count);
  const items = typeof actions === "function" ? actions(selected) : (actions ?? []);
  const [menuOpen, setMenuOpen] = useState(false);
  const getRoot = (table as Partial<DataTableExtras>).getRootElement;

  // Placed by hand over the table (fixed, so it takes no room and needs no
  // particular parent), written straight to the element on scroll and
  // resize while the bar is up.
  const barRef = useRef<HTMLDivElement>(null);
  // The portal needs document.body: false on the server and in hydration,
  // true once in the browser.
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  useLayoutEffect(() => {
    if (count === 0) return;
    let frame = 0;
    const place = () => {
      frame = 0;
      const bar = barRef.current;
      const root = getRoot?.();
      if (!bar || !root) return;
      const r = root.getBoundingClientRect();
      const bottom = Math.min(r.bottom, window.innerHeight) - BAR_INSET;
      bar.style.left = `${r.left + r.width / 2}px`;
      bar.style.top = `${bottom}px`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(place);
    };
    place();
    window.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("resize", schedule);
    const root = getRoot?.();
    const ro = root ? new ResizeObserver(schedule) : null;
    if (root) ro?.observe(root);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
      ro?.disconnect();
    };
  }, [count > 0, getRoot]); // eslint-disable-line react-hooks/exhaustive-deps -- placed while up

  const clear = () => {
    setMenuOpen(false);
    table.resetRowSelection();
  };
  const noun = shown === 1 ? "row" : "rows";

  const bar = (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          key="bar"
          ref={barRef}
          // Grows up from its bottom center, the edge it's anchored by.
          className="pointer-events-auto fixed z-[var(--z-sticky,30)] -translate-x-1/2 -translate-y-full"
          style={{ transformOrigin: "50% 100%" }}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={
            reduceMotion
              ? { opacity: 0, transition: spring.moderate.exit }
              : { opacity: 0, y: 8, scale: 0.96, transition: spring.moderate.exit }
          }
          transition={spring.moderate}
          onKeyDown={(e) => {
            if (e.key === "Escape" && !menuOpen) {
              e.preventDefault();
              clear();
            }
          }}
        >
          <Elevated
            offset={2}
            shadowLevel={3}
            role="toolbar"
            aria-label="Selected rows"
            className={cn(
              "flex items-center whitespace-nowrap",
              compact ? "gap-1 p-1 pl-3" : "gap-1.5 p-1.5 pl-4",
              shape.variant === "sharp" ? "rounded-[1px]" : shape.variant === "pill" ? "rounded-full" : "rounded-xl",
              sizeClasses.text,
              className
            )}
          >
            <span aria-live="polite" className="tabular-nums text-foreground">
              {shown} selected
            </span>
            {items.length > 0 && (
              <Button
                variant="ghost"
                size={compact ? "compact" : "default"}
                onClick={() => setMenuOpen(true)}
                aria-keyshortcuts={shortcut ?? undefined}
                className="ml-1"
              >
                Actions
                {shortcut && <CommandMenuShortcut keys={shortcut} className="ml-1" />}
              </Button>
            )}
            <Tooltip
              content={
                <span className="flex items-center gap-2">
                  Clear selection
                  {/* A key cap in the tooltip's inverted colors, as the
                      Sidebar's tooltips draw theirs. */}
                  <kbd className="-my-1 flex h-4 min-w-4 items-center justify-center rounded border border-background/30 px-1 font-sans text-[length:var(--fs-micro-compact,10px)] leading-[var(--lh-micro-compact,12px)] text-background">
                    Esc
                  </kbd>
                </span>
              }
            >
              <Button
                variant="ghost"
                size={compact ? "icon-compact" : "icon"}
                aria-label="Clear selection"
                aria-keyshortcuts="Escape"
                onClick={clear}
              >
                <XIcon />
              </Button>
            </Tooltip>
          </Elevated>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {mounted && createPortal(bar, document.body)}
      {items.length > 0 && (
        <CommandMenuDialog
          open={menuOpen}
          onOpenChange={setMenuOpen}
          // Bound only while rows are selected, so ⌘K reaches the page's
          // own palette the rest of the time.
          shortcut={count > 0 ? shortcut : null}
          title="Selection actions"
          description={`Actions for the ${shown} selected ${noun}.`}
        >
          <CommandMenu items={items}>
            <CommandMenuInput placeholder={placeholder ?? `Act on ${shown} ${noun}…`} />
            <CommandMenuList>
              <CommandMenuEmpty>No action matches.</CommandMenuEmpty>
            </CommandMenuList>
            <CommandMenuFooter />
          </CommandMenu>
        </CommandMenuDialog>
      )}
    </>
  );
}

// ── Exports ──────────────────────────────────────────────

export {
  useDataTable,
  DataTable,
  DataTableColumnHeader,
  DataTableTitle,
  DataTableSearch,
  DataTableFilters,
  DataTableViewOptions,
  DataTableRowActions,
  DataTablePagination,
  DataTableSelectionBar,
  selectColumn,
  rowActionsColumn,
  useUndoableRows,
};
export type {
  DataTableInstance,
  DataTableEditor,
  DataTableSelectOption,
  DataTableCellEdit,
  DataTableExtras,
  ColumnLines,
  UseDataTableOptions,
  DataTableProps,
  DataTableEmpty,
  DataTableColumnHeaderProps,
  DataTableTitleProps,
  DataTableSearchProps,
  DataTableFiltersProps,
  UseUndoableRowsOptions,
  DataTableFilterKind,
  DataTableFilterValue,
  DataTableViewOptionsProps,
  DataTableRowActionsProps,
  DataTablePaginationProps,
  DataTableSelectionBarProps,
};
export type { ColumnDef, TableState } from "@tanstack/react-table";
