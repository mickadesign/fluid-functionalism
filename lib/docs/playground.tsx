"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Shuffle } from "lucide-react";
import { animate } from "motion/react";
import { spring } from "@/registry/default/lib/springs";
import { cn } from "@/lib/utils";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { RailHairline, useRightRailNode } from "@/lib/right-rail";
import { Tooltip } from "@/registry/radix/tooltip";
import { showShortcutToast } from "@/lib/docs/settings-toast";
import { useShape } from "@/lib/shape-context";
import { useFluidHover } from "@/hooks/use-fluid-hover";
import { FluidHoverHighlight } from "@/components/ui/fluid-hover-highlight";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/flavored/select";

// ---------------------------------------------------------------------------
// Shared scaffolding for doc-page playgrounds (Card, Button, …): the control
// rows, the muted panel with its shuffle header, and the layout that parks the
// controls in the desktop right rail while the preview stays in the column.
// ---------------------------------------------------------------------------

// Reversed layout turns the library Switch (toggle → label) into a settings
// row (label ← left, toggle → right) that matches the borderless-select rows.
// play-row: one stop of the panel's fluid hover (see PlaygroundPanel).
// Its height is the Switch's own by the Size setting: 36px at default, and
// at least the compact select row's 28px (the compact switch alone is 24px).
export const PLAY_SWITCH = "play-row w-full min-h-7 flex-row-reverse justify-between px-2";

export function PlayField({
  label,
  children,
  disabled = false,
}: {
  label: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between pl-2",
        disabled && "opacity-40 pointer-events-none"
      )}
    >
      <span className="text-site-body text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

export function PlaySelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      {/* play-row: one stop of the panel's fluid hover. */}
      <SelectTrigger
        variant="borderless"
        className="play-row relative z-10 min-w-0 w-auto px-2 text-site-body"
      />
      <SelectContent>
        {options.map((o, i) => (
          <SelectItem key={o.value} value={o.value} index={i}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function PlaySection({ label }: { label: string }) {
  // Full-contrast at the rows' own size, so the section titles read as
  // headings of the list rather than a smaller muted caption.
  return (
    <div
      className="px-2 pb-1 pt-2 text-site-body text-foreground"
      style={{ fontVariationSettings: fontWeights.semibold }}
    >
      {label}
    </div>
  );
}

/** Pins a playground's `overlay` to the bottom centre of the preview area.
 *  The host's preview area must be the nearest positioned ancestor. */
export function PlaygroundOverlay({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center [&>*]:pointer-events-auto">
      {children}
    </div>
  );
}

/** Hairline between two control groups, inset like the group label's. */
export function PlayDivider() {
  return <div aria-hidden className="my-2 mx-2 h-px shrink-0 bg-border" />;
}

// True when PlaygroundLayout renders the controls under the preview instead
// of in the rail: the panel then drops the rail's group spacing.
const InlinePlaygroundContext = createContext(false);

/** The muted controls card: title row with a shuffle button, fields below. */
export function PlaygroundPanel({
  title = "Playground variant",
  onShuffle,
  children,
}: {
  title?: string;
  onShuffle: () => void;
  children: ReactNode;
}) {
  // A group like the settings above it and the left sidebar's: no card, a
  // small label with the shuffle on its right, a hairline under it.
  const shape = useShape();
  const inline = useContext(InlinePlaygroundContext);

  // X shuffles, like the settings' single-key shortcuts and with their
  // guards: not while typing, not from inside a menu or a dialog.
  const shuffleRef = useRef(onShuffle);
  const keyRef = useRef<HTMLElement>(null);
  useEffect(() => {
    shuffleRef.current = onShuffle;
  });
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "x" && e.key !== "X") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) return;
      if (target?.closest('[role="listbox"], [role="menu"], [role="dialog"], [role="combobox"], [role="option"]')) return;
      e.preventDefault();
      shuffleRef.current();
      showShortcutToast("X", "Playground shuffled");
      // The key chip presses like the settings' chips: down, held 80ms,
      // then back on the fast spring.
      const key = keyRef.current;
      if (!key) return;
      clearTimeout(release);
      animate(key, { scale: 0.85 }, spring.fast);
      release = setTimeout(() => animate(key, { scale: 1 }, spring.fast), 80);
    };
    let release: ReturnType<typeof setTimeout> | undefined;
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      clearTimeout(release);
    };
  }, []);

  // One fluid hover across the controls, as in the settings group: every
  // select trigger and switch row (marked play-row) is a stop, in page order.
  // Playgrounds build their rows freely, so the stops are read off the DOM,
  // and registered again only when that list changes.
  const listRef = useRef<HTMLDivElement>(null);
  const hover = useFluidHover(listRef, {
    // A disabled field fades its row and stops pointer events on it.
    isItemDisabled: (el) => !!el.closest(".pointer-events-none"),
  });
  // registerItem is stable; the handlers object is new each render.
  const { registerItem, handlers } = hover;
  const registered = useRef<HTMLElement[]>([]);
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const sync = () => {
      const rows = [...list.querySelectorAll<HTMLElement>(".play-row")];
      const prev = registered.current;
      if (rows.length === prev.length && rows.every((el, i) => el === prev[i])) return;
      prev.forEach((_, i) => registerItem(i, null));
      rows.forEach((el, i) => registerItem(i, el));
      registered.current = rows;
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(list, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      registered.current.forEach((_, i) => registerItem(i, null));
      registered.current = [];
    };
  }, [registerItem]);

  return (
    // In the rail, pt-8 is a clear break from the settings group above,
    // double the sidebar's 16px between groups. Under the preview there is no
    // group above, and -mx-2 hangs the rows' 8px inset outside the column, so
    // the labels, chevrons and hairline line up with the preview's edges.
    <div className={cn("w-full", inline ? "-mx-2 w-auto" : "pt-8")}>
      <div className="flex h-8 items-center justify-between pl-2">
        <h2 className="text-site-caption text-foreground">{title}</h2>
        {/* The X key chip, then the icon: px-1.5 + mr-0.5 end the icon 8px
            in, under the hairline's end and the chevrons. */}
        {/* The key shows on the button itself, so the tooltip names it. */}
        <Tooltip content="Shuffle">
          <button
            type="button"
            onClick={onShuffle}
            aria-label="Shuffle the playground"
            aria-keyshortcuts="X"
            // Rounds with the Radius setting, like the select triggers beside it.
            className={cn(
              "mr-0.5 flex h-7 items-center gap-1.5 px-1.5 text-muted-foreground hover:text-foreground hover:bg-hover transition-colors duration-80 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
              shape.input
            )}
          >
            {/* The settings' key chip; hidden on touch, where there is no X. */}
            <kbd
              ref={keyRef}
              aria-hidden
              className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center bg-[light-dark(rgb(23_23_23/0.08),rgb(245_245_245/0.08))] px-1 font-mono text-site-micro leading-none text-muted-foreground rounded-[2px] pointer-coarse:hidden"
            >
              X
            </kbd>
            <Shuffle size={16} strokeWidth={1.5} />
          </button>
        </Tooltip>
      </div>
      <RailHairline />
      {/* Triggers drop their own hover fill: the gliding one replaces it. */}
      <div
        ref={listRef}
        className="relative flex flex-col [&_.play-row:hover]:bg-transparent"
        {...handlers}
      >
        <FluidHoverHighlight hover={hover} className={shape.input} />
        {children}
      </div>
    </div>
  );
}

