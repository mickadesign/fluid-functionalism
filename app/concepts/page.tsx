"use client";

import { ConceptFrame } from "@/app/concepts/_components/concept-frame";
import { NavMenu } from "@/components/ui/nav-menu";
import { NavItem } from "@/components/ui/nav-item";

const CONCEPTS = [
  { slug: "lumen", name: "Lumen" },
  { slug: "atlas", name: "Atlas" },
  { slug: "beacon", name: "Beacon" },
  { slug: "quill", name: "Quill" },
];

export default function ConceptsIndex() {
  return (
    <ConceptFrame bare>
      <div className="flex min-h-screen items-center justify-center px-6">
        <NavMenu activeSlug={null} aria-label="Concepts" className="w-56">
          {CONCEPTS.map((c, i) => (
            <NavItem
              key={c.slug}
              index={i}
              href={`/concepts/${c.slug}`}
              label={c.name}
            />
          ))}
        </NavMenu>
      </div>
    </ConceptFrame>
  );
}
