"use client";

import {
  Children,
  createContext,
  forwardRef,
  useContext,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type OlHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { cn } from "@/lib/utils";
import { fontWeights } from "@/lib/font-weight";
import { useShape } from "@/lib/shape-context";
import { SizeProvider, useSize, type SizeVariant } from "@/lib/size-context";
import { useIcons } from "@/lib/icon-context";
import { useFluidHover } from "@/hooks/use-fluid-hover";
import { FluidHoverHighlight } from "@/components/ui/fluid-hover-highlight";
import { Tooltip } from "@/components/ui/tooltip";

// ---------------------------------------------------------------------------
// A trail of links to the current page. Every crumb in the trail (links,
// buttons and the current page) shares one fluid hover scope, so the
// highlight glides from crumb to crumb under the cursor. The separator is
// each crumb's trailing icon, so crumbs sit flush with no dead gap between
// them. A crumb can be a link, a button that opens a Dropdown (a step with
// siblings, or the collapsed middle of a long trail), and can lead with an
// icon.
//
//   <Breadcrumb>
//     <BreadcrumbList>
//       <BreadcrumbItem>
//         <BreadcrumbLink href="/">Home</BreadcrumbLink>
//       </BreadcrumbItem>
//       <BreadcrumbItem>
//         <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
//       </BreadcrumbItem>
//     </BreadcrumbList>
//   </Breadcrumb>
//
// The trail registers its targets by DOM order, so parts compose freely: no
// index props, and a Dropdown trigger wrapped around a BreadcrumbButton joins
// the scope like any link.
// ---------------------------------------------------------------------------

/** Marks the elements that join the trail's hover scope. */
const TARGET_ATTR = "data-breadcrumb-target";

/** Puts a crumb's text in its own span so it can truncate: a text node in a
 *  flex row can't take an ellipsis. Icons and other elements pass through,
 *  so the icon gap still applies. */
function wrapLabels(children: ReactNode): ReactNode {
  return Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      <span data-slot="breadcrumb-label" className="min-w-0 truncate">
        {child}
      </span>
    ) : (
      child
    )
  );
}

// ─── Slot (render / asChild) ───────────────────────────────────────────────
//
// A local slot instead of Radix's Slot or Base UI's useRender, so Breadcrumb
// installs the same into either flavor. Supports the library's
// `render={<Link href="/" />}` and shadcn's `asChild`.

type SlotProps = {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
} & Record<string, unknown>;

function assignRef<T>(target: Ref<T> | undefined, node: T | null) {
  if (typeof target === "function") target(node);
  else if (target) (target as React.RefObject<T | null>).current = node;
}

/** Merges two prop bags onto one element: `outer` wins on plain values,
 *  classes and styles combine, and duplicated handlers both run, `inner`'s
 *  first (it owns the element). */
function mergeSlotProps(inner: SlotProps, outer: SlotProps): SlotProps {
  const merged: SlotProps = {
    ...inner,
    ...outer,
    className: cn(inner.className, outer.className),
    style: { ...inner.style, ...(outer.style as CSSProperties | undefined) },
  };
  for (const key of Object.keys(inner)) {
    if (!/^on[A-Z]/.test(key)) continue;
    const a = inner[key];
    const b = outer[key];
    if (typeof a === "function" && typeof b === "function") {
      merged[key] = (...args: unknown[]) => {
        (b as (...x: unknown[]) => void)(...args);
        (a as (...x: unknown[]) => void)(...args);
      };
    }
  }
  return merged;
}

/** A wrapper that clones the Slot (a Tooltip trigger) passes its ref and
 *  props to it; they land on the rendered element too. forwardRef, so the
 *  ref arrives on React 18 as well. */
interface SlotOwnProps {
  trailing?: ReactNode;
  render?: ReactElement;
  asChild?: boolean;
  defaultTag: ElementType;
  elementRef?: Ref<HTMLElement>;
  props: SlotProps;
  children?: ReactNode;
  /** Whatever a cloning wrapper adds (handlers, aria and data attributes). */
  [key: string]: unknown;
}

