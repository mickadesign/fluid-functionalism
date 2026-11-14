"use client";

import {
  useCallback,
  useEffect,
  useInsertionEffect,
  useLayoutEffect,
  useRef,
  useState,
  useMemo,
  createContext,
  useContext,
  forwardRef,
  type CSSProperties,
  type ReactNode,
  type HTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { fontWeights } from "@/lib/font-weight";
import { SizeProvider, useSize, type SizeVariant } from "@/lib/size-context";
import {
  useFluidHover,
  useFluidHoverSelect,
  useRegisterFluidHoverItem,
  type FluidHoverActiveStore,
} from "@/hooks/use-fluid-hover";
import { FluidHoverHighlight } from "@/components/ui/fluid-hover-highlight";
import { useShape } from "@/lib/shape-context";
import {
  SelectionBackgrounds,
  useMergeSplitBlocks,
  useSelectionRuns,
} from "@/hooks/use-merge-split";

// ---------------------------------------------------------------------------
// Table is a plain HTML table with one fluid hover highlight drawn behind all
// of it. Body rows opt in by passing `index`; header rows leave it out, so
// they never light up. On the lit row the borders around it fade out and its
// text lifts from muted to foreground, so the highlight reads as one clean
// pill instead of a band crossed by rules.
// ---------------------------------------------------------------------------

// ── Context ──────────────────────────────────────────────

interface TableContextValue {
  registerItem: (index: number, element: HTMLElement | null) => void;
  /** Read per row, so a highlight change re-renders only the rows whose
   *  borders or text change, not the whole table. */
  activeStore: FluidHoverActiveStore;
  /** Selected body rows: their borders, and the border above a run, step
   *  aside so a merged selection reads as one block. */
  selected: ReadonlySet<number>;
  /** Header cells with a hoverIndex join their own fluid hover scope. */
  registerHead: (index: number, element: HTMLElement | null) => void;
}

const TableContext = createContext<TableContextValue | null>(null);

// ── Table ────────────────────────────────────────────────

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
  /** Pins the table's rows to one step of the size ladder (default 36px,
   *  compact 28px). Omitted, it follows the surrounding SizeProvider. */
  size?: SizeVariant;
  /** Selected body rows, by `index`. Contiguous ones share one merged
   *  background, drawn like CheckboxGroup's, under the hover highlight. */
  selectedIndices?: readonly number[];
  /** Change it in the render that reorders rows without animating them
   *  (rows opened or closed above): the selection fill and the hover
   *  highlight jump with the rows for that one commit instead of springing
   *  after them. */
  snapKey?: string | number;
  /** Hides the header cells' fluid hover highlight, e.g. while a header
   *  is dragged. */
  hideHeadHighlight?: boolean;
  /** A mark that rides the row highlight, for the body row at `index`:
   *  drawn inside the fill, so it glides from row to row with it. */
  hoverMarker?: (index: number) => ReactNode;
  /** The row highlight's live box on every frame it moves (`y` and
   *  `height` from the table's top, and its opacity), to draw along with
   *  it. Write to the DOM in it; don't set state. */
  onHighlightFrame?: (box: { y: number; height: number; opacity: number }) => void;
  /** Elements that get a live copy of the selection fills, in the table's
   *  own coordinates (place each one over the table's top left corner):
   *  for drawing the selection again where something opaque covers it,
   *  with the same merges and splits, frame for frame. */
  selectionMirrors?: readonly (HTMLElement | null)[];
}

const NO_SELECTION: readonly number[] = [];

/** Dispatched (bubbling) from a row to move the table's highlight onto it. */
const TABLE_HIGHLIGHT_EVENT = "fluid-table-highlight";

