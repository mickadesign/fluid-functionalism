"use client";

import {
  forwardRef,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  PresenceContext,
  animate,
  motion,
  useMotionValue,
  usePresence,
  useReducedMotion,
  useTransform,
  type ValueAnimationTransition,
} from "motion/react";
import { cn } from "@/lib/utils";
import { fontWeights } from "@/lib/font-weight";
import { useShape } from "@/lib/shape-context";
import { SizeProvider, typeClass, useSize, type SizeVariant } from "@/lib/size-context";
import { useIcons, type IconComponent } from "@/lib/icon-context";
import { spring } from "@/lib/springs";
import { Button, type ButtonProps } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Banner is a status message built from parts, the way Card is: Banner owns
// the status color, the icon and the dismiss control; BannerTitle,
// BannerDescription and BannerActions fill the text column.
//
// One status color per banner, and it lands in one place at a time:
//   contrast="low":  a neutral overlay behind the text; only the icon is
//                    colored.
//   contrast="high": a light wash of the status color behind the text.
// There is no solid fill: the status color never sits behind the text at
// full strength. Text stays on the foreground ramp in both, so it reads the
// same on every status.
//
// The parts sit on one grid, so their placement is pure CSS: actions trail
// the title on a title-only banner, and drop under the text when there is a
// description or the banner is narrower than 24rem.
// ---------------------------------------------------------------------------

type BannerStatus = "default" | "info" | "success" | "warning" | "error";
type BannerContrast = "low" | "high";
type BannerVariant = "inline" | "fixed";

// The status color: the icon's fill, and the wash behind a high-contrast
// banner. Default is the foreground, so a neutral banner reads as ink.
// --info, --success and --warning ship with the component: Tailwind 500s in
// light mode, where they carry the light mark cut into a filled glyph, and
// 300s in dark mode, where the mark turns dark. Error reuses --destructive,
// so it matches the app's other error states.
// useLayoutEffect warns when rendered on the server; the effect only
// measures, so the server can skip it.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const TONE: Record<BannerStatus, string> = {
  default: "var(--foreground)",
  info: "var(--info)",
  success: "var(--success)",
  warning: "var(--warning)",
  error: "var(--destructive)",
};

// Both fills are translucent, so the banner takes on whatever surface it sits
// on. Grey reads darker than a hue at the same mix, so the neutral wash steps
// down to 8%.
function fillFor(status: BannerStatus, contrast: BannerContrast) {
  if (contrast === "low") return "var(--hover)";
  const amount = status === "default" ? 8 : 12;
  return `color-mix(in oklab, var(--banner-tone) ${amount}%, transparent)`;
}

// ── Status glyphs ────────────────────────────────────────
// The 4 colored statuses get filled shapes with the mark cut out in the page
// color: a solid shape carries the status color at 16–20px far better than a
// 1.5px outline. Drawn here rather than taken from the icon set so they stay
// filled whatever icon library the app uses. The neutral default carries no
// status, so it takes the icon set's regular outline info icon instead.

type ColoredStatus = Exclude<BannerStatus, "default">;

function StatusGlyph({ status, size }: { status: ColoredStatus; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      {status === "warning" ? (
        <path
          d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      ) : (
        <circle cx="12" cy="12" r="10.5" fill="currentColor" />
      )}
      <g
        className="stroke-background"
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {status === "success" ? (
          <path d="m8.5 12.25 2.5 2.5 4.5-5" />
        ) : status === "warning" ? (
          <path d="M12 9.5v3.5M12 17h.01" />
        ) : status === "error" ? (
          <path d="M12 7.5v5M12 16.5h.01" />
        ) : (
          <path d="M12 16.5v-5M12 7.5h.01" />
        )}
      </g>
    </svg>
  );
}

