"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { AnimatePresence, animate, motion, useReducedMotion } from "motion/react";
import { spring } from "@/registry/default/lib/springs";
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
import { useSize, useSizeContext, type SizeVariant } from "@/lib/size-context";
import { useThemeContext, type Theme } from "@/registry/default/lib/theme-context";
import { useIcon } from "@/lib/icon-context";
import {
  useIconLibrary,
  iconLibraryOrder,
  iconLibraryLabels,
  type IconLibrary,
} from "@/lib/docs/icon-playground";
import { RailHairline, RightRailTarget } from "@/lib/right-rail";
import { cn } from "@/lib/utils";
import { useFluidHover } from "@/hooks/use-fluid-hover";
import { FluidHoverHighlight } from "@/components/ui/fluid-hover-highlight";
import { showShortcutToast } from "@/lib/docs/settings-toast";
import { Tooltip } from "@/registry/radix/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBase, type Base } from "@/lib/base-context";
import { StarterPromptButton } from "@/app/components/starter-install";
import { ColorPickerPopover } from "@/registry/default/color-picker";
import { accentHexOf, accentSwatches, useAccent } from "@/lib/docs/accent";
import { ACCENT_ORDER, LOW_ACCENT_CONTRAST, accentLabel, contrastRatio } from "@/lib/accent";
import { useHeadingFont, headingFontLabel, HeadingWeightSelect } from "@/lib/docs/heading-font";
import type { HeadingFont } from "@/lib/docs/site-settings";

const REPO = "mickadesign/fluid-functionalism";

/** The heading font select's action row: opens the Google Fonts picker. */
const BROWSE = "__browse";

/** The page background on each theme, as globals.css's --surface-1. Read
 *  as constants, not off the screen: the accent flips shade the moment the
 *  theme does, while the painted background is still crossfading, and a
 *  read mid-fade paired the new shade with a half-changed page. */
const PAGE_BG = { light: "#FAFAFA", dark: "#171717" };

/** Warns under the Accent row when a custom color nearly vanishes against
 *  the page: focus rings are 1px of the accent. Worded and styled like a
 *  field's error caption, after the Banner's warning glyph. */
function AccentContrastNote({ hex, dark }: { hex: string; dark: boolean }) {
  if (contrastRatio(hex, PAGE_BG[dark ? "dark" : "light"]) >= LOW_ACCENT_CONTRAST) return null;
  return (
    <p className="flex items-start gap-1.5 py-2 text-site-caption text-destructive">
      {/* Banner's filled warning triangle, its mark cut out in the page
          color; one caption line tall, centered on the first line. */}
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="mt-px shrink-0">
        <path
          d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <path
          d="M12 9.5v3.5M12 17h.01"
          className="stroke-background"
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Low contrast: Accent color will be hard to see
    </p>
  );
}

/** How far a setting's value travels as it rolls in or out. */
const ROLL = 16;
/** The trigger's edge fade while values roll: clear across the text's
 *  line, fading out over the top and bottom quarter. */
const ROLL_MASK = "linear-gradient(to bottom, transparent, #000 25%, #000 75%, transparent)";

/** The trigger's parts as they line up on screen (the key and chevron are
 *  reordered with CSS order), the key included, the chevron not. */
function inVisualOrder(trigger: HTMLElement): HTMLElement[] {
  return [...trigger.children]
    .filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el.dataset.rollCopy === undefined
    )
    .map((el, i) => ({ el, i, order: Number(getComputedStyle(el).order) || 0 }))
    .sort((a, b) => a.order - b.order || a.i - b.i)
    .map(({ el }) => el);
}

/** A shortcut key's chip, pressed: down 2px a side on its 18px. */
const KEY_PRESS = 0.85;

/** What rolls in a trigger: its first part, the value's text (a select's
 *  icon and label, the accent's name). The key and chevron hold still, and
 *  the accent's swatch fades from one color to the next instead (the
 *  site's color transition). */
function rollingParts(trigger: HTMLElement): HTMLElement[] {
  const first = trigger.firstElementChild;
  return first instanceof HTMLElement ? [first] : [];
}

