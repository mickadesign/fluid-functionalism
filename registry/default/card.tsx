"use client";

import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type HTMLAttributes,
  type ReactElement,
} from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import { useShape } from "@/lib/shape-context";
import { useIcon, type IconComponent } from "@/lib/icon-context";
import { useProximityHover } from "@/hooks/use-proximity-hover";

// ---------------------------------------------------------------------------
// Card is a single, prop-driven surface. Its sibling CardGroup owns the shared
// concerns — layout (stacked list, inline rows, or grid), the dividers between
// borderless cards, and the proximity-hover highlight that previews where a
// click will land. A Card renders fine on its own; inside a CardGroup it
// registers itself so the group's magnetic highlight can find it.
//
// Surface colour is NOT a Card concern: cards are transparent and inherit
// whatever substrate their parent provides (see the Surfaces system), so a
// group dropped into a muted panel reads against that panel automatically.
// ---------------------------------------------------------------------------

type CardOrientation = "card" | "inline";
type CardBorder = "none" | "outlined";

// ── Context ──────────────────────────────────────────────

interface CardGroupContextValue {
  registerItem: (index: number, element: HTMLElement | null) => void;
  activeIndex: number | null;
  orientation: CardOrientation;
  columns: number;
  count: number;
  /** Individual cards carry their own border/tile shape (separated grids). */
  separated: boolean;
  /** Inner hairline dividers are drawn between adjacent cards. */
  divided: boolean;
  outlined: boolean;
}

const CardGroupContext = createContext<CardGroupContextValue | null>(null);

// ── CardGroup ────────────────────────────────────────────

interface CardGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "onDrag"> {
  /** How each card lays its own content out.
   *  "card" — stacked vertically (media on top). "inline" — a horizontal row
   *  (leading media, trailing actions), like a Table row. @default "card" */
  orientation?: CardOrientation;
  /** Number of grid columns. >1 enables 2-D proximity across rows and columns.
   *  @default 1 */
  columns?: number;
  /** "none" — borderless (default), separated only by subtle dividers.
   *  "outlined" — draws a border: one shared frame when grouped, or one per
   *  card when `separated`. @default "none" */
  border?: CardBorder;
  /** Split the group into individually-shaped cards with a gap between them
   *  (a grid of tiles) instead of one continuous divided block. @default false */
  separated?: boolean;
  /** Enable the magnetic proximity-hover highlight. @default true */
  proximityHover?: boolean;
}

