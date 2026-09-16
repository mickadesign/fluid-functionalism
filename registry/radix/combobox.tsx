"use client";

import {
  forwardRef,
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useId,
  createContext,
  useContext,
  type ReactNode,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { motion, AnimatePresence, animate, useMotionValue, type MotionValue } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { useIcon, type IconComponent } from "@/lib/icon-context";
import { cn } from "@/lib/utils";
import { spring, exitFallbackMs } from "@/lib/springs";
import { useFluidHover, useRegisterFluidHoverItem } from "@/hooks/use-fluid-hover";
import {
  useMergeSplitBlocks,
  useSelectionRuns,
  SelectionBackgrounds,
} from "@/hooks/use-merge-split";
import { useShape, shapeMap } from "@/lib/shape-context";
import { SizeProvider, useSize, type SizeVariant } from "@/lib/size-context";
import { Elevated } from "@/lib/elevated";
import {
  popupMotionClass,
  popupScrollAreaClass,
  popupViewportClass,
  isDisabledRow,
} from "@/lib/popup";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FluidHoverHighlight } from "@/components/ui/fluid-hover-highlight";

// ---------------------------------------------------------------------------
// Combobox
//
// A text field that filters a list as you type. Radix has no combobox
// primitive, so this build composes Radix Popover (positioning, portal,
// outside-press and focus-out dismissal) with its own listbox: the input
// keeps DOM focus while ArrowUp/ArrowDown move an aria-activedescendant
// highlight through the rows, Enter picks the highlighted row, Escape
// closes. Filtering runs over the `items` prop. The fluid-hover
// overlays, spring open/close animation, and animated checkmark are the
// same visuals as Select.
//
// Items are data: pass `items` to the root and render rows from the
// ComboboxList function child. String items are their own value and label;
// object items carry `{ value, label }` plus anything else you need.
// ---------------------------------------------------------------------------

type ComboboxItemData = string | { value: string; label: string };

function itemValue(item: ComboboxItemData): string {
  return typeof item === "string" ? item : item.value;
}

function itemLabel(item: ComboboxItemData): string {
  return typeof item === "string" ? item : item.label;
}

function defaultFilter(item: ComboboxItemData, query: string) {
  return itemLabel(item)
    .toLocaleLowerCase()
    .includes(query.toLocaleLowerCase());
}

// The create row is one more row in the filtered list, so Enter and the
// arrows reach it like any row. Its value can't collide with a consumer's;
// its label is the query it would create.
const CREATE_VALUE = "\u0000create";

function isCreateItem(item: ComboboxItemData): boolean {
  return itemValue(item) === CREATE_VALUE;
}

function defaultCreateLabel(query: string): ReactNode {
  return `Create “${query}”`;
}

interface Highlight {
  index: number;
  /** A keyboard/auto highlight also draws the focus ring; a pointer
   *  highlight only makes the row the one Enter would pick. */
  keyboard: boolean;
}

type ComboboxValue<Multiple extends boolean> = Multiple extends true
  ? string[]
  : string;

