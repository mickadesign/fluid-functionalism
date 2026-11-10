"use client";

import { inKeyboardScope } from "@/lib/keyboard-scope";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Toaster, toast } from "sonner";

import { cn } from "@/lib/utils";
import { spring } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import { useShape, useShapeContext } from "@/lib/shape-context";
import { useSizeContext } from "@/lib/size-context";
import { useThemeContext } from "@/registry/default/lib/theme-context";
import { useIconLibrary, iconLibraryLabels } from "@/lib/docs/icon-playground";
import { useIcon } from "@/lib/icon-context";

/** Which right-panel setting each global shortcut key drives. */
const shortcutSettings = {
  t: "theme",
  r: "shape",
  s: "size",
  i: "icons",
} as const;

type Setting = (typeof shortcutSettings)[keyof typeof shortcutSettings];

/** Display label of the shortcut key for each setting (shown in the toast). */
const settingKeys: Record<Setting, string> = {
  theme: "T",
  shape: "R",
  size: "S",
  icons: "I",
};

const TOAST_MS = 2000;

// A shortcut keydown and the context update it causes land within a frame or
// two of each other; the window only exists so a stale keypress can't claim a
// later pointer-driven change (e.g. picking from the select with the mouse).
const MATCH_WINDOW_MS = 300;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Monotonic press counter shared by every shortcut toast — a repeat press
// updates the single toast in place and replays its pressed-state dip.
let pressSeq = 0;

/** Surface a shortcut-driven change the way the settings shortcuts do — the
 *  key as an inverted chip beside the message, one toast slot for all of
 *  them. Exported for shortcuts whose state lives outside this watcher (the
 *  sidebar's "[", the properties panel's "]"). */
export function showShortcutToast(keyLabel: string, message: string) {
  const press = ++pressSeq;
  toast.custom(
    () => <ShortcutToast keyLabel={keyLabel} message={message} press={press} />,
    {
      id: "settings-shortcut",
      duration: TOAST_MS,
      // A custom toast's <li> shrinks to fit and left-aligns inside the
      // centered 356px-wide list; full width lets the body's mx-auto center.
      style: { width: "100%" },
    }
  );
}

/** Surface a completed action (a command menu pick, a copy) in the same
 *  shell as the shortcut toasts — fit to its text, control height, inverted
 *  colors — with a check where the key cap would be. Its own slot, so a
 *  shortcut toast and a success toast never fight over one. */
export function showSuccessToast(message: string) {
  toast.custom(() => <SuccessToast message={message} />, {
    id: "site-success",
    duration: TOAST_MS,
    style: { width: "100%" },
  });
}

/** Surface an action that can be taken back (a delete): the same inverted
 *  shell, the message, and an Undo button. Its own slot, held longer than
 *  the others so there's time to reach the button. */
export function showUndoToast(message: string, onUndo: () => void) {
  toast.custom((id) => <UndoToast message={message} onUndo={() => {
    onUndo();
    toast.dismiss(id);
  }} />, {
    id: "site-undo",
    duration: 6000,
    style: { width: "100%" },
  });
}

function UndoToast({ message, onUndo }: { message: string; onUndo: () => void }) {
  const shapeClasses = useShape();
  return (
    <div
      role="status"
      className={cn(
        "mx-auto flex h-9 w-max items-center gap-3 bg-foreground pl-3 pr-1 text-site-body text-background",
        shapeClasses.bg
      )}
      style={{ fontVariationSettings: fontWeights.normal }}
    >
      <span className="[text-box:trim-both_cap_alphabetic]">{message}</span>
      <button
        type="button"
        onClick={onUndo}
        className={cn(
          "inline-flex h-7 cursor-pointer items-center gap-1.5 px-2 text-background outline-none transition-colors duration-80 hover:bg-background/15 focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
          shapeClasses.input
        )}
        style={{ fontVariationSettings: fontWeights.semibold }}
      >
        Undo
        <kbd className="font-mono text-site-micro">⌘Z</kbd>
      </button>
    </div>
  );
}

function SuccessToast({ message }: { message: string }) {
  const shapeClasses = useShape();
  const CheckIcon = useIcon("check");
  return (
    <div
      className={cn(
        "mx-auto flex h-9 w-max items-center gap-2 bg-foreground px-3 text-site-body text-background",
        shapeClasses.bg
      )}
      style={{ fontVariationSettings: fontWeights.normal }}
    >
      <span
        aria-hidden
        className={cn(
          "inline-flex h-[18px] w-[18px] items-center justify-center bg-background/15 text-background",
          shapeClasses.bg
        )}
      >
        <CheckIcon size={12} strokeWidth={2.5} />
      </span>
      <span className="[text-box:trim-both_cap_alphabetic]">{message}</span>
    </div>
  );
}