// ── Motion ───────────────────────────────────────────────
// The space a banner takes (a one-row grid whose track runs between 0fr and
// 1fr) and the banner itself move separately.
//
// Appearing, the row starts opening, and a fast tier later the banner fades
// in while growing from 40% on the slow tier, bounce included. Dismissing,
// the row starts closing at once and the banner rides it: while the row
// closes to 60% of its height, the banner shrinks from 100% to 60% from its
// top edge and fades out, so its visible height always equals the row's and
// the closing row never cuts it. The rest of the close happens with the
// banner already gone. A full-bleed bar can't shrink without pulling its ends
// in from the window edges, so it rides its row instead: it slides down into
// the opening row while fading in, and up out of the closing one while
// fading out, both on the row's curve. Reduced motion keeps the fades and
// snaps the row.
//
// At rest the row is exactly the content height, so rewrapping text never
// waits on a measurement, and fr resolves from layout, so a scaled ancestor
// can't skew it the way it skews a framer "auto" target. In a flex column
// with a gap, the row also takes back one gap, so nothing jumps when the
// banner mounts or unmounts.

/** Every value in the appear and dismiss. */
interface BannerMotionConfig {
  readonly appear: {
    /** The row opening. */
    readonly row: ValueAnimationTransition<number>;
    /** The banner fading in and growing. */
    readonly banner: ValueAnimationTransition<number>;
    /** The scale the banner grows from. */
    readonly fromScale: number;
  };
  readonly dismiss: {
    /** The row closing. The banner rides it. */
    readonly row: ValueAnimationTransition<number>;
    /** The scale the banner shrinks to, which is also how open the row is
     *  when the banner is gone. One number, so the banner's visible height
     *  always equals the row's and the row never cuts it. */
    readonly shrinkTo: number;
  };
}

/** The default appear and dismiss, each value a motion token or derived from
 *  one. Pass a banner's `motion` prop to change them for that banner; spread
 *  these to change one value and keep the rest. */
const bannerMotion: BannerMotionConfig = {
  appear: {
    // Twice the moderate tier, no bounce.
    row: { type: "spring", duration: spring.moderate.duration * 2, bounce: 0 },
    // The slow tier, bounce included, starting a fast tier after the row.
    banner: {
      type: "spring",
      duration: spring.slow.duration,
      bounce: spring.slow.bounce,
      delay: spring.fast.duration,
    },
    fromScale: 0.4,
  },
  dismiss: {
    // easeInOut, twice the moderate exit.
    row: { duration: spring.moderate.exit.duration * 2, ease: "easeInOut" },
    shrinkTo: 0.6,
  },
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Where keyboard focus goes when a banner holding it closes: the first
 *  focusable element after the banner, else the last one before it. */
function focusNeighbour(banner: HTMLElement) {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !banner.contains(el) && (el.checkVisibility?.() ?? true)
  );
  const after = candidates.find(
    (el) => banner.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING
  );
  const before = candidates
    .filter((el) => banner.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING)
    .pop();
  (after ?? before)?.focus({ preventScroll: true });
}

interface BannerMotionProps {
  fixed: boolean;
  reduceMotion: boolean;
  config: BannerMotionConfig;
  children: ReactNode;
}