interface ComboboxContextValue {
  /** Selected values — one entry in single mode, any number in multiple. */
  values: string[];
  multiple: boolean;
  inputValue: string;
  open: boolean;
  disabled: boolean;
  listId: string;
  filteredItems: readonly ComboboxItemData[];
  itemsByValue: Map<string, ComboboxItemData>;
  /** The create row's label for the current query; null while no row is
   *  offered. */
  createRow: ReactNode | null;
  /** `hideSelected` has emptied the list with nothing typed: every item is
   *  a chip already. */
  allSelected: boolean;
  /** Latest highlight without subscribing to it — rows read this on pointer
   *  move; the value itself lives in ComboboxHighlightContext. */
  highlightRef: React.RefObject<Highlight | null>;
  setHighlight: (next: Highlight | null) => void;
  setOpen: (open: boolean) => void;
  /** Pick a row: replaces the selection in single mode, toggles it in
   *  multiple. */
  select: (item: ComboboxItemData) => void;
  /** Drop one value from a multiple selection. */
  remove: (value: string) => void;
  clear: () => void;
  setInputValue: (next: string) => void;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

const ComboboxContext = createContext<ComboboxContextValue | null>(null);

/** The highlighted row, in its own context so a per-pointer highlight
 *  re-renders the list and the field, not every row. Always clamped to the
 *  rows actually rendered. */
const ComboboxHighlightContext = createContext<Highlight | null>(null);

function useComboboxContext() {
  const ctx = useContext(ComboboxContext);
  if (!ctx)
    throw new Error("Combobox compound components must be inside <Combobox>");
  return ctx;
}

// Content context for fluid hover
interface ComboboxContentContextValue {
  registerItem: (index: number, element: HTMLElement | null) => void;
  activeIndex: number | null;
}

const ComboboxContentContext =
  createContext<ComboboxContentContextValue | null>(null);

// Each rendered row learns its index from the list, so consumers never
// number rows by hand.
const ComboboxItemIndexContext = createContext<number>(0);

// ---------------------------------------------------------------------------
// Combobox (root)
// ---------------------------------------------------------------------------

interface ComboboxProps<
  T extends ComboboxItemData = ComboboxItemData,
  Multiple extends boolean = false,
> {
  children: ReactNode;
  /** The options. Strings, or `{ value, label, … }` objects. */
  items: readonly T[];
  /** Select any number of items; pair with ComboboxChips for the field.
   *  Values become `string[]`. @default false */
  multiple?: Multiple;
  /** Selected value(s): a string ("" = none), or an array when `multiple`. */
  value?: ComboboxValue<Multiple>;
  defaultValue?: ComboboxValue<Multiple>;
  onValueChange?: (value: ComboboxValue<Multiple>) => void;
  /** Match an item against the typed query. Defaults to a case-insensitive
   *  "contains" on the label. */
  filter?: (item: T, query: string) => boolean;
  /** Offer a last row that creates what was typed, whenever the query
   *  matches no item's label exactly. Called with the trimmed query. Add the
   *  new item to `items` and return it to select it. */
  onCreate?: (query: string) => T | void;
  /** The create row's label. @default (query) => `Create “${query}”` */
  createLabel?: (query: string) => ReactNode;
  /** Multiple only: selected items leave the list, so it reads as what is
   *  left to add. The chips are then the only way to deselect.
   *  @default false */
  hideSelected?: boolean;
  disabled?: boolean;
  name?: string;
  required?: boolean;
  /** Pins field and popup to one step of the size ladder (default 36px,
   *  compact 28px — see /docs/sizes). Omitted, both follow the surrounding
   *  SizeProvider. */
  size?: SizeVariant;
}

function toValues(v: string | readonly string[] | undefined): string[] {
  if (v === undefined) return [];
  if (Array.isArray(v)) return v as string[];
  return v === "" ? [] : [v as string];
}

function Combobox<
  T extends ComboboxItemData = ComboboxItemData,
  Multiple extends boolean = false,
>({
  children,
  items,
  multiple,
  value,
  defaultValue,
  onValueChange,
  filter,
  onCreate,
  createLabel = defaultCreateLabel,
  hideSelected = false,
  disabled = false,
  name,
  required,
  size,
}: ComboboxProps<T, Multiple>) {
  const isMultiple = !!multiple;
  const listId = useId();
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [internalValues, setInternalValues] = useState<string[]>(() =>
    toValues(defaultValue)
  );
  // Memoized on the prop identity: a string value is stable by nature and a
  // consumer's array is state, so the derived array (and everything keyed on
  // it) only changes when the selection does.
  const controlledValues = useMemo(() => toValues(value), [value]);
  const values = value !== undefined ? controlledValues : internalValues;

  const itemsByValue = useMemo(() => {
    const map = new Map<string, ComboboxItemData>();
    for (const item of items) map.set(itemValue(item), item);
    return map;
  }, [items]);

  // Single mode shows the selection's label in the field; multiple keeps
  // the field for typing only (the chips carry the selection).
  const selectedLabel = useMemo(() => {
    if (isMultiple) return "";
    const item = values[0] !== undefined ? itemsByValue.get(values[0]) : undefined;
    return item ? itemLabel(item) : "";
  }, [isMultiple, values, itemsByValue]);

  // What the field shows vs. what filters the list: opening with a selection
  // shows its label but lists everything, until the user types.
  const [inputValue, setInputValueState] = useState(selectedLabel);
  const [query, setQuery] = useState("");
  const [open, setOpenState] = useState(false);
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const highlightRef = useRef<Highlight | null>(null);

  // An external value change (or a label change) re-syncs the field.
  useEffect(() => {
    setInputValueState(selectedLabel);
  }, [selectedLabel]);

  // The create row appears once the trimmed query matches no label exactly.
  const trimmedQuery = query.trim();
  const createItem = useMemo<ComboboxItemData | null>(() => {
    if (!onCreate || trimmedQuery === "") return null;
    const lower = trimmedQuery.toLocaleLowerCase();
    const exists = items.some((item) => itemLabel(item).toLocaleLowerCase() === lower);
    return exists ? null : { value: CREATE_VALUE, label: trimmedQuery };
  }, [onCreate, trimmedQuery, items]);

  // What the list shows: the matches less the chips when `hideSelected`,
  // plus the create row last, so Enter picks a real match while one exists
  // and only creates once nothing matches.
  const hideChecked = hideSelected && isMultiple;
  const filteredItems = useMemo(() => {
    const match = filter ?? defaultFilter;
    let visible = query === "" ? items : items.filter((item) => match(item, query));
    if (hideChecked) visible = visible.filter((item) => !values.includes(itemValue(item)));
    return createItem ? [...visible, createItem] : visible;
  }, [items, query, filter, hideChecked, values, createItem]);
  const allSelected =
    hideChecked && trimmedQuery === "" && items.length > 0 && filteredItems.length === 0;

  // A highlight past the rendered rows (a query that matches nothing, or a
  // list that just shrank) would point aria-activedescendant at no element.
  const safeHighlight =
    highlight && highlight.index < filteredItems.length ? highlight : null;
  highlightRef.current = safeHighlight;

  const commitValues = useCallback(
    (next: string[]) => {
      if (value === undefined) setInternalValues(next);
      onValueChange?.(
        (isMultiple ? next : (next[0] ?? "")) as ComboboxValue<Multiple>
      );
    },
    [value, onValueChange, isMultiple]
  );

  const setOpen = useCallback(
    (next: boolean) => {
      setOpenState(next);
      if (!next) {
        // Closing without a pick reverts the field to the selection.
        setQuery("");
        setHighlight(null);
        setInputValueState(selectedLabel);
      }
    },
    [selectedLabel]
  );

  const onCreateRef = useRef(onCreate);
  onCreateRef.current = onCreate;

  const select = useCallback(
    (item: ComboboxItemData) => {
      // A pick on the create row is not a selection: it asks the consumer
      // for the item, selects whatever comes back, and closes like any pick
      // made while filtering.
      if (isCreateItem(item)) {
        const made = onCreateRef.current?.(itemLabel(item));
        if (made != null) {
          commitValues(isMultiple ? [...values, itemValue(made)] : [itemValue(made)]);
          setInputValueState(isMultiple ? "" : itemLabel(made));
        } else {
          setInputValueState(isMultiple ? "" : selectedLabel);
        }
        setQuery("");
        setHighlight(null);
        setOpenState(false);
        return;
      }
      const v = itemValue(item);
      if (isMultiple) {
        // Toggle. A pick from an unfiltered list keeps the popup open for
        // the next one; a pick made while filtering closes it and clears
        // the query.
        commitValues(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
        if (query !== "") {
          setInputValueState("");
          setQuery("");
          setHighlight(null);
          setOpenState(false);
        }
        return;
      }
      commitValues([v]);
      setInputValueState(itemLabel(item));
      setQuery("");
      setHighlight(null);
      setOpenState(false);
    },
    [commitValues, isMultiple, values, query, selectedLabel]
  );

  const remove = useCallback(
    (v: string) => {
      commitValues(values.filter((x) => x !== v));
      inputRef.current?.focus();
    },
    [commitValues, values]
  );

  const clear = useCallback(() => {
    commitValues([]);
    setInputValueState("");
    setQuery("");
    setHighlight(null);
    inputRef.current?.focus();
  }, [commitValues]);

  const setInputValue = useCallback(
    (next: string) => {
      setInputValueState(next);
      setQuery(next);
      setOpenState(true);
      // The first match is highlighted while typing so Enter picks it.
      setHighlight({ index: 0, keyboard: true });
    },
    []
  );

  // The first row is highlighted the moment the list opens, whatever opened
  // it (a click, the chevron, typing), so Enter always has a target. An
  // opener that already chose a row (ArrowUp picks the last) keeps it.
  useEffect(() => {
    if (open) setHighlight((h) => h ?? { index: 0, keyboard: true });
  }, [open]);

  const createRow = createItem ? createLabel(trimmedQuery) : null;
  const ctx = useMemo<ComboboxContextValue>(
    () => ({
      values,
      multiple: isMultiple,
      inputValue,
      open,
      disabled,
      listId,
      filteredItems,
      itemsByValue,
      createRow,
      allSelected,
      highlightRef,
      setHighlight,
      setOpen,
      select,
      remove,
      clear,
      setInputValue,
      anchorRef,
      inputRef,
    }),
    [
      values,
      isMultiple,
      inputValue,
      open,
      disabled,
      listId,
      filteredItems,
      itemsByValue,
      createRow,
      allSelected,
      setOpen,
      select,
      remove,
      clear,
      setInputValue,
    ]
  );

  // A size prop pins the whole compound (field + portalled popup — React
  // context crosses portals) to one step of the ladder.
  const root = (
    <ComboboxContext.Provider value={ctx}>
    <ComboboxHighlightContext.Provider value={safeHighlight}>
      {/* Root is always controlled by `open` so ComboboxContent can drive
          the exit animation before the portal unmounts. Non-modal: the page
          keeps scrolling and the popup tracks its anchor. */}
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen} modal={false}>
        {children}
        {name &&
          (isMultiple ? (
            values.map((v) => (
              <input key={v} type="hidden" name={name} value={v} />
            ))
          ) : (
            <input type="hidden" name={name} value={values[0] ?? ""} required={required} />
          ))}
      </PopoverPrimitive.Root>
    </ComboboxHighlightContext.Provider>
    </ComboboxContext.Provider>
  );

  return size ? <SizeProvider size={size}>{root}</SizeProvider> : root;
}

Combobox.displayName = "Combobox";

// ---------------------------------------------------------------------------
// ComboboxInput — the field: leading icon, text input, clear ✕, chevron.
// ---------------------------------------------------------------------------

// The field follows the global pill/rounded shape; the popup does not. Like
// Dropdown, the list keeps the smaller "rounded" radii whatever the rest of
// the UI is shaped: pill corners on a popover distort its padding and break
// the concentric fit of the rows' hover and selection backgrounds inside it.
const popupShape = shapeMap.rounded;

const fieldVariants = cva(
  [
    "group flex items-center ring-1 cursor-text",
    "transition-all duration-80",
    "data-[disabled]:opacity-50 data-[disabled]:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        // Framed at rest; the fills step up on hover and focus like an
        // input field.
        bordered:
          "ring-border bg-transparent hover:bg-muted/50 focus-within:bg-card",
        // Invisible at rest — the InputGroup field ladder: muted fill +
        // ring on hover, card fill when focused.
        borderless:
          "ring-transparent bg-transparent hover:bg-muted/50 hover:ring-border focus-within:bg-card focus-within:ring-border",
      },
    },
    defaultVariants: {
      variant: "bordered",
    },
  }
);

