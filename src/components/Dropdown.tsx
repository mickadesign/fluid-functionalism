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

interface DropdownContextValue {
  registerItem: (index: number, element: HTMLDivElement | null) => void;
  activeIndex: number | null;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

export function useDropdown() {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error("useDropdown must be used within a Dropdown");
  return ctx;
}

interface DropdownProps {
  children: ReactNode;
  checkedIndex?: number;
}

export default function Dropdown({ children, checkedIndex }: DropdownProps) {
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

  const activeRect = activeIndex !== null ? itemRects[activeIndex] : null;
  const checkedRect = checkedIndex != null ? itemRects[checkedIndex] : null;
  const isHoveringOther = activeIndex !== null && activeIndex !== checkedIndex;

  const spring = {
    type: "spring" as const,
    stiffness: 500,
    damping: 35,
    mass: 0.8,
  };

  return (
    <DropdownContext.Provider value={{ registerItem, activeIndex }}>
      <div
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative flex flex-col gap-0.5 w-72 rounded-xl bg-white shadow-[0_8px_16px_rgba(0,0,0,0.08)] border border-neutral-200/60 p-1 select-none"
      >
        {/* Selected background */}
        <AnimatePresence>
          {checkedRect && (
            <motion.div
              className="absolute rounded-lg bg-neutral-300/50 pointer-events-none"
              initial={false}
              animate={{
                top: checkedRect.top,
                left: checkedRect.left,
                width: checkedRect.width,
                height: checkedRect.height,
                opacity: isHoveringOther ? 0.8 : 1,
              }}
              exit={{ opacity: 0 }}
              transition={{ ...spring, opacity: { duration: 0.15 } }}
            />
          )}
        </AnimatePresence>

        {/* Hover background */}
        <AnimatePresence>
          {activeRect && (
            <motion.div
              key={sessionRef.current}
              className="absolute rounded-lg bg-neutral-200/40 pointer-events-none"
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
                ...spring,
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
