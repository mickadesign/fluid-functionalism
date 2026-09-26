"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { spring } from "@/registry/default/lib/springs";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { Button } from "@/registry/radix/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/flavored/select";
import {
  useShape,
  useShapeContext,
  type ShapeVariant,
} from "@/lib/shape-context";
import { useSizeContext, type SizeVariant } from "@/lib/size-context";
import { useThemeContext, type Theme } from "@/registry/default/lib/theme-context";
import { useIcon } from "@/lib/icon-context";
import {
  useIconLibrary,
  iconLibraryOrder,
  iconLibraryLabels,
  type IconLibrary,
} from "@/lib/docs/icon-playground";
import { SurfaceProvider } from "@/lib/surface-context";
import { RightRailTarget } from "@/lib/right-rail";
import { showShortcutToast } from "@/lib/docs/settings-toast";
import { Tooltip } from "@/registry/radix/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBase, type Base } from "@/lib/base-context";

const REPO = "mickadesign/fluid-functionalism";

function formatStars(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return String(n);
}

/** GitHub mark, shaped as an IconComponent so it can ride Button's leadingIcon slot. */
function GitHubIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

/** Standalone GitHub star-count button — rendered next to the "Make them yours" heading. */
// One fetch per page load, shared by every instance (right panel + the
// sidebar sheet's footer). Without the cache, each sheet open remounted the
// button and refired the unauthenticated API call — GitHub rate-limits those
// per IP, after which the count silently disappeared.
let cachedStars: number | null = null;
let starsPromise: Promise<number | null> | null = null;

function fetchStars(): Promise<number | null> {
  starsPromise ??= fetch(`https://api.github.com/repos/${REPO}`, {
    headers: { Accept: "application/vnd.github.v3+json" },
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data?.stargazers_count != null) cachedStars = data.stargazers_count;
      return cachedStars;
    })
    .catch(() => null);
  return starsPromise;
}

