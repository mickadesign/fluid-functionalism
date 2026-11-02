"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  typeStyles,
  typeScale,
  typeClasses,
  typeClass,
  fieldTouchClass,
  type TypeScaleRole,
  type TypeScalePair,
  type TypeScaleStep,
} from "@/lib/type-scale";

type SizeVariant = "default" | "compact";

interface SizeClasses {
  /** The variant these classes belong to — handy for conditionals. */
  variant: SizeVariant;
  /** Bounded control height — buttons, inputs, select triggers, tabs —
   *  AND list/menu rows (select options, dropdown, checkbox and radio rows).
   *  One token by design: a popup row lines up with the trigger that opened
   *  it because they share this height. */
  control: string;
  /** `control` as a number, for consumers that need raw pixels. */
  controlHeight: number;
  /** Tab trigger height inside a padded segmented list. Sized so
   *  `segmentPad` + `segmentItem` adds back up to the control height —
   *  the segmented control's outer box stays on the same ladder. */
  segmentItem: string;
  /** Padding of the segmented list around its tabs. */
  segmentPad: string;
  /** Body text inside controls (size + line height), same as `type.body`.
   *  Its 20px line box (18px compact) is what puts a padded row on the
   *  ladder: 8 + 20 + 8 = 36, 5 + 18 + 5 = 28. */
  text: string;
  /** `text` for an editable field: the same body role, plus 16px on touch
   *  screens (`fieldTouchClass`), since iOS Safari zooms the page into a
   *  focused field set under 16px. */
  field: string;
  /** One class string per type role at this step (size + leading). */
  type: Record<TypeScaleRole, string>;
  /** Horizontal padding of bounded controls (select trigger, inputs). */
  px: string;
  /** Horizontal padding of list/menu rows, which sit inside a padded popup
   *  or group and need less inset than a bounded control. */
  itemPx: string;
  /** Gap between an icon / control glyph and its label, and between
   *  neighbouring controls in a row (toolbars, filter bars, button
   *  clusters). Density is spacing as much as control height, so the
   *  compact step halves it. */
  gap: string;
  /** Glyph size in px: leading/trailing icons inside controls, and the
   *  checkbox square / radio circle. */
  icon: number;
}

const sizeMap: Record<SizeVariant, SizeClasses> = {
  // 36px — the default control height. Matches a 13px label with comfortable
  // breathing room and keeps controls a workable pointer target.
  default: {
    variant: "default",
    control: "h-9",
    controlHeight: 36,
    segmentItem: "h-7",
    segmentPad: "p-1",
    text: typeClasses.default.body,
    field: `${typeClasses.default.body} ${fieldTouchClass}`,
    type: typeClasses.default,
    px: "px-3",
    itemPx: "px-2",
    gap: "gap-2",
    icon: 16,
  },
  // 28px — the compact height for dense surfaces: filter bars, toolbars,
  // table headers, sidebars. One step down in text (12px) and icon (14px)
  // so the whole control shrinks together, not just its box.
  compact: {
    variant: "compact",
    control: "h-7",
    controlHeight: 28,
    segmentItem: "h-6",
    segmentPad: "p-0.5",
    text: typeClasses.compact.body,
    field: `${typeClasses.compact.body} ${fieldTouchClass}`,
    type: typeClasses.compact,
    px: "px-2.5",
    itemPx: "px-1.5",
    gap: "gap-1",
    icon: 14,
  },
};

/** The type scale resolved for the active ladder step (font size in px per
 *  role): explicit override > surrounding SizeProvider > "default". Line
 *  heights live in `typeStyles` and the --lh-* tokens. */
function useTypeScale(
  override?: SizeVariant | null
): Record<TypeScaleRole, number> {
  const variant = useSizeVariant(override);
  return {
    display: typeScale.display[variant],
    title: typeScale.title[variant],
    subtitle: typeScale.subtitle[variant],
    body: typeScale.body[variant],
    caption: typeScale.caption[variant],
    micro: typeScale.micro[variant],
  };
}

interface SizeContextValue {
  size: SizeVariant;
  setSize: (size: SizeVariant) => void;
  classes: SizeClasses;
}

const SizeContext = createContext<SizeContextValue | null>(null);

/** Resolve the active size variant: explicit prop > provider > "default". */
function useSizeVariant(override?: SizeVariant | null): SizeVariant {
  const ctx = useContext(SizeContext);
  return override ?? ctx?.size ?? "default";
}

/** Resolve size classes: explicit prop > provider > "default". */
function useSize(override?: SizeVariant | null): SizeClasses {
  return sizeMap[useSizeVariant(override)];
}

function useSizeContext() {
  const ctx = useContext(SizeContext);
  if (!ctx) throw new Error("useSizeContext must be used within a SizeProvider");
  return ctx;
}

function SizeProvider({
  children,
  size,
  defaultSize = "default",
}: {
  children: ReactNode;
  /** Controlled variant — pin a whole region to one size (e.g. a compact
   *  filter bar). Overrides internal state. */
  size?: SizeVariant;
  defaultSize?: SizeVariant;
}) {
  const [internalSize, setInternalSize] = useState<SizeVariant>(defaultSize);
  const isControlled = size !== undefined;
  const resolved = size ?? internalSize;

  // Controlled providers ignore setSize entirely — a background write to the
  // shadowed internal state would pop back out if the size prop were later
  // removed.
  const setSize = useCallback(
    (next: SizeVariant) => {
      if (isControlled) return;
      setInternalSize(next);
    },
    [isControlled]
  );

  const value = useMemo(
    () => ({ size: resolved, setSize, classes: sizeMap[resolved] }),
    [resolved, setSize]
  );

  return <SizeContext.Provider value={value}>{children}</SizeContext.Provider>;
}

export {
  SizeProvider,
  useSize,
  useSizeVariant,
  useSizeContext,
  useTypeScale,
  sizeMap,
  typeStyles,
  typeScale,
  typeClasses,
  typeClass,
  fieldTouchClass,
};
export type {
  SizeVariant,
  SizeClasses,
  TypeScaleRole,
  TypeScalePair,
  TypeScaleStep,
};
