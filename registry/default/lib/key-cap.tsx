import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// One look for every keystroke: an 18px filled cap, no outline. `inverted`
// is the same cap on a dark surface (a tooltip, a toast, a primary button).
const cap =
  "inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-[2px] px-1 font-mono text-[length:var(--fs-micro,11px)] leading-none";

const tones = {
  default: "bg-foreground/[0.08] text-muted-foreground",
  inverted: "bg-background/15 text-background",
};

// The mono face draws ⌘ and the arrows smaller than its letters; the sans
// face draws them at letter size.
const isGlyph = (key: ReactNode) =>
  typeof key === "string" && !/[a-z0-9]/i.test(key);

/** "⇧⌘O" → ["⇧", "⌘", "O"], "Ctrl+K" → ["Ctrl", "K"], "Esc" → ["Esc"].
 *  Spaces separate keys, so a key with a space in its name ("Page Up")
 *  goes in an array: ["Page Up"]. An empty string is no keys. */
export function splitKeys(combo: string): string[] {
  return combo.match(/[⌘⇧⌥⌃]|[^⌘⇧⌥⌃+\s]+|\+$/g) ?? [];
}

export interface KeyCapProps extends HTMLAttributes<HTMLElement> {
  tone?: keyof typeof tones;
}

/** One key. */
const KeyCap = forwardRef<HTMLElement, KeyCapProps>(
  ({ tone = "default", className, children, ...props }, ref) => (
    <kbd
      ref={ref}
      className={cn(cap, tones[tone], isGlyph(children) && "font-sans", className)}
      {...props}
    >
      {children}
    </kbd>
  )
);
KeyCap.displayName = "KeyCap";

export interface KeyCapsProps extends HTMLAttributes<HTMLElement> {
  /** A combo ("⇧⌘O", "Ctrl+K") split into one cap per key, or the keys
   *  as an array (the form for a key with a space: ["Page Up"]). */
  keys: string | readonly string[];
  tone?: keyof typeof tones;
}

/** A combo, one cap per key, 2px apart. */
const KeyCaps = forwardRef<HTMLElement, KeyCapsProps>(
  ({ keys, tone, className, suppressHydrationWarning, ...props }, ref) => (
    <span
      ref={ref}
      className={cn("inline-flex shrink-0 items-center gap-0.5", className)}
      {...props}
    >
      {(typeof keys === "string" ? splitKeys(keys) : keys).map((key, i) => (
        // React silences a text mismatch only on the element that holds the
        // text, so the flag goes on each cap, not on the wrapper.
        <KeyCap key={`${key}-${i}`} tone={tone} suppressHydrationWarning={suppressHydrationWarning}>
          {key}
        </KeyCap>
      ))}
    </span>
  )
);
KeyCaps.displayName = "KeyCaps";

export { KeyCap, KeyCaps };
