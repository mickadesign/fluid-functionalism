"use client";

import { useEffect, useState } from "react";
import type { ComponentEntry } from "@/lib/docs/components";
import { previewMap } from "@/app/components/bento-previews";
import { BentoCard } from "@/app/components/bento-card";
import { cn } from "@/lib/utils";

const displayOrder = [
  "slider",
  "thinking-indicator",
  "tabs-subtle",
  "radio-group",
  "switch",
  "ask-user-questions",
  "thinking-steps",
  "checkbox-group",
  "select",
  "accordion",
  "tabs",
  "dropdown",
  "input-copy",
  "color-picker",
  "table",
  "input-group",
  "button",
  "dialog",
  "tooltip",
  "badge",
];

/**
 * Column count driven from React state (not just CSS breakpoints) so the
 * cards can FLIP-animate between grid layouts. A pure media-query change
 * reflows the grid outside React's commit, which means framer-motion never
 * sees the "before" positions and the re-slot snaps. By applying the column
 * template in the render that follows the matchMedia flip, the layout change
 * happens inside the commit and each card animates from its old slot.
 *
 * `null` = pre-hydration: the SSR markup keeps the plain responsive classes
 * (identical computed layout), so there is no first-paint flash on any
 * viewport and no animation on mount.
 */
function useGridCols(): 1 | 2 | 3 | null {
  const [cols, setCols] = useState<1 | 2 | 3 | null>(null);

  useEffect(() => {
    const md = window.matchMedia("(min-width: 768px)");
    const xl = window.matchMedia("(min-width: 1280px)");
    // A window resize listener (reading mq.matches) rather than MediaQueryList
    // "change" events: same signal in real browsers, but it also fires under
    // synthetic resize dispatch, which emulated/test environments rely on.
    // setCols with an unchanged value skips the re-render, so per-frame resize
    // events inside a breakpoint band cost nothing.
    const update = () => setCols(xl.matches ? 3 : md.matches ? 2 : 1);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return cols;
}

interface BentoGridProps {
  components: ComponentEntry[];
}

export function BentoGrid({ components }: BentoGridProps) {
  const componentMap = new Map(components.map((c) => [c.slug, c]));
  const ordered = displayOrder
    .map((slug) => componentMap.get(slug))
    .filter((c): c is ComponentEntry => c != null);
  const cols = useGridCols();

  return (
    <div
      className={cn(
        "grid gap-3 bento-grid",
        cols === null && "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
      )}
      style={
        cols !== null
          ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }
          : undefined
      }
    >
      {ordered.map((c) => {
        const Preview = previewMap[c.slug];
        if (!Preview) return null;
        return (
          <BentoCard
            key={c.slug}
            slug={c.slug}
            name={c.name}
            isNew={c.isNew}
            gridSize={c.gridSize}
            animateLayout
          >
            <Preview />
          </BentoCard>
        );
      })}
    </div>
  );
}
