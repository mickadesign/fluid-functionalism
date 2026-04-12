"use client";

import Link from "next/link";
import type { ReactNode, CSSProperties } from "react";
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
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border overflow-hidden transition-[shadow,border-color] duration-80 bento-card-border",
        sizeClasses[gridSize],
        extraClassName,
      )}
      style={style}
    >
      <div className="flex-1 min-h-0 flex items-center justify-center px-6 py-16 overflow-hidden">
        {children}
      </div>

      {slug ? (
        <Link
          href={`/docs/${slug}`}
          aria-label={`View ${name} documentation`}
          className="group/link shrink-0 flex items-center gap-2 px-4 py-3 border-t border-border/40 rounded-b-xl transition-colors duration-80 hover:bg-muted/50 outline-none focus-visible:shadow-[inset_0_0_0_1px_#6B97FF]"
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
