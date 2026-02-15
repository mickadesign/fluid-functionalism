import {
  useRef,
  useEffect,
  createContext,
  useContext,
  forwardRef,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";
import { springs } from "../lib/springs";
import { useProximityHover } from "../lib/use-proximity-hover";

interface DropdownContextValue {
  registerItem: (index: number, element: HTMLElement | null) => void;
  activeIndex: number | null;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

export function useDropdown() {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error("useDropdown must be used within a Dropdown");
  return ctx;
}

interface DropdownProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  checkedIndex?: number;
}

const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  ({ children, checkedIndex, className, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const {
      activeIndex,
      setActiveIndex,
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
    const checkedRect =
      checkedIndex != null ? itemRects[checkedIndex] : null;
    const isHoveringOther =
      activeIndex !== null && activeIndex !== checkedIndex;

    return (
      <DropdownContext.Provider value={{ registerItem, activeIndex }}>
        <div
          ref={(node) => {
            (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }}
          onMouseEnter={handlers.onMouseEnter}
          onMouseMove={handlers.onMouseMove}
          onMouseLeave={handlers.onMouseLeave}
          onFocus={(e) => {
            const indexAttr = (e.target as HTMLElement)
              .closest("[data-proximity-index]")
              ?.getAttribute("data-proximity-index");
            if (indexAttr != null) setActiveIndex(Number(indexAttr));
          }}
          onBlur={(e) => {
            if (containerRef.current?.contains(e.relatedTarget as Node)) return;
            setActiveIndex(null);
          }}
          onKeyDown={(e) => {
            if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(e.key)) return;
            e.preventDefault();
            const items = Array.from(
              containerRef.current?.querySelectorAll('[role="menuitem"]') ?? []
            ) as HTMLElement[];
            const currentIdx = items.indexOf(e.target as HTMLElement);
            if (currentIdx === -1) return;
            const next = ["ArrowDown", "ArrowRight"].includes(e.key)
              ? (currentIdx + 1) % items.length
              : (currentIdx - 1 + items.length) % items.length;
            items[next].focus();
          }}
          role="menu"
          className={cn(
            "relative flex flex-col gap-0.5 w-72 max-w-full rounded-xl bg-card shadow-[0_8px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-border/60 p-1 select-none",
            className
          )}
          {...props}
        >
          {/* Selected background */}
          <AnimatePresence>
            {checkedRect && (
              <motion.div
                className="absolute rounded-lg bg-selected/50 dark:bg-accent/40 pointer-events-none"
                initial={false}
                animate={{
                  top: checkedRect.top,
                  left: checkedRect.left,
                  width: checkedRect.width,
                  height: checkedRect.height,
                  opacity: isHoveringOther ? 0.8 : 1,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  ...springs.default,
                  opacity: { duration: 0.15 },
                }}
              />
            )}
          </AnimatePresence>

          {/* Hover background */}
          <AnimatePresence>
            {activeRect && (
              <motion.div
                key={sessionRef.current}
                className="absolute rounded-lg bg-accent/40 dark:bg-accent/25 pointer-events-none"
                initial={{
                  opacity: 0,
                  top: checkedRect?.top ?? activeRect.top,
                  left: checkedRect?.left ?? activeRect.left,
                  width: checkedRect?.width ?? activeRect.width,
                  height: checkedRect?.height ?? activeRect.height,
                }}
                animate={{
                  opacity: 1,
                  top: activeRect.top,
                  left: activeRect.left,
                  width: activeRect.width,
                  height: activeRect.height,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  ...springs.default,
                  opacity: { duration: 0.15 },
                }}
              />
            )}
          </AnimatePresence>

          {children}
        </div>
      </DropdownContext.Provider>
    );
  }
);

Dropdown.displayName = "Dropdown";

export { Dropdown };
export default Dropdown;
