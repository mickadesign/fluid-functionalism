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

interface RadioGroupContextValue {
  registerItem: (index: number, element: HTMLDivElement | null) => void;
  activeIndex: number | null;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

function useRadioGroup() {
  const ctx = useContext(RadioGroupContext);
  if (!ctx) throw new Error("useRadioGroup must be used within a RadioGroup");
  return ctx;
}

interface RadioGroupProps {
  children: ReactNode;
  selectedIndex: number;
}

export default function RadioGroup({ children, selectedIndex }: RadioGroupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef(new Map<number, HTMLDivElement>());
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [itemRects, setItemRects] = useState<ItemRect[]>([]);
  const sessionRef = useRef(0);

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

  const activeRect = activeIndex !== null ? itemRects[activeIndex] : null;
  const selectedRect = itemRects[selectedIndex];
  const isHoveringOther = activeIndex !== null && activeIndex !== selectedIndex;

  const spring = {
    type: "spring" as const,
    stiffness: 500,
    damping: 35,
    mass: 0.8,
  };

  return (
    <RadioGroupContext.Provider value={{ registerItem, activeIndex }}>
      <div
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative flex flex-col gap-0.5 w-72 max-w-full select-none"
      >
        {/* Selected background */}
        {selectedRect && (
          <motion.div
            className="absolute rounded-lg bg-neutral-300/50 pointer-events-none"
            initial={false}
            animate={{
              top: selectedRect.top,
              left: selectedRect.left,
              width: selectedRect.width,
              height: selectedRect.height,
              opacity: isHoveringOther ? 0.8 : 1,
            }}
            transition={{ ...spring, opacity: { duration: 0.15 } }}
          />
        )}

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
    </RadioGroupContext.Provider>
  );
}

interface RadioItemProps {
  label: string;
  index: number;
  selected: boolean;
  onSelect: () => void;
}

export function RadioItem({ label, index, selected, onSelect }: RadioItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const hasMounted = useRef(false);
  const { registerItem, activeIndex } = useRadioGroup();

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
      onClick={onSelect}
      className="relative z-10 flex items-center gap-2.5 rounded-lg px-2 py-2 cursor-pointer"
    >
      {/* Radio circle */}
      <div className="relative w-[18px] h-[18px] shrink-0">
        {/* Border */}
        <div
          className={`absolute inset-0 rounded-full border-solid transition-all duration-120 ${
            selected
              ? "border-[1.5px] border-transparent"
              : isActive
              ? "border-[1.5px] border-neutral-400"
              : "border-[1.5px] border-neutral-300"
          }`}
        />
        {/* Dot */}
        <AnimatePresence>
          {selected && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: skipAnimation ? 1 : 0, scale: skipAnimation ? 1 : 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.3 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                mass: 0.5,
              }}
            >
              <div className="w-[8px] h-[8px] rounded-full bg-neutral-900" />
            </motion.div>
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
            selected || isActive ? "text-neutral-900" : "text-neutral-500"
          }`}
          style={{ fontVariationSettings: `'wght' ${selected ? 550 : 400}` }}
        >
          {label}
        </span>
      </span>
    </div>
  );
}
