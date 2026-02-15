import {
  useId,
  useRef,
  useCallback,
  useEffect,
  createContext,
  useContext,
  forwardRef,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { springs } from "../lib/springs";
import { fontWeights } from "../lib/font-weight";
import { useProximityHover } from "../lib/use-proximity-hover";

interface SubtleTabContextValue {
  registerTab: (index: number, element: HTMLElement | null) => void;
  hoveredIndex: number | null;
  selectedIndex: number;
  onSelect: (index: number) => void;
  idPrefix: string;
}

const SubtleTabContext = createContext<SubtleTabContextValue | null>(null);

function useSubtleTab() {
  const ctx = useContext(SubtleTabContext);
  if (!ctx) throw new Error("useSubtleTab must be used within a SubtleTab");
  return ctx;
}

interface SubtleTabProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  children: ReactNode;
  selectedIndex: number;
  onSelect: (index: number) => void;
  idPrefix?: string;
}

const SubtleTab = forwardRef<HTMLDivElement, SubtleTabProps>(
  ({ children, selectedIndex, onSelect, idPrefix: idPrefixProp, className, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const isMouseInside = useRef(false);
    const generatedId = useId();
    const idPrefix = idPrefixProp || generatedId;

    const {
      activeIndex: hoveredIndex,
      setActiveIndex: setHoveredIndex,
      itemRects: tabRects,
      handlers,
      registerItem: registerTab,
      measureItems: measureTabs,
    } = useProximityHover(containerRef, { axis: "x" });

    useEffect(() => {
      measureTabs();
    }, [measureTabs, children]);

    // Wrap handlers to track isMouseInside
    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        isMouseInside.current = true;
        handlers.onMouseMove(e);
      },
      [handlers]
    );

    const handleMouseLeave = useCallback(() => {
      isMouseInside.current = false;
      handlers.onMouseLeave();
    }, [handlers]);

    const selectedRect = tabRects[selectedIndex];
    const hoverRect =
      hoveredIndex !== null ? tabRects[hoveredIndex] : null;
    const isHoveringSelected = hoveredIndex === selectedIndex;
    const isHovering = hoveredIndex !== null && !isHoveringSelected;

    return (
      <SubtleTabContext.Provider
        value={{ registerTab, hoveredIndex, selectedIndex, onSelect, idPrefix }}
      >
        <div
          ref={(node) => {
            (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onFocus={(e) => {
            const indexAttr = (e.target as HTMLElement)
              .closest("[data-proximity-index]")
              ?.getAttribute("data-proximity-index");
            if (indexAttr != null) setHoveredIndex(Number(indexAttr));
          }}
          onBlur={(e) => {
            if (containerRef.current?.contains(e.relatedTarget as Node)) return;
            if (isMouseInside.current) return;
            setHoveredIndex(null);
          }}
          onKeyDown={(e) => {
            const items = Array.from(
              containerRef.current?.querySelectorAll('[role="tab"]') ?? []
            ) as HTMLElement[];
            const currentIdx = items.indexOf(e.target as HTMLElement);
            if (currentIdx === -1) return;

            if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
              e.preventDefault();
              const next = ["ArrowRight", "ArrowDown"].includes(e.key)
                ? (currentIdx + 1) % items.length
                : (currentIdx - 1 + items.length) % items.length;
              items[next].focus();
            } else if (e.key === "Home") {
              e.preventDefault();
              items[0]?.focus();
            } else if (e.key === "End") {
              e.preventDefault();
              items[items.length - 1]?.focus();
            }
          }}
          className={cn(
            "relative flex items-center gap-1 select-none overflow-x-auto max-w-full scrollbar-hide px-6",
            className
          )}
          role="tablist"
          {...props}
        >
          {/* Selected pill */}
          {selectedRect && (
            <motion.div
              className="absolute rounded-full bg-selected/50 dark:bg-accent/40 pointer-events-none"
              initial={false}
              animate={{
                left: selectedRect.left,
                width: selectedRect.width,
                top: selectedRect.top,
                height: selectedRect.height,
                opacity: isHovering ? 0.8 : 1,
              }}
              transition={{
                ...springs.tab,
                opacity: { duration: 0.15 },
              }}
            />
          )}

          {/* Hover pill */}
          <AnimatePresence>
            {hoverRect && !isHoveringSelected && selectedRect && (
              <motion.div
                className="absolute rounded-full bg-accent/60 dark:bg-accent/30 pointer-events-none"
                initial={{
                  left: selectedRect.left,
                  width: selectedRect.width,
                  top: selectedRect.top,
                  height: selectedRect.height,
                  opacity: 0,
                }}
                animate={{
                  left: hoverRect.left,
                  width: hoverRect.width,
                  top: hoverRect.top,
                  height: hoverRect.height,
                  opacity: 0.4,
                }}
                exit={
                  !isMouseInside.current && selectedRect
                    ? {
                        left: selectedRect.left,
                        width: selectedRect.width,
                        top: selectedRect.top,
                        height: selectedRect.height,
                        opacity: 0,
                      }
                    : { opacity: 0 }
                }
                transition={{
                  ...springs.tab,
                  opacity: { duration: 0.15 },
                }}
              />
            )}
          </AnimatePresence>

          {children}
        </div>
      </SubtleTabContext.Provider>
    );
  }
);

SubtleTab.displayName = "SubtleTab";

interface SubtleTabItemProps extends HTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  index: number;
}