const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ children, size, selectedIndices = NO_SELECTION, snapKey, hideHeadHighlight = false, hoverMarker, onHighlightFrame, selectionMirrors, className, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sizeClasses = useSize(size);

    const hover = useFluidHover(containerRef);
    // Header cells that act (sort, move) share a second scope: one fill
    // glides along the header row the way the row highlight runs down the
    // body. Only the cell under the pointer lights.
    const headHover = useFluidHover(containerRef, { axis: "x" });
    const registerHead = headHover.registerItem;
    const {
      activeStore,
      handlers,
      registerItem,
      itemRects,
      setActiveIndex,
    } = hover;

    // The same merged, merge/split-animated selection CheckboxGroup draws.
    const shape = useShape();
    const runs = useSelectionRuns(selectedIndices);
    const mergedBlocks = useMergeSplitBlocks(runs, itemRects, shape.mergedRadius);
    // A new snapKey snaps the fills for the commit it lands in, and the
    // frame after hands them back to their springs.
    const [snap, setSnap] = useState({ key: snapKey, on: false });
    if (snap.key !== snapKey) setSnap({ key: snapKey, on: true });
    useEffect(() => {
      if (!snap.on) return;
      const id = requestAnimationFrame(() => setSnap((s) => ({ ...s, on: false })));
      return () => cancelAnimationFrame(id);
    }, [snap.on]);
    // The rows just moved: measure them now, before paint, so the snapped
    // fills land on their new places in the same frame (the observer that
    // usually measures runs a frame later).
    const { measureItems } = hover;
    useLayoutEffect(() => {
      if (snap.on) measureItems();
    }, [snap.on, measureItems]);
    const blocks = snap.on
      ? mergedBlocks.map((b) => ({ ...b, instant: true, exitInstant: true, enterFrom: undefined }))
      : mergedBlocks;

    // Keyboard focus owns the highlight until the pointer really moves. A
    // scroll (the rows sliding under a still pointer, as arrow keys bring
    // the next row in) fires mouse moves and leaves at the same spot: those
    // must not snatch the highlight back to whatever row is now underneath.
    const keyboardOwns = useRef(false);
    const lastPointer = useRef<{ x: number; y: number } | null>(null);
    const pointerMoved = (e: React.MouseEvent) => {
      const last = lastPointer.current;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      return !last || last.x !== e.clientX || last.y !== e.clientY;
    };
    const fromPointer = (e: React.MouseEvent) => {
      const moved = pointerMoved(e);
      if (keyboardOwns.current && !moved) return false;
      keyboardOwns.current = false;
      return true;
    };

    // A row can ask for the highlight (`TABLE_HIGHLIGHT_EVENT`, bubbling
    // from the row): DataTable does after it moves a row from the keyboard,
    // so the fill, and what it carries, goes with the row to its new place
    // rather than staying where the pointer happens to rest. The keyboard
    // owns the highlight from there, until the pointer moves.
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      const claim = (e: Event) => {
        const index = (e.target as HTMLElement | null)
          ?.closest?.("[data-fluid-hover-index]")
          ?.getAttribute("data-fluid-hover-index");
        if (index == null) return;
        keyboardOwns.current = true;
        setActiveIndex(Number(index));
      };
      container.addEventListener(TABLE_HIGHLIGHT_EVENT, claim);
      return () => container.removeEventListener(TABLE_HIGHLIGHT_EVENT, claim);
    }, [setActiveIndex]);

    // A held arrow key repeats faster than the highlight's spring settles,
    // so while it repeats the highlight snaps row to row and stays on the
    // focused one; a single press, and the pointer, still glide.
    const [repeating, setRepeating] = useState(false);

    const selectedKey = selectedIndices.join(",");
    const selected = useMemo(
      () => new Set(selectedKey ? selectedKey.split(",").map(Number) : []),
      [selectedKey]
    );

    // A selection change switches its rows' rules in the same frame as
    // their fill, which doesn't fade either. Left to the 80ms fade (there
    // for the gliding highlight), selecting every row started a transition
    // per cell border: 1,200 of them for 34 rows, each with its events.
    // An insertion effect, so the mark is on before any layout effect
    // reads layout and commits the new rules without it.
    useInsertionEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      container.setAttribute("data-snap-rules", "");
      const frame = requestAnimationFrame(() => container.removeAttribute("data-snap-rules"));
      return () => cancelAnimationFrame(frame);
    }, [selectedKey]);

    // A divider hides once the highlight's fill covers it, read from where
    // the fill is this frame rather than where it's headed: hiding on the
    // hover change itself would drop the rule before the fill gets there.
    // Straight to the DOM (no render per frame); reads first, then writes.
    // A rule goes at once as the fill reaches it and fades back in after.
    // Where each row's rule sits, measured once and kept until the rows can
    // have moved (a render, a resize, rows added or removed). Layout
    // offsets, so a row mid-slide (a sort's FLIP) reads where it lands,
    // and a scroll changes nothing. Reading boxes on every frame of
    // the glide forced a layout in the middle of each frame, right after
    // the fill had moved, and the attribute written after it a second one:
    // most of what a sweep down the table cost. With nothing read per
    // frame, the browser lays the frame out once.
    const ruleEdges = useRef<{ tr: HTMLTableRowElement; bottom: number }[] | null>(null);
    const ruleState = useRef(new WeakMap<HTMLTableRowElement, boolean>());
    // New children are a new set of rows; a render for the hover alone
    // (the fill moving to another row) keeps what was measured.
    useLayoutEffect(() => {
      ruleEdges.current = null;
    }, [children]);
    useEffect(() => {
      const container = containerRef.current;
      if (!container || typeof ResizeObserver === "undefined") return;
      const drop = () => {
        ruleEdges.current = null;
      };
      const sizes = new ResizeObserver(drop);
      sizes.observe(container);
      // Rows coming and going (not what the fill carries beside the table).
      const rows = new MutationObserver(drop);
      container.querySelectorAll("thead, tbody").forEach((part) => rows.observe(part, { childList: true }));
      return () => {
        sizes.disconnect();
        rows.disconnect();
      };
    }, []);
    const hideCoveredRules = useCallback((box: { y: number; height: number; opacity: number }) => {
      const container = containerRef.current;
      if (!container) return;
      if (!ruleEdges.current) {
        let top: number | null = null;
        ruleEdges.current = Array.from(
          container.querySelectorAll<HTMLTableRowElement>("thead > tr, tbody > tr")
        ).map((tr) => ({
          tr,
          bottom:
            tr.offsetParent === container
              ? tr.offsetTop + tr.offsetHeight
              : tr.getBoundingClientRect().bottom - (top ??= container.getBoundingClientRect().top),
        }));
      }
      const shown = box.opacity >= 0.5;
      for (const { tr, bottom } of ruleEdges.current) {
        const on = shown && bottom >= box.y - 1.5 && bottom <= box.y + box.height + 1.5;
        // Written only when it changes: the attribute restyles the row's cells.
        if (ruleState.current.get(tr) === on) continue;
        ruleState.current.set(tr, on);
        tr.toggleAttribute("data-under-highlight", on);
      }
    }, []);

    // The fill's live box each frame: the rules under it hide here, and a
    // caller that draws along with the fill (DataTable's scroll-fade bands)
    // hears it too. Read through a ref, so a new callback each render costs
    // the highlight nothing.
    const frameRef = useRef(onHighlightFrame);
    useEffect(() => {
      frameRef.current = onHighlightFrame;
    });
    const onHighlightBox = useCallback(
      (box: { y: number; height: number; opacity: number }) => {
        hideCoveredRules(box);
        frameRef.current?.(box);
      },
      [hideCoveredRules]
    );

    const headCell =
      !hideHeadHighlight && headHover.isMeasured && headHover.activeIndex !== null
        ? headHover.itemRects[headHover.activeIndex]
        : undefined;
    const headRect = headCell ? { ...headCell, height: headCell.height - 1 } : null;
    // A header cell in the gliding scope held down, while the pointer is
    // still on it: its fill shows pressed. Slid onto a neighbor before
    // release, the fill follows the hover there unpressed.
    const [pressedHead, setPressedHead] = useState<number | null>(null);
    const headPressed = pressedHead !== null && pressedHead === headHover.activeIndex;
    const setHeadPressed = (on: boolean) => setPressedHead(on ? headHover.activeIndex : null);
    useEffect(() => {
      if (pressedHead === null) return;
      const release = () => setPressedHead(null);
      window.addEventListener("pointerup", release);
      window.addEventListener("pointercancel", release);
      return () => {
        window.removeEventListener("pointerup", release);
        window.removeEventListener("pointercancel", release);
      };
    }, [pressedHead]);

    const contextValue = useMemo(
      () => ({ registerItem, activeStore, selected, registerHead }),
      [registerItem, activeStore, selected, registerHead]
    );

    const table = (
      <TableContext.Provider value={contextValue}>
        {/* A div can't live inside <table>, so the highlight sits in this
            positioned wrapper behind the table and rows ride above it (z-10). */}
        <div
          ref={containerRef}
          className="group/table relative"
          onMouseEnter={(e) => {
            headHover.handlers.onMouseEnter();
            if (fromPointer(e)) handlers.onMouseEnter();
          }}
          onMouseMove={(e) => {
            headHover.handlers.onMouseMove(e);
            if (fromPointer(e)) handlers.onMouseMove(e);
          }}
          onMouseLeave={(e) => {
            headHover.handlers.onMouseLeave();
            if (fromPointer(e)) handlers.onMouseLeave();
          }}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            const th = (e.target as HTMLElement).closest("th[data-head-hover]");
            if (th && containerRef.current?.contains(th)) setHeadPressed(true);
          }}
          onClick={handlers.onClick}
          onKeyDown={(e) => {
            if (e.repeat && !repeating && e.key.startsWith("Arrow")) setRepeating(true);
          }}
          onKeyUp={() => repeating && setRepeating(false)}
          // Keyboard focus moves the highlight too: a row holding focus (or
          // a control in it) looks hovered, so the fill is its focus mark.
          onFocus={(e) => {
            const target = e.target as HTMLElement;
            if (!target.matches(":focus-visible")) return;
            const index = target.closest("[data-fluid-hover-index]")?.getAttribute("data-fluid-hover-index");
            if (index == null) return;
            keyboardOwns.current = true;
            setActiveIndex(Number(index));
          }}
          onBlur={(e) => {
            const container = containerRef.current;
            if (!container || container.contains(e.relatedTarget as Node)) return;
            // The pointer keeps the highlight it's over.
            if (!container.matches(":hover")) setActiveIndex(null);
            setRepeating(false);
          }}
        >
          {/* Selected backgrounds, merged per contiguous run */}
          {/* Keyed by the snap, so a block that leaves in a snap goes at
              once instead of fading from where the rows no longer are. */}
          <SelectionBackgrounds key={String(snap.key ?? "")} blocks={blocks} />
          {selectionMirrors?.map(
            (el, i) =>
              el &&
              createPortal(<SelectionBackgrounds key={String(snap.key ?? "")} blocks={blocks} />, el, `mirror-${i}`)
          )}

          {/* Hover background, rounded by the shape setting like the
              selection under it. */}
          <FluidHoverHighlight
            hover={hover}
            className={shape.bg}
            transition={repeating || snap.on ? false : undefined}
            onFrame={onHighlightBox}
          >
            {hoverMarker && hover.activeIndex !== null ? hoverMarker(hover.activeIndex) : null}
          </FluidHoverHighlight>
          {/* The header's fill stops 1px short of the header's bottom line,
              and turns --active while its cell is pressed: one surface for
              hover and press. */}
          <FluidHoverHighlight
            rect={headRect}
            session={headHover.session}
            className={cn(shape.bg, "transition-[background-color] duration-80", headPressed && "bg-active")}
          />

          <table
            ref={ref}
            // --table-cell-py is the one source for row height: cells pad by
            // it and TableEmpty holds its rows with it.
            className={cn(
              // Separate borders, each cell drawing its own divider, so a
              // sticky cell paints over the dividers scrolling under it
              // (collapsed borders paint over every cell).
              "w-full border-separate border-spacing-0",
              sizeClasses.variant === "compact" ? "[--table-cell-py:5px]" : "[--table-cell-py:--spacing(2)]",
              sizeClasses.text,
              className
            )}
            {...props}
          >
            {children}
          </table>
        </div>
      </TableContext.Provider>
    );

    // A size prop pins every cell to one ladder step (cells read the context).
    return size ? <SizeProvider size={size}>{table}</SizeProvider> : table;
  }
);

