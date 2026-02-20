import Link from "next/link";
import { componentList } from "@/lib/docs/components";
import { fontWeights } from "@/registry/default/lib/font-weight";

export default function DocsIndex() {
  return (
    <div className="flex flex-col gap-8 px-6">
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

      <div className="flex flex-col gap-3">
        <h2
          className="text-[16px] text-foreground leading-none"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Installation
        </h2>
        <p className="text-[13px] text-muted-foreground">
          Add any component directly using the shadcn CLI:
        </p>
        <pre className="overflow-x-auto rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-[13px] text-foreground">
          <code>npx shadcn@latest add https://fluid-functionalism.vercel.app/r/button.json</code>
        </pre>
        <p className="text-[13px] text-muted-foreground">
          Or configure a registry namespace in your <code className="text-[12px] bg-muted/50 px-1.5 py-0.5 rounded">components.json</code> for shorter commands:
        </p>
        <pre className="overflow-x-auto rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-[13px] text-foreground">
          <code>{`"registries": {
  "@fluid": "https://fluid-functionalism.vercel.app/r/{name}.json"
}`}</code>
        </pre>
        <p className="text-[13px] text-muted-foreground">
          Then install with:
        </p>
        <pre className="overflow-x-auto rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-[13px] text-foreground">
          <code>npx shadcn@latest add @fluid/button</code>
        </pre>
        <p className="text-[13px] text-muted-foreground">
          Dependencies and shared utilities are resolved automatically.
          Font weight animations require the Inter variable font.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2
          className="text-[16px] text-foreground leading-none"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          All Components
        </h2>
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
    </div>
  );
}
