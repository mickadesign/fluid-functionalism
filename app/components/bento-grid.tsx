"use client";

import { useEffect, useState } from "react";
import type { ComponentEntry } from "@/lib/docs/components";
import { previewMap } from "@/app/components/bento-previews";
import { useReleaseMarks } from "@/lib/changelog/marks";
import { BentoCard, BentoTileContext } from "@/app/components/bento-card";
import { cn } from "@/lib/utils";

/**
 * Band layout. At xl (3 cols) the grid reads as horizontal bands: each 2-wide
 * card (medium/large) pairs with smalls filling the remaining column — a
 * large (2 rows) takes two smalls, a medium takes one. `side: "right"` pins
 * that band's wide card to columns 2–3 (xl:col-start-2); the dense auto-flow
 * backfills column 1 with the neighboring smalls, so the wide card alternates
 * left/right band by band.
 *
 * The size mix is balanced so the grid fills with NO holes at xl:
 * smalls needed = 2·(larges) + 1·(mediums) = 2·5 + 7 = 17 = smalls available.
 * At md (2 cols) only smalls take one column, so an odd small count leaves a
 * half row: the last small then spans the full row there (and goes back to
 * one column at xl). Adding a card or changing a gridSize breaks the xl
 * equation — rebalance before shipping or the bottom rows develop holes.
 */
const displayOrder: { slug: string; side?: "right" }[] = [
  { slug: "input-message" },                  // band 1 · medium left
  { slug: "thinking-indicator" },
  { slug: "color-picker", side: "right" },    // band 2 · large right
  { slug: "switch" },
  { slug: "combobox" },
  { slug: "card" },                           // band 3 · medium left
  { slug: "select" },
  { slug: "command-menu", side: "right" },    // band 4 · large right
  { slug: "tooltip" },
  { slug: "badge" },
  { slug: "sidebar" },                        // band 5 · large left
  { slug: "radio-group" },
  { slug: "chat-message" },
  { slug: "thinking-steps", side: "right" },  // band 6 · large right
  { slug: "tabs" },
  { slug: "checkbox-group" },
  { slug: "ask-user-questions" },             // band 7 · large left
  { slug: "slider" },
  { slug: "dropdown" },
  { slug: "banner", side: "right" },          // band 8 · medium right
  { slug: "input-copy" },
  { slug: "accordion" },                      // band 9 · medium left
  { slug: "input-group" },
  { slug: "carousel-dots", side: "right" },   // band 10 · medium right
  { slug: "button" },
  { slug: "table" },                          // band 11 · medium left
  { slug: "dialog" },
  { slug: "calendar", side: "right" },        // band 12 · medium right
  { slug: "date-picker" },
];

/** Stage padding overrides, by slug (the default is px-6 py-16). */
const STAGE_PADDING: Record<string, string> = {
  sidebar: "px-4 py-8",
  table: "px-6 py-6",
  card: "px-6 py-5",
  "command-menu": "px-6 py-8",
  calendar: "px-4 py-2",
};

/**
 * Column count driven from React state (not just CSS breakpoints) so the
 * cards can FLIP-animate between grid layouts. A pure media-query change
 * reflows the grid outside React's commit, which means Motion never
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

/** Grid footprint per card size. The reveal-scroll wrapper is the grid
 *  item, so it carries the span; the card inside fills it. */
const sizeClasses: Record<string, string> = {
  large: "md:col-span-2 md:row-span-2",
  medium: "md:col-span-2",
  small: "col-span-1",
};

export function BentoGrid({ components }: BentoGridProps) {
  const componentMap = new Map(components.map((c) => [c.slug, c]));
  const ordered = displayOrder.flatMap(({ slug, side }) => {
    const entry = componentMap.get(slug);
    return entry ? [{ entry, side }] : [];
  });
  const cols = useGridCols();
  const { isNew } = useReleaseMarks();
  // An odd number of smalls leaves a half row at md: the last one fills it.
  const smalls = ordered.filter(({ entry }) => (entry.gridSize ?? "small") === "small");
  const wideAtMd = smalls.length % 2 === 1 ? smalls[smalls.length - 1]?.entry.slug : undefined;

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
        // The wrapper is the grid item and the reveal-scroll section. The
        // card inside keeps its framer layout transform, which a CSS
        // animation on the same element would override.
        return (
          <div
            key={c.slug}
            className={cn(
              "reveal-scroll flex",
              sizeClasses[c.gridSize ?? "small"],
              side === "right" && "xl:col-start-2",
              c.slug === wideAtMd && "md:col-span-2 xl:col-span-1"
            )}
          >
            <BentoCard
              slug={c.slug}
              name={c.name}
              isNew={isNew(c.slug)}
              className="min-w-0 flex-1"
              // Tall previews spend less of the row on stage padding: a whole
              // app shell, the command menu's panel, and the two medium tiles
              // that show a list (a 4-row table, 4 inline cards).
              previewClassName={STAGE_PADDING[c.slug]}
              animateLayout
            >
              <BentoTileContext.Provider value={true}>
                {/* The component follows its card in (a nested
                    reveal-scroll runs half a range behind). It fills the
                    stage and re-centers, so previews lay out as before. */}
                <div className="reveal-scroll flex size-full min-h-0 items-center justify-center">
                  <Preview />
                </div>
              </BentoTileContext.Provider>
            </BentoCard>
          </div>
        );
      })}
    </div>
  );
}
