"use client";

import {
  Fragment,
  forwardRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
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
import { SizeProvider, useSize, type SizeVariant } from "@/lib/size-context";
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
import { Tooltip } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

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
  }
}

// ── useDataTable ─────────────────────────────────────────

// TanStack hands back one table object for the table's whole life and
// mutates it, so a memoized part would never see a sort or a page turn.
// Every part that reads it opts out of the React Compiler ("use no memo").

type UseDataTableOptions<TData> = Omit<TableOptions<TData>, "getCoreRowModel"> & {
  /** Rows per page. @default 10 */
  pageSize?: number;
};

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
    // Every column sorts ascending first, numbers included (TanStack's own
    // default starts numbers descending), so a header click is predictable.
    sortDescFirst: false,
    // Widths follow the pointer while a resize handle is dragged.
    columnResizeMode: "onChange",
    ...options,
    initialState: {
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
  return useMemo(
    () =>
      Object.assign(Object.create(table) as TanStackTable<TData>, {
        columnLines,
        _registerLayout: (capture: () => void) => {
          captureRef.current = capture;
        },
        captureLayout: () => captureRef.current(),
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
  /** Overrides a column's `meta.lines`; `undefined` hands it back. */
  setColumnLines: (id: string, lines: ColumnLines | undefined) => void;
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

/** Data columns (with an accessor) move; selection and action columns hold
 *  their place at the ends. */
const canReorder = <TData,>(column: Column<TData, unknown>) => column.accessorFn !== undefined;

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
  className,
}: DataTableProps<TData>) {
  "use no memo";
  const rows = table.getRowModel().rows;
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

  // The clickable row that holds the body's tab stop.
  const [focusRowId, setFocusRowId] = useState<string | null>(null);

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
  }, [fill]);

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
      if (old === undefined) return;
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

  // Resizing starts from the widths the table lays out on its own: the
  // first render is auto layout, then each column's width is read once and
  // the table switches to fixed layout at those widths.
  const sizing = table.getState().columnSizing;
  const seeded = Object.keys(sizing).length > 0;
  useLayoutEffect(() => {
    if (!resizeColumns || seeded) return;
    const widths: Record<string, number> = {};
    headRowRef.current?.querySelectorAll<HTMLElement>("th[data-column-id]").forEach((th) => {
      widths[th.dataset.columnId!] = Math.round(th.getBoundingClientRect().width);
    });
    // Nothing measured (no visible columns yet): setting an empty sizing
    // would only re-render into this same effect, forever.
    if (Object.keys(widths).length === 0) return;
    table.setColumnSizing((old) => ({ ...widths, ...old }));
  }, [resizeColumns, seeded, table]);
  const sized = resizeColumns && seeded;
  // Keys inside the table body:
  //   ↑ / ↓        the same column in the row above / below
  //   Home / End   the same column in the first / last row
  //   Shift + ↑ ↓  also carries the selection along, like Shift-click
  //   ⌘A / Ctrl+A  selects every row on the page
  //   Esc          clears the selection
  // "The same column" is its first focusable control: the selection box,
  // a link, the row menu. Rows without one are skipped.
  const hasSelection = table.getAllLeafColumns().some((c) => c.id === "select");
  const onBodyKeyDown = (e: KeyboardEvent<HTMLTableElement>) => {
    const target = e.target as HTMLElement;
    // A clickable row focused as a whole (see the row's tabIndex): arrows
    // and Home / End move between rows, Enter or Space opens it.
    if (onRowClick && target.matches("tbody tr[data-row-id]")) {
      const bodyRows = Array.from(
        (target.parentElement as HTMLTableSectionElement).querySelectorAll<HTMLElement>("tr[data-row-id]")
      );
      const at = bodyRows.indexOf(target);
      const to =
        e.key === "ArrowDown" ? at + 1
        : e.key === "ArrowUp" ? at - 1
        : e.key === "Home" ? 0
        : e.key === "End" ? bodyRows.length - 1
        : null;
      if (to !== null && !e.altKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        bodyRows[Math.max(0, Math.min(bodyRows.length - 1, to))]?.focus();
        return;
      }
      if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
        e.preventDefault();
        const row = rows.find((r) => r.id === target.dataset.rowId);
        if (row) onRowClick(row);
        return;
      }
    }
    const td = target.closest("td");
    if (!td || target.closest("input, textarea, select, [contenteditable=true]")) return;
    const mod = e.metaKey || e.ctrlKey;
    if (hasSelection && mod && e.key.toLowerCase() === "a") {
      e.preventDefault();
      table.toggleAllPageRowsSelected(true);
      return;
    }
    if (hasSelection && e.key === "Escape" && Object.keys(table.getState().rowSelection).length) {
      e.preventDefault();
      table.resetRowSelection();
      return;
    }
    if (mod || e.altKey || !["ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) return;
    const tr = td.parentElement as HTMLTableRowElement;
    const bodyRows = Array.from((tr.parentElement as HTMLTableSectionElement).rows).filter(
      (r) => r.dataset.rowId
    );
    const col = td.cellIndex;
    const control = (r: HTMLTableRowElement) =>
      r.cells[col]?.querySelector<HTMLElement>(
        'button, a[href], input, [role=checkbox], [tabindex]:not([tabindex="-1"])'
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
    const next = order.find((r) => control(r));
    if (!next) return;
    e.preventDefault();
    control(next)!.focus();
    if (hasSelection && e.shiftKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      const value = table.getRow(tr.dataset.rowId!).getIsSelected();
      selectRange(table, tr.dataset.rowId!, next.dataset.rowId!, value);
      selectionAnchors.set(table.getState, next.dataset.rowId!);
    }
  };

  const tableEl = (
    <Table
      size={size}
      // Selected rows on this page get CheckboxGroup's merged fill.
      selectedIndices={rows.flatMap((row, i) => (row.getIsSelected() ? [i] : []))}
      // The skeleton rows are aria-hidden; this tells assistive tech the
      // table is loading rather than empty.
      aria-busy={loading || undefined}
      onKeyDown={onBodyKeyDown}
      // Fixed layout keeps the widths you set. The min width is every
      // column's width summed, so past the box the table scrolls instead of
      // crushing the column that takes the rest.
      className={cn(sized && "table-fixed", className)}
      style={sized ? { minWidth: table.getTotalSize() } : undefined}
    >
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          // Sticky header rows ride above the body rows (both z-10 by
          // default, and later rows would paint over earlier ones).
          <TableRow key={group.id} ref={headRowRef} className={fill ? "z-20" : undefined}>
            {group.headers.map((header) => {
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
                  style={
                    sized &&
                    column.id !== flexId &&
                    (column.id in sizing || column.columnDef.size !== undefined)
                      ? { width: header.getSize() }
                      : undefined
                  }
                  className={cn(
                    // Headers step back to muted so the content leads.
                    "relative text-muted-foreground",
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
                    // hover, and a surface 1px inside the cell fills with
                    // --hover, spread back out by a same-color 1px ring;
                    // pressed it turns --active and the ring collapses, so
                    // the surface shrinks 1px a side. Once it drags, the
                    // ghost takes over and the slot stays empty.
                    (movable || column.getCanSort()) && [
                      "hover:text-foreground transition-colors duration-80",
                      "after:pointer-events-none after:absolute after:inset-px after:-z-10 after:bg-transparent after:shadow-[0_0_0_1px_transparent] after:transition-[background-color,box-shadow] after:duration-80",
                      "not-data-dragging:hover:after:bg-hover not-data-dragging:hover:after:shadow-[0_0_0_1px_var(--hover)]",
                      "not-data-dragging:active:after:bg-active not-data-dragging:active:after:shadow-[0_0_0_0px_var(--active)]",
                      PRESS_RADIUS[shape.variant],
                    ],
                    meta?.className
                  )}
                >
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
            <TableRow
              // Keyed by record, so state in a cell (an open row menu, a
              // consumer's own input, focus) stays with its row through a
              // sort, a search or a page turn.
              key={row.id}
              data-row-id={row.id}
              index={i}
              data-state={row.getIsSelected() ? "selected" : undefined}
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
              // Clickable rows are one tab stop for the whole body (roving:
              // the row last focused, else the first) so the action has a
              // keyboard path without a stop per row.
              tabIndex={onRowClick ? (row.id === (focusRowId ?? rows[0]?.id) ? 0 : -1) : undefined}
              onFocus={
                onRowClick
                  ? (e: FocusEvent<HTMLTableRowElement>) => {
                      if (e.target === e.currentTarget) setFocusRowId(row.id);
                    }
                  : undefined
              }
              className={cn(
                onRowClick && "cursor-pointer outline-none",
                // The keyboard ring for a focused row: the row's own box,
                // inset so the next row's rule doesn't cut through it.
                onRowClick && "focus-visible:shadow-[inset_0_0_0_1px_var(--focus-ring,#6B97FF)]"
              )}
            >
              {row.getVisibleCells().map((cell, c) => {
                const meta = cell.column.columnDef.meta;
                const lines = linesOf(table, cell.column);
                const rendered = flexRender(cell.column.columnDef.cell, cell.getContext());
                // line-clamp needs a block of its own; a cell isn't one.
                const content =
                  lines === 2 ? (
                    <div className="line-clamp-2 [overflow-wrap:anywhere]">{rendered}</div>
                  ) : (
                    rendered
                  );
                return (
                  <TableCell
                    key={cell.column.id}
                    data-column-id={cell.column.id}
                    className={cn(
                      // Content reads at full strength, above the muted
                      // headers.
                      "text-foreground",
                      // Anchors the skeleton that fades over it on landing.
                      swapping && "relative",
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
                      meta?.className
                    )}
                  >
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
                        {skeletonFor(cell.column.id, i, c, shape.variant, sizeClasses.variant === "compact")}
                      </span>
                    )}
                    {textCell(cell.column.id) ? (
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
            </TableRow>
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
  );

  return (
    <>
      {/* The library's ScrollArea: a table wider than its box scrolls
          sideways under the system's thumb (4px, low contrast, widening on
          hover; native scrolling on touch screens), and both edges fade
          while there's more to that side. Filled, it scrolls both ways
          under a sticky header. Its root clips, so a height that eases
          never flashes a scrollbar. */}
      <ScrollArea
        ref={wrapRef}
        orientation={fill ? "both" : "horizontal"}
        className={cn("w-full", fill && "group/scroll min-h-0 flex-1")}
        viewportClassName="scroll-fade-x"
      >
        {tableEl}
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

/** A header that sorts its column: click for ascending, again for
 *  descending, a third time to clear. Shift-click adds a column to the
 *  sort. Columns that can't sort render the title alone. */
function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  "use no memo";
  const icons = useIcons();
  const Unsorted = icons["chevrons-up-down"];
  const Arrow = icons["arrow-up"];

  const icon = column.columnDef.meta?.icon;
  if (!column.getCanSort())
    return (
      <span className={className}>
        <HeaderLabel icon={icon} title={title} />
      </span>
    );

  const sorted = column.getIsSorted();

  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className={cn(
        "group/sort inline-flex cursor-pointer items-center gap-1 rounded-[4px] align-top outline-none",
        "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      {icon && <Icon14 icon={icon} />}
      {title}
      {/* One 14px cell for both glyphs, so the label never shifts. The arrow
          turns over for descending instead of swapping glyphs. */}
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
    </button>
  );
}

// ── Selection column ─────────────────────────────────────

// The row a range starts from, per table. Keyed by the table's getState
// function, the one object the table keeps for its whole life (the view
// useDataTable hands out is new on every change).
const selectionAnchors = new WeakMap<object, string>();

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

/** A ready-made first column of checkboxes: one per row, and a header box
 *  that selects every row on the page (a dash while only some are). Each
 *  box answers a click anywhere in its cell. Put it first in your
 *  `columns`. */
function selectColumn<TData>(): ColumnDef<TData> {
  return {
    id: "select",
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    // 8px either side of the 16px box, so its focus ring never meets the
    // row's edge (or the scroll box's clip).
    size: 32,
    // w-0 shrinks the column to the box and its 8px either side.
    meta: { className: "w-0 px-2" },
    header: ({ table }) => {
      const all = table.getIsAllPageRowsSelected();
      return (
        // The tooltip names what the next click does: a dash selects the
        // rest of the page, a check clears it. Its trigger is the hit area,
        // not the box, so it works whichever primitive the box is built on.
        <Tooltip content={all ? "Unselect all" : "Select all"} side="top">
          <SelectHit onToggle={() => table.toggleAllPageRowsSelected(!all)}>
            <Checkbox
              aria-label="Select all rows on this page"
              checked={all}
              indeterminate={table.getIsSomePageRowsSelected()}
              onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked)}
            />
          </SelectHit>
        </Tooltip>
      );
    },
    cell: ({ row, table }) => (
      <SelectHit
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
          disabled={!row.getCanSelect()}
          onCheckedChange={(checked) => row.toggleSelected(checked)}
        />
      </SelectHit>
    ),
  };
}

// ── DataTableSearch ──────────────────────────────────────

interface DataTableSearchProps<TData> {
  table: TanStackTable<TData>;
  /** The column id to search. Omitted, the field searches every column. */
  column?: string;
  placeholder?: string;
  size?: SizeVariant;
  className?: string;
}

/** A search field that narrows the rows as you type, by one column or all.
 *  The magnifying glass sits over the field's left padding, where Input
 *  puts a file field's icon. */
function DataTableSearch<TData>({
  table,
  column,
  placeholder = "Search…",
  size,
  className,
}: DataTableSearchProps<TData>) {
  "use no memo";
  const icons = useIcons();
  const SearchIcon = icons.search;
  const sizeClasses = useSize(size);
  const target = column ? table.getColumn(column) : undefined;
  const value = (target ? target.getFilterValue() : table.getState().globalFilter) ?? "";

  return (
    <span data-slot="data-table-search" className={cn("relative block w-full max-w-xs min-w-0", className)}>
      <SearchIcon
        size={sizeClasses.icon}
        strokeWidth={1.5}
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
          "left-2"
        )}
      />
      <Input
        type="search"
        size={size}
        placeholder={placeholder}
        aria-label={placeholder.replace(/…$/, "")}
        value={String(value)}
        onChange={(e) => {
          const next = e.target.value;
          if (target) target.setFilterValue(next);
          else table.setGlobalFilter(next);
          // A search that shrinks the rows starts over on the first page.
          table.setPageIndex(0);
        }}
        // The icon sits 8px in, on the selection checkbox's line; then the
        // icon and an 8px gap (16 + 8, 14 + 6 compact).
        // Ghost, like the toolbar's buttons: no hairline at rest, the hover
        // fill on hover, and the fill held while focused so the field still
        // shows where typing goes.
        className={cn(
          "pl-8",
          "border-transparent focus:border-transparent aria-invalid:focus:border-transparent focus:bg-hover focus:hover:bg-hover"
        )}
      />
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

function columnLabel<TData>(column: Column<TData, unknown>) {
  const header = column.columnDef.header;
  return column.columnDef.meta?.label ?? (typeof header === "string" ? header : column.id);
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
    meta: { className: "w-0 pl-2 pr-1" },
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

/** The row count (or the selection, once there is one) on the left, the
 *  page and the previous / next arrows on the right. */
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
          : `${total} ${total === 1 ? "row" : "rows"}`}
      </span>
      <div className="flex items-center gap-1">
        {sizes.length > 0 && (
          // A borderless select, so it reads as part of the sentence.
          <span className="mr-3 flex items-center gap-1">
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
      </div>
    </div>
  );

  return size ? <SizeProvider size={size}>{bar}</SizeProvider> : bar;
}

// ── Exports ──────────────────────────────────────────────

export {
  useDataTable,
  DataTable,
  DataTableColumnHeader,
  DataTableSearch,
  DataTableViewOptions,
  DataTableRowActions,
  DataTablePagination,
  selectColumn,
  rowActionsColumn,
};
export type {
  DataTableInstance,
  DataTableExtras,
  ColumnLines,
  UseDataTableOptions,
  DataTableProps,
  DataTableEmpty,
  DataTableColumnHeaderProps,
  DataTableSearchProps,
  DataTableViewOptionsProps,
  DataTableRowActionsProps,
  DataTablePaginationProps,
};
export type { ColumnDef } from "@tanstack/react-table";
