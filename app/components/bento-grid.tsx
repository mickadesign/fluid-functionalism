"use client";

import type { ComponentEntry } from "@/lib/docs/components";
import { previewMap } from "@/app/components/bento-previews";
import { BentoCard } from "@/app/components/bento-card";

const displayOrder = [
  "slider",
  "thinking-indicator",
  "tabs-subtle",
  "radio-group",
  "switch",
  "thinking-steps",
  "checkbox-group",
  "select",
  "accordion",
  "tabs",
  "dropdown",
  "input-copy",
  "table",
  "input-group",
  "button",
  "dialog",
  "tooltip",
  "badge",
];

interface BentoGridProps {
  components: ComponentEntry[];
}

export function BentoGrid({ components }: BentoGridProps) {
  const componentMap = new Map(components.map((c) => [c.slug, c]));
  const ordered = displayOrder
    .map((slug) => componentMap.get(slug))
    .filter((c): c is ComponentEntry => c != null);

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 bento-grid"
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
          >
            <Preview />
          </BentoCard>
        );
      })}
    </div>
  );
}