const SubtleTabItem = forwardRef<HTMLButtonElement, SubtleTabItemProps>(
  ({ icon: Icon, label, index, className, ...props }, ref) => {
    const internalRef = useRef<HTMLButtonElement>(null);
    const { registerTab, hoveredIndex, selectedIndex, onSelect, idPrefix } =
      useSubtleTab();

    useEffect(() => {
      registerTab(index, internalRef.current);
      return () => registerTab(index, null);
    }, [index, registerTab]);

    const isActive = hoveredIndex === index || selectedIndex === index;

    return (
      <button
        ref={(node) => {
          (internalRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        }}
        data-proximity-index={index}
        id={`${idPrefix}-tab-${index}`}
        role="tab"
        aria-selected={selectedIndex === index}
        aria-controls={`${idPrefix}-panel-${index}`}
        tabIndex={selectedIndex === index ? 0 : -1}
        onClick={() => onSelect(index)}
        className={cn(
          "relative z-10 flex items-center gap-2 rounded-full px-3 py-2 cursor-pointer bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:ring-offset-1",
          className
        )}
        {...props}
      >
        <Icon
          size={16}
          strokeWidth={isActive ? 2 : 1.5}
          className={cn(
            "transition-[color,stroke-width] duration-120",
            isActive ? "text-foreground" : "text-muted-foreground"
          )}
        />
        <span className="inline-grid text-[13px] whitespace-nowrap">
          <span
            className="col-start-1 row-start-1 invisible"
            style={{ fontVariationSettings: fontWeights.semibold }}
            aria-hidden="true"
          >
            {label}
          </span>
          <span
            className={cn(
              "col-start-1 row-start-1 transition-[color,font-variation-settings] duration-120",
              isActive ? "text-foreground" : "text-muted-foreground"
            )}
            style={{
              fontVariationSettings:
                selectedIndex === index
                  ? fontWeights.semibold
                  : fontWeights.normal,
            }}
          >
            {label}
          </span>
        </span>
      </button>
    );
  }
);

SubtleTabItem.displayName = "SubtleTabItem";

interface SubtleTabPanelProps extends HTMLAttributes<HTMLDivElement> {
  index: number;
  selectedIndex: number;
  idPrefix: string;
  children: ReactNode;
}

const SubtleTabPanel = forwardRef<HTMLDivElement, SubtleTabPanelProps>(
  ({ index, selectedIndex, idPrefix, children, className, ...props }, ref) => {
    const isSelected = selectedIndex === index;

    return (
      <div
        ref={ref}
        id={`${idPrefix}-panel-${index}`}
        role="tabpanel"
        aria-labelledby={`${idPrefix}-tab-${index}`}
        hidden={!isSelected}
        tabIndex={0}
        className={cn(
          "outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 rounded-lg",
          className
        )}
        {...props}
      >
        {isSelected && children}
      </div>
    );
  }
);

SubtleTabPanel.displayName = "SubtleTabPanel";

export { SubtleTab, SubtleTabItem, SubtleTabPanel };
export default SubtleTab;