// The clear and chevron buttons share one quiet style; they sit inside the
// field's ring so they need no frame of their own.
const fieldButtonClass =
  "flex shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors duration-80 hover:text-foreground focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] disabled:pointer-events-none";
// The clear ✕ is a real icon button: the hover fill says "press me", where
// the chevron beside it only decorates the field it belongs to.
const clearButtonClass = cn(
  fieldButtonClass,
  "hover:bg-hover active:bg-active transition-[color,background-color]"
);
// A chip's ✕ sits on the chip's own hover-tinted fill, so it steps up a notch.
const chipRemoveClass = cn(fieldButtonClass, "rounded hover:bg-active");

interface ComboboxFieldProps
  extends Omit<
      InputHTMLAttributes<HTMLInputElement>,
      "size" | "value" | "defaultValue" | "onChange"
    >,
    VariantProps<typeof fieldVariants> {
  icon?: IconComponent;
  placeholder?: string;
  error?: string;
  /** Render a ✕ that clears the selection and query. Its slot is always
   *  reserved so the field never changes width. @default false */
  clearable?: boolean;
  /** Size override for the field alone. Prefer the `size` prop on <Combobox>
   *  (or a surrounding SizeProvider) so the popup matches. */
  size?: SizeVariant;
}

type ComboboxInputProps = ComboboxFieldProps;
type ComboboxChipsProps = ComboboxFieldProps;

/** The text input with the combobox keyboard model and ARIA wiring —
 *  shared by the single field and the chips field. */
const FieldInput = forwardRef<
  HTMLInputElement,
  Omit<ComboboxFieldProps, "variant" | "icon" | "error" | "clearable" | "size"> & {
    invalid?: boolean;
    inputClassName?: string;
    /** The input's `size` attribute: its intrinsic width in characters. */
    inputSize?: number;
  }