Table.displayName = "Table";

// ── TableHeader ──────────────────────────────────────────

const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("", className)} {...props} />
));

TableHeader.displayName = "TableHeader";

// ── TableBody ────────────────────────────────────────────

const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("", className)} {...props} />
));

TableBody.displayName = "TableBody";

// ── TableRow ─────────────────────────────────────────────

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  index?: number;
  /** A header row keeps its rule when the first body row is selected. For
   *  a header that stays put over scrolling rows: its rule is the bar's
   *  own edge, and each sticky cell repainting it on every selection
   *  change showed, cell by cell. */
  keepRule?: boolean;
}

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ index, keepRule = false, className, style, ...props }, ref) => {
    const internalRef = useRef<HTMLTableRowElement>(null);
    const ctx = useContext(TableContext);

    useRegisterFluidHoverItem(ctx?.registerItem, index, internalRef);

    const isBodyRow = index !== undefined;
    // Each row draws only its bottom border, so the lit row's top edge is the
    // border of the row above it. Both hide under the highlight (Table sets
    // data-under-highlight as its fill covers them), so it has no rule along
    // or through it. Row 0's top edge is the header's border.
    const lit = useFluidHoverSelect(ctx?.activeStore, (active) => isBodyRow && active === index);
    // A selected row, and the row above it, drop their rule too, so a
    // selected run is one block with no lines through or over it.
    const selected = ctx?.selected;
    const nextIndex = isBodyRow ? index + 1 : 0;
    const bySelection =
      !!selected && ((isBodyRow && selected.has(index)) || selected.has(nextIndex));
    const hideBorder = bySelection && !(keepRule && !isBodyRow);

    return (
      <tr
        ref={(node) => {
          (internalRef as React.MutableRefObject<HTMLTableRowElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLTableRowElement | null>).current = node;
        }}
        data-fluid-hover-index={index}
        // Borders fade over 80ms instead of popping as the highlight moves.
        // `is-active` lets every cell read the lit state through the row.
        className={cn(
          "group/row relative z-10 *:border-b *:transition-[border-color] *:duration-80",
          "group-data-snap-rules/table:*:duration-0",
          hideBorder
            ? "*:border-transparent"
            : "*:border-accent/40 data-[under-highlight]:*:border-transparent data-[under-highlight]:*:duration-0",
          lit && "is-active",
          className
        )}
        // Weight goes through the variable font's axis with the same values
        // every component uses: semibold header, normal body.
        style={{
          ...style,
          fontVariationSettings: isBodyRow
            ? fontWeights.normal
            : fontWeights.semibold,
        }}
        {...props}
      />
    );
  }
);