export function GitHubStarButton() {
  const shapeCtx = useShape();
  const [stars, setStars] = useState<number | null>(cachedStars);

  useEffect(() => {
    if (cachedStars !== null) return;
    let cancelled = false;
    fetchStars().then((count) => {
      if (!cancelled && count !== null) setStars(count);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Button
      variant="ghost"
      size="sm"
      leadingIcon={GitHubIcon}
      aria-label="View on GitHub"
      className={shapeCtx.button}
      onClick={() =>
        window.open(
          `https://github.com/${REPO}`,
          "_blank",
          "noopener,noreferrer"
        )
      }
    >
      {stars !== null && (
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {formatStars(stars)}
        </span>
      )}
    </Button>
  );
}

/** The inner settings content — reused in the right column and mobile drawer. */
export function SettingsContent({ tooltipSide = "left" }: { tooltipSide?: "left" | "right" | "top" | "bottom" }) {
  const { theme, setTheme } = useThemeContext();
  const { shape, setShape } = useShapeContext();
  const { size, setSize } = useSizeContext();
  const { iconLibrary, setIconLibrary } = useIconLibrary();
  const { base, setBase } = useBase();

  const MonitorIcon = useIcon("monitor");
  const SunIcon = useIcon("sun");
  const MoonIcon = useIcon("moon");
  const RectHorizIcon = useIcon("rectangle-horizontal");
  const CircleIcon = useIcon("circle");
  const PaletteIcon = useIcon("palette");
  const RadixIcon = useIcon("circle");
  const BaseUiIcon = useIcon("square-library");

  const themeOptions = [
    { label: "System", value: "system" as Theme, icon: MonitorIcon },
    { label: "Light", value: "light" as Theme, icon: SunIcon },
    { label: "Dark", value: "dark" as Theme, icon: MoonIcon },
  ];

  const shapeOptions = [
    { label: "Rounded", value: "rounded" as ShapeVariant, icon: RectHorizIcon },
    { label: "Pill", value: "pill" as ShapeVariant, icon: CircleIcon },
  ];

  const sizeOptions = [
    { label: "Default", value: "default" as SizeVariant },
    { label: "Compact", value: "compact" as SizeVariant },
  ];

  const iconOptions = iconLibraryOrder.map((lib) => ({
    label: iconLibraryLabels[lib],
    value: lib,
    icon: PaletteIcon,
  }));

  const baseOptions = [
    { label: "Radix", value: "radix" as Base, icon: RadixIcon },
    { label: "Base UI", value: "base" as Base, icon: BaseUiIcon },
  ];

  return (
    <div className="flex flex-col gap-2">
      {/* Theme, Radius & Icons selects */}
      <div className="flex flex-col gap-1.5 py-3">
        <Tooltip content={<span>Press &ensp;<kbd className="font-mono opacity-50">T</kbd>&ensp; to cycle</span>} side={tooltipSide}>
          <div className="flex items-center justify-between">
            <span className="text-body text-muted-foreground">Theme</span>
            <Select value={theme} onValueChange={(v) => setTheme(v as Theme)}>
              <SelectTrigger
                variant="borderless"
                className="min-w-0 w-auto h-7 px-2 text-body"
                icon={themeOptions.find((o) => o.value === theme)?.icon}
              />
              <SelectContent>
                {themeOptions.map((o, i) => (
                  <SelectItem key={o.value} value={o.value} index={i} icon={o.icon}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Tooltip>
        <Tooltip content={<span>Press &ensp;<kbd className="font-mono opacity-50">R</kbd>&ensp; to toggle</span>} side={tooltipSide}>
          <div className="flex items-center justify-between">
            <span className="text-body text-muted-foreground">Radius</span>
            <Select value={shape} onValueChange={(v) => setShape(v as ShapeVariant)}>
              <SelectTrigger
                variant="borderless"
                className="min-w-0 w-auto h-7 px-2 text-body"
                icon={shapeOptions.find((o) => o.value === shape)?.icon}
              />
              <SelectContent>
                {shapeOptions.map((o, i) => (
                  <SelectItem key={o.value} value={o.value} index={i} icon={o.icon}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Tooltip>
        <Tooltip content={<span>Press &ensp;<kbd className="font-mono opacity-50">S</kbd>&ensp; to toggle</span>} side={tooltipSide}>
          <div className="flex items-center justify-between">
            <span className="text-body text-muted-foreground">Size</span>
            <Select value={size} onValueChange={(v) => setSize(v as SizeVariant)}>
              <SelectTrigger
                variant="borderless"
                className="min-w-0 w-auto h-7 px-2 text-body"
              />
              <SelectContent>
                {sizeOptions.map((o, i) => (
                  <SelectItem key={o.value} value={o.value} index={i}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Tooltip>
        <Tooltip content={<span>Press &ensp;<kbd className="font-mono opacity-50">I</kbd>&ensp; to cycle</span>} side={tooltipSide}>
          <div className="flex items-center justify-between">
            <span className="text-body text-muted-foreground">Icons</span>
            <Select value={iconLibrary} onValueChange={(v) => setIconLibrary(v as IconLibrary)}>
              <SelectTrigger
                variant="borderless"
                className="min-w-0 w-auto h-7 px-2 text-body"
              />
              <SelectContent>
                {iconOptions.map((o, i) => (
                  <SelectItem key={o.value} value={o.value} index={i}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Tooltip>
        <div className="flex items-center justify-between">
          <span className="text-body text-muted-foreground">Primitive</span>
          <Select value={base} onValueChange={(v) => setBase(v as Base)}>
            <SelectTrigger
              variant="borderless"
              className="min-w-0 w-auto h-7 px-2 text-body"
            />
            <SelectContent>
              {baseOptions.map((o, i) => (
                <SelectItem key={o.value} value={o.value} index={i}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Credit */}
      <div className="flex items-center gap-2">
        <img
          src="/micka.png"
          alt=""
          className="w-5 h-5 rounded-full object-cover shrink-0 outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
        />
        <p className="text-body text-muted-foreground">
          Created by{" "}
          <a
            href="https://x.com/micka_design"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded text-muted-foreground hover:text-foreground transition-colors duration-80 outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] focus-visible:ring-offset-2"
          >
            @micka_design
          </a>
        </p>
      </div>

    </div>
  );
}

/** Desktop-only right column that mirrors the left sidebar styling. */
export function RightPanel() {
  // The bare "]" key shows/hides the panel — the mirror of the left rail's
  // "[" (the sidebar provider only ever claims its own side's key, so "]" is
  // free while no right-side Sidebar is mounted). Same guards as the other
  // site shortcuts: no modifiers, and typing surfaces own their keys.
  const [open, setOpen] = useState(true);
  const reduceMotion = useReducedMotion() ?? false;
  // The listener registers once; the ref keeps the current value in reach so
  // the toast can announce the RESULT without a setState-updater side effect.
  const openRef = useRef(open);
  openRef.current = open;
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "]") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Below xl the panel doesn't render — a shortcut that visibly does
      // nothing (but toasts and flips state) reads as broken.
      if (!window.matchMedia("(min-width: 1280px)").matches) return;
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      )
        return;
      e.preventDefault();
      const next = !openRef.current;
      setOpen(next);
      showShortcutToast(
        "]",
        next ? "Properties panel expanded" : "Properties panel collapsed"
      );
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const PanelRightIcon = useIcon("panel-right");

  return (
    <>
      {/* Collapsed, the panel leaves a way back in its own top-right spot —
          the same ghost trigger the sidebar uses, mirrored. */}
      <AnimatePresence>
        {!open && (
          <motion.div
            // Mirrors the left rail's reopen trigger: same top-4 inset from
            // its edge, same default trigger size.
            className="fixed top-4 right-4 z-40 max-xl:hidden"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{
              opacity: 0,
              transition: reduceMotion ? { duration: 0 } : spring.fast.exit,
            }}
            transition={reduceMotion ? { duration: 0 } : spring.fast}
          >
            <Tooltip
              side="left"
              content={
                <span className="flex items-center gap-2">
                  <span className="[text-box:trim-both_cap_alphabetic]">
                    Expand properties panel
                  </span>
                  <kbd className="-my-1 flex h-4 min-w-4 items-center justify-center rounded border border-background/30 px-1 font-sans text-[10px] text-background/80">
                    ]
                  </kbd>
                </span>
              }
            >
              <Button
                variant="ghost"
                size="icon"
                aria-label="Expand properties panel"
                onClick={() => setOpen(true)}
              >
                <PanelRightIcon />
              </Button>
            </Tooltip>
          </motion.div>
        )}
      </AnimatePresence>
    {/* max-xl:fixed — during the xl-fade-block fade-out the panel keeps
        display:block for the transition (allow-discrete), which would hold its
        264px of flex space and make the content reflow a second time when
        display finally flips to none. Fixed positioning below xl removes it
        from flow at the breakpoint (single reflow) while it fades in place:
        top-0/right-0 + mt-4 and the animated 16px marginRight land on the
        same 16px inset as the pinned sticky state. The wrapper carries the fade/sticky so pages can stack a
        second panel (RightRailTarget) below the settings.
        xl-fade-block sets display:block at ≥xl, so the flex column lives on an
        inner wrapper (else it would override `flex` and drop the gap).
        The "]" toggle animates width/margin (the sidebar-shell technique: the
        outer collapses while the inner keeps its true width) so the page
        content reflows into the space instead of snapping. */}
    <motion.div
      className="shrink-0 overflow-hidden sticky top-4 self-start mt-4 xl-fade-block max-xl:fixed max-xl:top-0 max-xl:right-0 max-xl:z-40 max-xl:pointer-events-none"
      initial={false}
      animate={{
        width: open ? 256 : 0,
        // 16px on the right, matching the 16px top (sticky top-4) and the
        // 16px the max-h calc leaves at the bottom — one even inset.
        marginRight: open ? 16 : 0,
        opacity: open ? 1 : 0,
      }}
      transition={
        reduceMotion ? { duration: 0 } : open ? spring.slow : spring.slow.exit
      }
      style={{ pointerEvents: open ? undefined : "none" }}
      // Collapsed is width:0 + opacity:0 — still in the DOM, so without
      // inert every control inside would stay tabbable and announced.
      inert={open ? undefined : true}
    >
      <div className="w-64">
      {/* Taller stacks (settings + playground controls) scroll within the
          viewport instead of running past it — the house ScrollArea (quiet
          thumb on the overlay ramp), scroll-fade dissolving the clipped
          edges. The fade sits on the viewport itself, so it starts at the
          panel's true edge — any breathing room lives INSIDE the scroller,
          under the mask, never outside pushing the gradient down. */}
      <ScrollArea viewportClassName="scroll-fade max-h-[calc(100svh-2rem)]">
      <div className="flex flex-col gap-3">
        <aside className="p-4 rounded-lg bg-muted">
          <SurfaceProvider value={2}>
            <div className="flex items-center justify-between pt-2 pb-2">
              <h2
                className="text-title text-foreground leading-none"
                style={{ fontVariationSettings: fontWeights.semibold }}
              >
                Make them yours
              </h2>
              <GitHubStarButton />
            </div>
            <SettingsContent tooltipSide="left" />
          </SurfaceProvider>
        </aside>

        {/* Page-owned slot — e.g. the Card doc's Playground controls. */}
        <RightRailTarget />
      </div>
      </ScrollArea>
      </div>
    </motion.div>
    </>
  );
}
