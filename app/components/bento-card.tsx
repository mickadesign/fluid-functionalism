"use client";

import Link from "next/link";
import { type ReactNode, type CSSProperties } from "react";
import { cn } from "@/registry/default/lib/utils";
import { fontWeights } from "@/registry/default/lib/font-weight";
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
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function BentoCard({ slug, name, isNew, gridSize = "small", className: extraClassName, style, children }: BentoCardProps) {
  // No click-to-focus wiring here. Previously a mousedown on empty space
  // inside the card routed focus to the preview's first interactive element
  // (so the user could keyboard-drive the demo afterwards). In practice it
  // caused unintended visual focus state on the first item — the
  // checked-state on radios, the selected tab on TabsSubtle, the open
  // accordion section, etc. — making cards look "primed" the moment a user
  // clicked anywhere in them. Now clicking only focuses what the user
  // actually clicked; Tab still routes into the card naturally.
  return (
    <div
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
      <div className="flex-1 min-h-0 flex items-center justify-center px-6 py-16">
        {children}
      </div>

      {slug ? (
        <Link
          href={`/docs/${slug}`}
          aria-label={`View ${name} documentation`}
          className="group/link shrink-0 flex items-center gap-2 px-4 py-3 border-t border-border/40 rounded-b-xl transition-colors duration-80 hover:bg-hover outline-none focus-visible:shadow-[inset_0_0_0_1px_#6B97FF]"
        >
          <span
            className="text-[13px] text-muted-foreground group-hover/link:text-foreground transition-colors duration-80"
            style={{ fontVariationSettings: fontWeights.medium }}
          >
            {name}
          </span>
          {isNew && (
            <Badge variant="dot" color="blue" size="sm">
              New
            </Badge>
          )}
        </Link>
      ) : (
        <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-t border-border/40">
          <span
            className="text-[13px] text-muted-foreground"
            style={{ fontVariationSettings: fontWeights.medium }}
          >
            {name}
          </span>
        </div>
      )}
    </div>
  );
}