// Loose outside, typed inside: forwardRef's prop mapping flattens an index
// signature to unknown. Slot is internal, so the one cast is safe.
const Slot = forwardRef<HTMLElement, Record<string, unknown>>(function Slot(
  rawProps,
  outerRef
): ReactElement {
  const {
    render,
    asChild,
    defaultTag: DefaultTag,
    elementRef,
    props: ownProps,
    trailing,
    children,
    ...extra
  } = rawProps as SlotOwnProps;
  const props = mergeSlotProps(ownProps, extra as SlotProps);
  let template: ReactElement<SlotProps> | null = null;
  let content = children;
  if (render && isValidElement(render)) {
    template = render as ReactElement<SlotProps>;
  } else if (asChild) {
    const only = Children.toArray(children)[0];
    if (isValidElement(only)) {
      template = only as ReactElement<SlotProps>;
      content = (only.props as SlotProps).children;
    }
  }
  const ownRef = (node: HTMLElement | null) => {
    assignRef(elementRef, node);
    assignRef(outerRef, node);
  };
  if (!template) {
    return (
      <DefaultTag {...props} ref={ownRef}>
        {wrapLabels(children)}
        {trailing}
      </DefaultTag>
    );
  }
  const Tag = template.type as ElementType;
  const theirs = template.props;
  const merged = mergeSlotProps(props, theirs);
  const templateRef = (theirs as { ref?: Ref<HTMLElement> }).ref;
  const composedRef = (node: HTMLElement | null) => {
    ownRef(node);
    assignRef(templateRef, node);
  };
  return (
    <Tag {...merged} ref={composedRef}>
      {wrapLabels(content ?? theirs.children)}
      {trailing}
    </Tag>
  );
});

// ─── Breadcrumb ──────────────────────────────────────────────────────────────

interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  /** Pins the trail to one step of the size ladder (default 28px crumbs,
   *  compact 24px). Omitted, it follows the surrounding SizeProvider. */
  size?: SizeVariant;
  /** The trailing glyph of every crumb but the last. Defaults to the icon
   *  set's chevron-right, which turns to point down while a step's menu is
   *  open. `null` drops it. */
  separator?: ReactNode;
}

/** The separator a Breadcrumb hands its crumbs; undefined means the chevron. */
const SeparatorContext = createContext<ReactNode>(undefined);

const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  (
    {
      className,
      size,
      separator,
      children,
      onMouseMove,
      onMouseEnter,
      onMouseLeave,
      onClick,
      ...props
    },
    ref
  ) => {
    const navRef = useRef<HTMLElement | null>(null);
    const shape = useShape();
    // Only the crumb under the pointer lights. Crumbs sit flush, so the
    // highlight glides along the trail without going dark between them.
    const hover = useFluidHover(navRef, { axis: "xy", gapClick: false });
    const { registerItem } = hover;
    const registered = useRef<HTMLElement[]>([]);

    // Targets register by DOM order after every render of the trail, and
    // only the slots whose element changed re-register, so a re-render that
    // moves nothing costs no measurement pass. A Dropdown's popup is
    // portalled out of the nav, so its rows never join this scope.
    useLayoutEffect(() => {
      const nav = navRef.current;
      if (!nav) return;
      const next = Array.from(nav.querySelectorAll<HTMLElement>(`[${TARGET_ATTR}]`));
      const previous = registered.current;
      for (let i = next.length; i < previous.length; i++) registerItem(i, null);
      next.forEach((element, i) => {
        if (previous[i] !== element) registerItem(i, element);
      });
      registered.current = next;
    });

    const setRef = useCallback(
      (node: HTMLElement | null) => {
        navRef.current = node;
        assignRef(ref, node);
      },
      [ref]
    );

    const nav = (
      <nav
        ref={setRef}
        aria-label="Breadcrumb"
        data-slot="breadcrumb"
        className={cn("relative", className)}
        {...props}
        // The app's own mouse handlers run alongside the fluid hover's.
        onMouseMove={(e) => {
          onMouseMove?.(e);
          hover.handlers.onMouseMove(e);
        }}
        onMouseEnter={(e) => {
          onMouseEnter?.(e);
          hover.handlers.onMouseEnter();
        }}
        onMouseLeave={(e) => {
          onMouseLeave?.(e);
          hover.handlers.onMouseLeave();
        }}
        onClick={(e) => {
          onClick?.(e);
          hover.handlers.onClick(e);
        }}
      >
        <FluidHoverHighlight hover={hover} className={shape.bg} />
        <SeparatorContext.Provider value={separator}>{children}</SeparatorContext.Provider>
      </nav>
    );
    return size ? <SizeProvider size={size}>{nav}</SizeProvider> : nav;
  }
);
Breadcrumb.displayName = "Breadcrumb";