/** The settings list's fluid hover: each row hands it its trigger. */
const SettingHoverContext = createContext<
  ((index: number, element: HTMLElement | null) => void) | null
>(null);

/** Whether rows inset their label 8px, to line up with a group label. */
const SettingInsetContext = createContext(true);

/** A setting: its label, then its control with the keyboard shortcut inside
 *  it, in view without a hover, in the key chip the settings toast shows
 *  when it's pressed. Touch screens drop the keys: there's no keyboard to
 *  press them on.
 *
 *  `index` is the value's place in its menu. When it changes (a shortcut
 *  cycling it, or a pick), the values roll like a list: the new one comes
 *  in from where it sits, from below going down the menu, from above going
 *  up or wrapping back to the top, while the old one leaves the other way,
 *  blurring as it fades. Both pass through a fade at the trigger's top and
 *  bottom edges, as a list scrolls under a scroll fade. */
function SettingRow({
  label,
  shortcut,
  index,
  hoverIndex,
  children,
}: {
  label: string;
  shortcut?: string;
  index?: number;
  /** The row's fixed place in the list's fluid hover. */
  hoverIndex: number;
  children: ReactNode;
}) {
  // The chevron's size, for the accent swatch to take the same room.
  const { icon } = useSize();
  const inset = useContext(SettingInsetContext);
  const reduceMotion = useReducedMotion();
  const controlRef = useRef<HTMLSpanElement>(null);
  // The control's trigger button, once mounted, to hold the shortcut key.
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  useLayoutEffect(() => {
    setTrigger(controlRef.current?.querySelector("button") ?? null);
  }, []);
  // The trigger joins the list's fluid hover: the highlight sits on it, and
  // a click anywhere on the row (its label too) goes to it.
  const registerHover = useContext(SettingHoverContext);
  useEffect(() => {
    if (!registerHover || !trigger) return;
    registerHover(hoverIndex, trigger);
    return () => registerHover(hoverIndex, null);
  }, [registerHover, hoverIndex, trigger]);
  // Pressing the key presses its chip, the way the settings toast dips on a
  // repeat press: down, held 80ms, then back on the fast spring. On window,
  // after the shortcut's own listener on document: it marks a key it acted
  // on with preventDefault, so a key typed into a field never presses.
  const keyRef = useRef<HTMLElement>(null);
  // When the shortcut last fired: only a change it caused rolls the value.
  // A pick from the open menu shows up in place, the menu already moved.
  const pressedAt = useRef(-Infinity);
  useEffect(() => {
    if (!shortcut) return;
    let release: ReturnType<typeof setTimeout> | undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.defaultPrevented || e.key.toLowerCase() !== shortcut.toLowerCase()) return;
      const key = keyRef.current;
      if (!key) return;
      clearTimeout(release);
      animate(key, { scale: KEY_PRESS }, spring.fast);
      release = setTimeout(() => animate(key, { scale: 1 }, spring.fast), 80);
    };
    // Capture phase, ahead of the shortcut's listener: React renders the
    // change before a later listener runs. A key typed into a field is
    // stamped too, harmlessly: it changes no value.
    const onKeyCapture = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === shortcut.toLowerCase()) pressedAt.current = performance.now();
    };
    window.addEventListener("keydown", onKeyCapture, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyCapture, true);
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(release);
    };
  }, [shortcut]);
  const prevIndex = useRef(index);
  // The trigger's content as last rendered, to play the old value out: by
  // the time the index changes, the trigger already shows the new one.
  const snapshot = useRef<HTMLElement | null>(null);
  const leaving = useRef<HTMLElement | null>(null);
  const rolls = useRef(0);
  const entering = useRef<ReturnType<typeof animate> | null>(null);
  const lastChange = useRef(0);
  // Layout effects: the new value is already in the DOM, and the roll has
  // to start before it paints at rest.
  useLayoutEffect(() => {
    const from = prevIndex.current;
    prevIndex.current = index;
    if (index === undefined || from === undefined || from === index) return;
    if (performance.now() - pressedAt.current > 100) return;
    const trigger = controlRef.current?.querySelector("button");
    if (!trigger) return;
    // A press mid-roll drops the value still leaving.
    leaving.current?.remove();
    leaving.current = null;
    const content = rollingParts(trigger);
    if (!content.length) return;
    const y = index > from ? ROLL : -ROLL;

    // A held key repeats faster than a roll lasts: restarting it each time
    // keeps the value faded out at its start. A change within a roll's
    // length of the last one snaps to the new value instead, so a held key
    // steps through values and the next press after a pause rolls again.
    const now = performance.now();
    const quick = now - lastChange.current < spring.moderate.duration * 1000;
    lastChange.current = now;
    if (quick) {
      entering.current?.stop();
      entering.current = null;
      rolls.current++;
      animate(content, { opacity: 1, y: 0 }, { duration: 0 });
      trigger.style.removeProperty("mask-image");
      trigger.style.removeProperty("-webkit-mask-image");
      return;
    }

    const old = snapshot.current;
    if (old) {
      if (getComputedStyle(trigger).position === "static") trigger.style.position = "relative";
      // Over the new value's line, pinned by its right edge, where the
      // chevron keeps it: the trigger has already resized to the new value.
      const box = trigger.getBoundingClientRect();
      // The copy holds the key's and swatch's room too, so it spans the
      // same parts.
      const line = inVisualOrder(trigger);
      const first = line[0].getBoundingClientRect();
      const last = line[line.length - 1].getBoundingClientRect();
      Object.assign(old.style, {
        position: "absolute",
        top: `${first.top - box.top - trigger.clientTop}px`,
        right: `${box.right - last.right - trigger.clientLeft}px`,
        height: `${first.height}px`,
        display: "flex",
        alignItems: "center",
        gap: getComputedStyle(trigger).columnGap,
        whiteSpace: "nowrap",
        pointerEvents: "none",
      });
      trigger.append(old);
      leaving.current = old;
    }

    trigger.style.setProperty("mask-image", ROLL_MASK);
    trigger.style.setProperty("-webkit-mask-image", ROLL_MASK);
    const roll = ++rolls.current;
    const done = () => {
      if (roll !== rolls.current) return;
      trigger.style.removeProperty("mask-image");
      trigger.style.removeProperty("-webkit-mask-image");
    };

    // Moderate tier: the spring moves the value, while opacity and blur run
    // linear over the same time, so the fade reads evenly across the travel.
    const enter = animate(
      content,
      reduceMotion ? { opacity: [0, 1] } : { opacity: [0, 1], y: [y, 0] },
      { ...spring.moderate, opacity: { duration: spring.moderate.duration, ease: "linear" } }
    );
    if (old) {
      const fade = { duration: spring.moderate.exit.duration, ease: "linear" } as const;
      animate(
        old,
        reduceMotion
          ? { opacity: [1, 0] }
          : { opacity: [1, 0], y: [0, -y], filter: ["blur(0px)", "blur(2px)"] },
        { ...spring.moderate.exit, ease: "easeIn", opacity: fade, filter: fade }
      ).then(() => {
        old.remove();
        if (leaving.current === old) leaving.current = null;
      });
    }
    entering.current = enter;
    enter.then(() => {
      if (entering.current === enter) entering.current = null;
      done();
    });
  }, [index, reduceMotion]);
  // After every render, so the copy has whatever the trigger shows now (an
  // icon set swapped, a label renamed), with none of a roll's inline styles.
  useLayoutEffect(() => {
    const trigger = controlRef.current?.querySelector("button");
    const parts = trigger ? inVisualOrder(trigger) : [];
    if (!parts.length) return;
    const copy = document.createElement("span");
    copy.setAttribute("aria-hidden", "true");
    copy.dataset.rollCopy = "";
    for (const part of parts) {
      const clone = part.cloneNode(true) as HTMLElement;
      clone.style.removeProperty("transform");
      clone.style.removeProperty("opacity");
      clone.removeAttribute("id");
      // At the size it has in the trigger: out of it, the trigger's own
      // rules (the swatch's size) no longer reach the copy.
      clone.style.width = getComputedStyle(part).width;
      clone.style.flexShrink = "0";
      // Only the value leaves: the rest stays put in the trigger, so the
      // copy only keeps its room.
      if (part !== trigger?.firstElementChild) clone.style.visibility = "hidden";
      copy.append(clone);
    }
    snapshot.current = copy;
  });
  return (
    // The label holds one line; a long value truncates in its trigger. The
    // Select wraps its trigger in a div, which has to give way too.
    // relative: painted over the list's highlight, which sits behind the
    // trigger in place of the trigger's own hover fill.
    // pl-2: the label starts where the group label above it does.
    <div className={cn("relative flex items-center justify-between gap-3", inset && "pl-2")}>
      <span className="shrink-0 whitespace-nowrap text-site-body text-muted-foreground">{label}</span>
      <span
        ref={controlRef}
        className="flex min-w-0 items-center [&>div]:min-w-0 [&_button:hover]:bg-transparent [&_button>span:nth-child(2)]:order-1 [&_button>span:nth-child(2)]:size-(--swatch)! [&_button>svg]:order-1"
        style={{ "--swatch": `${icon}px` } as CSSProperties}
      >
        {children}
        {/* The key sits in the trigger, after the value and before the
            chevron (ordered last above), so it reads as part of the control.
            Hidden from the combobox's name: the value is what it reads. */}
        {shortcut &&
          trigger &&
          createPortal(
            <kbd
              ref={keyRef}
              aria-hidden
              data-shortcut=""
              className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center bg-[light-dark(rgb(23_23_23/0.08),rgb(245_245_245/0.08))] px-1 font-mono text-site-micro leading-none text-muted-foreground rounded-[2px] pointer-coarse:hidden"
            >
              {shortcut}
            </kbd>,
            trigger
          )}
      </span>
    </div>
  );
}

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
// The count comes from the root layout, rendered on the server, so the button
// paints with its number. Only when that came back empty (GitHub slow or
// refusing) does the client ask, through /api/stars: that route shares one
// GitHub call a minute across visitors, where calling GitHub from the browser
// spent each visitor's own 60-an-hour limit, after which the count vanished.
const GitHubStarsContext = createContext<number | null>(null);

