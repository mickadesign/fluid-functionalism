"use client";

import {
  useRef,
  useEffect,
  useMemo,
  createContext,
  useContext,
  forwardRef,
  type ReactNode,
  type HTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import { SizeProvider, useSize, type SizeVariant } from "@/lib/size-context";
import { useProximityHover } from "@/hooks/use-proximity-hover";

// ── Context ──────────────────────────────────────────────

interface TableContextValue {
  registerItem: (index: number, element: HTMLElement | null) => void;
  activeIndex: number | null;
}

const TableContext = createContext<TableContextValue | null>(null);

// ── Table ────────────────────────────────────────────────

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
  /** Pins the table's rows to one step of the size ladder (default 36px,
   *  compact 28px — see /docs/sizes). Omitted, it follows the surrounding
   *  SizeProvider. */
  size?: SizeVariant;
}

const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ children, size, className, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sizeClasses = useSize(size);

    const {
      activeIndex,
      itemRects,
      sessionRef,
      handlers,
      registerItem,
      measureItems,
    } = useProximityHover(containerRef);

    useEffect(() => {
      measureItems();
    }, [measureItems, children]);

    const activeRect = activeIndex !== null ? itemRects[activeIndex] : null;

    const contextValue = useMemo(
      () => ({ registerItem, activeIndex }),
      [registerItem, activeIndex]
    );

    const table = (
      <TableContext.Provider value={contextValue}>
        <div
          ref={containerRef}
          className="relative"
          onMouseEnter={handlers.onMouseEnter}
          onMouseMove={handlers.onMouseMove}
          onMouseLeave={handlers.onMouseLeave}
        >
          {/* Hover background */}
          <AnimatePresence>
            {activeRect && (
              <motion.div
                key={sessionRef.current}
                className="absolute bg-hover pointer-events-none"
                initial={{
                  opacity: 0,
                  top: activeRect.top,
                  left: activeRect.left,
                  width: activeRect.width,
                  height: activeRect.height,
                }}
                animate={{
                  opacity: 1,
                  top: activeRect.top,
                  left: activeRect.left,
                  width: activeRect.width,
                  height: activeRect.height,
                }}
                exit={{ opacity: 0, transition: spring.fast.exit }}
                transition={{
                  ...spring.fast,
                  opacity: { duration: 0.08 },
                }}
              />
            )}
          </AnimatePresence>

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

    useEffect(() => {
      if (index === undefined || !ctx) return;
      ctx.registerItem(index, internalRef.current);
      return () => ctx.registerItem(index, null);
    }, [index, ctx]);

    const isBodyRow = index !== undefined;
    const activeIdx = ctx?.activeIndex ?? null;
    const hideBorder = activeIdx !== null && (
      (isBodyRow && (index === activeIdx || index === activeIdx - 1)) ||
      (!isBodyRow && activeIdx === 0)
    );

    return (
      <tr
        ref={(node) => {
          (internalRef as React.MutableRefObject<HTMLTableRowElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLTableRowElement | null>).current = node;
        }}
        data-proximity-index={index}
        className={cn(
          "group/row relative z-10 border-b transition-[border-color] duration-80",
          hideBorder ? "border-transparent" : "border-accent/40",
          isBodyRow && activeIdx === index && "is-active",
          className
        )}
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