// ─── List and item ───────────────────────────────────────────────────────────

const BreadcrumbList = forwardRef<HTMLOListElement, OlHTMLAttributes<HTMLOListElement>>(
  ({ className, ...props }, ref) => {
    const sizeClasses = useSize();
    return (
      <ol
        ref={ref}
        data-slot="breadcrumb-list"
        className={cn(
          "flex min-w-0 flex-nowrap items-center text-muted-foreground",
          sizeClasses.text,
          className
        )}
        {...props}
      />
    );
  }
);
BreadcrumbList.displayName = "BreadcrumbList";

const BreadcrumbItem = forwardRef<HTMLLIElement, LiHTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      data-slot="breadcrumb-item"
      className={cn(
        // Items keep their width; only the current page's item gives way, so
        // a long page name truncates in place on one row.
        "inline-flex min-w-0 shrink-0 items-center has-[[data-slot=breadcrumb-page]]:shrink",
        className
      )}
      {...props}
    />
  )
);
BreadcrumbItem.displayName = "BreadcrumbItem";

// ─── Crumbs (link, button, page) ─────────────────────────────────────────────

/** A crumb's own text, for the tooltip that shows a cut name in full. */
function textOf(children: ReactNode): string | undefined {
  const parts: string[] = [];
  Children.forEach(children, (child) => {
    if (typeof child === "string" || typeof child === "number") parts.push(String(child));
  });
  const text = parts.join("").trim();
  return text || undefined;
}

/** Whether a crumb's label is cut short, read as the pointer or keyboard
 *  focus arrives: cheap, and current at the moment the tooltip could show. */
function useCutLabel() {
  const [cut, setCut] = useState(false);
  const check = useCallback((crumb: HTMLElement) => {
    const label = crumb.querySelector<HTMLElement>("[data-slot=breadcrumb-label]");
    setCut(!!label && label.scrollWidth > label.clientWidth + 0.5);
  }, []);
  return { cut, check };
}

/** The full name of a crumb whose label is cut, in a tooltip under it. It
 *  stays closed while the name fits and while the crumb's own menu is open,
 *  so it never stacks on the menu. */
function FullName({
  text,
  cut,
  menuOpen,
  children,
}: {
  text: string | undefined;
  cut: boolean;
  menuOpen?: boolean;
  children: ReactElement;
}) {
  if (!text) return children;
  return (
    <Tooltip content={text} side="bottom" forceOpen={cut && !menuOpen ? undefined : false}>
      {children}
    </Tooltip>
  );
}

/** A trigger's open state, from the props a Dropdown passes its trigger
 *  (Radix data-state, Base UI data-popup-open, both aria-expanded). */
function isMenuOpen(props: Record<string, unknown>) {
  return (
    props["data-state"] === "open" ||
    props["data-popup-open"] !== undefined ||
    props["aria-expanded"] === true ||
    props["aria-expanded"] === "true"
  );
}

/** The box every crumb shares: one segment-item high (28px, 24px compact),
 *  the ladder's row padding, an icon gap, and icons at the ladder's glyph
 *  size. A trailing separator's glyph carries its own side bearing, so the
 *  right padding steps down by it. Links and buttons add the hover and focus
 *  states on top. */