function BannerMotion({ fixed, reduceMotion, config, children }: BannerMotionProps) {
  // A banner that is open on first render arrives already in place.
  const appear = useContext(PresenceContext)?.initial !== false;
  const [isPresent, safeToRemove] = usePresence();
  // AnimatePresence hands out a new `safeToRemove` on every render while a
  // banner leaves, and the config may change mid-flight. Reading both
  // through refs keeps a parent re-render from restarting an animation.
  const safeToRemoveRef = useRef(safeToRemove);
  const configRef = useRef(config);
  useEffect(() => {
    safeToRemoveRef.current = safeToRemove;
    configRef.current = config;
  });
  const scaled = !fixed && !reduceMotion;
  // A fixed bar rides its row both ways: its bottom edge sits on the row's,
  // so it slides down into an opening row and up out of a closing one.
  const slides = fixed && !reduceMotion;

  // How open the row is (as a share of the banner's height), how shown and
  // how large the banner is. Every style below is one of these or derived
  // from one, so the row and the banner render from the same frame.
  const row = useMotionValue(appear ? 0 : 1);
  const shown = useMotionValue(appear ? 0 : 1);
  const scale = useMotionValue(appear && scaled ? config.appear.fromScale : 1);
  // The gap a flex-column parent puts next to the banner, measured when the
  // banner mounts (before it paints), and taken back as the row closes.
  const gap = useMotionValue(0);
  // The row clips only while it has to. Appearing inline, the banner's
  // slow-tier bounce takes it a touch past full size; the row lets that show
  // rather than cutting its edges. Leaving, the banner never outgrows the
  // row, so clipping costs nothing; a fixed bar slides out of it.
  const overflow = useMotionValue(fixed ? "hidden" : "visible");

  const gridTemplateRows = useTransform(row, (v) => `${v}fr`);
  const marginBottom = useTransform([row, gap], ([r, g]: number[]) => (r - 1) * g);
  const y = useTransform(row, (v) => (slides ? `${(v - 1) * 100}%` : "0%"));
  // A banner that is mostly faded takes no clicks: one appearing can't catch
  // clicks meant for what's under it, and one leaving can't be hit twice.
  const pointerEvents = useTransform(shown, (v) => (v > 0.5 ? "auto" : "none"));

  const rootRef = useRef<HTMLDivElement | null>(null);
  // Measured in a layout effect, not a ref callback: React attaches refs
  // before it runs layout effects, so a gap set from the ref came before
  // marginBottom's useTransform subscribed to it (in a layout effect above)
  // and never reached the margin until the row moved. Motion holds an
  // animation's start while the main thread is busy, so the first frame
  // then painted with no margin and the content below jumped by the gap.
  // Set here, it lands on the next frame, which runs before the first paint.
  useIsoLayoutEffect(() => {
    const parent = rootRef.current?.parentElement;
    if (!parent) return;
    const style = getComputedStyle(parent);
    const column =
      parent.children.length > 1 &&
      style.display.endsWith("flex") &&
      style.flexDirection.startsWith("column");
    gap.set(column ? parseFloat(style.rowGap) || 0 : 0);
  }, [gap]);

  useEffect(() => {
    const { appear: enter, dismiss: leave } = configRef.current;

    if (isPresent) {
      // Appearing (or coming back mid-dismiss, from wherever it is): the row
      // opens. Inline, the banner fades in and grows just behind it; a fixed
      // bar slides down into the row and fades in with it.
      overflow.set(fixed ? "hidden" : "visible");
      const open = animate(row, 1, reduceMotion ? { duration: 0 } : enter.row);
      if (slides) {
        const follow = row.on("change", (v) => shown.set(v));
        return () => {
          follow();
          open.stop();
        };
      }
      const show = animate(shown, 1, reduceMotion ? spring.fast : enter.banner);
      const grow = scaled ? animate(scale, 1, enter.banner) : undefined;
      return () => {
        open.stop();
        show.stop();
        grow?.stop();
      };
    }

    // Leaving with keyboard focus inside: hand it to a neighbour, so it
    // doesn't fall back to the top of the page when the banner unmounts.
    const root = rootRef.current;
    if (root?.contains(document.activeElement)) focusNeighbour(root);

    if (reduceMotion) {
      const hide = animate(shown, 0, spring.fast.exit);
      hide.then(() => safeToRemoveRef.current?.());
      return () => hide.stop();
    }

    // Dismissing: the row closes from the start, and the banner rides it.
    // Inline, the banner is gone by the time the row is `shrinkTo` open,
    // shrinking toward `shrinkTo` as it fades, so it is never taller than the
    // row; a fixed bar fades over the whole close. Both start from wherever
    // the banner is, so a dismiss mid-appear doesn't jump.
    overflow.set("hidden");
    const end = fixed ? 0 : Math.min(leave.shrinkTo, 0.99);
    const rowFrom = row.get();
    const shownFrom = shown.get();
    const scaleFrom = scale.get();
    const unfollow = row.on("change", (v) => {
      const left =
        rowFrom > end ? (v - end) / (rowFrom - end) : rowFrom > 0 ? v / rowFrom : 0;
      shown.set(shownFrom * Math.min(1, Math.max(0, left)));
      if (scaled) scale.set(Math.min(scaleFrom, Math.max(v, end)));
    });
    const close = animate(row, 0, leave.row);
    close.then(() => safeToRemoveRef.current?.());
    return () => {
      unfollow();
      close.stop();
    };
  }, [isPresent, reduceMotion, fixed, scaled, slides, row, shown, scale, overflow]);

  return (
    <motion.div
      ref={rootRef}
      style={{ gridTemplateRows, marginBottom, overflow }}
      // w-full: the banner is a container (for its narrow layout), so it
      // can't size to its content and has to take the full row.
      //
      // The clip sits on the grid, not on the track's item: below 1fr,
      // Chrome sizes the grid to f of the content but the track itself to
      // f² (0.5fr renders a quarter). The grid's height is the space the
      // banner takes, so clipping there keeps what is shown and what is
      // pushed down the same box.
      className={cn("grid w-full", fixed && "sticky top-0 z-[var(--z-sticky,30)]")}
    >
      <div className="min-h-0">
        <motion.div style={{ opacity: shown, scale, y, pointerEvents, transformOrigin: "top" }}>
          {children}
        </motion.div>
      </div>
    </motion.div>
  );
}

