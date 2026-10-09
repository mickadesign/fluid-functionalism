"use client";

import { useEffect, useState } from "react";
import type { ComponentEntry } from "@/lib/docs/components";
import { previewMap } from "@/app/components/bento-previews";
import { BentoCard, BentoTileContext } from "@/app/components/bento-card";
import { cn } from "@/lib/utils";
import { resolveNavKind } from "@/lib/docs/updates";

/**
 * Band layout. At xl (3 cols) the grid reads as horizontal bands: each 2-wide
 * card (medium/large) pairs with smalls filling the remaining column — a
 * large (2 rows) takes two smalls, a medium takes one. `side: "right"` pins
 * that band's wide card to columns 2–3 (xl:col-start-2); the dense auto-flow
 * backfills column 1 with the neighboring smalls, so the wide card alternates
 * left/right band by band.
 *
 * The size mix is balanced so the grid fills with NO holes at both md and xl:
 * smalls needed = 2·(larges) + 1·(mediums) = 2·5 + 6 = 16 = smalls available
 * (and an even small count keeps md's half-width pairs complete). Adding a
 * card or changing a gridSize breaks that equation — rebalance before
 * shipping or the bottom rows develop holes again.
 */
const displayOrder: { slug: string; side?: "right" }[] = [
  { slug: "input-message" },                  // band 1 · medium left
  { slug: "thinking-indicator" },
  { slug: "command-menu", side: "right" },    // band 2 · large right
  { slug: "combobox" },
  { slug: "switch" },
  { slug: "sidebar" },                        // band 3 · large left
  { slug: "radio-group" },
  { slug: "chat-message" },
  { slug: "card", side: "right" },            // band 4 · medium right
  { slug: "select" },
  { slug: "thinking-steps" },                 // band 5 · large left
  { slug: "tabs-subtle" },
  { slug: "checkbox-group" },
  { slug: "ask-user-questions", side: "right" }, // band 6 · large right
  { slug: "slider" },
  { slug: "dropdown" },
  { slug: "tabs" },                           // band 7 · medium left
  { slug: "input-copy" },
  { slug: "accordion", side: "right" },       // band 8 · medium right
  { slug: "input-group" },
  { slug: "carousel-dots" },                // band 9 · medium left
  { slug: "button" },
  { slug: "table", side: "right" },           // band 10 · medium right
  { slug: "dialog" },
  { slug: "color-picker" },                   // band 11 · large left
  { slug: "tooltip" },
  { slug: "badge" },
];

/** Stage padding overrides, by slug (the default is px-6 py-16). */
const STAGE_PADDING: Record<string, string> = {
  sidebar: "px-4 py-8",
  table: "px-6 py-6",
  card: "px-6 py-5",
  "command-menu": "px-6 py-8",
};

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
  const ordered = displayOrder.flatMap(({ slug, side }) => {
    const entry = componentMap.get(slug);
    return entry ? [{ entry, side }] : [];
  });
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
      {ordered.map(({ entry: c, side }) => {
        const Preview = previewMap[c.slug];
        if (!Preview) return null;
        const kind = resolveNavKind(c);
        return (
          <BentoCard
            key={c.slug}
            slug={c.slug}
            name={c.name}
            isNew={kind === "New"}
            isUpdated={kind === "Updated"}
            gridSize={c.gridSize}
            className={side === "right" ? "xl:col-start-2" : undefined}
            // Tall previews spend less of the row on stage padding: a whole
            // app shell, the command menu's panel, and the two medium tiles
            // that show a list (a 4-row table, 4 inline cards).
            previewClassName={STAGE_PADDING[c.slug]}
            animateLayout
          >
            <BentoTileContext.Provider value={true}>
              <Preview />
            </BentoTileContext.Provider>
          </BentoCard>
        );
      })}
    </div>
  );
}
