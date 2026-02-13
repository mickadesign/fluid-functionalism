import {
  useRef,
  useState,
  useCallback,
  useEffect,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ItemRect {
  top: number;
  height: number;
  left: number;
  width: number;
}

interface CheckboxGroupContextValue {
  registerItem: (index: number, element: HTMLDivElement | null) => void;
  activeIndex: number | null;
}

const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(null);

function useCheckboxGroup() {
  const ctx = useContext(CheckboxGroupContext);
  if (!ctx) throw new Error("useCheckboxGroup must be used within a CheckboxGroup");
  return ctx;
}

interface CheckboxGroupProps {
  children: ReactNode;
  checkedIndices: Set<number>;
}

export default function CheckboxGroup({ children, checkedIndices }: CheckboxGroupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef(new Map<number, HTMLDivElement>());
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [itemRects, setItemRects] = useState<ItemRect[]>([]);
  const sessionRef = useRef(0);
  const groupIdCounter = useRef(0);
  const prevGroupMap = useRef(new Map<number, number>());

  const registerItem = useCallback(
    (index: number, element: HTMLDivElement | null) => {
      if (element) {
        itemsRef.current.set(index, element);
      } else {
        itemsRef.current.delete(index);
      }
    },
    []
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const mouseY = e.clientY;

    let closestIndex: number | null = null;
    let closestDistance = Infinity;
    const rects: ItemRect[] = [];

    itemsRef.current.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      rects[index] = {
        top: rect.top - containerRect.top,
        height: rect.height,
        left: rect.left - containerRect.left,
        width: rect.width,
      };

      const itemCenterY = rect.top + rect.height / 2;
      const distance = Math.abs(mouseY - itemCenterY);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setItemRects(rects);
    setActiveIndex(closestIndex);
  }, []);

  const handleMouseEnter = useCallback(() => {
    sessionRef.current += 1;
  }, []);

  const handleMouseLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const measureItems = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const rects: ItemRect[] = [];
    itemsRef.current.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      rects[index] = {
        top: rect.top - containerRect.top,
        height: rect.height,
        left: rect.left - containerRect.left,
        width: rect.width,
      };
    });
    setItemRects(rects);
  }, []);

  useEffect(() => {
    measureItems();
  }, [measureItems, children]);

  // Group contiguous checked indices into runs with stable IDs
  const runs: { start: number; end: number }[] = [];
  const sortedChecked = [...checkedIndices].sort((a, b) => a - b);
  for (const idx of sortedChecked) {
    const last = runs[runs.length - 1];
    if (last && idx === last.end + 1) {
      last.end = idx;
    } else {
      runs.push({ start: idx, end: idx });
    }
  }

  // Assign stable IDs: reuse previous ID if any member overlaps
  const usedIds = new Set<number>();
  const newGroupMap = new Map<number, number>();
  const checkedGroups = runs.map((run) => {
    let stableId: number | null = null;
    for (let i = run.start; i <= run.end; i++) {
      const prevId = prevGroupMap.current.get(i);
      if (prevId !== undefined && !usedIds.has(prevId)) {
        stableId = prevId;
        break;
      }
    }
    const id = stableId ?? ++groupIdCounter.current;
    usedIds.add(id);
    for (let i = run.start; i <= run.end; i++) {
      newGroupMap.set(i, id);
    }
    return { ...run, id };
  });
  prevGroupMap.current = newGroupMap;

  const activeRect = activeIndex !== null ? itemRects[activeIndex] : null;
  const isHoveringUnchecked = activeIndex !== null && !checkedIndices.has(activeIndex);

  const spring = {
    type: "spring" as const,
    stiffness: 500,
    damping: 35,
    mass: 0.8,
  };

  return (
    <CheckboxGroupContext.Provider value={{ registerItem, activeIndex }}>
      <div
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative flex flex-col gap-0.5 w-72 max-w-full select-none"
      >
        {/* Selected backgrounds (merged for contiguous checked items) */}
        <AnimatePresence>
          {checkedGroups.map((group) => {
            const startRect = itemRects[group.start];
            const endRect = itemRects[group.end];
            if (!startRect || !endRect) return null;
            const mergedTop = startRect.top;
            const mergedHeight = endRect.top + endRect.height - startRect.top;
            const mergedLeft = Math.min(startRect.left, endRect.left);
            const mergedWidth = Math.max(startRect.width, endRect.width);
            return (
              <motion.div
                key={`group-${group.id}`}
                className="absolute rounded-lg bg-neutral-300/50 pointer-events-none"
                initial={false}
                animate={{
                  top: mergedTop,
                  left: mergedLeft,
                  width: mergedWidth,
                  height: mergedHeight,
                  opacity: isHoveringUnchecked ? 0.8 : 1,
                }}
                exit={{ opacity: 0 }}
                transition={{ ...spring, opacity: { duration: 0.15 } }}
              />
            );
          })}
        </AnimatePresence>

        {/* Hover background */}
        <AnimatePresence>
          {activeRect && (
            <motion.div
              key={sessionRef.current}
              className="absolute rounded-lg bg-neutral-200/40 pointer-events-none"
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
                ...spring,
                opacity: { duration: 0.15 },
              }}
            />
          )}
        </AnimatePresence>

        {children}
      </div>
    </CheckboxGroupContext.Provider>
  );
}

interface CheckboxItemProps {
  label: string;
  index: number;
  checked: boolean;
  onToggle: () => void;
}

export function CheckboxItem({ label, index, checked, onToggle }: CheckboxItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const hasMounted = useRef(false);
  const { registerItem, activeIndex } = useCheckboxGroup();

  useEffect(() => {
    registerItem(index, ref.current);
    return () => registerItem(index, null);
  }, [index, registerItem]);

  useEffect(() => {
    hasMounted.current = true;
  }, []);

  const isActive = activeIndex === index;
  const skipAnimation = !hasMounted.current;

  return (
    <div
      ref={ref}
      onClick={onToggle}
      className="relative z-10 flex items-center gap-2.5 rounded-lg px-3 py-2 cursor-pointer"
    >
      {/* Checkbox */}
      <div className="relative w-[18px] h-[18px] shrink-0">
        {/* Border */}
        <div
          className={`absolute inset-0 rounded-[5px] border-solid transition-all duration-120 ${
            checked
              ? "border-[1.5px] border-transparent"
              : isActive
              ? "border-[1.5px] border-neutral-400"
              : "border-[1.5px] border-neutral-300"
          }`}
        />
        {/* Check mark */}
        <AnimatePresence>
          {checked && (
            <motion.svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgb(23 23 23)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute inset-0"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 1 }}
            >
              <motion.path
                d="M6 12L10 16L18 8"
                initial={{ pathLength: skipAnimation ? 1 : 0 }}
                animate={{ pathLength: 1, transition: { duration: 0.12, ease: "easeOut" } }}
                exit={{ pathLength: 0, transition: { duration: 0.06, ease: "easeIn" } }}
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </div>

      {/* Label */}
      <span className="inline-grid text-[13px]">
        <span
          className="col-start-1 row-start-1 invisible"
          style={{ fontVariationSettings: "'wght' 550" }}
          aria-hidden="true"
        >
          {label}
        </span>
        <span
          className={`col-start-1 row-start-1 transition-[color,font-variation-settings] duration-120 ${
            checked || isActive ? "text-neutral-900" : "text-neutral-500"
          }`}
          style={{ fontVariationSettings: `'wght' ${checked ? 550 : 400}` }}
        >
          {label}
        </span>
      </span>
    </div>
  );
}