function useCrumbClasses() {
  const shape = useShape();
  const sizeClasses = useSize();
  const compact = sizeClasses.variant === "compact";
  return cn(
    "relative inline-flex min-w-0 shrink-0 items-center whitespace-nowrap",
    sizeClasses.segmentItem,
    sizeClasses.itemPx,
    compact ? "gap-1" : "gap-1.5",
    compact
      ? "has-[>[data-slot=breadcrumb-separator]]:pr-1"
      : "has-[>[data-slot=breadcrumb-separator]]:pr-1.5",
    compact
      ? "[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5"
      : "[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    shape.item
  );
}

/** A link or button in the trail: muted at rest, foreground while the fluid
 *  hover sits on it or its menu is open, and the library focus ring. Each
 *  stops at 12rem (10rem compact), so a long step truncates at that cap
 *  instead of crowding the trail; short steps are never cut. The current
 *  page takes whatever room is left. */
function useTargetClasses() {
  const compact = useSize().variant === "compact";
  return cn(
    useCrumbClasses(),
    compact ? "max-w-40" : "max-w-48",
    "cursor-pointer text-muted-foreground outline-none transition-colors duration-80",
    "data-[fluid-hover-active]:text-foreground",
    // Only a menu trigger's open state: Base UI's Tooltip marks its trigger
    // data-popup-open too, and a truncated link's tooltip is not a menu.
    "[&[aria-haspopup][data-state=open]]:text-foreground [&[aria-haspopup][data-popup-open]]:text-foreground",
    "focus-visible:text-foreground focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
    "disabled:pointer-events-none disabled:opacity-50"
  );
}

interface BreadcrumbLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Element to render instead of `<a>`, such as a framework link:
   *  `render={<Link href="/docs" />}`. */
  render?: ReactElement;
  /** shadcn-style composition: the single child element becomes the link. */
  asChild?: boolean;
}

const BreadcrumbLink = forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ className, style, render, asChild, children, onPointerEnter, onFocus, ...props }, ref) => {
    const classes = useTargetClasses();
    const { cut, check } = useCutLabel();
    const text = textOf(
      asChild && isValidElement(children)
        ? (children.props as { children?: ReactNode }).children
        : children
    );
    return (
      <FullName text={text} cut={cut}>
        <Slot
          render={render}
          asChild={asChild}
          defaultTag="a"
          elementRef={ref as Ref<HTMLElement>}
          props={{
            ...props,
            [TARGET_ATTR]: "",
            "data-slot": "breadcrumb-link",
            className: cn(classes, className),
            style: { fontVariationSettings: fontWeights.normal, ...style },
            onPointerEnter: (e: React.PointerEvent<HTMLAnchorElement>) => {
              onPointerEnter?.(e);
              check(e.currentTarget);
            },
            onFocus: (e: React.FocusEvent<HTMLAnchorElement>) => {
              onFocus?.(e);
              check(e.currentTarget);
            },
          }}
          trailing={<CrumbSeparator />}
        >
          {children}
        </Slot>
      </FullName>
    );
  }
);
BreadcrumbLink.displayName = "BreadcrumbLink";

/** A crumb that acts instead of navigating: the trigger of a Dropdown on a
 *  step, or of the collapsed middle of the trail.
 *
 *    <DropdownTrigger render={<BreadcrumbButton>Components</BreadcrumbButton>} /> */
const BreadcrumbButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, style, type = "button", children, onPointerEnter, onFocus, ...props }, ref) => {
    const classes = useTargetClasses();
    const { cut, check } = useCutLabel();
    return (
      <FullName text={textOf(children)} cut={cut} menuOpen={isMenuOpen(props)}>
        <button
          ref={ref}
          type={type}
          {...{ [TARGET_ATTR]: "" }}
          data-slot="breadcrumb-button"
          className={cn(classes, className)}
          style={{ fontVariationSettings: fontWeights.normal, ...style }}
          {...props}
          onPointerEnter={(e) => {
            onPointerEnter?.(e);
            check(e.currentTarget);
          }}
          onFocus={(e) => {
            onFocus?.(e);
            check(e.currentTarget);
          }}
        >
          {wrapLabels(children)}
          <CrumbSeparator />
        </button>
      </FullName>
    );
  }
);
BreadcrumbButton.displayName = "BreadcrumbButton";