TableRow.displayName = "TableRow";

// ── TableHead ────────────────────────────────────────────

interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  /** Joins the header row's fluid hover: give each header cell that acts
   *  (sorts, moves) its position. */
  hoverIndex?: number;
}

const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(({ hoverIndex, className, ...props }, ref) => {
  const sizeClasses = useSize();
  const ctx = useContext(TableContext);
  const internalRef = useRef<HTMLTableCellElement>(null);
  useRegisterFluidHoverItem(ctx?.registerHead, hoverIndex, internalRef);
  return (
    <th
      ref={(node) => {
        internalRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      data-head-hover={hoverIndex !== undefined || undefined}
      className={cn(
        "text-left text-foreground",
        // py + line box lands the row on the ladder (36px / 28px).
        "py-(--table-cell-py)",
        sizeClasses.variant === "compact" ? "px-2.5" : "px-3",
        className
      )}
      {...props}
    />
  );
});

TableHead.displayName = "TableHead";

// ── TableCell ────────────────────────────────────────────

const TableCell = forwardRef<
  HTMLTableCellElement,
  TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  const sizeClasses = useSize();
  return (
    <td
      ref={ref}
      // Muted at rest, foreground on the lit row, on the same 80ms as the
      // border fade. Same padding as TableHead so every row shares a height.
      className={cn(
        "text-muted-foreground transition-colors duration-80 group-[.is-active]/row:text-foreground",
        "py-(--table-cell-py)",
        sizeClasses.variant === "compact" ? "px-2.5" : "px-3",
        className
      )}
      {...props}
    />
  );
});