/**
 * The toast body — rendered by Sonner inside the Toaster (which mounts within
 * all the site providers, so the shape context resolves). Carries the
 * tooltip's inverted colors (bg-foreground / text-background) with the
 * pressed key as an inline-code chip on the left — same chip recipe as
 * AskUserQuestions' inverted ShortcutChip — rather than Sonner's default
 * styling.
 */
function ShortcutToast({
  keyLabel,
  message,
  press,
}: {
  keyLabel: string;
  message: string;
  /** Monotonic press counter — a change while visible replays the dip. */
  press: number;
}) {
  const shapeClasses = useShape();

  // Pressed-state feedback for repeat presses: dip the scale, then spring
  // back. Modeled as a retargeting transition (pressed → released) rather
  // than keyframes so a press mid-release smoothly redirects instead of
  // restarting — the toast reads as a button being tapped again. spring.fast:
  // micro-interaction tier. The first render skips the dip — Sonner's own
  // entrance covers the initial appearance.
  const [pressed, setPressed] = useState(false);
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    setPressed(true);
    const release = setTimeout(() => setPressed(false), 80);
    return () => clearTimeout(release);
  }, [press]);

  return (
    <motion.div
      animate={{ scale: pressed ? 0.95 : 1 }}
      transition={spring.fast}
      className={cn(
        "mx-auto flex h-9 w-max items-center gap-2 bg-foreground px-3 text-site-body text-background",
        shapeClasses.bg
      )}
      style={{ fontVariationSettings: fontWeights.normal }}
    >
      <kbd
        aria-hidden
        className={cn(
          "inline-flex h-[18px] min-w-[18px] items-center justify-center bg-background/15 px-1 font-mono text-[11px] leading-none text-background",
          shapeClasses.bg
        )}
      >
        {keyLabel}
      </kbd>
      <span className="[text-box:trim-both_cap_alphabetic]">{message}</span>
    </motion.div>
  );
}

/**
 * Docs-site-only confirmation toast (Sonner): when one of the global settings
 * shortcuts (T theme / R radius / S size / I icons) changes a value, the new
 * value is announced in a success toast at the bottom center. Pointer-driven
 * changes through the right panel's selects stay silent — the panel itself
 * already shows the result. Mount once in the root layout, inside all the
 * setting providers.
 */
export function SettingsToast() {
  const { theme } = useThemeContext();
  const { shape } = useShapeContext();
  const { size } = useSizeContext();
  const { iconLibrary } = useIconLibrary();

  // Last shortcut keypress that could have caused a settings change. A ref —
  // recording it must not re-render, and the change effect below reads it
  // synchronously.
  const pendingRef = useRef<{ setting: Setting; at: number } | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Keys typed in a preview belong to the component in it.
      if (inKeyboardScope(e.target)) return;
      const setting =
        shortcutSettings[e.key.toLowerCase() as keyof typeof shortcutSettings];
      if (!setting) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Mirror the shortcut guards: keys typed into fields or open popups
      // (select typeahead) never trigger the shortcuts, so they must not
      // claim the resulting change either. (e.target can be the document
      // itself, which has no closest() — hence the instanceof check.)
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      )
        return;
      if (
        target?.closest(
          '[role="listbox"], [role="menu"], [role="dialog"], [role="combobox"], [role="option"]'
        )
      )
        return;
      pendingRef.current = { setting, at: e.timeStamp };
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Detect which setting changed and, if a matching shortcut was just
  // pressed, surface the new value. First run only seeds the previous values.
  const prevRef = useRef<{
    theme: string;
    shape: string;
    size: string;
    iconLibrary: string;
  } | null>(null);
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = { theme, shape, size, iconLibrary };
    if (!prev) return;

    let changed: { setting: Setting; message: string } | null = null;
    if (theme !== prev.theme)
      changed = { setting: "theme", message: `Theme set to ${capitalize(theme)}` };
    else if (shape !== prev.shape)
      changed = { setting: "shape", message: `Radius set to ${capitalize(shape)}` };
    else if (size !== prev.size)
      changed = { setting: "size", message: `Size set to ${capitalize(size)}` };
    else if (iconLibrary !== prev.iconLibrary)
      changed = {
        setting: "icons",
        message: `Icons set to ${iconLibraryLabels[iconLibrary]}`,
      };
    if (!changed) return;

    const pending = pendingRef.current;
    if (
      !pending ||
      pending.setting !== changed.setting ||
      performance.now() - pending.at > MATCH_WINDOW_MS
    )
      return;
    pendingRef.current = null;
    const { setting, message } = changed;
    showShortcutToast(settingKeys[setting], message);
  }, [theme, shape, size, iconLibrary]);

  return <Toaster position="bottom-center" />;
}
