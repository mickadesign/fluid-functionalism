"use client";

import {
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
}

const NO_SELECTION: readonly number[] = [];

const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ children, size, selectedIndices = NO_SELECTION, className, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sizeClasses = useSize(size);

    const hover = useFluidHover(containerRef);
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
    const blocks = useMergeSplitBlocks(runs, itemRects, shape.mergedRadius);

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

    // A held arrow key repeats faster than the highlight's spring settles,
    // so while it repeats the highlight snaps row to row and stays on the
    // focused one; a single press, and the pointer, still glide.
    const [repeating, setRepeating] = useState(false);

    const selectedKey = selectedIndices.join(",");
    const selected = useMemo(
      () => new Set(selectedKey ? selectedKey.split(",").map(Number) : []),
      [selectedKey]
    );

    const contextValue = useMemo(
      () => ({ registerItem, activeStore, selected }),
      [registerItem, activeStore, selected]
    );

    const table = (
      <TableContext.Provider value={contextValue}>
        {/* A div can't live inside <table>, so the highlight sits in this
            positioned wrapper behind the table and rows ride above it (z-10). */}
        <div
          ref={containerRef}
          className="relative"
          onMouseEnter={(e) => fromPointer(e) && handlers.onMouseEnter()}
          onMouseMove={(e) => fromPointer(e) && handlers.onMouseMove(e)}
          onMouseLeave={(e) => fromPointer(e) && handlers.onMouseLeave()}
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
          <SelectionBackgrounds blocks={blocks} />

          {/* Hover background, rounded by the shape setting like the
              selection under it. */}
          <FluidHoverHighlight hover={hover} className={shape.bg} transition={repeating ? false : undefined} />

          <table
            ref={ref}
            // --table-cell-py is the one source for row height: cells pad by
            // it and TableEmpty holds its rows with it.
            className={cn(
              "w-full border-collapse",
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
}

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ index, className, style, ...props }, ref) => {
    const internalRef = useRef<HTMLTableRowElement>(null);
    const ctx = useContext(TableContext);

    useRegisterFluidHoverItem(ctx?.registerItem, index, internalRef);

    const isBodyRow = index !== undefined;
    // Each row draws only its bottom border, so the lit row's top edge is the
    // border of the row above it. Hiding both leaves the highlight with no
    // rule along or through it. Row 0's top edge is the header's border.
    // 2: this row is lit; 1: its border borders the lit row; 0: neither.
    const litState = useFluidHoverSelect(ctx?.activeStore, (active) => {
      if (active === null) return 0;
      if (!isBodyRow) return active === 0 ? 1 : 0;
      if (index === active) return 2;
      return index === active - 1 ? 1 : 0;
    });
    // A selected row, and the row above it, drop their rule too, so a
    // selected run is one block with no lines through or over it.
    const selected = ctx?.selected;
    const nextIndex = isBodyRow ? index + 1 : 0;
    const bySelection =
      !!selected && ((isBodyRow && selected.has(index)) || selected.has(nextIndex));
    const hideBorder = litState > 0 || bySelection;

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
          "group/row relative z-10 border-b transition-[border-color] duration-80",
          hideBorder ? "border-transparent" : "border-accent/40",
          litState === 2 && "is-active",
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

const TableHead = forwardRef<
  HTMLTableCellElement,
  ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  const sizeClasses = useSize();
  return (
    <th
      ref={ref}
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
            className="flex min-h-[calc(var(--table-empty-rows)*(1lh+2*var(--table-cell-py)+1px))] flex-col items-center justify-center gap-1 px-3 py-4 text-center"
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

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty };
