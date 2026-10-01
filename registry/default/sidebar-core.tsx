"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  useRef,
  useId,
  forwardRef,
  cloneElement,
  isValidElement,
  Children,
  type ReactNode,
  type ReactElement,
  type ElementType,
  type CSSProperties,
  type HTMLAttributes,
  type Ref,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { spring, exitFallbackMs } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import { useShape } from "@/lib/shape-context";
import { useSize, useSizeVariant } from "@/lib/size-context";
import { useIcon } from "@/lib/icon-context";
import { useSurface, SurfaceProvider } from "@/lib/surface-context";
import { surfaceClasses } from "@/lib/surface-classes";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

// ─── Constants ───────────────────────────────────────────────────────────────

export const SIDEBAR_COOKIE_NAME = "sidebar_state";
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const SIDEBAR_WIDTH = "16rem";
export const SIDEBAR_WIDTH_MOBILE = "18rem";
/** Bare-key toggle defaults: "[" for a left sidebar, "]" for a right one.
 *  Bare (no ⌘/Ctrl) so the browser's history shortcuts stay untouched. */
export const SIDEBAR_KEYBOARD_SHORTCUT = "[";
export const SIDEBAR_KEYBOARD_SHORTCUT_RIGHT = "]";
/** Drag-resize clamp for the built-in rail handle (px). */
export const SIDEBAR_MIN_WIDTH = 160;
export const SIDEBAR_MAX_WIDTH = 360;
/** Dragging this far past the minimum width collapses the sidebar instead of
 *  bottoming out — the same "throw it at the edge to dismiss" affordance
 *  native apps use. */
export const SIDEBAR_COLLAPSE_SLOP = 56;

// ─── Context ─────────────────────────────────────────────────────────────────

export type SidebarSide = "left" | "right";
export type SidebarVariant = "sidebar" | "floating" | "inset";
export type SidebarCollapsible = "offcanvas" | "none";

export interface SidebarContextValue {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  openMobile: boolean;
  setOpenMobile: React.Dispatch<React.SetStateAction<boolean>>;
  isMobile: boolean;
  toggleSidebar: () => void;
  /** Live rail width — the rail's drag-resize updates it. */
  width: string;
  setWidth: (width: string) => void;
  widthMobile: string;
  mobileBreakpoint: number;
  /** Which edge the rendered Sidebar sits on (registered by <Sidebar/>). */
  side: SidebarSide;
  /** Internal: <Sidebar/> reports its side so the provider can resolve the
   *  default shortcut and the rail can mirror. */
  registerSide: (side: SidebarSide) => void;
  /** The resolved toggle key ("[" / "]" / custom / null when disabled). */
  shortcut: string | null;
  /** Collapsed-peek mode: reveal the sidebar as a floating overlay from the
   *  collapsed edge on hover or click, without pinning it open. */
  peek: "hover" | "click" | "none";
  /** True while the collapsed sidebar is peeking as an overlay. */
  isPeeking: boolean;
  setIsPeeking: React.Dispatch<React.SetStateAction<boolean>>;
  /** Shared hover-intent machinery for the peek: ONE timer serves every
   *  affordance that can float the rail out (the edge strip, the trigger),
   *  so crossing between them — or into the peeked card — cancels a pending
   *  dismissal instead of racing a second timer. */
  schedulePeek: () => void;
  scheduleDismissPeek: () => void;
  cancelPeekTimer: () => void;
  /** Internal: true while the rail is being drag-resized (disables the
   *  width spring so the panel tracks the pointer 1:1). */
  isResizing: boolean;
  setIsResizing: React.Dispatch<React.SetStateAction<boolean>>;
}

// Mounted-provider registry for the global toggle shortcut. The listener has
// to be global (the key should work without focus in the sidebar), but only
// ONE provider may answer a keypress: the innermost one containing focus, or —
// when focus is outside every provider — the OUTERMOST mounted one (the
// app-shell provider that wraps everything else; mount order can't be used
// because a persistent layout provider mounts once while demos mount later
// on navigation). Same pattern as AskUserQuestions' 1-9 shortcuts.
const mountedProviders: HTMLElement[] = [];

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within a SidebarProvider");
  return ctx;
}

// Starts undefined so the server and first client render agree (both treat it
// as desktop); the media query corrects it in an effect before interaction.
function useIsMobile(breakpoint: number): boolean {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint]);
  return !!isMobile;
}

// ─── SidebarProvider ─────────────────────────────────────────────────────────

export interface SidebarProviderProps extends HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Persist the desktop open state to the `sidebar_state` cookie so a server
   *  layout can read it back into `defaultOpen`. Mobile state never persists. */
  persist?: boolean;
  /** Bare-key toggle shortcut. Defaults to "[" for a left sidebar and "]"
   *  for a right one; `null` disables it. */
  shortcut?: string | null;
  /** Viewport width (px) below which the sidebar renders as a drawer. */
  mobileBreakpoint?: number;
  /** While collapsed, reveal the sidebar as a floating overlay from the
   *  edge — on hover (with intent delay) or on click of the edge strip.
   *  Peeking never pins the sidebar or writes the cookie. @default "none" */
  peek?: "hover" | "click" | "none";
  width?: string;
  widthMobile?: string;
}