>(({ placeholder, invalid, inputClassName, inputSize, onKeyDown, onClick, className: _className, ...props }, ref) => {
  const sizeClasses = useSize();
  const {
    values,
    multiple,
    inputValue,
    open,
    disabled,
    listId,
    filteredItems,
    setHighlight,
    setOpen,
    select,
    remove,
    setInputValue,
    inputRef,
  } = useComboboxContext();
  const highlight = useContext(ComboboxHighlightContext);

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || disabled) return;
    const count = filteredItems.length;
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp": {
        e.preventDefault();
        if (!open) {
          setOpen(true);
          if (count > 0)
            setHighlight({
              index: e.key === "ArrowDown" ? 0 : count - 1,
              keyboard: true,
            });
          return;
        }
        if (count === 0) return;
        // Loop through the field: past the last row the highlight clears
        // (the input is the stop), and the next press wraps to the first
        // row — the APG combobox pattern.
        const step = e.key === "ArrowDown" ? 1 : -1;
        const current = highlight?.index ?? (step === 1 ? -1 : count);
        const next = current + step;
        if (next < 0 || next >= count) setHighlight(null);
        else setHighlight({ index: next, keyboard: true });
        return;
      }
      case "Enter": {
        if (!open) return;
        e.preventDefault();
        if (highlight && filteredItems[highlight.index]) {
          select(filteredItems[highlight.index]);
        }
        return;
      }
      case "Escape": {
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        return;
      }
      case "Backspace": {
        // Multiple: an empty field backspaces into the chips.
        if (multiple && e.currentTarget.value === "" && values.length > 0) {
          e.preventDefault();
          remove(values[values.length - 1]);
        }
        return;
      }
      default:
        return;
    }
  };

  return (
    <input
      ref={(node) => {
        inputRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      type="text"
      role="combobox"
      size={inputSize}
      aria-expanded={open}
      aria-controls={open ? listId : undefined}
      aria-autocomplete="list"
      aria-activedescendant={
        open && highlight ? `${listId}-${highlight.index}` : undefined
      }
      aria-invalid={invalid || undefined}
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      disabled={disabled}
      value={inputValue}
      placeholder={placeholder}
      onChange={(e) => setInputValue(e.target.value)}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented && !open) setOpen(true);
      }}
      onKeyDown={handleKeyDown}
      className={cn(
        "min-w-0 flex-1 rounded-none bg-transparent text-foreground placeholder:text-muted-foreground outline-none font-[inherit]",
        sizeClasses.text,
        // The caret is as tall as the line box (Chrome, Safari); the
        // ladder's leading keeps it in proportion to the field.
        sizeClasses.variant === "compact" ? "leading-5" : "leading-6",
        inputClassName
      )}
      {...props}
    />
  );
});
FieldInput.displayName = "ComboboxFieldInput";

/** The trailing clear ✕ and chevron, shared by both fields. */
function FieldControls({
  clearable,
  compact,
  iconSize,
}: {
  clearable: boolean;
  compact: boolean;
  iconSize: number;
}) {
  const XIcon = useIcon("x");
  const pill = useShape().variant === "pill";
  const { values, inputValue, open, disabled, setOpen, clear, inputRef } =
    useComboboxContext();
  return (
    <>
      {clearable && (
        // Hidden (not removed) while there is nothing to clear, so the
        // field's width never changes.
        <button
          type="button"
          aria-label="Clear"
          disabled={disabled}
          hidden={!(values.length > 0 || inputValue !== "")}
          onClick={clear}
          className={cn(clearButtonClass, pill && "rounded-full", "[&[hidden]]:invisible [&[hidden]]:flex", compact ? "size-5" : "size-6")}
        >
          <XIcon size={iconSize} strokeWidth={1.5} />
        </button>
      )}
      {/* Not a tab stop: the field itself opens on ArrowDown or typing. */}
      <button
        type="button"
        aria-label="Open"
        tabIndex={-1}
        disabled={disabled}
        onClick={() => {
          inputRef.current?.focus();
          setOpen(!open);
        }}
        className={cn(fieldButtonClass, compact ? "size-5" : "size-6")}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-colors duration-80"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </>
  );
}

/** Springs the chips field's height to the measured chip row stack (plus
 *  `padY`, the field's vertical padding) as chips wrap and unwrap. The
 *  height lives in a MotionValue driving an inline style, and for a reason:
 *  the field must stay pinned at its old height through the reflow that
 *  wraps a chip, or its auto height lands on the new row before any spring
 *  can start and the growth snaps. First measure sets the pin; every later
 *  one springs it. Measured (offsetHeight + ResizeObserver), never
 *  `height: "auto"`: framer resolves "auto" from the element's *visual*
 *  (transformed) size, so under a scaled ancestor (the /demo card) the
 *  spring would overshoot. Layout metrics are transform-immune. */
function useChipRowHeight(padY: number) {
  const height = useMotionValue<number | "auto">("auto");
  const roRef = useRef<ResizeObserver | null>(null);
  const padRef = useRef(padY);
  padRef.current = padY;
  const ref = useCallback(
    (el: HTMLDivElement | null) => {
      roRef.current?.disconnect();
      roRef.current = null;
      if (!el) return;
      const measure = () => {
        if (el.offsetHeight <= 0) return;
        const target = el.offsetHeight + padRef.current;
        if (height.get() === "auto") height.set(target);
        else if (height.get() !== target) animate(height, target, spring.fast);
      };
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      roRef.current = ro;
    },
    [height]
  );
  return { ref, height };
}

/** The anchored field frame: a click on the icon or padding focuses the
 *  input without disturbing its caret. `height` (the chips field's animated
 *  height from useChipRowHeight) pins and springs the frame as chips wrap
 *  and unwrap; omitted, the frame just sizes to its content. */
function FieldFrame({
  className,
  height,
  children,
}: {
  className: string;
  height?: MotionValue<number | "auto">;
  children: ReactNode;
}) {
  const { open, disabled, anchorRef, inputRef } = useComboboxContext();
  return (
    <PopoverPrimitive.Anchor asChild>
      <motion.div
        ref={anchorRef}
        data-disabled={disabled || undefined}
        data-popup-open={open || undefined}
        style={height ? { height } : undefined}
        onMouseDown={(e) => {
          if (e.target === inputRef.current) return;
          if ((e.target as HTMLElement).closest("button")) return;
          e.preventDefault();
          inputRef.current?.focus();
        }}
        className={className}
      >
        {children}
      </motion.div>
    </PopoverPrimitive.Anchor>
  );
}

