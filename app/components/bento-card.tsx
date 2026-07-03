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
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function BentoCard({ slug, name, isNew, gridSize = "small", animateLayout = false, className: extraClassName, style, children }: BentoCardProps) {
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
          "text-[13px] text-muted-foreground transition-colors duration-80",
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

      {slug ? (
        <Link
          href={`/docs/${slug}`}
          aria-label={`View ${name} documentation`}
          className="group/link shrink-0 flex items-center gap-2 px-4 py-3 border-t border-border/40 rounded-b-xl transition-colors duration-80 hover:bg-hover outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--focus-ring,#6B97FF)]"
        >
          {footerLabel}
        </Link>
      ) : (
        <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-t border-border/40">
          {footerLabel}
        </div>
      )}
    </motion.div>
  );
}
