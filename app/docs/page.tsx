import Link from "next/link";
import { componentList } from "@/lib/docs/components";
import { fontWeights } from "@/registry/default/lib/font-weight";

export default function DocsIndex() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1
          className="text-[22px] sm:text-[28px] text-foreground leading-none mb-2"
          style={{ fontVariationSettings: fontWeights.bold }}
        >
          Components
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Fluid components used exclusively in service of functional clarity.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {componentList.map((c) => (
          <Link
            key={c.slug}
            href={`/docs/${c.slug}`}
            className="group flex flex-col gap-1 rounded-xl border border-border/60 p-4 outline-none transition-colors duration-80 hover:bg-muted/50 focus-visible:ring-1 focus-visible:ring-[#6B97FF]"
          >
            <span
              className="text-[14px] text-foreground"
              style={{ fontVariationSettings: fontWeights.semibold }}
            >
              {c.name}
            </span>
            <span className="text-[13px] text-muted-foreground">
              {c.description}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