const SidebarProvider = forwardRef<HTMLDivElement, SidebarProviderProps>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange,
      persist = true,
      shortcut: shortcutProp,
      mobileBreakpoint = 768,
      peek = "none",
      width: widthProp = SIDEBAR_WIDTH,
      widthMobile = SIDEBAR_WIDTH_MOBILE,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile(mobileBreakpoint);
    const [openMobile, setOpenMobile] = useState(false);
    const [side, setSide] = useState<SidebarSide>("left");
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      const el = wrapperRef.current;
      if (!el) return;
      mountedProviders.push(el);
      return () => {
        const i = mountedProviders.indexOf(el);
        if (i !== -1) mountedProviders.splice(i, 1);
      };
    }, []);
    const registerSide = useCallback((next: SidebarSide) => setSide(next), []);

    // Live width: the prop is the starting point, the rail's drag-resize
    // updates it at runtime.
    const [width, setWidth] = useState(widthProp);
    useEffect(() => setWidth(widthProp), [widthProp]);
    const [isResizing, setIsResizing] = useState(false);

    // Default shortcut mirrors the sidebar's edge: "[" left, "]" right.
    const shortcut =
      shortcutProp === undefined
        ? side === "right"
          ? SIDEBAR_KEYBOARD_SHORTCUT_RIGHT
          : SIDEBAR_KEYBOARD_SHORTCUT
        : shortcutProp;

    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const open = openProp ?? internalOpen;
    const openRef = useRef(open);
    openRef.current = open;

    const setOpen = useCallback(
      (value: boolean | ((prev: boolean) => boolean)) => {
        const next = typeof value === "function" ? value(openRef.current) : value;
        if (onOpenChange) onOpenChange(next);
        else setInternalOpen(next);
        if (persist) {
          document.cookie = `${SIDEBAR_COOKIE_NAME}=${next}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
        }
      },
      [onOpenChange, persist]
    );

    const toggleSidebar = useCallback(() => {
      if (isMobile) setOpenMobile((prev) => !prev);
      else setOpen((prev) => !prev);
    }, [isMobile, setOpen]);

    // Collapsed-peek overlay state. Pinning the sidebar open (or disabling
    // the mode) always dismisses the peek — including a PENDING intent
    // timer, or a hover armed just before the pin would fire setIsPeeking on
    // an open sidebar (the effect's deps never re-run for the late timer).
    const [isPeeking, setIsPeeking] = useState(false);
    const peekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
      if (open || peek === "none") {
        if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
        peekTimerRef.current = null;
        setIsPeeking(false);
      }
    }, [open, peek]);
    const cancelPeekTimer = useCallback(() => {
      if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
      peekTimerRef.current = null;
    }, []);
    const schedulePeek = useCallback(() => {
      cancelPeekTimer();
      peekTimerRef.current = setTimeout(() => setIsPeeking(true), 150);
    }, [cancelPeekTimer]);
    const scheduleDismissPeek = useCallback(() => {
      cancelPeekTimer();
      peekTimerRef.current = setTimeout(() => setIsPeeking(false), 250);
    }, [cancelPeekTimer]);
    useEffect(() => cancelPeekTimer, [cancelPeekTimer]);

    // The bare shortcut key toggles the sidebar app-wide. Bound to the
    // provider's lifetime (not a docs-only global), skipped while typing, and
    // skipped when a modifier is held so ⌘[ / ⌘] keep their browser meaning.
    useEffect(() => {
      if (shortcut == null) return;
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key.toLowerCase() !== shortcut.toLowerCase()) return;
        if (event.metaKey || event.ctrlKey || event.altKey) return;
        const target = event.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable
        )
          return;
        // Only one mounted provider answers (see mountedProviders). Providers
        // can NEST (an app shell wrapping doc previews), so containment alone
        // isn't enough: the innermost provider containing focus wins.
        const root = wrapperRef.current;
        if (!root) return;
        if (root.contains(target)) {
          if (
            mountedProviders.some(
              (el) => el !== root && root.contains(el) && el.contains(target)
            )
          )
            return;
          // The focused element itself WRAPS another provider (a docs
          // preview frame holding keyboard scope for the demo inside it —
          // see click-to-focus): the wrapped provider answers, not this
          // ancestor shell.
          if (mountedProviders.some((el) => el !== root && target.contains(el)))
            return;
        } else {
          // Focus outside this provider. A focused element that WRAPS
          // providers — a docs preview frame holding keyboard scope for the
          // demo inside it (see click-to-focus) — scopes the key to what it
          // wraps: the outermost wrapped provider answers, and this check
          // must come BEFORE the containment guard below (an app-shell
          // provider always contains the preview frame, and must not steal
          // the key from the demo the frame scopes to). Focus on <body>
          // wraps every provider, which degenerates to the original rule:
          // the OUTERMOST provider overall answers — mount order is
          // unreliable here (a persistent app-shell provider mounts once,
          // while doc demos mount later on client-side navigation).
          const wrapped = mountedProviders.filter((el) => target.contains(el));
          if (wrapped.length > 0) {
            const outermost = wrapped.find(
              (el) => !wrapped.some((other) => other !== el && other.contains(el))
            );
            if (outermost !== root) return;
          } else {
            if (mountedProviders.some((el) => el !== root && el.contains(target)))
              return;
            const outermost = mountedProviders.find(
              (el) =>
                !mountedProviders.some((other) => other !== el && other.contains(el))
            );
            if (outermost !== root) return;
          }
        }
        event.preventDefault();
        toggleSidebar();
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [shortcut, toggleSidebar]);

    const value = useMemo<SidebarContextValue>(
      () => ({
        state: open ? "expanded" : "collapsed",
        open,
        setOpen,
        openMobile,
        setOpenMobile,
        isMobile,
        toggleSidebar,
        width,
        setWidth,
        widthMobile,
        mobileBreakpoint,
        side,
        registerSide,
        shortcut,
        peek,
        isPeeking,
        setIsPeeking,
        schedulePeek,
        scheduleDismissPeek,
        cancelPeekTimer,
        isResizing,
        setIsResizing,
      }),
      [
        open,
        setOpen,
        openMobile,
        isMobile,
        toggleSidebar,
        width,
        widthMobile,
        mobileBreakpoint,
        side,
        registerSide,
        shortcut,
        peek,
        isPeeking,
        schedulePeek,
        scheduleDismissPeek,
        cancelPeekTimer,
        isResizing,
      ]
    );

    return (
      <SidebarContext.Provider value={value}>
        <div
          ref={(node) => {
            wrapperRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }}
          data-slot="sidebar-wrapper"
          className={cn("group/sidebar-wrapper relative flex min-h-svh w-full", className)}
          style={
            {
              "--sidebar-width": width,
              "--sidebar-width-mobile": widthMobile,
              ...style,
            } as CSSProperties
          }
          {...props}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    );
  }
);
SidebarProvider.displayName = "SidebarProvider";

// ─── Slot helpers (render / asChild polymorphism) ────────────────────────────
//
// A local slot instead of a primitive-library one so every menu part exists in
// exactly one primitive-agnostic copy: Radix's Slot would leak into Base UI
// projects, and Base UI's useRender the other way around. Supports both the
// library's `render={<Link/>}` convention and shadcn's `asChild`.

type SlotProps = {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
} & Record<string, unknown>;

function composeRefs<T>(...refs: (Ref<T> | undefined)[]): Ref<T> {
  return (node: T | null) => {
    for (const r of refs) {
      if (typeof r === "function") r(node);
      else if (r) (r as React.MutableRefObject<T | null>).current = node;
    }
  };
}

/** Resolves the element to clone: `render` wins, else `asChild`'s single
 *  element child. `content` is what should render inside it — for `asChild`
 *  the child element's own children, otherwise the caller's. */
export function resolveSlotTemplate(
  render: ReactElement | undefined,
  asChild: boolean | undefined,
  children: ReactNode
): { template: ReactElement<SlotProps> | null; content: ReactNode } {
  if (render && isValidElement(render)) {
    return { template: render as ReactElement<SlotProps>, content: children };
  }
  if (asChild) {
    const only = Children.toArray(children)[0];
    if (isValidElement(only)) {
      return {
        template: only as ReactElement<SlotProps>,
        content: (only.props as SlotProps).children,
      };
    }
  }
  return { template: null, content: children };
}

/** Renders `content` into the template element (merging class/style/handlers,
 *  composing refs) or into the default tag when there is no template. */
export function slotElement(
  template: ReactElement<SlotProps> | null,
  DefaultTag: ElementType,
  props: SlotProps & { ref?: Ref<HTMLElement> },
  content: ReactNode
): ReactElement {
  if (!template) {
    const Tag = DefaultTag as ElementType;
    return <Tag {...props}>{content}</Tag>;
  }
  const templateProps = template.props;
  const merged: SlotProps & { ref?: Ref<HTMLElement> } = {
    ...props,
    ...templateProps,
    className: cn(props.className, templateProps.className),
    style: { ...props.style, ...(templateProps.style as CSSProperties | undefined) },
  };
  // Chain duplicated event handlers, template's first (it owns the element).
  for (const key of Object.keys(props)) {
    if (!/^on[A-Z]/.test(key)) continue;
    const ours = props[key];
    const theirs = templateProps[key];
    if (typeof ours === "function" && typeof theirs === "function") {
      merged[key] = (...args: unknown[]) => {
        (theirs as (...a: unknown[]) => void)(...args);
        (ours as (...a: unknown[]) => void)(...args);
      };
    }
  }
  const templateRef =
    (templateProps as { ref?: Ref<HTMLElement> }).ref ??
    (template as unknown as { ref?: Ref<HTMLElement> }).ref;
  merged.ref = composeRefs(props.ref, templateRef);
  return cloneElement(template, merged, content);
}

// ─── SidebarShell (desktop DOM shared by both primitive libraries) ───────────

// Literal map so Tailwind's scanner emits the utilities: for the standard
// breakpoints the shell is also hidden by CSS, avoiding a pre-hydration flash
// of the rail on small screens. Non-standard breakpoints fall back to a
// JS-driven `hidden` in the shell (no dissolve, but never rail + drawer at
// once).
// Crossing the drawer breakpoint DISSOLVES the desktop rail instead of
// snapping it away: opacity fades while `display` rides the same transition
// with allow-discrete, so none applies only once the fade lands (and
// @starting-style fades it back in when the window grows). Literal classes
// per breakpoint — Tailwind's scanner can't see composed strings.
const BREAKPOINT_FADE_BASE =
  "transition-[opacity,display] ease-out [transition-behavior:allow-discrete] motion-reduce:transition-none";
const BREAKPOINT_HIDDEN: Record<number, string> = {
  640: "max-sm:hidden max-sm:opacity-0 max-sm:duration-160 sm:duration-240 sm:starting:opacity-0",
  768: "max-md:hidden max-md:opacity-0 max-md:duration-160 md:duration-240 md:starting:opacity-0",
  1024: "max-lg:hidden max-lg:opacity-0 max-lg:duration-160 lg:duration-240 lg:starting:opacity-0",
  1280: "max-xl:hidden max-xl:opacity-0 max-xl:duration-160 xl:duration-240 xl:starting:opacity-0",
};

// Props framer-motion redefines with incompatible signatures; they must not
// be forwarded onto a motion.div.
type MotionSafeDivProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
>;

export interface SidebarShellProps extends MotionSafeDivProps {
  side: SidebarSide;
  variant: SidebarVariant;
  /** The `sidebar` variant's inner-edge border. Default true. */
  bordered?: boolean;
  /** Render the built-in resize/collapse rail handle. `false` hides it and
   *  disables drag-resize — the trigger and keyboard shortcut still toggle. */
  rail?: boolean;
  /** Pin the rail's tooltip open (`true`) or closed (`false`); `undefined`
   *  leaves it on hover. Dragging always hides it. */
  railTooltipOpen?: boolean;
}

/** Internal: the expanded/collapsed desktop rail. An in-flow sticky column
 *  animates its width (this is what reflows the inset) while the fixed-width
 *  panel inside slides out under overflow clipping — container-relative, so
 *  the whole sidebar works inside any bounded frame, not just the viewport.
 *  Ships the resize/collapse rail handle on its inner edge by default. */
const SidebarShell = forwardRef<HTMLDivElement, SidebarShellProps>(
  ({ side, variant, bordered = true, rail = true, railTooltipOpen, className, children, ...props }, ref) => {
    const {
      open,
      width,
      mobileBreakpoint,
      isMobile,
      isResizing,
      peek,
      isPeeking,
      setIsPeeking,
      schedulePeek,
      scheduleDismissPeek,
      cancelPeekTimer,
    } = useSidebar();
    const shape = useShape();
    const shellRef = useRef<HTMLDivElement | null>(null);

    // Collapsed-peek: the edge strip reveals the sidebar as a floating
    // overlay without pinning it. Hover mode uses small intent/leave delays;
    // both modes dismiss on Escape or an outside press.
    // `!isResizing`: a drag can preview the collapsed state mid-gesture; the
    // shell must not swap to the peek strip then, or it would unmount the
    // rail holding the pointer capture and kill the drag.
    const peekEnabled = peek !== "none" && !open && !isResizing;
    useEffect(() => {
      if (!(peekEnabled && isPeeking)) return;
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") setIsPeeking(false);
      };
      const onPointerDown = (event: PointerEvent) => {
        if (!shellRef.current?.contains(event.target as Node)) setIsPeeking(false);
      };
      // Hover mode holds the peek by geometric containment, not
      // enter/leave: a portalled tooltip or menu covering the card steals
      // the hit-test and fires pointerleave on the shell even though the
      // cursor never left the sidebar. Dismissal is armed only when the
      // pointer's position actually crosses out of the overlay's box (with
      // a little margin), and disarmed the moment it crosses back.
      let wasInside = true;
      const onPointerMove = (event: PointerEvent) => {
        const overlay =
          shellRef.current?.querySelector('[data-sidebar="peek"]') ?? shellRef.current;
        if (!overlay) return;
        const box = overlay.getBoundingClientRect();
        const inside =
          event.clientX >= box.left - 8 &&
          event.clientX <= box.right + 8 &&
          event.clientY >= box.top - 8 &&
          event.clientY <= box.bottom + 8;
        if (inside) {
          // Unconditional (not transition-gated): another surface's leave —
          // the hover-peek trigger's, say — may have armed a dismissal while
          // the pointer was already inside the box.
          wasInside = true;
          cancelPeekTimer();
        } else if (wasInside) {
          wasInside = false;
          scheduleDismissPeek();
        }
      };
      document.addEventListener("keydown", onKeyDown);
      document.addEventListener("pointerdown", onPointerDown);
      if (peek === "hover") document.addEventListener("pointermove", onPointerMove);
      return () => {
        document.removeEventListener("keydown", onKeyDown);
        document.removeEventListener("pointerdown", onPointerDown);
        document.removeEventListener("pointermove", onPointerMove);
      };
    }, [peekEnabled, isPeeking, setIsPeeking, peek, cancelPeekTimer, scheduleDismissPeek]);
    const substrate = useSurface();
    const floatingLevel = Math.min(substrate + 1, 8);
    // Drag-resize needs the panel glued to the pointer; the spring resumes
    // for open/close. Reduced motion snaps instead of sliding — the state
    // change stays legible without the 256px of travel. The open/close ride
    // the SLOW tier: a whole column moving is the largest thing this
    // component animates (the sheet and peek stay on moderate — drawers
    // settle precisely, per the tier notes).
    const reduceMotion = useReducedMotion() ?? false;
    // Mid-drag open flips — the collapse preview and its drag-back rescue —
    // ride the moderate tier instead of the drag's glued duration-0 tracking.
    // The flip is detected synchronously (transition must be right on the
    // very commit whose animate target changes; effects run too late), then
    // `dragFlip` holds the spring through its settle so pointer moves landing
    // right after a flip retarget the spring instead of snapping.
    const [dragFlip, setDragFlip] = useState(false);
    const prevOpenRef = useRef(open);
    const openFlipped = prevOpenRef.current !== open;
    // Pinning open from an active peek: the panel is already fully on screen
    // as the overlay card, so while the width spring makes room the shell
    // must not clip — otherwise the visible sidebar wipes in from a mask it
    // never left. Detected synchronously (the provider clears isPeeking an
    // effect later); the state hold keeps the clip off through the spring.
    const [pinFromPeekHold, setPinFromPeekHold] = useState(false);
    const pinnedFromPeek = (openFlipped && open && isPeeking) || pinFromPeekHold;
    useEffect(() => {
      if (!(open && isPeeking)) return;
      setPinFromPeekHold(true);
      const id = setTimeout(() => setPinFromPeekHold(false), exitFallbackMs(spring.slow));
      return () => clearTimeout(id);
    }, [open, isPeeking]);
    useEffect(() => {
      const flipped = prevOpenRef.current !== open;
      prevOpenRef.current = open;
      if (!isResizing) {
        setDragFlip(false);
        return;
      }
      if (!flipped) return;
      setDragFlip(true);
      const id = setTimeout(() => setDragFlip(false), exitFallbackMs(spring.moderate));
      return () => clearTimeout(id);
    }, [open, isResizing]);
    const widthTransition = reduceMotion
      ? { duration: 0 }
      : isResizing
        ? openFlipped || dragFlip
          ? open
            ? spring.moderate
            : spring.moderate.exit
          : { duration: 0 }
        : open
          ? spring.slow
          : spring.slow.exit;

    return (
      <motion.div
        ref={(node: HTMLDivElement | null) => {
          shellRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        data-slot="sidebar"
        data-state={open ? "expanded" : "collapsed"}
        data-collapsible={open ? "" : "offcanvas"}
        data-variant={variant}
        data-side={side}
        className={cn(
          // No bare `group` here: an unnamed group on the whole rail would
          // fire every descendant's group-hover (Button fills, icon strokes)
          // on rail hover. Named groups (menu-item etc.) handle row states.
          "peer shrink-0 sticky top-0 h-svh",
          // While peek is armed the 0-width shell must not clip the edge
          // strip or the overlay card — and the shell must rise above the
          // inset (a later sibling) so the card paints over it. Pinning from
          // a peek keeps both through the width spring for the same reason.
          peekEnabled || pinnedFromPeek ? "z-40" : "overflow-hidden",
          // Flex order (not DOM order) decides the side, so consumers can
          // keep Sidebar before SidebarInset regardless of `side`.
          side === "right" && "order-last",
          // The inset rail has no card edge of its own, so its scroll hairline
          // hugs the rows' 8px gutter instead of running panel-wide.
          variant === "inset" && "[--scroll-divider-inset:8px]",
          BREAKPOINT_FADE_BASE,
          BREAKPOINT_HIDDEN[mobileBreakpoint],
          // A non-standard breakpoint has no literal utility in the map, so
          // JS hides the shell (no fade, but never rail + drawer at once).
          !BREAKPOINT_HIDDEN[mobileBreakpoint] && isMobile && "hidden",
          className
        )}
        initial={false}
        animate={{ width: open ? width : "0rem" }}
        transition={widthTransition}
        // Hover-mode dismissal lives on the shell root: the pointer can land
        // on the overlay without ever crossing it (the card slides in under
        // a stationary cursor), so per-element leave events are unreliable —
        // leaving the shell subtree is the signal that matters.
        onPointerEnter={peekEnabled && peek === "hover" ? cancelPeekTimer : undefined}
        // While PEEKED, dismissal belongs to the geometric watcher above —
        // leave events lie whenever portalled content (tooltip, menu) covers
        // the card. This leave handler only retires a pending peek-arm when
        // the cursor departs before the intent delay lands.
        onPointerLeave={
          peekEnabled && peek === "hover"
            ? () => {
                if (!isPeeking) cancelPeekTimer();
              }
            : undefined
        }
        {...props}
      >
        {peekEnabled ? (
          <>
            {/* Edge strip: the collapsed sidebar's reveal affordance. A thin
                hairline brightens on hover; hover mode peeks after a short
                intent delay, click mode on press. */}
            <button
              type="button"
              aria-label="Peek sidebar"
              aria-expanded={isPeeking}
              className={cn(
                "group/peek-strip absolute inset-y-0 z-40 w-3 cursor-pointer outline-none",
                side === "left" ? "left-0" : "right-0"
              )}
              onPointerEnter={
                peek === "hover"
                  ? (event) => {
                      if (event.pointerType === "mouse") schedulePeek();
                    }
                  : undefined
              }
              onClick={() => {
                cancelPeekTimer();
                setIsPeeking(true);
              }}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-y-0 w-px bg-border opacity-0 transition-opacity duration-80 group-hover/peek-strip:opacity-100 group-focus-visible/peek-strip:opacity-100",
                  side === "left" ? "left-0" : "right-0"
                )}
              />
            </button>
            <AnimatePresence>
              {isPeeking && (
                <motion.div
                  data-sidebar="peek"
                  className={cn(
                    "absolute inset-y-2 z-50 flex flex-col overflow-hidden",
                    // The card's edge inset matches where the PINNED rail's
                    // content sits, so pinning from a peek never shifts the
                    // rows sideways: floating pins into a card inset by the
                    // same gutter; inset/sidebar pin flush to the edge.
                    side === "left"
                      ? variant === "floating"
                        ? "left-2"
                        : "left-0"
                      : variant === "floating"
                        ? "right-2"
                        : "right-0",
                    shape.container,
                    surfaceClasses(floatingLevel, 3)
                  )}
                  style={{
                    width: `calc(${width} - ${variant === "floating" ? "1rem" : "0.5rem"})`,
                  }}
                  initial={reduceMotion ? false : { x: side === "left" ? "-108%" : "108%" }}
                  animate={{ x: 0 }}
                  exit={{
                    x: side === "left" ? "-108%" : "108%",
                    transition: reduceMotion ? { duration: 0 } : spring.moderate.exit,
                  }}
                  transition={reduceMotion ? { duration: 0 } : spring.moderate}
                >
                  <SurfaceProvider value={floatingLevel}>{children}</SurfaceProvider>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
        <motion.div
          className={cn(
            "absolute inset-y-0 flex h-full flex-col",
            side === "left" ? "left-0" : "right-0",
            // Floating floats its card inside a full gutter; inset only needs
            // the vertical inset (horizontal room belongs to the nav rows).
            variant === "floating" && "p-2",
            variant === "inset" && "py-2"
          )}
          style={{ width }}
          initial={false}
          animate={{ x: open ? "0%" : side === "left" ? "-100%" : "100%" }}
          transition={widthTransition}
        >
          {variant === "floating" ? (
            <div
              data-sidebar="sidebar"
              className={cn(
                "flex h-full w-full min-h-0 flex-col",
                shape.container,
                surfaceClasses(floatingLevel, 3)
              )}
            >
              <SurfaceProvider value={floatingLevel}>{children}</SurfaceProvider>
            </div>
          ) : (
            <div
              data-sidebar="sidebar"
              className={cn(
                "flex h-full w-full min-h-0 flex-col",
                bordered &&
                  variant === "sidebar" &&
                  (side === "left" ? "border-r border-border" : "border-l border-border")
              )}
            >
              {children}
            </div>
          )}
          {rail && (
          <SidebarRail
            tooltipOpen={railTooltipOpen}
            className={cn(
              // The floating card sits inside the panel's p-2 gutter, so the
              // grab strip (and its hover hairline) moves in to straddle the
              // card's edge instead of the panel's.
              variant === "floating" &&
                (side === "left" ? "right-1 after:right-[3.5px]" : "left-1 after:left-[3.5px]"),
              // Cards are vertically inset and rounded — the hover hairline
              // hugs the card's straight run: fully transparent through the
              // corner radius, then fading in over 24px (mirrored at the
              // bottom). The radius rides the shape system via CSS vars.
              variant !== "sidebar" &&
                "after:inset-y-2 after:[mask-image:linear-gradient(to_bottom,transparent_var(--rail-fade-start),black_var(--rail-fade-end),black_calc(100%-var(--rail-fade-end)),transparent_calc(100%-var(--rail-fade-start)))]"
            )}
            style={
              variant !== "sidebar"
                ? ({
                    "--rail-fade-start": `${shape.bgRadius >= 20 ? 24 : 12}px`,
                    "--rail-fade-end": `${(shape.bgRadius >= 20 ? 24 : 12) + 24}px`,
                  } as CSSProperties)
                : undefined
            }
          />
          )}
        </motion.div>
        )}
      </motion.div>
    );
  }
);
SidebarShell.displayName = "SidebarShell";

// ─── SidebarTrigger ──────────────────────────────────────────────────────────

export type SidebarTriggerProps = ButtonProps;

/** Keystroke chip rendered inside the (inverted) tooltip surface. */
function ShortcutKbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="-my-1 flex h-4 min-w-4 items-center justify-center rounded border border-background/30 px-1 font-sans text-[10px] text-background/80">
      {children}
    </kbd>
  );
}

/** The tooltips always show the toggle keystroke, falling back to the
 *  side's default key even when the provider's binding is disabled. */
function useShortcutKey(): string {
  const { side, shortcut } = useSidebar();
  return (
    shortcut ??
    (side === "right" ? SIDEBAR_KEYBOARD_SHORTCUT_RIGHT : SIDEBAR_KEYBOARD_SHORTCUT)
  );
}

/** Ghost icon button calling toggleSidebar(). The icon mirrors the
 *  sidebar's side, and its tooltip names the action with the toggle
 *  keystroke by default. */
const SidebarTrigger = forwardRef<HTMLButtonElement, SidebarTriggerProps>(
  ({ onClick, size, children, ...props }, ref) => {
    const {
      toggleSidebar,
      open,
      openMobile,
      isMobile,
      side,
      peek,
      isPeeking,
      schedulePeek,
      cancelPeekTimer,
    } = useSidebar();
    const shortcutKey = useShortcutKey();
    // With hover-peek enabled, the COLLAPSED trigger is a peek affordance
    // too: resting on it floats the rail out exactly like the edge strip —
    // same shared intent timer, so moving from the trigger into the peeked
    // card (or back) cancels the pending dismissal.
    const hoverPeek = peek === "hover" && !isMobile && !open;
    const PanelLeftIcon = useIcon("panel-left");
    const PanelRightIcon = useIcon("panel-right");
    const TriggerIcon = side === "right" ? PanelRightIcon : PanelLeftIcon;
    const iconSize = useSizeVariant() === "compact" ? ("icon-compact" as const) : ("icon" as const);
    const collapsed = isMobile ? !openMobile : !open;

    return (
      <Tooltip
        side="bottom"
        content={
          <span className="flex items-center gap-1.5">
            {/* A flex row escapes the surface's text-box trim, so the label
                re-applies it — otherwise the shortcut row would sit taller
                than a tooltip without a chip. */}
            <span className="[text-box:trim-both_cap_alphabetic]">
              {collapsed ? "Expand sidebar" : "Collapse sidebar"}
            </span>
            <ShortcutKbd>{shortcutKey}</ShortcutKbd>
          </span>
        }
      >
        <Button
          ref={ref}
          variant="ghost"
          size={size ?? iconSize}
          data-sidebar="trigger"
          aria-label="Toggle Sidebar"
          onClick={(event) => {
            onClick?.(event);
            toggleSidebar();
          }}
          onPointerEnter={
            hoverPeek
              ? (event: React.PointerEvent) => {
                  if (event.pointerType !== "mouse") return;
                  if (isPeeking) cancelPeekTimer();
                  else schedulePeek();
                }
              : undefined
          }
          // While PEEKED the shell's geometric watcher owns dismissal — a
          // leave fired here can be the peek card sliding over a stationary
          // cursor (layout-driven boundary event, no accompanying move to
          // disarm it), which would flicker the peek closed and open again.
          // This leave only retires a pending intent timer.
          onPointerLeave={
            hoverPeek
              ? () => {
                  if (!isPeeking) cancelPeekTimer();
                }
              : undefined
          }
          {...props}
        >
          {children ?? <TriggerIcon />}
        </Button>
      </Tooltip>
    );
  }
);
SidebarTrigger.displayName = "SidebarTrigger";

// ─── SidebarRail ─────────────────────────────────────────────────────────────

export interface SidebarRailProps extends HTMLAttributes<HTMLButtonElement> {
  /** Pin the tooltip open/closed; `undefined` leaves it on hover. */
  tooltipOpen?: boolean;
}

/** The grab strip on the sidebar's inner edge, rendered by default inside
 *  the desktop shell: drag it to resize (clamped), click it to collapse, and
 *  its tooltip explains both with the toggle keystroke. Hovering it
 *  brightens the edge border. */
const SidebarRail = forwardRef<HTMLButtonElement, SidebarRailProps>(
  ({ className, tooltipOpen, ...props }, ref) => {
    const { toggleSidebar, setOpen, setWidth, side, setIsResizing } = useSidebar();
    const shortcutKey = useShortcutKey();
    const railRef = useRef<HTMLButtonElement | null>(null);
    const dragRef = useRef<{ startX: number; startWidth: number; moved: boolean; collapsed: boolean } | null>(null);
    const [dragging, setDragging] = useState(false);

    const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
      const panel = railRef.current?.closest('[data-slot="sidebar"]') as HTMLElement | null;
      if (!panel) return;
      dragRef.current = { startX: event.clientX, startWidth: panel.offsetWidth, moved: false, collapsed: false };
      event.currentTarget.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = event.clientX - drag.startX;
      if (!drag.moved && Math.abs(dx) < 4) return;
      if (!drag.moved) {
        drag.moved = true;
        setDragging(true);
        setIsResizing(true);
      }
      const delta = side === "left" ? dx : -dx;
      const raw = drag.startWidth + delta;
      // Dragged well past the minimum, toward the edge: preview the collapse
      // but keep the drag session alive — pulling back past the threshold
      // re-expands, so an overshoot isn't committed until release.
      if (raw < SIDEBAR_MIN_WIDTH - SIDEBAR_COLLAPSE_SLOP) {
        if (!drag.collapsed) {
          drag.collapsed = true;
          setWidth(`${SIDEBAR_MIN_WIDTH}px`);
          setOpen(false);
        }
        return;
      }
      if (drag.collapsed) {
        drag.collapsed = false;
        setOpen(true);
      }
      const next = Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, raw));
      setWidth(`${next}px`);
    };

    const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      dragRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
      setDragging(false);
      setIsResizing(false);
      // A press that never turned into a drag is the collapse click.
      if (drag && !drag.moved) toggleSidebar();
    };

    // A cancelled pointer (touch interruption, capture loss) ends the drag
    // where it stands — no collapse-click, capture is already released.
    const onPointerCancel = () => {
      dragRef.current = null;
      setDragging(false);
      setIsResizing(false);
    };

    const semibold = { fontVariationSettings: fontWeights.semibold };

    return (
      <Tooltip
        side={side === "left" ? "right" : "left"}
        sideOffset={8}
        followCursor="y"
        forceOpen={dragging ? false : tooltipOpen}
        content={
          // The flex column escapes the tooltip surface's text-box trim, so
          // BOTH lines re-apply it and the gap alone carries the line rhythm
          // — an untrimmed line would smuggle its half-leading back in as
          // lopsided padding.
          <span className="flex flex-col items-start gap-2">
            <span className="[text-box:trim-both_cap_alphabetic]">
              <span style={semibold}>Drag</span> to resize
            </span>
            <span className="flex items-center gap-1.5">
              <span className="[text-box:trim-both_cap_alphabetic]">
                <span style={semibold}>Click</span> to collapse
              </span>
              <ShortcutKbd>{shortcutKey}</ShortcutKbd>
            </span>
          </span>
        }
      >
        <button
          ref={(node) => {
            railRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
          }}
          type="button"
          data-sidebar="rail"
          aria-label="Resize or collapse sidebar"
          tabIndex={-1}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          className={cn(
            // touch-none: without it the browser claims a touch drag for
            // scrolling and pointercancels the resize mid-gesture.
            "absolute inset-y-0 z-20 w-2 cursor-col-resize touch-none outline-none",
            // Positioned from context (not group-data selectors) so variant
            // offsets passed via className can win the merge.
            side === "left" ? "right-0" : "left-0",
            // Hovering brightens the edge border the shell draws by default;
            // a pinned tooltip brightens it too, so the spotlight reads as
            // the hover it stands in for.
            "after:absolute after:inset-y-0 after:w-px after:bg-transparent hover:after:bg-foreground/25 after:transition-colors after:duration-80",
            tooltipOpen && "after:bg-foreground/25",
            side === "left" ? "after:right-0" : "after:left-0",
            className
          )}
          {...props}
        />
      </Tooltip>
    );
  }
);
SidebarRail.displayName = "SidebarRail";

// ─── SidebarInset ────────────────────────────────────────────────────────────

export type SidebarInsetProps = HTMLAttributes<HTMLElement>;

const SidebarInset = forwardRef<HTMLElement, SidebarInsetProps>(
  ({ className, ...props }, ref) => {
    const shape = useShape();
    return (
      <main
        ref={ref}
        data-slot="sidebar-inset"
        className={cn(
          "relative flex min-h-0 w-full min-w-0 flex-1 flex-col bg-background",
          "peer-data-[variant=inset]:m-2 peer-data-[variant=inset]:peer-data-[side=left]:ml-0 peer-data-[variant=inset]:peer-data-[side=right]:mr-0",
          // With the rail collapsed away, restore the sidebar-side margin so
          // the card keeps symmetric insets.
          "peer-data-[variant=inset]:peer-data-[state=collapsed]:peer-data-[side=left]:ml-2 peer-data-[variant=inset]:peer-data-[state=collapsed]:peer-data-[side=right]:mr-2",
          "transition-[margin] duration-80",
          // Container radius follows the shape system (literal classes so
          // Tailwind's scanner emits both).
          shape.bgRadius >= 20
            ? "peer-data-[variant=inset]:rounded-3xl"
            : "peer-data-[variant=inset]:rounded-xl",
          "peer-data-[variant=inset]:bg-surface-2 peer-data-[variant=inset]:shadow-surface-2",
          className
        )}
        {...props}
      />
    );
  }
);
SidebarInset.displayName = "SidebarInset";

// ─── SidebarInput ────────────────────────────────────────────────────────────

export type SidebarInputProps = React.InputHTMLAttributes<HTMLInputElement>;

const SidebarInput = forwardRef<HTMLInputElement, SidebarInputProps>(
  ({ className, ...props }, ref) => {
    const shape = useShape();
    const size = useSize();
    return (
      <input
        ref={ref}
        data-sidebar="input"
        className={cn(
          // Mirrors the InputGroup field ladder: transparent at rest,
          // muted fill + border ring on hover, card fill when focused.
          "w-full bg-transparent px-3 text-foreground placeholder:text-muted-foreground outline-none",
          "ring-1 ring-transparent transition-[background-color,box-shadow] duration-80",
          "hover:bg-muted/50 hover:ring-border",
          "focus:bg-card focus:ring-border",
          "focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
          size.variant === "compact" ? "h-7" : "h-8",
          size.text,
          shape.input,
          className
        )}
        {...props}
      />
    );
  }
);
SidebarInput.displayName = "SidebarInput";

// ─── SidebarHeader / SidebarFooter / SidebarSeparator ────────────────────────

export type SidebarSectionProps = HTMLAttributes<HTMLDivElement>;

const SidebarHeader = forwardRef<HTMLDivElement, SidebarSectionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn("flex shrink-0 flex-col gap-2 p-2", className)}
      {...props}
    />
  )
);
SidebarHeader.displayName = "SidebarHeader";

const SidebarFooter = forwardRef<HTMLDivElement, SidebarSectionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn("mt-auto flex shrink-0 flex-col gap-2 p-2", className)}
      {...props}
    />
  )
);
SidebarFooter.displayName = "SidebarFooter";

const SidebarSeparator = forwardRef<HTMLDivElement, SidebarSectionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="separator"
      role="separator"
      aria-orientation="horizontal"
      className={cn("mx-2 h-px shrink-0 bg-border", className)}
      {...props}
    />
  )
);
SidebarSeparator.displayName = "SidebarSeparator";

// ─── SidebarGroup family ─────────────────────────────────────────────────────

// SSR-safe layout effect (client components still server-render in Next).
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface SidebarGroupContextValue {
  open: boolean;
  toggle: () => void;
  contentId: string;
  /** How many header action buttons overlay the label's right edge — the
   *  collapsible label pads itself so its chevron clears them. */
  actionsCount: number;
}

const SidebarGroupContext = createContext<SidebarGroupContextValue | null>(null);

export interface SidebarGroupProps extends SidebarSectionProps {
  /** Makes the group's SidebarGroupLabel a toggle that collapses everything
   *  rendered after it — a group-level accordion. Uncontrolled by default;
   *  pass `open`/`onOpenChange` to control it. */
  collapsible?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const SidebarGroup = forwardRef<HTMLDivElement, SidebarGroupProps>(
  (
    {
      className,
      collapsible = false,
      open: openProp,
      defaultOpen = true,
      onOpenChange,
      children,
      ...props
    },
    ref
  ) => {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const open = openProp ?? uncontrolledOpen;
    const contentId = useId();
    const toggle = useCallback(() => {
      const next = !(openProp ?? uncontrolledOpen);
      setUncontrolledOpen(next);
      onOpenChange?.(next);
    }, [openProp, uncontrolledOpen, onOpenChange]);
    // Measured-height collapse: animate between 0 and the content's real
    // offsetHeight — never to "auto", which framer measures wrong under a
    // scaled ancestor.
    const contentRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState<number | null>(null);
    useIsoLayoutEffect(() => {
      if (!collapsible) return;
      const el = contentRef.current;
      if (!el || typeof ResizeObserver === "undefined") return;
      const measure = () => setContentHeight(el.offsetHeight);
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }, [collapsible]);
    const measured = contentHeight !== null;
    // The collapse wrapper must clip while animating, but a permanently
    // clipped box shaves the 2px focus ring off a group's first and last
    // rows — so clipping lifts once an open group has settled.
    const [settled, setSettled] = useState(open);
    useEffect(() => {
      if (!open) setSettled(false);
    }, [open]);

    // Height animates only when THIS group toggles. When the measured height
    // changes underneath it instead — a nested sub-menu collapsing inside the
    // group — the wrapper must snap: a spring re-targeted every frame chases
    // the child's own animation, lands well after it, and drags everything
    // below the group along late. Tracked with a ref so a controlled `open`
    // is covered too, and cleared once the toggle's animation lands.
    const prevOpenRef = useRef(open);
    const togglingRef = useRef(false);
    if (prevOpenRef.current !== open) {
      prevOpenRef.current = open;
      togglingRef.current = true;
    }

    // The label and any header actions stay put; everything else after the
    // label rides in the collapse wrapper. If no SidebarGroupLabel child is
    // found the group renders untouched.
    const isHeaderAction = (k: ReactNode) =>
      isValidElement(k) &&
      (k.type === SidebarGroupAction || k.type === SidebarGroupActions);
    let inner: ReactNode = children;
    let actionsCount = 0;
    if (collapsible) {
      const kids = Children.toArray(children);
      const labelIdx = kids.findIndex(
        (k) => isValidElement(k) && k.type === SidebarGroupLabel
      );
      if (labelIdx !== -1) {
        const tail = kids.slice(labelIdx + 1);
        const headerActions = tail.filter(isHeaderAction);
        const rest = tail.filter((k) => !isHeaderAction(k));
        actionsCount = headerActions.reduce<number>(
          (n, k) =>
            n +
            (isValidElement(k) && k.type === SidebarGroupActions
              ? Children.count(
                  (k.props as { children?: ReactNode }).children
                )
              : 1),
          0
        );
        inner = (
          <>
            {kids.slice(0, labelIdx)}
            {/* Header hover scope: hovering anywhere on the row — the
                overlaid action cluster included, which never :hovers the
                label element itself — reveals the label's chevron. Kept
                position-static so the cluster's absolute box still anchors
                to the group and stays on the rows' action axis. */}
            <div className="group/group-header w-full">
              {kids[labelIdx]}
              {headerActions}
            </div>
            <motion.div
              id={contentId}
              aria-hidden={open ? undefined : true}
              className={cn(
                open && settled ? "overflow-visible" : "overflow-hidden",
                !measured && !open && "h-0"
              )}
              initial={false}
              animate={
                measured
                  ? { height: open ? contentHeight : 0, opacity: open ? 1 : 0 }
                  : { opacity: open ? 1 : 0 }
              }
              // Do NOT simplify this to `open ? spring.moderate : …`. The
              // togglingRef arm is what stops a re-measure from springing —
              // without it a nested collapse makes this wrapper chase its own
              // child and everything below the group moves late.
              transition={
                togglingRef.current
                  ? open
                    ? spring.moderate
                    : spring.moderate.exit
                  : { duration: 0 }
              }
              onAnimationComplete={() => {
                togglingRef.current = false;
                if (open) setSettled(true);
              }}
            >
              <div ref={contentRef} className="flex w-full min-w-0 flex-col">
                {rest}
              </div>
            </motion.div>
          </>
        );
      }
    }

    const ctx = useMemo(
      () => ({ open, toggle, contentId, actionsCount }),
      [open, toggle, contentId, actionsCount]
    );

    return (
      <div
        ref={ref}
        data-sidebar="group"
        data-state={collapsible ? (open ? "open" : "closed") : undefined}
        className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
        {...props}
      >
        <SidebarGroupContext.Provider value={collapsible ? ctx : null}>
          {inner}
        </SidebarGroupContext.Provider>
      </div>
    );
  }
);
SidebarGroup.displayName = "SidebarGroup";

export interface SidebarGroupLabelProps extends HTMLAttributes<HTMLDivElement> {
  render?: ReactElement;
  asChild?: boolean;
}

const SidebarGroupLabel = forwardRef<HTMLDivElement, SidebarGroupLabelProps>(
  ({ className, render, asChild, children, ...props }, ref) => {
    const sizeVariant = useSizeVariant();
    const sizeClasses = useSize();
    const group = useContext(SidebarGroupContext);
    const shape = useShape();
    const ChevronRightIcon = useIcon("chevron-right");
    const { template, content } = resolveSlotTemplate(render, asChild, children);

    // Truncate only the leading text; element children (count badges,
    // trailing controls) stay flex siblings so the row's gap keeps spacing
    // them — same split MenuRowLabel does for menu rows.
    const nodes = Children.toArray(content);
    let textEnd = 0;
    while (
      textEnd < nodes.length &&
      (typeof nodes[textEnd] === "string" || typeof nodes[textEnd] === "number")
    ) {
      textEnd++;
    }
    const leadingText = nodes.slice(0, textEnd).join("");
    const labelContent = leadingText ? (
      <>
        <span className="min-w-0 truncate">{leadingText}</span>
        {nodes.slice(textEnd)}
      </>
    ) : (
      content
    );

    // Inside a collapsible group the label becomes the toggle. Design
    // treatment is unchanged — hover only raises the label's contrast and
    // reveals a chevron (kept visible while collapsed as the reopen cue).
    if (group) {
      return slotElement(
        template,
        "button",
        {
          ref: ref as Ref<HTMLElement>,
          type: template ? undefined : "button",
          "data-sidebar": "group-label",
          "aria-expanded": group.open,
          "aria-controls": group.contentId,
          onClick: group.toggle,
          // The action cluster overlays the label's right edge, so the label
          // pads past it — far enough that the hover-revealed chevron lands
          // one cluster gap (4px) to its left and the whole trailing run
          // keeps a single rhythm. Cluster width is 24px per action plus 4px
          // between them; add that gap again, less the 8px the group's
          // padding already gives back: 28n + 6. The cluster is always
          // visible, so the reservation is permanent.
          style:
            group.actionsCount > 0
              ? ({ "--group-actions-pad": `${group.actionsCount * 28 + 6}px` } as CSSProperties)
              : undefined,
          className: cn(
            "flex h-8 w-full shrink-0 cursor-pointer select-none items-center gap-2 px-2 text-left text-muted-foreground/70 outline-none",
            "transition-colors duration-80 hover:text-muted-foreground",
            group.actionsCount > 0 && "pr-[var(--group-actions-pad)]",
            "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
            shape.item,
            sizeVariant === "compact" ? "text-[11px]" : "text-[12px]",
            className
          ),
          ...props,
        },
        <>
          {labelContent}
          {/* The chevron occupies an action-sized box, so it reads as one more
              icon in the row rather than a smaller glyph tacked on the end.
              One chevron-right glyph for both states, sprung 90° to point
              down while the group is open — the motion wrapper is what
              animates: Tailwind's rotate-* sets the standalone CSS `rotate`
              property, which transition-transform never covers. While open
              the whole box collapses to zero width at rest so the label text
              keeps the full row; hover/focus (or an open action popup)
              reveals it. Collapsed keeps it visible as the reopen cue. */}
          {/* No width/opacity transition: animating the box's width slides
              the glyph in from the side — the chevron should simply be
              there once the header is hovered. */}
          <span
            className={cn(
              "ml-auto flex h-6 shrink-0 items-center justify-center overflow-hidden",
              group.open
                ? "w-0 opacity-0 group-hover/group-header:w-6 group-hover/group-header:opacity-100 group-focus-within/group-header:w-6 group-focus-within/group-header:opacity-100 group-has-[[data-sidebar=group-action]:is([data-state=open],[data-popup-open],[aria-expanded=true])]/group-header:w-6 group-has-[[data-sidebar=group-action]:is([data-state=open],[data-popup-open],[aria-expanded=true])]/group-header:opacity-100 pointer-coarse:w-6 pointer-coarse:opacity-100"
                : "w-6 opacity-100"
            )}
          >
            <motion.span
              className="inline-flex"
              animate={{ rotate: group.open ? 90 : 0 }}
              transition={spring.fast}
            >
              <ChevronRightIcon
                size={sizeClasses.icon}
                strokeWidth={1.5}
                className="shrink-0"
              />
            </motion.span>
          </span>
        </>
      );
    }

    return slotElement(
      template,
      "div",
      {
        ref: ref as Ref<HTMLElement>,
        "data-sidebar": "group-label",
        className: cn(
          "flex h-8 shrink-0 items-center gap-2 px-2 text-muted-foreground/70 outline-none",
          sizeVariant === "compact" ? "text-[11px]" : "text-[12px]",
          className
        ),
        ...props,
      },
      labelContent
    );
  }
);
SidebarGroupLabel.displayName = "SidebarGroupLabel";

export interface SidebarGroupActionProps extends HTMLAttributes<HTMLButtonElement> {
  render?: ReactElement;
  asChild?: boolean;
}

/** True while rendering inside a SidebarGroupActions cluster, where each
 *  action sits in the flex row instead of positioning itself absolutely. */
const GroupActionsContext = createContext(false);

const SidebarGroupAction = forwardRef<HTMLButtonElement, SidebarGroupActionProps>(
  ({ className, render, asChild, children, ...props }, ref) => {
    const shape = useShape();
    const sizeClasses = useSize();
    const inCluster = useContext(GroupActionsContext);
    const { template, content } = resolveSlotTemplate(render, asChild, children);
    return slotElement(
      template,
      "button",
      {
        ref: ref as Ref<HTMLElement>,
        type: template ? undefined : "button",
        "data-sidebar": "group-action",
        className: cn(
          inCluster
            ? "relative flex size-6 items-center justify-center text-muted-foreground outline-none"
            // size-6 matches the rows' action hit-box, and right-3.5 puts that
            // 24px box's centre 26px from the sidebar's inner edge — the axis
            // the rows' badges and actions already sit on.
            : "absolute right-3.5 top-3 flex size-6 items-center justify-center text-muted-foreground outline-none",
          "hover:bg-hover hover:text-foreground transition-colors duration-80",
          "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
          // Normalize bare icons to the site's 1.5 stroke (library defaults
          // vary), thickening to 2 on hover — the same treatment Button's
          // icon-only span applies.
          "[&_svg]:size-[var(--icon-size)] [&_svg]:shrink-0 [&_svg]:stroke-[1.5] [&_svg]:transition-[stroke-width] [&_svg]:duration-80 hover:[&_svg]:stroke-[2]",
          shape.item,
          className
        ),
        ...props,
        // After ...props: the spread would otherwise replace this object
        // wholesale and drop the icon-size the glyph is sized from.
        style: {
          ...({ "--icon-size": `${sizeClasses.icon}px` } as CSSProperties),
          ...(props.style ?? {}),
        },
      },
      content
    );
  }
);
SidebarGroupAction.displayName = "SidebarGroupAction";

/** Header action cluster: 1–3 SidebarGroupActions laid out in a row over the
 *  group label's right edge. Use instead of a lone SidebarGroupAction when a
 *  section needs several controls. */
export type SidebarGroupActionsProps = HTMLAttributes<HTMLDivElement>;

const SidebarGroupActions = forwardRef<HTMLDivElement, SidebarGroupActionsProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="group-actions"
        className={cn(
          // right-3.5 lands the last 24px action's centre 26px from the
          // sidebar's inner edge — the rows' badge/action axis, so the header's
          // controls line up with the column below them.
          "absolute right-3.5 top-2 z-10 flex h-8 items-center gap-1",
          className
        )}
        {...props}
      >
        <GroupActionsContext.Provider value={true}>
          {children}
        </GroupActionsContext.Provider>
      </div>
    );
  }
);
SidebarGroupActions.displayName = "SidebarGroupActions";

const SidebarGroupContent = forwardRef<HTMLDivElement, SidebarSectionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="group-content"
      className={cn("w-full", className)}
      {...props}
    />
  )
);
SidebarGroupContent.displayName = "SidebarGroupContent";

export {
  SidebarProvider,
  SidebarShell,
  SidebarTrigger,
  SidebarRail,
  SidebarInset,
  SidebarInput,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupActions,
  SidebarGroupContent,
};