// ── Banner ───────────────────────────────────────────────

interface BannerProps extends HTMLAttributes<HTMLDivElement> {
  /** Which status color the banner carries. @default "default" */
  status?: BannerStatus;
  /** "low" — neutral fill, colored icon. "high" — a light wash of the status
   *  color behind the text. @default "low" */
  contrast?: BannerContrast;
  /** "inline" — a rounded block in the flow of the page. "fixed" — a
   *  full-bleed bar that sticks to the top of its scroll container and pushes
   *  the content below it down. @default "inline" */
  variant?: BannerVariant;
  /** Replaces the status icon. Rendered in the status color. */
  icon?: IconComponent;
  /** Shows a dismiss (✕) button. */
  dismissible?: boolean;
  /** Called when the ✕ is pressed. */
  onDismiss?: () => void;
  /** Accessible name for the ✕. @default "Dismiss" */
  dismissLabel?: string;
  /** Controls visibility. Omitted, the banner hides itself when dismissed.
   *  Either way, closing collapses its height so the content below slides up. */
  open?: boolean;
  /** Pins the banner to one step of the size ladder. Omitted, it follows the
   *  surrounding SizeProvider. */
  size?: SizeVariant;
  /** Overrides the appear and dismiss values for this banner. Spread
   *  `bannerMotion` to change one and keep the rest. */
  motion?: BannerMotionConfig;
}

