import {
  useRef,
  useState,
  useCallback,
  useEffect,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";

interface InputGroupContextValue {
  registerItem: (index: number, element: HTMLLabelElement | null) => void;
  activeIndex: number | null;
  focusedIndex: number | null;
  setFocusedIndex: (index: number | null) => void;
}

const InputGroupContext = createContext<InputGroupContextValue | null>(null);

function useInputGroup() {
  const ctx = useContext(InputGroupContext);
  if (!ctx) throw new Error("useInputGroup must be used within an InputGroup");
  return ctx;
}

interface InputGroupProps {
  children: ReactNode;
}

export default function InputGroup({ children }: InputGroupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef(new Map<number, HTMLLabelElement>());
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const registerItem = useCallback(
    (index: number, element: HTMLLabelElement | null) => {
      if (element) {
        itemsRef.current.set(index, element);
      } else {
        itemsRef.current.delete(index);
      }
    },
    []
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const mouseY = e.clientY;

    let closestIndex: number | null = null;
    let closestDistance = Infinity;

    itemsRef.current.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const itemCenterY = rect.top + rect.height / 2;
      const distance = Math.abs(mouseY - itemCenterY);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  return (
    <InputGroupContext.Provider
      value={{ registerItem, activeIndex, focusedIndex, setFocusedIndex }}
    >
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="flex flex-col gap-3 w-72 max-w-full"
      >
        {children}
      </div>
    </InputGroupContext.Provider>
  );
}

interface InputFieldProps {
  label: string;
  placeholder?: string;
  icon?: LucideIcon;
  index: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function InputField({
  label,
  placeholder,
  icon: Icon,
  index,
  value,
  onChange,
  error,
  disabled,
}: InputFieldProps) {
  const ref = useRef<HTMLLabelElement>(null);
  const { registerItem, activeIndex, focusedIndex, setFocusedIndex } =
    useInputGroup();
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    registerItem(index, ref.current);
    return () => registerItem(index, null);
  }, [index, registerItem]);

  const isActive = activeIndex === index;
  const labelActive = isActive || isFocused;

  const handleFocus = () => {
    setIsFocused(true);
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setFocusedIndex(null);
  };

  // Input container classes
  let bgClass: string;
  let ringClass: string;

  if (disabled) {
    bgClass = "bg-transparent";
    ringClass = "ring-neutral-200";
  } else if (error) {
    bgClass = isFocused ? "bg-white" : "bg-red-50/60";
    ringClass = "ring-red-300";
  } else if (isFocused) {
    bgClass = "bg-white";
    ringClass = "ring-neutral-200";
  } else if (isActive) {
    bgClass = "bg-neutral-100/50";
    ringClass = "ring-neutral-200";
  } else {
    bgClass = "bg-transparent";
    ringClass = "ring-transparent";
  }

  return (
    <label
      ref={ref}
      className={`flex flex-col gap-1 cursor-text ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      {/* Label */}
      <span className="inline-grid text-[13px] pl-3">
        <span
          className="col-start-1 row-start-1 invisible"
          style={{ fontVariationSettings: "'wght' 550" }}
          aria-hidden="true"
        >
          {label}
        </span>
        <span
          className={`col-start-1 row-start-1 ${
            error ? "text-red-500" : "text-neutral-500"
          }`}
          style={{
            fontVariationSettings: "'wght' 400",
          }}
        >
          {label}
        </span>
      </span>

      {/* Input container */}
      <div
        className={`flex items-center gap-2 rounded-lg px-3 py-2 ring-1 transition-all duration-150 ${bgClass} ${ringClass}`}
      >
        {Icon && (
          <Icon
            size={16}
            strokeWidth={labelActive ? 2 : 1.5}
            className={`shrink-0 transition-[color,stroke-width] duration-120 ${
              error
                ? "text-red-400"
                : labelActive
                ? "text-neutral-700"
                : "text-neutral-400"
            }`}
          />
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-transparent text-[13px] text-neutral-900 placeholder:text-neutral-400 outline-none font-[inherit]"
          style={{ fontVariationSettings: "'wght' 400" }}
        />
      </div>

      {/* Error message */}
      {error && (
        <span
          className="text-[12px] text-red-500 pl-3"
          style={{ fontVariationSettings: "'wght' 450" }}
        >
          {error}
        </span>
      )}
    </label>
  );
}
