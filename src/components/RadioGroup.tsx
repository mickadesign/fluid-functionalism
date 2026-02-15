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
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "../lib/utils";
import { springs } from "../lib/springs";
import { fontWeights } from "../lib/font-weight";
import { useProximityHover } from "../lib/use-proximity-hover";

interface RadioGroupContextValue {
  registerItem: (index: number, element: HTMLElement | null) => void;
  activeIndex: number | null;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

function useRadioGroupContext() {
  const ctx = useContext(RadioGroupContext);
  if (!ctx) throw new Error("useRadioGroup must be used within a RadioGroup");
  return ctx;
}

interface RadioGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  children: ReactNode;
  selectedIndex: number;
  value?: string;
  onValueChange?: (value: string) => void;
}

const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ children, selectedIndex, value, onValueChange, className, ...props }, ref) => {
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
    const selectedRect = itemRects[selectedIndex];
    const isHoveringOther =
      activeIndex !== null && activeIndex !== selectedIndex;

    const content = (
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
          // Sync proximity hover with keyboard focus
          const target = e.target as HTMLElement;
          const indexAttr = target
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
            containerRef.current?.querySelectorAll('[role="radio"]') ?? []
          ) as HTMLElement[];
          const currentIdx = items.indexOf(e.target as HTMLElement);
          if (currentIdx === -1) return;
          const next = ["ArrowDown", "ArrowRight"].includes(e.key)
            ? (currentIdx + 1) % items.length
            : (currentIdx - 1 + items.length) % items.length;
          items[next].focus();
          items[next].click();
        }}
        role="radiogroup"
        className={cn(
          "relative flex flex-col gap-0.5 w-72 max-w-full select-none",
          className
        )}
        {...props}
      >
        {/* Selected background */}
        {selectedRect && (
          <motion.div
            className="absolute rounded-lg bg-selected/50 dark:bg-accent/40 pointer-events-none"
            initial={false}
            animate={{
              top: selectedRect.top,
              left: selectedRect.left,
              width: selectedRect.width,
              height: selectedRect.height,
              opacity: isHoveringOther ? 0.8 : 1,
            }}
            transition={{
              ...springs.default,
              opacity: { duration: 0.15 },
            }}
          />
        )}

        {/* Hover background */}
        <AnimatePresence>
          {activeRect && (
            <motion.div
              key={sessionRef.current}
              className="absolute rounded-lg bg-accent/40 dark:bg-accent/25 pointer-events-none"
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
    );

    // If Radix value/onValueChange provided, wrap with Radix RadioGroup
    if (value !== undefined && onValueChange) {
      return (
        <RadioGroupContext.Provider value={{ registerItem, activeIndex }}>
          <RadioGroupPrimitive.Root
            value={value}
            onValueChange={onValueChange}
            asChild
          >
            {content}
          </RadioGroupPrimitive.Root>
        </RadioGroupContext.Provider>
      );
    }

    return (
      <RadioGroupContext.Provider value={{ registerItem, activeIndex }}>
        {content}
      </RadioGroupContext.Provider>
    );
  }
);

RadioGroup.displayName = "RadioGroup";

interface RadioItemProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  index: number;
  selected: boolean;
  onSelect: () => void;
  value?: string;
}

const RadioItem = forwardRef<HTMLDivElement, RadioItemProps>(
  ({ label, index, selected, onSelect, value, className, ...props }, ref) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const hasMounted = useRef(false);
    const { registerItem, activeIndex } = useRadioGroupContext();

    useEffect(() => {
      registerItem(index, internalRef.current);
      return () => registerItem(index, null);
    }, [index, registerItem]);

    useEffect(() => {
      hasMounted.current = true;
    }, []);

    const isActive = activeIndex === index;
    const skipAnimation = !hasMounted.current;

    return (
      <div
        ref={(node) => {
          (internalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        data-proximity-index={index}
        tabIndex={selected ? 0 : -1}
        role="radio"
        aria-checked={selected}
        aria-label={label}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onSelect();
          }
        }}
        className={cn(
          "relative z-10 flex items-center gap-2.5 rounded-lg px-3 py-2 cursor-pointer outline-none",
          className
        )}
        {...props}
      >
        {/* Radio circle */}
        <div className="relative w-[18px] h-[18px] shrink-0">
          {/* Border */}
          <div
            className={cn(
              "absolute inset-0 rounded-full border-solid transition-all duration-120",
              selected
                ? "border-[1.5px] border-transparent"
                : isActive
                ? "border-[1.5px] border-neutral-400 dark:border-neutral-500"
                : "border-[1.5px] border-border"
            )}
          />
          {/* Dot */}
          <AnimatePresence>
            {selected && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{
                  opacity: skipAnimation ? 1 : 0,
                  scale: skipAnimation ? 1 : 0.3,
                }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.3 }}
                transition={springs.radio}
              >
                <div className="w-[8px] h-[8px] rounded-full bg-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Label */}
        <span className="inline-grid text-[13px]">
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
              selected || isActive
                ? "text-foreground"
                : "text-muted-foreground"
            )}
            style={{
              fontVariationSettings: selected
                ? fontWeights.semibold
                : fontWeights.normal,
            }}
          >
            {label}
          </span>
        </span>

        {/* Hidden Radix radio input for accessibility */}
        {value !== undefined && (
          <RadioGroupPrimitive.Item
            value={value}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
          />
        )}
      </div>
    );
  }
);

RadioItem.displayName = "RadioItem";

export { RadioGroup, RadioItem };
export default RadioGroup;