const Banner = forwardRef<HTMLDivElement, BannerProps>(
  (
    {
      status = "default",
      contrast = "low",
      variant = "inline",
      icon: Icon,
      dismissible = false,
      onDismiss,
      dismissLabel = "Dismiss",
      open: openProp,
      size,
      motion: motionConfig = bannerMotion,
      role,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const shape = useShape();
    const sizeClasses = useSize(size);
    const compact = sizeClasses.variant === "compact";
    const icons = useIcons();
    const XIcon = icons.x;
    const InfoIcon = icons.info;
    const reduceMotion = useReducedMotion() ?? false;
    const fixed = variant === "fixed";

    const [openState, setOpenState] = useState(true);
    const open = openProp ?? openState;

    const handleDismiss = () => {
      onDismiss?.();
      if (openProp === undefined) setOpenState(false);
    };

    const iconSize = compact ? 16 : 20;
    // A custom icon, or the neutral default's info icon, comes from the icon
    // set as an outline at its usual 1.5 stroke; the colored statuses get
    // their filled glyph.
    const OutlineIcon = Icon ?? (status === "default" ? InfoIcon : undefined);

    const body = (
      <div
        ref={ref}
        // Errors and warnings interrupt a screen reader; the rest wait their
        // turn.
        role={role ?? (status === "error" || status === "warning" ? "alert" : "status")}
        data-slot="banner"
        data-status={status}
        data-contrast={contrast}
        data-variant={variant}
        className={cn(
          "group/banner @container/banner relative grid w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center text-foreground",
          // With a description the icon and ✕ hold to the title line instead
          // of centring on the whole block.
          "has-data-[slot=banner-description]:items-start",
          // Even inset on all 4 sides: 16px, 12px compact.
          compact ? "p-3" : "p-4",
          // A fixed bar runs edge to edge: square corners, no frame.
          !fixed && shape.container,
          className
        )}
        style={
          {
            "--banner-tone": TONE[status],
            "--banner-fill": fillFor(status, contrast),
            // A fixed bar stays opaque over the page scrolling under it;
            // inline, the fill blends with the surface below.
            backgroundColor: fixed ? "var(--background)" : undefined,
            backgroundImage: "linear-gradient(var(--banner-fill), var(--banner-fill))",
            ...style,
          } as CSSProperties
        }
        {...props}
      >
        {/* The glyph box is one title line tall, so it lines up with the
            first line whether it centres or tops. */}
        <span
          aria-hidden="true"
          className={cn(
            "col-start-1 row-start-1 flex items-center justify-center text-[color:var(--banner-tone)]",
            compact ? "mr-2.5 h-[18px]" : "mr-3 h-5"
          )}
        >
          {OutlineIcon ? (
            <OutlineIcon size={iconSize} strokeWidth={1.5} />
          ) : (
            status !== "default" && <StatusGlyph status={status} size={iconSize} />
          )}
        </span>

        {children}

        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={dismissLabel}
            className={cn(
              "col-start-4 row-start-1 flex size-7 cursor-pointer items-center justify-center text-muted-foreground outline-none transition-colors duration-80 hover:bg-hover hover:text-foreground focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
              // Pulled into the padding so the glyph, not the 28px box, sits
              // on the title line and the inset edge.
              compact ? "-my-[5px] -mr-1.5 ml-1.5" : "-my-1 -mr-1.5 ml-2",
              shape.button
            )}
          >
            <XIcon size={compact ? 13 : 15} strokeWidth={1.5} />
          </button>
        )}
      </div>
    );

    const banner = (
      <AnimatePresence initial={false}>
        {open && (
          <BannerMotion
            key="banner"
            fixed={fixed}
            reduceMotion={reduceMotion}
            config={motionConfig}
          >
            {body}
          </BannerMotion>
        )}
      </AnimatePresence>
    );

    return size ? <SizeProvider size={size}>{banner}</SizeProvider> : banner;
  }
);

Banner.displayName = "Banner";

// ── BannerTitle ──────────────────────────────────────────

const BannerTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, style, ...props }, ref) => {
    const compact = useSize().variant === "compact";
    return (
      <p
        ref={ref}
        data-slot="banner-title"
        className={cn(
          "col-start-2 row-start-1 min-w-0 text-foreground",
          typeClass("subtitle", compact ? "compact" : "default"),
          className
        )}
        style={{ fontVariationSettings: fontWeights.semibold, ...style }}
        {...props}
      />
    );
  }
);

BannerTitle.displayName = "BannerTitle";

// ── BannerDescription ────────────────────────────────────
// Foreground, like the title: muted grey drops under 4.5:1 on the tinted
// and neutral fills, and the title already stands apart by its weight.

const BannerDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const compact = useSize().variant === "compact";
  return (
    <p
      ref={ref}
      data-slot="banner-description"
      className={cn(
        "col-start-2 row-start-2 mt-0.5 min-w-0 text-foreground",
        typeClass("subtitle", compact ? "compact" : "default"),
        className
      )}
      {...props}
    />
  );
});