// True at ≥1280px, where the right rail is visible (below that it's
// display:none, so controls fall back to rendering inline under the preview).
function useIsXl() {
  const [isXl, setIsXl] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const sync = () => setIsXl(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return isXl;
}

/** Preview in the main column; controls portaled into the desktop right rail
 *  (fading with the preview's visibility) or rendered inline below it on
 *  narrower screens. */
export function PlaygroundLayout({
  preview,
  controls,
}: {
  preview: ReactNode;
  controls: ReactNode;
}) {
  // Park the controls in the right rail on wide screens; inline below the
  // preview otherwise. `mounted` gates the first paint so desktop doesn't flash
  // the controls inline before the portal target resolves.
  const railNode = useRightRailNode();
  const isXl = useIsXl();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const inRail = isXl && !!railNode;

  // Show the rail controls only while the center playground is on screen —
  // once it scrolls out of view, the controls in the rail disappear.
  const playgroundRef = useRef<HTMLDivElement>(null);
  const [playgroundInView, setPlaygroundInView] = useState(true);
  useEffect(() => {
    const el = playgroundRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setPlaygroundInView(entry.isIntersecting),
      { rootMargin: "0px 0px -20% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={playgroundRef}>
      {preview}
      {mounted && inRail && (
        // Kept mounted so it can cross-fade (the same fade the side panels use)
        // as the playground scrolls in and out of view, rather than snapping.
        createPortal(
          <div className="inview-fade-block" data-shown={playgroundInView}>
            {controls}
          </div>,
          railNode
        )
      )}
      {mounted && !inRail && (
        <div className="mt-3">
          <InlinePlaygroundContext.Provider value={true}>{controls}</InlinePlaygroundContext.Provider>
        </div>
      )}
    </div>
  );
}
