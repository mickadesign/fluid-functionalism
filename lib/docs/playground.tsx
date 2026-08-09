"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { SurfaceProvider } from "@/lib/surface-context";
import { useRightRailNode } from "@/lib/right-rail";
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
export const PLAY_SWITCH = "w-full flex-row-reverse justify-between h-9 px-1 py-0";

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
        "flex h-9 items-center justify-between px-1",
        disabled && "opacity-40 pointer-events-none"
      )}
    >
      <span className="text-body text-muted-foreground">{label}</span>
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
      <SelectTrigger
        variant="borderless"
        className="min-w-0 w-auto h-7 px-2 text-body"
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
  return (
    <div
      className="px-1 pb-1 pt-1 text-caption text-muted-foreground"
      style={{ fontVariationSettings: fontWeights.semibold }}
    >
      {label}
    </div>
  );
}

/** Hairline between two control groups. */
export function PlayDivider() {
  return <div className="my-2 border-t border-border/60" />;
}

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
  return (
    <SurfaceProvider value={2}>
      <div className="w-full rounded-lg bg-muted p-3">
        <div className="flex items-center justify-between px-1 pt-1 pb-2">
          <h2
            className="text-title text-foreground leading-none"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onShuffle}
            aria-label="Randomize properties"
            title="Randomize"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-hover transition-colors duration-80 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
          >
            <Shuffle size={15} strokeWidth={1.5} />
          </button>
        </div>
        {children}
      </div>
    </SurfaceProvider>
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
      {mounted && !inRail && <div className="mt-3">{controls}</div>}
    </div>
  );
}
