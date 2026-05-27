"use client";

import Link from "next/link";
import { useRef, type ReactNode, type CSSProperties, type MouseEvent } from "react";
import { cn } from "@/registry/default/lib/utils";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { Badge } from "@/registry/default/badge";
import { routeKeyboardOnMouseDown } from "@/lib/click-to-focus";

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
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Clicking anywhere on the card routes keyboard control into it: focus the
  // preview's first interactive element (falling back to the card itself).
  // From then on the card is :focus-within (the contrasted border) and the
  // inner component's own shortcut handlers receive keys. Clicking an
  // interactive element keeps native focus; clicking outside the card blurs it,
  // so shortcuts fall back to the page level.
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) =>
    routeKeyboardOnMouseDown(e, contentRef.current, cardRef.current);

  return (
    <div
      ref={cardRef}
      tabIndex={-1}
      onMouseDown={handleMouseDown}
      className={cn(
        "group relative flex flex-col rounded-xl border overflow-hidden outline-none transition-[shadow,border-color] duration-80 bento-card-border",
        sizeClasses[gridSize],
        extraClassName,
      )}
      style={style}
    >
      <div
        ref={contentRef}
        className="flex-1 min-h-0 flex items-center justify-center px-6 py-16 overflow-hidden"
      >
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
