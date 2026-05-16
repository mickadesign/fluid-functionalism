"use client";

import {
  Children,
  useRef,
  useState,
  useEffect,
  createContext,
  useContext,
  forwardRef,
  isValidElement,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import { useProximityHover } from "@/hooks/use-proximity-hover";
import { useShape } from "@/lib/shape-context";

interface RadioGroupContextValue {
  registerItem: (index: number, element: HTMLElement | null) => void;
  activeIndex: number | null;
  selectedIndex: number | null;
  selectedValue?: string;
  onValueChange?: (value: string) => void;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

function useRadioGroupContext() {
  const ctx = useContext(RadioGroupContext);
  if (!ctx) throw new Error("useRadioGroup must be used within a RadioGroup");
  return ctx;
}

interface RadioGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  children: ReactNode;
  selectedIndex?: number;
  value?: string;
  onValueChange?: (value: string) => void;
}

const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ children, selectedIndex, value, onValueChange, className, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const childValues = Children.toArray(children)
      .filter(isValidElement)
      .map((child) => (child.props as { value?: string }).value);
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

    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const resolvedSelectedIndex =
      value !== undefined
        ? childValues.findIndex((childValue) => childValue === value)
        : selectedIndex ?? -1;

    const activeRect = activeIndex !== null ? itemRects[activeIndex] : null;
    const focusRect = focusedIndex !== null ? itemRects[focusedIndex] : null;
    const selectedRect =
      resolvedSelectedIndex >= 0 ? itemRects[resolvedSelectedIndex] : null;
    const isHoveringOther =
      activeIndex !== null && activeIndex !== resolvedSelectedIndex;
    const shape = useShape();

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
          const indexAttr = (e.target as HTMLElement)
            .closest("[data-proximity-index]")
            ?.getAttribute("data-proximity-index");
          if (indexAttr != null) {
            const idx = Number(indexAttr);
            setActiveIndex(idx);
            setFocusedIndex(
              (e.target as HTMLElement).matches(":focus-visible") ? idx : null
            );
          }
        }}
        onBlur={(e) => {
          if (containerRef.current?.contains(e.relatedTarget as Node)) return;
          setFocusedIndex(null);
          setActiveIndex(null);
        }}
        onKeyDown={(e) => {
          const items = Array.from(
            containerRef.current?.querySelectorAll('[role="radio"]') ?? []
          ) as HTMLElement[];
          const currentIdx = items.indexOf(e.target as HTMLElement);
          if (currentIdx === -1) return;

          if (["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(e.key)) {
            e.preventDefault();
            const next = ["ArrowDown", "ArrowRight"].includes(e.key)
              ? (currentIdx + 1) % items.length
              : (currentIdx - 1 + items.length) % items.length;
            items[next].focus();
            items[next].click();
          } else if (e.key === "Home") {
            e.preventDefault();
            items[0]?.focus();
            items[0]?.click();
          } else if (e.key === "End") {
            e.preventDefault();
            items[items.length - 1]?.focus();
            items[items.length - 1]?.click();
          }
        }}
        role="radiogroup"
        className={cn(
          "relative flex flex-col w-72 max-w-full select-none",
          className
        )}
        {...props}
      >
        {/* Selected background */}
        {selectedRect && (
          <motion.div
            className={`absolute ${shape.bg} bg-active pointer-events-none`}
            initial={false}
            animate={{
              top: selectedRect.top,
              left: selectedRect.left,
              width: selectedRect.width,
              height: selectedRect.height,
              opacity: isHoveringOther ? 0.8 : 1,
            }}
            transition={{
              ...springs.moderate,
              opacity: { duration: 0.08 },
            }}
          />
        )}

        {/* Hover background */}
        <AnimatePresence>
          {activeRect && (
            <motion.div
              key={sessionRef.current}
              className={`absolute ${shape.bg} bg-hover pointer-events-none`}
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
              exit={{ opacity: 0, transition: { duration: 0.06 } }}
              transition={{
                ...springs.fast,
                opacity: { duration: 0.08 },
              }}
            />
          )}
        </AnimatePresence>

        {/* Focus ring */}
        <AnimatePresence>
          {focusRect && (
            <motion.div
              className={`absolute ${shape.focusRing} pointer-events-none z-20 border border-[#6B97FF]`}
              initial={false}
              animate={{
                left: focusRect.left - 2,
                top: focusRect.top - 2,
                width: focusRect.width + 4,
                height: focusRect.height + 4,
              }}
              exit={{ opacity: 0, transition: { duration: 0.06 } }}
              transition={{
                ...springs.fast,
                opacity: { duration: 0.08 },
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
        <RadioGroupContext.Provider
          value={{
            registerItem,
            activeIndex,
            selectedIndex: resolvedSelectedIndex >= 0 ? resolvedSelectedIndex : null,
            selectedValue: value,
            onValueChange,
          }}
        >
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
      <RadioGroupContext.Provider
        value={{
          registerItem,
          activeIndex,
          selectedIndex: selectedIndex ?? null,
        }}
      >
        {content}
      </RadioGroupContext.Provider>
    );
  }
);

RadioGroup.displayName = "RadioGroup";

interface RadioItemProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  index: number;
  selected?: boolean;
  onSelect?: () => void;
  value?: string;
}

const RadioItem = forwardRef<HTMLDivElement, RadioItemProps>(
  ({ label, index, selected, onSelect, value, className, ...props }, ref) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const hasMounted = useRef(false);
    const {
      registerItem,
      activeIndex,
      selectedIndex,
      selectedValue,
      onValueChange,
    } = useRadioGroupContext();

    useEffect(() => {
      registerItem(index, internalRef.current);
      return () => registerItem(index, null);
    }, [index, registerItem]);

    useEffect(() => {
      hasMounted.current = true;
    }, []);

    const isActive = activeIndex === index;
    const skipAnimation = !hasMounted.current;
    const shape = useShape();
    const isSelected =
      value !== undefined && selectedValue !== undefined
        ? selectedValue === value
        : selected ?? selectedIndex === index;

    const handleSelect = () => {
      if (value !== undefined) {
        onValueChange?.(value);
      }
      onSelect?.();
    };

    return (
      <div
        ref={(node) => {
          (internalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        data-proximity-index={index}
        tabIndex={isSelected ? 0 : -1}
        role="radio"
        aria-checked={isSelected}
        aria-label={label}
        onClick={handleSelect}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            handleSelect();
          }
        }}
        className={cn(
          `relative z-10 flex items-center gap-2.5 ${shape.item} px-3 py-1.5 cursor-pointer outline-none`,
          className
        )}
        {...props}
      >
        {/* Radio circle */}
        <div className="relative w-[15px] h-[15px] shrink-0">
          {/* Border */}
          <div
            className={cn(
              "absolute inset-0 rounded-full border-solid transition-all duration-80",
              isSelected
                ? "border-[1.5px] border-transparent"
                : isActive
                ? "border-[1.5px] border-neutral-400 dark:border-neutral-500"
                : "border-[1.5px] border-border"
            )}
          />
          {/* Dot */}
          <AnimatePresence>
            {isSelected && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{
                  opacity: skipAnimation ? 1 : 0,
                  scale: skipAnimation ? 1 : 0.3,
                }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.3, transition: { duration: 0.04 } }}
                transition={springs.fast}
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
              "col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80",
              isSelected || isActive
                ? "text-foreground"
                : "text-muted-foreground"
            )}
            style={{
              fontVariationSettings: isSelected
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