export function GitHubStarsProvider({
  stars,
  children,
}: {
  stars: number | null;
  children: ReactNode;
}) {
  return <GitHubStarsContext.Provider value={stars}>{children}</GitHubStarsContext.Provider>;
}

// One client fetch at a time, shared by every instance (right panel + the
// sidebar sheet's footer). A miss clears it, so the next mount asks again.
let cachedStars: number | null = null;
let starsPromise: Promise<number | null> | null = null;

function fetchStars(): Promise<number | null> {
  starsPromise ??= fetch("/api/stars")
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (typeof data?.stars === "number") cachedStars = data.stars;
      return cachedStars;
    })
    .catch(() => null)
    .then((count) => {
      if (count === null) starsPromise = null;
      return count;
    });
  return starsPromise;
}

export function GitHubStarButton() {
  const shapeCtx = useShape();
  const serverStars = useContext(GitHubStarsContext);
  const [fetchedStars, setFetchedStars] = useState<number | null>(cachedStars);
  const stars = serverStars ?? fetchedStars;

  useEffect(() => {
    if (serverStars !== null || cachedStars !== null) return;
    let cancelled = false;
    fetchStars().then((count) => {
      if (!cancelled && count !== null) setFetchedStars(count);
    });
    return () => {
      cancelled = true;
    };
  }, [serverStars]);

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

/** The author's avatar, shaped as an IconComponent so it can ride Button's
 *  leadingIcon slot the way the GitHub mark does. A face reads at 20px, not
 *  at the button's 14px icon size, so it ignores the size it is handed. */
const AVATAR_SIZE = 20;
function AuthorAvatar({ className }: { size?: number; className?: string }) {
  const size = AVATAR_SIZE;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a 16px avatar, served as is
    <img
      src="/micka.png"
      alt=""
      width={size}
      height={size}
      className={cn(
        "shrink-0 rounded-full object-cover outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10",
        className
      )}
    />
  );
}