const ComboboxInput = forwardRef<HTMLInputElement, ComboboxInputProps>(
  (
    {
      className,
      variant,
      icon: Icon,
      placeholder = "Search…",
      error,
      clearable = false,
      size,
      ...props
    },
    ref
  ) => {
    const shape = useShape();
    const sizeClasses = useSize(size);
    const compact = sizeClasses.variant === "compact";

    return (
      <div className="flex flex-col gap-1">
        {/* The anchor is the whole field, so the list spans icon to chevron —
            not just the text input. */}
        <FieldFrame
          className={cn(
            fieldVariants({ variant }),
            sizeClasses.control,
            sizeClasses.gap,
            compact ? "px-2" : "px-2.5",
            compact ? "min-w-[128px]" : "min-w-[160px]",
            shape.input,
            error && "ring-destructive/50 hover:ring-destructive/50 focus-within:ring-destructive/50",
            className
          )}
        >
          {Icon && (
            <Icon
              size={sizeClasses.icon}
              strokeWidth={1.5}
              className="shrink-0 text-muted-foreground transition-[color,stroke-width] duration-80 group-focus-within:text-foreground group-focus-within:stroke-[2]"
            />
          )}
          <FieldInput ref={ref} placeholder={placeholder} invalid={!!error} {...props} />
          <FieldControls clearable={clearable} compact={compact} iconSize={sizeClasses.icon} />
        </FieldFrame>
        {error && (
          <span className="text-[12px] text-destructive pl-3">{error}</span>
        )}
      </div>
    );
  }
);

ComboboxInput.displayName = "ComboboxInput";

// ---------------------------------------------------------------------------
// ComboboxChips — the multiple-selection field: one chip per selected item
// ahead of the text input, wrapping onto new lines as they accumulate.
// Backspace in an empty input removes the last chip; each chip's ✕ removes
// that one.
// ---------------------------------------------------------------------------

