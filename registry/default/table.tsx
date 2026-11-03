"use client";

import {
  useRef,
  useMemo,
  createContext,
  useContext,
  forwardRef,
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
}

const TableContext = createContext<TableContextValue | null>(null);

// ── Table ────────────────────────────────────────────────

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
  /** Pins the table's rows to one step of the size ladder (default 36px,
   *  compact 28px). Omitted, it follows the surrounding SizeProvider. */
  size?: SizeVariant;
}

const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ children, size, className, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sizeClasses = useSize(size);

    const hover = useFluidHover(containerRef);
    const {
      activeStore,
      handlers,
      registerItem,
    } = hover;

    const contextValue = useMemo(
      () => ({ registerItem, activeStore }),
      [registerItem, activeStore]
    );

    const table = (
      <TableContext.Provider value={contextValue}>
        {/* A div can't live inside <table>, so the highlight sits in this
            positioned wrapper behind the table and rows ride above it (z-10). */}
        <div
          ref={containerRef}
          className="relative"
          onMouseEnter={handlers.onMouseEnter}
          onMouseMove={handlers.onMouseMove}
          onMouseLeave={handlers.onMouseLeave}
          onClick={handlers.onClick}
        >
          {/* Hover background */}
          <FluidHoverHighlight hover={hover} />

          <table
            ref={ref}
            className={cn("w-full border-collapse", sizeClasses.text, className)}
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
    const hideBorder = litState > 0;

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
        sizeClasses.variant === "compact" ? "px-2.5 py-[5px]" : "px-3 py-2",
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
        sizeClasses.variant === "compact" ? "px-2.5 py-[5px]" : "px-3 py-2",
        className
      )}
      {...props}
    />
  );
});

TableCell.displayName = "TableCell";

// ── Exports ──────────────────────────────────────────────

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
