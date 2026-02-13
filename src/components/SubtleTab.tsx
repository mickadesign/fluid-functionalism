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
import type { LucideIcon } from "lucide-react";

interface TabRect {
  left: number;
  width: number;
  top: number;
  height: number;
}

interface SubtleTabContextValue {
  registerTab: (index: number, element: HTMLButtonElement | null) => void;
  hoveredIndex: number | null;
  selectedIndex: number;
  onSelect: (index: number) => void;
}

const SubtleTabContext = createContext<SubtleTabContextValue | null>(null);

function useSubtleTab() {
  const ctx = useContext(SubtleTabContext);
  if (!ctx) throw new Error("useSubtleTab must be used within a SubtleTab");
  return ctx;
}

interface SubtleTabProps {
  children: ReactNode;
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export default function SubtleTab({ children, selectedIndex, onSelect }: SubtleTabProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef(new Map<number, HTMLButtonElement>());
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tabRects, setTabRects] = useState<TabRect[]>([]);
  const isMouseInside = useRef(false);
  const registerTab = useCallback((index: number, element: HTMLButtonElement | null) => {
    if (element) {
      tabsRef.current.set(index, element);
    } else {
      tabsRef.current.delete(index);
    }
  }, []);

  const measureTabs = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const rects: TabRect[] = [];
    tabsRef.current.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      rects[index] = {
        left: rect.left - containerRect.left + scrollLeft,
        width: rect.width,
        top: rect.top - containerRect.top,
        height: rect.height,
      };
    });
    setTabRects(rects);
  }, []);

  useEffect(() => {
    measureTabs();
  }, [measureTabs, children]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    isMouseInside.current = true;
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const mouseX = e.clientX;

    let closestIndex: number | null = null;
    let closestDistance = Infinity;
    const rects: TabRect[] = [];

    tabsRef.current.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      rects[index] = {
        left: rect.left - containerRect.left + scrollLeft,
        width: rect.width,
        top: rect.top - containerRect.top,
        height: rect.height,
      };

      const tabCenterX = rect.left + rect.width / 2;
      const distance = Math.abs(mouseX - tabCenterX);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setTabRects(rects);
    setHoveredIndex(closestIndex);
  }, []);

  const handleMouseLeave = useCallback(() => {
    isMouseInside.current = false;
    setHoveredIndex(null);
  }, []);

  const selectedRect = tabRects[selectedIndex];
  const hoverRect = hoveredIndex !== null ? tabRects[hoveredIndex] : null;
  const isHoveringSelected = hoveredIndex === selectedIndex;
  const isHovering = hoveredIndex !== null && !isHoveringSelected;

  const spring = {
    type: "spring" as const,
    stiffness: 400,
    damping: 40,
    mass: 0.8,
  };

  return (
    <SubtleTabContext.Provider value={{ registerTab, hoveredIndex, selectedIndex, onSelect }}>
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative flex items-center gap-1 select-none overflow-x-auto max-w-full scrollbar-hide px-6"
      >
        {/* Selected pill */}
        {selectedRect && (
          <motion.div
            className="absolute rounded-full bg-neutral-300/50 pointer-events-none"
            initial={false}
            animate={{
              left: selectedRect.left,
              width: selectedRect.width,
              top: selectedRect.top,
              height: selectedRect.height,
              opacity: isHovering ? 0.8 : 1,
            }}
            transition={{ ...spring, opacity: { duration: 0.15 } }}
          />
        )}

        {/* Hover pill */}
        <AnimatePresence>
          {hoverRect && !isHoveringSelected && selectedRect && (
            <motion.div
              className="absolute rounded-full bg-neutral-200/60 pointer-events-none"
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
              exit={!isMouseInside.current && selectedRect ? {
                left: selectedRect.left,
                width: selectedRect.width,
                top: selectedRect.top,
                height: selectedRect.height,
                opacity: 0,
              } : { opacity: 0 }}
              transition={{ ...spring, opacity: { duration: 0.15 } }}
            />
          )}
        </AnimatePresence>

        {children}
      </div>
    </SubtleTabContext.Provider>
  );
}

interface SubtleTabItemProps {
  icon: LucideIcon;
  label: string;
  index: number;
}

export function SubtleTabItem({ icon: Icon, label, index }: SubtleTabItemProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const { registerTab, hoveredIndex, selectedIndex, onSelect } = useSubtleTab();

  useEffect(() => {
    registerTab(index, ref.current);
    return () => registerTab(index, null);
  }, [index, registerTab]);

  const isActive = hoveredIndex === index || selectedIndex === index;

  return (
    <button
      ref={ref}
      onClick={() => onSelect(index)}
      className="relative z-10 flex items-center gap-2 rounded-full px-3 py-2 cursor-pointer bg-transparent border-none outline-none"
    >
      <Icon
        size={16}
        strokeWidth={isActive ? 2 : 1.5}
        className={`transition-[color,stroke-width] duration-120 ${
          isActive ? "text-neutral-700" : "text-neutral-400"
        }`}
      />
      <span className="inline-grid text-[13px] whitespace-nowrap">
        <span
          className="col-start-1 row-start-1 invisible"
          style={{ fontVariationSettings: "'wght' 550" }}
          aria-hidden="true"
        >
          {label}
        </span>
        <span
          className={`col-start-1 row-start-1 transition-[color,font-variation-settings] duration-120 ${
            isActive ? "text-neutral-900" : "text-neutral-500"
          }`}
          style={{ fontVariationSettings: `'wght' ${selectedIndex === index ? 550 : 400}` }}
        >
          {label}
        </span>
      </span>
    </button>
  );
}