const CardGroup = forwardRef<HTMLDivElement, CardGroupProps>(
  (
    {
      orientation = "card",
      columns = 1,
      border = "none",
      separated = false,
      proximityHover = true,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const shape = useShape();

    // >1 column wraps into a grid, where nearest-item must be resolved in two
    // dimensions; a single column is a plain vertical list.
    const axis = columns > 1 ? "xy" : "y";
    const {
      activeIndex,
      itemRects,
      sessionRef,
      handlers,
      registerItem,
      measureItems,
    } = useProximityHover(containerRef, { axis });

    // Assign each valid child a stable proximity index so callers never thread
    // one through by hand (Table asks for it; here the group owns it).
    const childArray = Children.toArray(children).filter(isValidElement);
    const count = childArray.length;
    const indexed = childArray.map((child, i) =>
      cloneElement(child as ReactElement<{ index?: number }>, { index: i })
    );

    useEffect(() => {
      measureItems();
    }, [measureItems, count, columns, orientation, separated, border]);

    const outlined = border === "outlined";
    const divided = !separated;

    const contextValue = useMemo<CardGroupContextValue>(
      () => ({
        registerItem,
        activeIndex,
        orientation,
        columns,
        count,
        separated,
        divided,
        outlined,
      }),
      [
        registerItem,
        activeIndex,
        orientation,
        columns,
        count,
        separated,
        divided,
        outlined,
      ]
    );

    const activeRect =
      proximityHover && activeIndex !== null ? itemRects[activeIndex] : null;

    return (
      <CardGroupContext.Provider value={contextValue}>
        <div
          ref={(node) => {
            (containerRef as React.MutableRefObject<HTMLDivElement | null>).current =
              node;
            if (typeof ref === "function") ref(node);
            else if (ref)
              (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }}
          {...props}
          data-orientation={orientation}
          className={cn(
            "relative grid",
            // A shared frame clips the highlight + dividers to its rounded
            // corners; separated tiles clip themselves.
            outlined && !separated && `border border-border/60 overflow-hidden ${shape.container}`,
            separated ? "gap-2" : "gap-0",
            className
          )}
          style={{
            gridTemplateColumns: `repeat(${Math.max(1, columns)}, minmax(0, 1fr))`,
          }}
          onMouseEnter={proximityHover ? handlers.onMouseEnter : undefined}
          onMouseMove={proximityHover ? handlers.onMouseMove : undefined}
          onMouseLeave={proximityHover ? handlers.onMouseLeave : undefined}
        >
          {/* Proximity highlight — a single magnetic layer that springs to the
              card nearest the cursor, previewing where a click will land. */}
          <AnimatePresence>
            {activeRect && (
              <motion.div
                key={sessionRef.current}
                aria-hidden
                className={cn("absolute bg-hover pointer-events-none z-0", shape.bg)}
                initial={{
                  opacity: 0,
                  top: activeRect.top,
                  left: activeRect.left,
                  width: activeRect.width,
                  height: activeRect.height,
                }}
                animate={{
                  opacity: 1,
                  top: activeRect.top,
                  left: activeRect.left,
                  width: activeRect.width,
                  height: activeRect.height,
                }}
                exit={{ opacity: 0, transition: spring.fast.exit }}
                transition={{ ...spring.fast, opacity: { duration: 0.08 } }}
              />
            )}
          </AnimatePresence>

          {indexed}
        </div>
      </CardGroupContext.Provider>
    );
  }
);

CardGroup.displayName = "CardGroup";

// ── Actions ──────────────────────────────────────────────

export interface CardAction {
  label: string;
  onClick?: () => void;
  /** Renders the action as a link. */
  href?: string;
  variant?: "primary" | "secondary" | "ghost" | "link";
  icon?: IconComponent;
  iconPosition?: "start" | "end";
  /** Opens the href in a new tab and appends an outward arrow glyph. */
  external?: boolean;
  disabled?: boolean;
}

const ACTION_VARIANTS: Record<NonNullable<CardAction["variant"]>, string> = {
  primary: "bg-foreground text-background hover:bg-foreground/90 active:bg-foreground/80",
  secondary: "bg-accent text-foreground hover:bg-accent/80 active:bg-accent",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-hover active:bg-active",
  link: "text-foreground underline-offset-4 hover:underline !px-0 !h-auto",
};

function CardActionButton({ action }: { action: CardAction }) {
  const shape = useShape();
  const variant = action.variant ?? "ghost";
  const Icon = action.icon;
  const ArrowRight = useIcon("arrow-right");
  const position = action.iconPosition ?? (action.external ? "end" : "start");

  const glyph = Icon ? (
    <Icon
      size={15}
      strokeWidth={1.5}
      className="shrink-0 transition-[stroke-width] duration-80 group-hover/action:stroke-[2]"
    />
  ) : null;
  const externalGlyph = action.external ? (
    <ArrowRight
      size={14}
      strokeWidth={1.5}
      className="shrink-0 -rotate-45 transition-[stroke-width] duration-80 group-hover/action:stroke-[2]"
    />
  ) : null;

  const inner = (
    <>
      {position === "start" && glyph}
      <span className="[text-box:trim-both_cap_alphabetic]">{action.label}</span>
      {position === "end" && glyph}
      {externalGlyph}
    </>
  );

  const classes = cn(
    "group/action relative z-30 inline-flex items-center justify-center gap-1.5 h-8 px-3 text-[13px] cursor-pointer outline-none",
    "transition-colors duration-80",
    "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
    "disabled:opacity-50 disabled:pointer-events-none",
    shape.button,
    ACTION_VARIANTS[variant]
  );

  if (action.href) {
    return (
      <Link
        href={action.href}
        onClick={action.onClick}
        target={action.external ? "_blank" : undefined}
        rel={action.external ? "noopener noreferrer" : undefined}
        className={classes}
        style={{ fontVariationSettings: fontWeights.medium }}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled}
      className={classes}
      style={{ fontVariationSettings: fontWeights.medium }}
    >
      {inner}
    </button>
  );
}

// ── Card sub-parts ───────────────────────────────────────

export interface CardFeature {
  icon?: IconComponent;
  title: string;
  description?: string;
}

/** Brand logo(s). A tuple renders a connected pair (e.g. a trigger — target). */
type CardLogo = string | [string, string];

function CardMedia({
  logo,
  logoAlt,
  icon: Icon,
  size = 22,
}: {
  logo?: CardLogo;
  logoAlt?: string;
  icon?: IconComponent;
  size?: number;
}) {
  if (logo) {
    const logos = Array.isArray(logo) ? logo : [logo];
    return (
      <span className="inline-flex items-center gap-1.5 shrink-0">
        {logos.map((src, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            {i > 0 && <span aria-hidden className="w-2 h-px bg-border" />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={logoAlt ?? ""}
              width={size}
              height={size}
              className="rounded-md object-contain"
              style={{ width: size, height: size }}
            />
          </span>
        ))}
      </span>
    );
  }
  if (Icon) {
    return (
      <Icon size={size} strokeWidth={1.5} className="shrink-0 text-foreground" />
    );
  }
  return null;
}

function CardTitle({
  title,
  emphasized,
}: {
  title: string;
  emphasized: boolean;
}) {
  // Ghost-span pattern: an invisible semibold copy reserves the width so the
  // resting→active weight animation never reflows the row.
  return (
    <span className="inline-grid text-[14px] leading-snug">
      <span
        className="col-start-1 row-start-1 invisible [text-box:trim-both_cap_alphabetic]"
        style={{ fontVariationSettings: fontWeights.semibold }}
        aria-hidden="true"
      >
        {title}
      </span>
      <span
        className="col-start-1 row-start-1 text-foreground transition-[font-variation-settings] duration-80 [text-box:trim-both_cap_alphabetic]"
        style={{
          fontVariationSettings: emphasized
            ? fontWeights.semibold
            : fontWeights.medium,
        }}
      >
        {title}
      </span>
    </span>
  );
}

// ── Card ─────────────────────────────────────────────────

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "onClick"> {
  title: string;
  description?: string;
  /** Small label above the title (e.g. "New Model"). */
  eyebrow?: string;
  /** Leading icon slot (ignored when `logo` is set). */
  icon?: IconComponent;
  /** Brand logo src, or a tuple for a connected logo pair. */
  logo?: CardLogo;
  logoAlt?: string;
  /** Top banner image (card orientation only). */
  image?: string;
  imageAlt?: string;
  /** Inner icon + title + description rows (e.g. a model's feature list). */
  features?: CardFeature[];
  /** Footer actions (card) / trailing actions (inline). */
  actions?: CardAction[];
  /** Makes the whole card an interactive target; proximity hover previews it.
   *  Renders a stretched link when `href` is set, else a stretched button. */
  onClick?: () => void;
  href?: string;
  external?: boolean;
  /** Persistent selected state, on top of the transient proximity hover. */
  selected?: boolean;
  disabled?: boolean;
  /** Shows a dismiss (✕) button in the corner. */
  dismissible?: boolean;
  onDismiss?: () => void;
  /** Injected by CardGroup — do not set by hand. */
  index?: number;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      title,
      description,
      eyebrow,
      icon,
      logo,
      logoAlt,
      image,
      imageAlt,
      features,
      actions,
      onClick,
      href,
      external,
      selected = false,
      disabled = false,
      dismissible = false,
      onDismiss,
      index,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const shape = useShape();
    const group = useContext(CardGroupContext);
    const XIcon = useIcon("x");
    const CheckIcon = useIcon("check");

    const orientation = group?.orientation ?? "card";
    const columns = group?.columns ?? 1;
    const count = group?.count ?? 1;
    const separated = group?.separated ?? true;
    const divided = group?.divided ?? false;
    const outlined = group?.outlined ?? false;
    const activeIndex = group?.activeIndex ?? null;
    const isActive = index !== undefined && activeIndex === index;

    useEffect(() => {
      if (index === undefined || !group) return;
      group.registerItem(index, internalRef.current);
      return () => group.registerItem(index, null);
    }, [index, group]);

    // Divider geometry: draw a hairline toward the neighbour below / to the
    // right, but drop it next to the active card so the highlight reads clean
    // (the same trick Table uses on row borders).
    const col = index !== undefined ? index % columns : 0;
    const hasBelow = index !== undefined && index + columns < count;
    const hasRight =
      index !== undefined && col < columns - 1 && index + 1 < count;
    const showBottom =
      divided &&
      hasBelow &&
      !(activeIndex === index || activeIndex === (index ?? -1) + columns);
    const showRight =
      divided &&
      hasRight &&
      !(activeIndex === index || activeIndex === (index ?? -1) + 1);

    const isInline = orientation === "inline";
    const clickable = !!href || !!onClick;
    const emphasized = isActive || selected;

    // A discrete tile (separated grid) carries its own rounding + clip; a
    // card in a continuous block leans on the group frame for both.
    const tileShape = separated
      ? cn(shape.container, "overflow-hidden", outlined && "border border-border/60")
      : "";

    const media = <CardMedia logo={logo} logoAlt={logoAlt} icon={icon} />;
    const hasMedia = !!logo || !!icon;

    const eyebrowNode = eyebrow ? (
      <span
        className="text-[11px] uppercase tracking-wide text-muted-foreground"
        style={{ fontVariationSettings: fontWeights.semibold }}
      >
        {eyebrow}
      </span>
    ) : null;

    const descriptionNode = description ? (
      <p className="text-[12px] leading-relaxed text-muted-foreground">
        {description}
      </p>
    ) : null;

    const featuresNode =
      features && features.length > 0 ? (
        <div className="flex flex-col gap-3">
          {features.map((f, i) => {
            const FIcon = f.icon;
            return (
              <div key={i} className="flex items-start gap-2.5">
                {FIcon && (
                  <FIcon
                    size={16}
                    strokeWidth={1.5}
                    className="mt-0.5 shrink-0 text-muted-foreground"
                  />
                )}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span
                    className="text-[13px] text-foreground [text-box:trim-both_cap_alphabetic]"
                    style={{ fontVariationSettings: fontWeights.medium }}
                  >
                    {f.title}
                  </span>
                  {f.description && (
                    <span className="text-[12px] leading-relaxed text-muted-foreground">
                      {f.description}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null;

    const actionsNode =
      actions && actions.length > 0 ? (
        <div
          className={cn(
            "relative z-30 flex items-center gap-1",
            isInline ? "shrink-0 ml-auto" : "flex-wrap"
          )}
        >
          {actions.map((a, i) => (
            <CardActionButton key={i} action={a} />
          ))}
        </div>
      ) : null;

    // Stretched overlay makes the whole card the click target while keeping
    // action buttons (higher z) independently clickable — the accessible
    // alternative to nesting interactive elements inside a button/anchor.
    const overlay = clickable ? (
      href ? (
        <Link
          href={href}
          onClick={onClick}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          aria-label={title}
          className="absolute inset-0 z-20 outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] rounded-[inherit]"
        />
      ) : (
        <button
          type="button"
          onClick={onClick}
          aria-label={title}
          aria-pressed={selected || undefined}
          className="absolute inset-0 z-20 outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] rounded-[inherit]"
        />
      )
    ) : null;

    return (
      <div
        ref={(node) => {
          (internalRef as React.MutableRefObject<HTMLDivElement | null>).current =
            node;
          if (typeof ref === "function") ref(node);
          else if (ref)
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        data-proximity-index={index}
        data-selected={selected || undefined}
        aria-disabled={disabled || undefined}
        className={cn(
          "group/card relative z-10 flex min-w-0",
          isInline ? "flex-row items-center gap-3" : "flex-col",
          // Standalone (no group) cards can't lean on the group highlight, so
          // they carry their own hover tint when interactive.
          !group && clickable && !disabled && "transition-colors duration-80 hover:bg-hover",
          tileShape,
          disabled && "opacity-50 pointer-events-none",
          className
        )}
        {...props}
      >
        {/* Persistent selected fill + dividers sit behind the static content
            (-z-10); the stretched overlay (z-20) sits above content so the
            whole card is clickable, and actions/dismiss (z-30) rise above the
            overlay to stay independently interactive. */}
        {selected && (
          <span
            aria-hidden
            className={cn("absolute inset-0 -z-10 bg-active pointer-events-none", shape.bg)}
          />
        )}

        {/* Dividers between borderless neighbours. */}
        {showBottom && (
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-px bg-border/60 pointer-events-none -z-10"
          />
        )}
        {showRight && (
          <span
            aria-hidden
            className="absolute inset-y-0 right-0 w-px bg-border/60 pointer-events-none -z-10"
          />
        )}

        {overlay}

        {/* Top banner (card orientation only). */}
        {image && !isInline && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={imageAlt ?? ""}
            className="w-full aspect-[16/9] object-cover"
          />
        )}

        {isInline ? (
          <>
            {hasMedia && <span className="shrink-0 pl-4">{media}</span>}
            <div
              className={cn(
                "flex flex-col gap-0.5 min-w-0 flex-1 py-3.5",
                !hasMedia && "pl-4",
                !actionsNode && "pr-4"
              )}
            >
              {eyebrowNode}
              <div className="flex items-center gap-2">
                <CardTitle title={title} emphasized={emphasized} />
                {selected && (
                  <CheckIcon size={15} strokeWidth={2} className="shrink-0 text-foreground" />
                )}
              </div>
              {descriptionNode}
              {featuresNode}
              {children}
            </div>
            {actionsNode && <div className="pr-4">{actionsNode}</div>}
          </>
        ) : (
          <div className="flex flex-col gap-3 p-4">
            {(hasMedia || eyebrowNode) && (
              <div className="flex items-center justify-between gap-2">
                {hasMedia ? media : <span />}
                {eyebrowNode}
              </div>
            )}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <CardTitle title={title} emphasized={emphasized} />
                {selected && (
                  <CheckIcon size={15} strokeWidth={2} className="shrink-0 text-foreground" />
                )}
              </div>
              {descriptionNode}
            </div>
            {featuresNode}
            {children}
            {actionsNode && <div className="mt-1">{actionsNode}</div>}
          </div>
        )}

        {/* Dismiss control sits above the stretched overlay. */}
        {dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className={cn(
              "absolute right-2 top-2 z-30 flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-hover cursor-pointer outline-none transition-colors duration-80 focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
              shape.button
            )}
          >
            <XIcon size={15} strokeWidth={1.5} />
          </button>
        )}
      </div>
    );
  }
);

Card.displayName = "Card";

export { Card, CardGroup };
export type { CardProps, CardGroupProps, CardLogo };