TableCell.displayName = "TableCell";

// ── TableEmpty ───────────────────────────────────────────

interface TableEmptyProps extends Omit<HTMLAttributes<HTMLTableRowElement>, "title"> {
  /** How many columns the message spans: the table's column count. */
  columns: number;
  /** One short line saying what belongs here. */
  title?: ReactNode;
  /** One line on how rows get here. */
  description?: ReactNode;
  /** The control that creates the first row, e.g. a Button. */
  action?: ReactNode;
  /** The height to hold, in body rows, so filling the table doesn't shift
   *  what sits under it. Default 3. */
  rows?: number;
}

// Rendered in place of the body rows when there are none. Not a fluid hover
// item (no `index`), so it never lights up.
const TableEmpty = forwardRef<HTMLTableRowElement, TableEmptyProps>(
  ({ columns, title, description, action, rows = 3, children, className, ...props }, ref) => {
    return (
      <tr ref={ref} data-slot="table-empty" className={className} {...props}>
        <td colSpan={columns} className="p-0">
          {/* A body row is one line box plus the cells' padding and its 1px
              bottom border, so `rows` of them stay in step with TableCell
              whatever the ladder step. */}
          <div
            // Pinned to the visible box: sticky at its left edge and as wide
            // as the scroll box (--table-view-w, which DataTable sets), so the
            // message centers on what's in view, not on a table wider than it.
            className="sticky left-0 flex w-(--table-view-w,100%) min-h-[calc(var(--table-empty-rows)*(1lh+2*var(--table-cell-py)+1px))] flex-col items-center justify-center gap-1 px-3 py-4 text-center"
            style={{ "--table-empty-rows": rows } as CSSProperties}
          >
            {title && (
              <span
                className="text-foreground"
                style={{ fontVariationSettings: fontWeights.semibold }}
              >
                {title}
              </span>
            )}
            {description && <span className="text-muted-foreground">{description}</span>}
            {children}
            {action && <div className="mt-2">{action}</div>}
          </div>
        </td>
      </tr>
    );
  }
);

TableEmpty.displayName = "TableEmpty";

// ── Exports ──────────────────────────────────────────────

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty, TABLE_HIGHLIGHT_EVENT };
