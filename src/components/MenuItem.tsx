import { useRef, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropdown } from "./Dropdown";

interface MenuItemProps {
  icon: LucideIcon;
  label: string;
  index: number;
  checked?: boolean;
  onSelect?: () => void;
}

export default function MenuItem({ icon: Icon, label, index, checked, onSelect }: MenuItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const hasMounted = useRef(false);
  const { registerItem, activeIndex } = useDropdown();

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
      className="relative z-10 flex items-center gap-2 rounded-lg px-2 py-2 cursor-pointer"
    >
      <span className="inline-grid">
        <span className="col-start-1 row-start-1 invisible">
          <Icon size={16} strokeWidth={2} />
        </span>
        <Icon
          size={16}
          strokeWidth={isActive || checked ? 2 : 1.5}
          className={`col-start-1 row-start-1 transition-[color,stroke-width] duration-120 ${
            isActive || checked ? "text-neutral-700 dark:text-neutral-200" : "text-neutral-400 dark:text-neutral-500"
          }`}
        />
      </span>
      <span className="inline-grid flex-1 text-[13px]">
        <span
          className="col-start-1 row-start-1 invisible"
          style={{ fontVariationSettings: "'wght' 550" }}
          aria-hidden="true"
        >
          {label}
        </span>
        <span
          className={`col-start-1 row-start-1 transition-[color,font-variation-settings] duration-120 ${
            isActive || checked ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-500 dark:text-neutral-400"
          }`}
          style={{ fontVariationSettings: `'wght' ${checked ? 550 : 400}` }}
        >
          {label}
        </span>
      </span>
      <AnimatePresence>
        {checked && (
          <motion.svg
            key="check"
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-neutral-900 dark:text-neutral-100 shrink-0"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
          >
            <motion.path
              d="M4 12L9 17L20 6"
              initial={{ pathLength: skipAnimation ? 1 : 0 }}
              animate={{ pathLength: 1, transition: { duration: 0.12, ease: "easeOut" } }}
              exit={{ pathLength: 0, transition: { duration: 0.06, ease: "easeIn" } }}
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </div>
  );
}
