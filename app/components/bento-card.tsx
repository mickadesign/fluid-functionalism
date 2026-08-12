"use client";

import Link from "next/link";
import { type ReactNode, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { cn } from "@/registry/default/lib/utils";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { spring } from "@/lib/springs";
import { Badge } from "@/registry/default/badge";

const sizeClasses: Record<string, string> = {
  large: "md:col-span-2 md:row-span-2",
  medium: "md:col-span-2",
  small: "col-span-1",
};

interface BentoCardProps {
  slug: string;
  name: string;
  isNew?: boolean;
  gridSize?: string;
  /** FLIP-animate the card when the surrounding grid re-slots it (used by the
   *  home bento grid when its column count changes). The card box tweens with
   *  a spring while the preview area and footer label ride as
   *  `layout="position"` nodes — framer scale-corrects nested layout nodes,
   *  so the content stays crisp instead of stretching with the box. */
  animateLayout?: boolean;
  /** Optional control pinned to the preview area's bottom-right corner —
   *  the /demo page puts the playground pen menu here. Rendered outside the
   *  (possibly scaled) preview content so it keeps its natural size. */
  action?: ReactNode;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function BentoCard({ slug, name, isNew, gridSize = "small", animateLayout = false, action, className: extraClassName, style, children }: BentoCardProps) {
  // No click-to-focus wiring here. Previously a mousedown on empty space
  // inside the card routed focus to the preview's first interactive element
  // (so the user could keyboard-drive the demo afterwards). In practice it
  // caused unintended visual focus state on the first item — the
  // checked-state on radios, the selected tab on TabsSubtle, the open
  // accordion section, etc. — making cards look "primed" the moment a user
  // clicked anywhere in them. Now clicking only focuses what the user
  // actually clicked; Tab still routes into the card naturally.
  const footerLabel = (
    <motion.div
      layout={animateLayout ? "position" : false}
      transition={spring.moderate}
      className="flex items-center gap-2"
    >
      <span
        className={cn(
          "text-body text-muted-foreground transition-colors duration-80",
          slug && "group-hover/link:text-foreground"
        )}
        style={{ fontVariationSettings: fontWeights.medium }}
      >
        {name}
      </span>
      {isNew && (
        <Badge variant="dot" color="blue" size="sm">
          New
        </Badge>
      )}
    </motion.div>
  );

  return (
    <motion.div
      layout={animateLayout}
      transition={spring.moderate}
      className={cn(
        // No unnamed `group` here — many of the components rendered inside
        // (Button, Select, InputCopy, …) use Tailwind's unnamed `group-hover:`
        // for their own hover styling. Tailwind's `.group-hover:` matches the
        // nearest *any* `.group` ancestor, so an unnamed group on the card
        // would fire every inner button's hover state at once whenever the
        // card itself was hovered. The footer link below uses a NAMED
        // `group/link`, which is properly scoped.
        "relative flex flex-col rounded-xl border overflow-hidden outline-none transition-[shadow,border-color] duration-80 bento-card-border",
        sizeClasses[gridSize],
        extraClassName,
      )}
      style={style}
    >
      <motion.div
        layout={animateLayout ? "position" : false}
        transition={spring.moderate}
        className="flex-1 min-h-0 flex items-center justify-center px-6 py-16"
      >
        {children}
      </motion.div>

      {/* Footer row: the name (a link to the docs when `slug` is set) on the
          left, the optional action on the right. The action sits OUTSIDE the
          link — nesting a button inside an anchor is invalid, and a click on
          the pen must not navigate. The link keeps its own hover/focus ring by
          staying its own flex child rather than wrapping the whole row. */}
      <div
        className={cn(
          "shrink-0 flex items-stretch border-t border-border/40",
          // The link paints its own hover fill to the card's bottom corners, so
          // the row itself stays transparent.
          action ? "pr-2" : undefined
        )}
      >
        {slug ? (
          <Link
            href={`/docs/${slug}`}
            aria-label={`View ${name} documentation`}
            className={cn(
              "group/link flex flex-1 min-w-0 items-center gap-2 px-4 py-3 transition-colors duration-80 hover:bg-hover outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--focus-ring,#6B97FF)]",
              action ? "rounded-bl-xl" : "rounded-b-xl"
            )}
          >
            {footerLabel}
          </Link>
        ) : (
          <div className="flex flex-1 min-w-0 items-center gap-2 px-4 py-3">
            {footerLabel}
          </div>
        )}
        {action && (
          <div className="flex shrink-0 items-center pl-2">{action}</div>
        )}
      </div>
    </motion.div>
  );
}