/** The current page: foreground text, not a link, announced as the current
 *  page. It joins the hover like every crumb, and keeps the crumb padding so
 *  its text lines up with the links. It is the one crumb that gives way when
 *  the trail runs out of room: its name truncates in place. */
const BreadcrumbPage = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  ({ className, style, children, onPointerEnter, ...props }, ref) => {
    const classes = useCrumbClasses();
    const { cut, check } = useCutLabel();
    return (
      <FullName text={textOf(children)} cut={cut}>
        <span
          ref={ref}
          role="link"
          aria-disabled="true"
          aria-current="page"
          {...{ [TARGET_ATTR]: "" }}
          data-slot="breadcrumb-page"
          className={cn(classes, "shrink cursor-default text-foreground", className)}
          style={{ fontVariationSettings: fontWeights.normal, ...style }}
          {...props}
          onPointerEnter={(e) => {
            onPointerEnter?.(e);
            check(e.currentTarget);
          }}
        >
          {wrapLabels(children)}
        </span>
      </FullName>
    );
  }
);
BreadcrumbPage.displayName = "BreadcrumbPage";

// ─── Separator and ellipsis ──────────────────────────────────────────────────

/** A crumb's trailing separator, inside the crumb so the hover covers it and
 *  crumbs sit flush. Hidden on the last item of the list. On a crumb that
 *  opens a menu, the default chevron turns to point down on hover, on
 *  keyboard focus, and while the menu is open (Radix data-state,
 *  Base UI data-popup-open). */
function CrumbSeparator() {
  const custom = useContext(SeparatorContext);
  const icons = useIcons();
  const sizeClasses = useSize();
  if (custom === null) return null;
  const ChevronRight = icons["chevron-right"];
  const isDefault = custom === undefined;
  return (
    <span
      aria-hidden="true"
      data-slot="breadcrumb-separator"
      className={cn(
        "inline-flex select-none items-center justify-center text-muted-foreground",
        "[li:last-child_&]:hidden",
        sizeClasses.variant === "compact" ? "[&>svg]:!size-3" : "[&>svg]:!size-3.5",
        isDefault &&
          "transition-transform duration-150 ease-out motion-reduce:transition-none [[aria-haspopup][data-state=open]>&]:rotate-90 [[aria-haspopup][data-popup-open]>&]:rotate-90",
        // A step that opens a menu shows it already on hover and keyboard
        // focus: the chevron turns down to say "this opens", while a plain
        // link's chevron stays put.
        isDefault &&
          "[[aria-haspopup][data-fluid-hover-active]>&]:rotate-90 [[aria-haspopup]:focus-visible>&]:rotate-90"
      )}
    >
      {isDefault ? <ChevronRight size={sizeClasses.icon - 2} /> : custom}
    </span>
  );
}

/** The collapsed middle of a long trail. Put it in a BreadcrumbButton (with
 *  an aria-label) to open the hidden steps in a Dropdown or reveal them in
 *  place. */
const BreadcrumbEllipsis = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => {
    const icons = useIcons();
    const sizeClasses = useSize();
    const More = icons["more-horizontal"];
    return (
      <span
        ref={ref}
        role="presentation"
        data-slot="breadcrumb-ellipsis"
        className={cn("inline-flex items-center justify-center", className)}
        {...props}
      >
        <More size={sizeClasses.icon} />
        <span className="sr-only">More</span>
      </span>
    );
  }
);
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis";

// ─── Collapse on overflow ────────────────────────────────────────────────────

/** A crumb's width with nothing cut: the current page shrinks to fit, so its
 *  label's hidden overflow is added back. Capped links stay capped. */