BannerDescription.displayName = "BannerDescription";

// ── BannerActions ────────────────────────────────────────
// Trailing on the title row by default (pulled into the padding so a 28px
// button doesn't grow a one-line banner). Under the text, aligned with the
// title and 8px below it (6px compact), when the banner has a description or
// is narrower than 24rem. Each BannerAction places itself by variant, so the
// order flips with the layout (see BANNER_ACTION_ORDER).

const BannerActions = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const compact = useSize().variant === "compact";
    return (
      <div
        ref={ref}
        data-slot="banner-actions"
        className={cn(
          "col-start-3 row-start-1 flex flex-wrap items-center gap-2",
          compact ? "-my-[5px] ml-2.5" : "-my-1 ml-3",
          // With a description
          "group-has-data-[slot=banner-description]/banner:col-start-2 group-has-data-[slot=banner-description]/banner:row-start-3 group-has-data-[slot=banner-description]/banner:my-0 group-has-data-[slot=banner-description]/banner:ml-0",
          compact
            ? "group-has-data-[slot=banner-description]/banner:mt-1.5"
            : "group-has-data-[slot=banner-description]/banner:mt-2",
          // Narrow banner
          "@max-sm/banner:col-start-2 @max-sm/banner:row-start-3 @max-sm/banner:my-0 @max-sm/banner:ml-0",
          compact ? "@max-sm/banner:mt-1.5" : "@max-sm/banner:mt-2",
          className
        )}
        {...props}
      />
    );
  }
);

BannerActions.displayName = "BannerActions";

// ── BannerAction ─────────────────────────────────────────
// The library Button at its compact 28px size, so it presses like every
// other button and a one-line banner doesn't grow. Primary is ink on any
// status; secondary's see-through tint darkens (or, in dark mode, lightens)
// whatever fill the banner has. Ghost text steps up from muted to 70%
// foreground, which holds 4.5:1 on every banner fill.

type BannerActionVariant = "primary" | "secondary" | "ghost";

// Where each variant sits, whatever order the actions are written in.
// Trailing the title, the strongest action goes last, at the edge: ghost,
// secondary, primary. Under the text it leads, where the eye starts the row:
// primary, secondary, ghost. Tab order follows the markup, so write primary
// first.
const BANNER_ACTION_ORDER: Record<BannerActionVariant, string> = {
  primary:
    "order-3 group-has-data-[slot=banner-description]/banner:order-1 @max-sm/banner:order-1",
  secondary: "order-2",
  ghost:
    "order-1 group-has-data-[slot=banner-description]/banner:order-3 @max-sm/banner:order-3",
};

interface BannerActionProps
  extends Omit<ButtonProps, "variant" | "size" | "asChild" | "render" | "nativeButton"> {
  /** @default "secondary" */
  variant?: BannerActionVariant;
  /** Renders a link instead of a button. */
  href?: string;
  /** Opens the href in a new tab. */
  external?: boolean;
}

const BannerAction = forwardRef<HTMLButtonElement, BannerActionProps>(
  ({ variant = "secondary", href, external = false, className, children, ...props }, ref) => {
    const classes = cn(
      BANNER_ACTION_ORDER[variant],
      variant === "ghost" && "text-foreground",
      className
    );

    if (href) {
      return (
        <Button
          ref={ref}
          asChild
          variant={variant}
          size="compact"
          data-slot="banner-action"
          className={classes}
          {...props}
        >
          <a
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
          >
            {children}
          </a>
        </Button>
      );
    }

    return (
      <Button
        ref={ref}
        type="button"
        variant={variant}
        size="compact"
        data-slot="banner-action"
        className={classes}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

BannerAction.displayName = "BannerAction";

export { Banner, BannerTitle, BannerDescription, BannerActions, BannerAction, bannerMotion };
export type {
  BannerProps,
  BannerMotionConfig,
  BannerStatus,
  BannerContrast,
  BannerVariant,
  BannerActionProps,
  BannerActionVariant,
};