/** "Created by" on the left, the author on the right as a ghost button (the
 *  avatar and the handle), opening their X profile like the GitHub button
 *  opens the repo. The label is inset like the group labels. */
export function Credit({ className }: { className?: string }) {
  const shapeCtx = useShape();
  return (
    <div className={cn("flex items-center justify-between gap-2 pl-2", className)}>
      <p className="text-site-body text-muted-foreground">Created by</p>
      <Button
        variant="ghost"
        size="sm"
        leadingIcon={AuthorAvatar}
        aria-label="@micka_design on X"
        className={shapeCtx.button}
        onClick={() => window.open("https://x.com/micka_design", "_blank", "noopener,noreferrer")}
      >
        @micka_design
      </Button>
    </div>
  );
}

/** The inner settings content: reused in the right column and mobile drawer.
 *  `credit={false}` where the host shows the credit elsewhere. `inset` (on
 *  by default) starts the labels 8px in, under the right panel's group
 *  label; the mobile sheet turns it off, so they start under its heading. */
export function SettingsContent({ credit = true, inset = true }: { credit?: boolean; inset?: boolean }) {
  const { theme, setTheme } = useThemeContext();
  const { shape, setShape } = useShapeContext();
  const { size, setSize } = useSizeContext();
  const { iconLibrary, setIconLibrary } = useIconLibrary();
  const { base, setBase } = useBase();
  const { font, fonts, custom, setFont, browse } = useHeadingFont();
  const accent = useAccent();
  const reduceMotion = useReducedMotion();
  const shapeClasses = useShape();
  const listRef = useRef<HTMLDivElement>(null);
  const hover = useFluidHover(listRef);
  // registerItem is stable; the handlers object is new each render.
  const { registerItem: registerHover, handlers: hoverHandlers } = hover;

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
      {/* The settings, stacked with no gap under one fluid hover. */}
      <SettingInsetContext.Provider value={inset}>
      <SettingHoverContext.Provider value={registerHover}>
      <div ref={listRef} className="relative flex flex-col" {...hoverHandlers}>
        <FluidHoverHighlight hover={hover} className={shapeClasses.input} />
        <SettingRow label="Theme" hoverIndex={0} shortcut="T" index={themeOptions.findIndex((o) => o.value === theme)}>
          <Select value={theme} onValueChange={(v) => setTheme(v as Theme)}>
            <SelectTrigger
              variant="borderless"
              className="min-w-0 w-auto px-2 text-site-body"
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
        </SettingRow>
        <SettingRow
          label="Accent"
          hoverIndex={1}
          shortcut="A"
          index={accent.custom ? ACCENT_ORDER.length : ACCENT_ORDER.indexOf(accent.preset)}
        >
          {/* The presets are the picker's swatches; any other color is a
              custom accent. The trigger reads like the selects: the name
              (or hex) in the foreground, then the color. */}
          <ColorPickerPopover
            value={accent.hex}
            onValueChange={(_, parsed) => accent.setColor(accentHexOf(parsed))}
            swatches={accentSwatches(accent.dark)}
            triggerLabel={accentLabel(accent.preset, accent.custom)}
            triggerShowValue={false}
            triggerClassName="border-transparent px-2 text-site-body [&_span]:px-0 [&_span]:text-foreground"
          />
        </SettingRow>
        <AccentContrastNote hex={accent.hex} dark={accent.dark} />
        <SettingRow label="Heading font" hoverIndex={2} shortcut="F" index={fonts.indexOf(font)}>
          {/* The last row is an action, not a value: it opens the
              Google Fonts picker and leaves the selection alone. */}
          <Select
            value={font}
            onValueChange={(v) => (v === BROWSE ? browse() : setFont(v as HeadingFont))}
          >
            <SelectTrigger
              variant="borderless"
              className="min-w-0 w-auto px-2 text-site-body"
            />
            <SelectContent>
              {fonts.map((f, i) => (
                <SelectItem key={f} value={f} index={i}>
                  {headingFontLabel(f, custom)}
                </SelectItem>
              ))}
              <SelectItem value={BROWSE} index={fonts.length}>
                Browse Google Fonts…
              </SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        {/* Only while a custom Google Fonts family is the heading font. It
            opens and closes in place (grid rows 0fr to 1fr), so the rows
            below slide instead of jumping. Clipped only while it moves: at rest
            the select's focus ring needs the room. */}
        <AnimatePresence initial={false}>
          {font === "custom" && custom && (
            <motion.div
              key="heading-weight"
              className="grid"
              initial={{ gridTemplateRows: "0fr", opacity: 0, overflow: "hidden" }}
              animate={{
                gridTemplateRows: "1fr",
                opacity: 1,
                transitionEnd: { overflow: "visible" },
              }}
              exit={{
                gridTemplateRows: "0fr",
                opacity: 0,
                overflow: "hidden",
                transition: reduceMotion
                  ? { duration: 0, opacity: spring.moderate.exit }
                  : spring.moderate.exit,
              }}
              // Reduced motion: the row snaps open or shut, and only fades.
              transition={
                reduceMotion ? { duration: 0, opacity: { duration: spring.moderate.duration } } : spring.moderate
              }
            >
              <div className="min-h-0">
                <SettingRow label="Heading weight" hoverIndex={3}>
                  <HeadingWeightSelect triggerClassName="min-w-0 w-auto px-2 text-site-body" />
                </SettingRow>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <SettingRow label="Radius" hoverIndex={4} shortcut="R" index={shapeOptions.findIndex((o) => o.value === shape)}>
          <Select value={shape} onValueChange={(v) => setShape(v as ShapeVariant)}>
            <SelectTrigger
              variant="borderless"
              className="min-w-0 w-auto px-2 text-site-body"
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
        </SettingRow>
        <SettingRow label="Size" hoverIndex={5} shortcut="S" index={sizeOptions.findIndex((o) => o.value === size)}>
          <Select value={size} onValueChange={(v) => setSize(v as SizeVariant)}>
            <SelectTrigger
              variant="borderless"
              className="min-w-0 w-auto px-2 text-site-body"
            />
            <SelectContent>
              {sizeOptions.map((o, i) => (
                <SelectItem key={o.value} value={o.value} index={i}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow label="Icons" hoverIndex={6} shortcut="I" index={iconOptions.findIndex((o) => o.value === iconLibrary)}>
          <Select value={iconLibrary} onValueChange={(v) => setIconLibrary(v as IconLibrary)}>
            <SelectTrigger
              variant="borderless"
              className="min-w-0 w-auto px-2 text-site-body"
            />
            <SelectContent>
              {iconOptions.map((o, i) => (
                <SelectItem key={o.value} value={o.value} index={i}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow label="Primitive" hoverIndex={7} index={baseOptions.findIndex((o) => o.value === base)}>
          <Select value={base} onValueChange={(v) => setBase(v as Base)}>
            <SelectTrigger
              variant="borderless"
              className="min-w-0 w-auto px-2 text-site-body"
            />
            <SelectContent>
              {baseOptions.map((o, i) => (
                <SelectItem key={o.value} value={o.value} index={i}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
      </div>
      </SettingHoverContext.Provider>
      </SettingInsetContext.Provider>

      {/* The home page's install prompt, carrying everything set above.
          mt-2 + the column's gap-2: 16px under the rows, and the same 16px
          (mb-2 + gap-2) on to the credit when it follows. */}
      <StarterPromptButton size="sm" className={cn("mt-2 w-full", credit && "mb-2")} />

      {credit && <Credit className={inset ? undefined : "pl-0"} />}

    </div>
  );
}

/** Desktop-only right column that mirrors the left sidebar styling. */
// The panel's own read of the xl breakpoint (the concept screens mount it
// outside any SidebarProvider, so it can't borrow the sidebar's isMobile).
// The server and the first client render assume desktop.
const XL_QUERY = "(min-width: 1280px)";
function subscribeXl(onChange: () => void) {
  const mql = window.matchMedia(XL_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}
function useIsXl() {
  return useSyncExternalStore(
    subscribeXl,
    () => window.matchMedia(XL_QUERY).matches,
    () => true
  );
}

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

  // Below xl the panel also gives its width back while xl-fade-block fades
  // it, so the page slides into the space instead of snapping once
  // display:none lands (the exit tween matches the CSS fade's 160ms).
  const isXl = useIsXl();
  const shown = open && isXl;
  const PanelRightIcon = useIcon("panel-right");
  // The changelog's rail holds its Releases index alone: nothing on that
  // page reacts to the settings, which stay a ⌘K or a shortcut away.
  const showSettings = usePathname() !== "/changelog";

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
                  <kbd className="-my-1 flex h-4 min-w-4 items-center justify-center rounded border border-background/30 px-1 font-sans text-[10px] text-background">
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
    {/* Below xl the panel fades out where it stands: xl-fade-block keeps
        display:block through the fade (allow-discrete), so the panel holds
        its space and never covers the page, and the content widens into it
        once the fade ends. (Fixed positioning during the fade saved that
        second reflow, but left the panel over the content as the left
        sidebar collapsed under it.) The wrapper carries the fade/sticky so
        pages can stack a second panel (RightRailTarget) below the settings.
        xl-fade-block sets display:block at ≥xl, so the flex column lives on an
        inner wrapper (else it would override `flex` and drop the gap).
        The "]" toggle animates width/margin (the sidebar-shell technique: the
        outer collapses while the inner keeps its true width) so the page
        content reflows into the space instead of snapping. Its fade runs on
        the inner wrapper: an inline opacity on the outer one would outrank
        xl-fade-block's, and the panel would pop out below xl at full
        opacity instead of fading. */}
    <motion.div
      className="shrink-0 overflow-hidden sticky top-4 self-start mt-4 xl-fade-block max-xl:pointer-events-none"
      initial={false}
      animate={{
        width: shown ? 256 : 0,
        // 16px on the right, matching the 16px top (sticky top-4) and the
        // 16px the max-h calc leaves at the bottom — one even inset.
        marginRight: shown ? 16 : 0,
      }}
      transition={
        reduceMotion ? { duration: 0 } : shown ? spring.slow : spring.slow.exit
      }
      style={{ pointerEvents: open ? undefined : "none" }}
      // Collapsed is width:0 + opacity:0 — still in the DOM, so without
      // inert every control inside would stay tabbable and announced.
      inert={open ? undefined : true}
    >
      <motion.div
        className="w-64"
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={
          reduceMotion ? { duration: 0 } : open ? spring.slow : spring.slow.exit
        }
      >
      {/* Taller stacks (settings + playground controls) scroll within the
          viewport instead of running past it — the house ScrollArea (quiet
          thumb on the overlay ramp), scroll-fade dissolving the clipped
          edges. The fade sits on the viewport itself, so it starts at the
          panel's true edge — any breathing room lives INSIDE the scroller,
          under the mask, never outside pushing the gradient down. */}
      {/* max-h leaves room for the credit pinned under the panel: its 32px
          row and 16px over it, on top of the 16px insets above and below. */}
      <ScrollArea viewportClassName="scroll-fade max-h-[calc(100svh-2rem-48px)]">
      {/* Groups stack like the left sidebar's: each later one brings its own
          16px (pt-4) above its label. */}
      <div className="flex flex-col">
        {showSettings && (
        // contain-inline-size: the rail's scroll area sizes to its content,
        // so the card's one-line labels would widen it past the rail;
        // contained, it takes the rail's width and the values truncate.
        // A group like the left sidebar's: no card, a small label with the
        // star count on its right, a hairline under it.
        <aside className="contain-inline-size">
          <div className="flex h-8 items-center justify-between pl-2">
            <h2 className="text-site-caption text-foreground">Make them yours</h2>
            <GitHubStarButton />
          </div>
          <RailHairline />
          <SettingsContent credit={false} />
        </aside>
        )}

        {/* Page-owned slot — e.g. the Card doc's Playground controls. */}
        <RightRailTarget />
      </div>
      </ScrollArea>
      {/* The credit, pinned to the page's bottom-right corner in the panel's
          column: 16px off the bottom like the panel's 16px off the top, and
          fading with it. */}
      <Credit className="fixed bottom-4 right-4 h-8 w-64" />
      </motion.div>
    </motion.div>
    </>
  );
}