function naturalWidth(item: HTMLElement) {
  let width = item.getBoundingClientRect().width;
  if (item.querySelector("[data-slot=breadcrumb-page]")) {
    item.querySelectorAll<HTMLElement>("[data-slot=breadcrumb-label]").forEach((label) => {
      width += label.scrollWidth - label.clientWidth;
    });
  }
  return width;
}

interface UseBreadcrumbCollapseOptions {
  /** Steps in the full trail, the current page included. */
  count: number;
  /** Off, nothing hides (a trail the reader expanded). */
  enabled?: boolean;
}

/**
 * Hides middle steps while the trail is wider than its Breadcrumb. Steps go
 * from the second one on, so the first step, the last link and the current
 * page always stay; past that the page name truncates. Render the steps from
 * `hidden`: the first, an ellipsis standing for steps 1 to `hidden`, then the
 * rest. The Breadcrumb needs a bounded width: it measures itself, and as a
 * block it takes its container's. In a flex row (a header beside buttons)
 * give it `flex-1 min-w-0`, or it sizes to its content and never overflows.
 *
 *   const { listRef, hidden } = useBreadcrumbCollapse({ count: steps.length });
 *   <BreadcrumbList ref={listRef}>…</BreadcrumbList>
 *
 * Widths are read in a layout effect, before paint, and remembered per step,
 * so a hidden step comes back as soon as its width fits again.
 */
function useBreadcrumbCollapse({ count, enabled = true }: UseBreadcrumbCollapseOptions) {
  // A callback ref with the node in state, so a list that mounts after the
  // first render (data loading, a conditional trail) is still observed.
  const listNode = useRef<HTMLOListElement | null>(null);
  const [list, setList] = useState<HTMLOListElement | null>(null);
  const listRef = useCallback((node: HTMLOListElement | null) => {
    listNode.current = node;
    setList(node);
  }, []);
  const widths = useRef<number[]>([]);
  const ellipsisWidth = useRef(0);
  const [hidden, setHidden] = useState(0);
  const [, setResized] = useState(0);

  // Every render, on purpose: any step's label can change its width. The
  // `next !== hidden` guard settles it in one extra pass at most.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const list = listNode.current;
    const nav = list?.parentElement;
    if (!list || !nav) return;
    const items = Array.from(list.children).filter((child): child is HTMLElement =>
      child.matches("[data-slot=breadcrumb-item]")
    );
    const isEllipsis = (item: HTMLElement) =>
      !!item.querySelector("[data-slot=breadcrumb-ellipsis]");
    const steps = items.filter((item) => !isEllipsis(item));
    const ellipsis = items.find(isEllipsis);
    if (ellipsis) ellipsisWidth.current = naturalWidth(ellipsis);
    // The rendered steps are 0, then hidden + 1 onward.
    steps.forEach((item, i) => {
      const index = hidden > 0 && i > 0 ? i + hidden : i;
      if (index < count) widths.current[index] = naturalWidth(item);
    });

    let next = 0;
    if (enabled) {
      const available = nav.clientWidth;
      const width = (i: number) => widths.current[i] ?? 0;
      let total = 0;
      for (let i = 0; i < count; i++) total += width(i);
      const maxHidden = Math.max(0, count - 3);
      // An ellipsis not drawn yet is about one square crumb with its chevron.
      const ellipsisCost = ellipsisWidth.current || 44;
      if (total > available + 0.5) {
        let shown = total + ellipsisCost;
        while (next < maxHidden && shown > available + 0.5) {
          shown -= width(1 + next);
          next++;
        }
      }
    }
    if (next !== hidden) setHidden(next);
  });

  // Container resizes re-run the pass above.
  useEffect(() => {
    const nav = list?.parentElement;
    if (!nav || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setResized((n) => n + 1));
    ro.observe(nav);
    return () => ro.disconnect();
  }, [list]);

  return { listRef, hidden: enabled ? hidden : 0 };
}

export {
  useBreadcrumbCollapse,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbButton,
  BreadcrumbPage,
  BreadcrumbEllipsis,
};
export type { BreadcrumbProps, BreadcrumbLinkProps, UseBreadcrumbCollapseOptions };
export default Breadcrumb;