const ComboboxChips = forwardRef<HTMLInputElement, ComboboxChipsProps>(
  (
    {
      className,
      variant,
      icon: Icon,
      placeholder = "Search…",
      error,
      clearable = false,
      size,
      ...props
    },
    ref
  ) => {
    const XIcon = useIcon("x");
    const shape = useShape();
    const sizeClasses = useSize(size);
    const compact = sizeClasses.variant === "compact";
    const { values, itemsByValue, disabled, remove, inputValue } = useComboboxContext();
    const rowHeight = useChipRowHeight(compact ? 8 : 12);

    return (
      <div className="flex flex-col gap-1">
        <FieldFrame
          // The frame springs to the chip rows' measured height as they wrap
          // and unwrap, instead of snapping a row taller or shorter.
          height={rowHeight.height}
          className={cn(
            fieldVariants({ variant }),
            // The spring above owns the height; leaving it in transition-all
            // would have the 80ms CSS ease drag behind every spring frame.
            "transition-[color,background-color,border-radius,box-shadow,opacity]",
            // Grows with its chips. Rows top-align (`items-start`) so the
            // icon and controls hold the first line while chips wrap; the
            // vertical padding is exactly what centers one 24px (20px
            // compact) row inside the ladder height.
            "!items-start",
            compact ? "min-h-7 py-1" : "min-h-9 py-1.5",
            sizeClasses.gap,
            compact ? "px-2" : "px-2.5",
            compact ? "min-w-[128px]" : "min-w-[160px]",
            shape.input,
            error && "ring-destructive/50 hover:ring-destructive/50 focus-within:ring-destructive/50",
            className
          )}
        >
          {Icon && (
            // A row-height box keeps the icon centered on the first line.
            <span className={cn("flex shrink-0 items-center", compact ? "h-5" : "h-6")}>
              <Icon
                size={sizeClasses.icon}
                strokeWidth={1.5}
                className="shrink-0 text-muted-foreground transition-[color,stroke-width] duration-80 group-focus-within:text-foreground group-focus-within:stroke-[2]"
              />
            </span>
          )}
          <div
            role="toolbar"
            aria-label="Selected"
            ref={rowHeight.ref}
            className={cn(
              "relative flex min-w-0 flex-1 flex-wrap items-center gap-1",
              // A chip leads the field: the row pulls left so the chip sits
              // an even distance from every edge. The offset lives here, not
              // on the container's padding — the container's transition-all
              // would ease a padding change against the chip's spring and
              // drag the caret with it; the row snaps instead, in the same
              // frame as the chip. An icon keeps the full inset — it leads,
              // not the chip.
              !Icon && values.length > 0 && "-ml-1"
            )}
          >
            {/* Chips pop in and out on the fast tier and slide into their
                new slots; an exiting chip is inert while it fades. popLayout
                lifts the exiting chip out of the flow at once, so the field
                reflows immediately rather than after the fade. */}
            <AnimatePresence initial={false} mode="popLayout">
              {values.map((v) => {
                const item = itemsByValue.get(v);
                const label = item ? itemLabel(item) : v;
                return (
                  <motion.span
                    key={v}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, pointerEvents: "none", transition: spring.fast.exit }}
                    transition={spring.fast}
                    // Grow from the left edge, where the typed text just
                    // was — not from the middle of the chip.
                    style={{ originX: 0 }}
                    aria-label={label}
                    className={cn(
                      "inline-flex max-w-full shrink-0 items-center gap-0.5 bg-hover pl-2 pr-0.5 text-foreground",
                      shape.variant === "pill" ? "rounded-full" : "rounded-md",
                      compact ? "h-5 text-[11px]" : "h-6 text-[12px]"
                    )}
                  >
                    <span className="truncate">{label}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${label}`}
                      disabled={disabled}
                      onClick={() => remove(v)}
                      className={cn(chipRemoveClass, shape.variant === "pill" && "rounded-full", compact ? "size-4" : "size-5")}
                    >
                      <XIcon size={compact ? 10 : 12} strokeWidth={2} />
                    </button>
                  </motion.span>
                );
              })}
            </AnimatePresence>
            {/* The field sizes to what is typed (`size` is the intrinsic
                width; flex-auto grows it across the rest of its row) so it
                stays beside the chips while it fits and wraps only once the
                text no longer does. It never animates: chips slide, the
                field snaps. Animating it read as the placeholder sliding in
                from the right when the last chip went. */}
            <span className="flex min-w-6 flex-auto">
              <FieldInput
                ref={ref}
                inputSize={Math.max(1, inputValue.length + 1)}
                placeholder={values.length ? undefined : placeholder}
                invalid={!!error}
                inputClassName={cn("w-full", compact ? "h-5 leading-5" : "h-6 leading-6")}
                {...props}
              />
            </span>
          </div>
          <FieldControls clearable={clearable} compact={compact} iconSize={sizeClasses.icon} />
        </FieldFrame>
        {error && (
          <span className="text-[12px] text-destructive pl-3">{error}</span>
        )}
      </div>
    );
  }
);

ComboboxChips.displayName = "ComboboxChips";

// ---------------------------------------------------------------------------
// ComboboxContent — the popup surface. Holds ComboboxEmpty and ComboboxList.
// ---------------------------------------------------------------------------

type ContentPrimitiveProps = React.ComponentPropsWithoutRef<
  typeof PopoverPrimitive.Content
>;

interface ComboboxContentProps {
  className?: string;
  children: ReactNode;
  side?: ContentPrimitiveProps["side"];
  align?: ContentPrimitiveProps["align"];
  sideOffset?: number;
}

const ComboboxContent = forwardRef<HTMLDivElement, ComboboxContentProps>(
  ({ className, children, side = "bottom", align = "start", sideOffset = 6 }, ref) => {
    const { open, anchorRef } = useComboboxContext();
    const shape = popupShape;

    // Portal lifetime: mounts as soon as `open` flips true; on close it stays
    // mounted (forceMount below) until the exit tween finishes.
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      if (open) setMounted(true);
    }, [open]);

    // Fallback release for the deferred unmount: onAnimationComplete on the
    // motion.div is the primary signal, but rAF-driven animation callbacks
    // can stall in throttled/background tabs. The popup exits with
    // spring.fast, so the fallback tracks that tier's exit duration plus a
    // safety buffer.
    useEffect(() => {
      if (open) return;
      const id = setTimeout(() => setMounted(false), exitFallbackMs(spring.fast));
      return () => clearTimeout(id);
    }, [open]);

    // Interactions on the field itself are not "outside": focus stays in
    // the input, and a press on the chevron toggles rather than dismisses.
    const guardAnchor = (
      e: { target: EventTarget | null; preventDefault: () => void }
    ) => {
      if (anchorRef.current?.contains(e.target as Node)) e.preventDefault();
    };

    if (!mounted) return null;

    return (
      <PopoverPrimitive.Portal forceMount>
        <PopoverPrimitive.Content
          ref={ref}
          asChild
          forceMount
          side={side}
          align={align}
          sideOffset={sideOffset}
          // The listbox inside is the semantic surface; the wrapper is chrome.
          role="presentation"
          // Focus never leaves the input — the listbox is driven through
          // aria-activedescendant.
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onFocusOutside={guardAnchor}
          onPointerDownOutside={guardAnchor}
          onInteractOutside={guardAnchor}
        >
          <motion.div
            className={cn("z-50 outline-none", popupMotionClass)}
            initial={{ opacity: 0, y: "var(--popup-enter-y)", scaleY: 0.96 }}
            animate={
              open
                ? { opacity: 1, y: 0, scaleY: 1 }
                : { opacity: 0, y: "var(--popup-enter-y)", scaleY: 0.96 }
            }
            transition={open ? spring.fast : spring.fast.exit}
            // Release the deferred unmount once the exit spring has finished
            // so the close animation fully plays.
            onAnimationComplete={() => {
              if (!open) setMounted(false);
            }}
          >
            <Elevated
              offset={2}
              shadowLevel={3}
              className={cn(
                // min-w tracks the field; the available-height var is
                // Radix's equivalent of Base UI's --available-height. The
                // list inside owns padding and scrolling.
                `flex flex-col min-w-[var(--radix-popover-trigger-width)] max-h-[min(300px,var(--radix-popover-content-available-height))] overflow-hidden ${shape.container} select-none outline-none`,
                className
              )}
            >
              {children}
            </Elevated>
          </motion.div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    );
  }
);

ComboboxContent.displayName = "ComboboxContent";

// ---------------------------------------------------------------------------
// ComboboxList — renders a row per matching item, carrying the fluid hover
// hover overlays and the animated selected background / focus ring.
// ---------------------------------------------------------------------------

interface ComboboxListProps {
  className?: string;
  /** Render one row per matching item: `(item, index) => <ComboboxItem …/>`. */
  children: (item: ComboboxItemData, index: number) => ReactNode;
}

const ComboboxList = forwardRef<HTMLDivElement, ComboboxListProps>(
  ({ className, children }, ref) => {
    const { open, values, multiple, listId, filteredItems, setHighlight, createRow } =
      useComboboxContext();
    const highlight = useContext(ComboboxHighlightContext);
    const PlusIcon = useIcon("plus");
    const shape = popupShape;
    const containerRef = useRef<HTMLDivElement>(null);

    const hover = useFluidHover(containerRef, { isItemDisabled: isDisabledRow });
    const {
      activeIndex,
      setActiveIndex,
      itemRects,
      isMeasured,
      handlers,
      registerItem,
      remeasure,
    } = hover;

    // Fresh rects once per open — the popup keeps its rows registered while
    // it sits mounted through the exit tween, so registration alone never
    // triggers a pass on reopen. Filtering re-registers rows, which the
    // hook coalesces into its own measurement.
    useEffect(() => {
      if (!open) return;
      remeasure();
    }, [open, remeasure]);

    // Typing re-filters the rows underneath the overlays, and those frames
    // must snap, not glide — an overlay springing to wherever its row LANDED
    // reads as the list smearing on every keystroke. The flag arms when the
    // VISIBLE row set changes (the values, not the array: multiple-mode
    // picks rebuild the array without moving a row, and their merge/split
    // glide must survive) and holds until the rects measured from that row
    // set land — measurement coalesces on a rAF, one render behind.
    const rowsSig = useMemo(
      () => filteredItems.map(itemValue).join(" "),
      [filteredItems]
    );
    const reflowRef = useRef(false);
    const prevSigRef = useRef(rowsSig);
    const armedRectsRef = useRef(itemRects);
    if (prevSigRef.current !== rowsSig) {
      prevSigRef.current = rowsSig;
      armedRectsRef.current = itemRects;
      reflowRef.current = true;
    }
    const reflowSnap = reflowRef.current;
    useEffect(() => {
      if (reflowRef.current && itemRects !== armedRectsRef.current)
        reflowRef.current = false;
    });

    // The checked rows' indices shift as the query filters the list.
    const checkedIndices = useMemo(
      () =>
        filteredItems
          .map((item, i) => (values.includes(itemValue(item)) ? i : -1))
          .filter((i) => i !== -1),
      [filteredItems, values]
    );

    // A keyboard (or auto) highlight drives the hover background — the only
    // indicator, no ring — and scrolls its row into view; the input keeps
    // DOM focus, so the browser won't do it for us.
    useEffect(() => {
      // A dropped highlight (the input is the stop again) takes the hover
      // background with it — otherwise it would linger on the last row.
      if (!highlight) {
        setActiveIndex(null);
        return;
      }
      if (!highlight.keyboard) return;
      setActiveIndex(highlight.index);
      const row = containerRef.current?.querySelector<HTMLElement>(
        `[data-fluid-hover-index="${highlight.index}"]`
      );
      row?.scrollIntoView({ block: "nearest" });
    }, [highlight, setActiveIndex]);

    // Reset every overlay index as the close begins, so the reopen doesn't
    // spring an overlay from a stale row.
    useEffect(() => {
      if (open) return;
      setActiveIndex(null);
    }, [open, setActiveIndex]);

    // Overlays read rects only once the hook reports the row set fully
    // measured — positioning one from an incomplete pass mounts it at the
    // wrong row, and the correcting pass then springs it across the list.
    // Single mode glides ONE marker between rows (a value change springs it
    // to the picked row). Multiple mode paints one block per contiguous run
    // of checked rows — merging and splitting like CheckboxGroup as picks
    // bridge or break a run.
    const checkedRect =
      isMeasured && !multiple && checkedIndices.length > 0
        ? itemRects[checkedIndices[0]]
        : null;
    const runs = useSelectionRuns(multiple ? checkedIndices : []);
    const blocks = useMergeSplitBlocks(
      runs,
      isMeasured && open ? itemRects : [],
      shape.bgRadius
    );

    const contentCtx = useMemo(
      () => ({ registerItem, activeIndex }),
      [registerItem, activeIndex]
    );

    const empty = filteredItems.length === 0;

    return (
      <ComboboxContentContext.Provider value={contentCtx}>
        <ScrollArea className={popupScrollAreaClass} viewportClassName={cn(popupViewportClass, "scroll-fade")}>
        <div
          ref={(node: HTMLDivElement | null) => {
            (containerRef as React.MutableRefObject<HTMLDivElement | null>).current =
              node;
            if (typeof ref === "function") ref(node);
            else if (ref)
              (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }}
          id={listId}
          role="listbox"
          tabIndex={-1}
          data-empty={empty || undefined}
          onMouseEnter={handlers.onMouseEnter}
          onMouseMove={handlers.onMouseMove}
          onClick={handlers.onClick}
          onMouseLeave={() => {
            handlers.onMouseLeave();
            // Leaving the list drops a pointer highlight; a keyboard one
            // stays so Enter still means what the ring shows.
            if (highlight && !highlight.keyboard) setHighlight(null);
          }}
          className={cn(
            // The list is the overlays' offsetParent, so rows and overlays
            // scroll together inside the ScrollArea. Padding collapses when
            // the list is empty (ComboboxEmpty takes over).
            "relative flex flex-col p-1 outline-none data-[empty]:p-0",
            className
          )}
        >
          {/* The three overlays are torn down as the close begins rather
              than exit-animated: an overlay still mounted when the popup
              reopens is one AnimatePresence re-adopts under its old key and
              animates from the row it had before. */}
          {/* Selected background */}
          {open && multiple && (
            <SelectionBackgrounds
              blocks={reflowSnap ? blocks.map((b) => ({ ...b, instant: true })) : blocks}
            />
          )}
          {open && !multiple && (
            <AnimatePresence>
              {checkedRect && (
                <motion.div
                  key="checked"
                  aria-hidden
                  className={`absolute ${shape.bg} bg-active pointer-events-none`}
                  initial={false}
                  animate={{
                    top: checkedRect.top,
                    left: checkedRect.left,
                    width: checkedRect.width,
                    height: checkedRect.height,
                    opacity: 1,
                  }}
                  exit={{ opacity: 0, transition: spring.moderate.exit }}
                  transition={
                    reflowSnap
                      ? { duration: 0 }
                      : { ...spring.moderate, opacity: { duration: 0.08 } }
                  }
                />
              )}
            </AnimatePresence>
          )}

          {/* Hover background. Snaps (no travel) while a filter reflow is
              moving the rows underneath. */}
          {open && (
            <FluidHoverHighlight
              hover={hover}
              className={shape.bg}
              transition={reflowSnap ? false : undefined}
            />
          )}

          {filteredItems.map((item, index) => (
            <ComboboxItemIndexContext.Provider key={itemValue(item)} value={index}>
              {/* The create row is the list's, not the consumer's: it reads
                  the label from the root and picks like any row. */}
              {isCreateItem(item) ? (
                <ComboboxItem value={CREATE_VALUE} icon={PlusIcon}>
                  {createRow}
                </ComboboxItem>
              ) : (
                children(item, index)
              )}
            </ComboboxItemIndexContext.Provider>
          ))}
        </div>
        </ScrollArea>
      </ComboboxContentContext.Provider>
    );
  }
);

ComboboxList.displayName = "ComboboxList";

// ---------------------------------------------------------------------------
// ComboboxItem
// ---------------------------------------------------------------------------

interface ComboboxItemProps extends HTMLAttributes<HTMLDivElement> {
  icon?: IconComponent;
  /** The item's value — a string item itself, or an object item's `value`. */
  value: string;
  disabled?: boolean;
}

const ComboboxItem = forwardRef<HTMLDivElement, ComboboxItemProps>(
  (
    { className, children, icon: Icon, value, disabled = false, onClick, ...props },
    ref
  ) => {
    const comboboxCtx = useComboboxContext();
    const contentCtx = useContext(ComboboxContentContext);
    const index = useContext(ComboboxItemIndexContext);
    const internalRef = useRef<HTMLDivElement>(null);
    const shape = popupShape;
    const sizeClasses = useSize();
    const compact = sizeClasses.variant === "compact";
    const hasMounted = useRef(false);

    useEffect(() => {
      hasMounted.current = true;
    }, []);

    // Register with fluid hover. Depends on the (stable) registerItem
    // rather than the content context, which is rebuilt on every activeIndex
    // change.
    const registerItem = contentCtx?.registerItem;
    useRegisterFluidHoverItem(registerItem, index, internalRef);

    const isActive = contentCtx?.activeIndex === index;
    const isChecked = comboboxCtx.values.includes(value);
    const skipAnimation = !hasMounted.current;
    const item = comboboxCtx.filteredItems[index];

    return (
      <div
        ref={(node: HTMLDivElement | null) => {
          (internalRef as React.MutableRefObject<HTMLDivElement | null>).current =
            node;
          if (typeof ref === "function") ref(node);
          else if (ref)
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        id={`${comboboxCtx.listId}-${index}`}
        role="option"
        aria-selected={isChecked}
        aria-disabled={disabled || undefined}
        data-fluid-hover-index={index}
        data-value={value}
        // Keep DOM focus in the input: a press on a row must not blur it.
        onPointerDown={(e) => e.preventDefault()}
        onPointerMove={() => {
          if (disabled) return;
          const h = comboboxCtx.highlightRef.current;
          if (!h || h.index !== index || h.keyboard)
            comboboxCtx.setHighlight({ index, keyboard: false });
        }}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented || disabled || !item) return;
          comboboxCtx.select(item);
        }}
        className={cn(
          // Fixed height so the text-box trim on the label doesn't shrink
          // the row; shrink-0 because the list is a max-height flex column.
          `relative z-10 flex ${sizeClasses.control} shrink-0 items-center ${sizeClasses.gap} ${shape.item} ${sizeClasses.itemPx} ${sizeClasses.text} cursor-pointer outline-none select-none`,
          "transition-[color] duration-80",
          isActive || isChecked ? "text-foreground" : "text-muted-foreground",
          disabled && "opacity-50 pointer-events-none",
          className
        )}
        {...props}
      >
        {Icon && (
          <Icon
            size={sizeClasses.icon}
            strokeWidth={isActive || isChecked ? 2 : 1.5}
            className="shrink-0 transition-[color,stroke-width] duration-80"
          />
        )}

        {/* py-1/-my-1 keeps truncate's overflow:hidden from clipping
            ascenders/descenders outside the trimmed box. */}
        <span className="flex-1 min-w-0 truncate [text-box:trim-both_cap_alphabetic] py-1 -my-1">
          {children}
        </span>

        {/* Always-rendered fixed slot so the check appearing/disappearing
            never changes the row's intrinsic width. */}
        <span
          aria-hidden
          className={cn("shrink-0", compact ? "w-3.5 h-3.5" : "w-4 h-4")}
        >
          <AnimatePresence>
            {isChecked && (
              <motion.svg
                key="check"
                width={sizeClasses.icon}
                height={sizeClasses.icon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-foreground"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 1 }}
              >
                <motion.path
                  d="M4 12L9 17L20 6"
                  initial={{ pathLength: skipAnimation ? 1 : 0 }}
                  animate={{
                    pathLength: 1,
                    transition: { duration: 0.08, ease: "easeOut" },
                  }}
                  exit={{
                    pathLength: 0,
                    transition: { duration: 0.04, ease: "easeIn" },
                  }}
                />
              </motion.svg>
            )}
          </AnimatePresence>
        </span>
      </div>
    );
  }
);

ComboboxItem.displayName = "ComboboxItem";

// ---------------------------------------------------------------------------
// ComboboxEmpty — shown in place of the list when nothing matches.
// ---------------------------------------------------------------------------

interface ComboboxEmptyProps extends HTMLAttributes<HTMLDivElement> {
  /** Shown instead of the children when `hideSelected` has emptied the
   *  list with nothing typed: every item is a chip already. */
  allSelected?: ReactNode;
}

const ComboboxEmpty = forwardRef<HTMLDivElement, ComboboxEmptyProps>(
  ({ className, children, allSelected, ...props }, ref) => {
    const { filteredItems, allSelected: exhausted } = useComboboxContext();
    const sizeClasses = useSize();
    return (
      // Always mounted as a live region; the message only renders while the
      // list is empty, so the padding is gated on having content.
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className={cn(
          "px-3 text-center text-muted-foreground [&:not(:empty)]:py-6",
          sizeClasses.text,
          className
        )}
        {...props}
      >
        {filteredItems.length === 0
          ? exhausted && allSelected !== undefined
            ? allSelected
            : children
          : null}
      </div>
    );
  }
);

ComboboxEmpty.displayName = "ComboboxEmpty";

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  Combobox,
  ComboboxInput,
  ComboboxChips,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  fieldVariants as comboboxFieldVariants,
};

export type {
  ComboboxItemData,
  ComboboxValue,
  ComboboxProps,
  ComboboxInputProps,
  ComboboxChipsProps,
  ComboboxContentProps,
  ComboboxListProps,
  ComboboxItemProps,
  ComboboxEmptyProps,
};
