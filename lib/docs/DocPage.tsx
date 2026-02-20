import { type ReactNode } from "react";
import { fontWeights } from "@/registry/default/lib/font-weight";

interface DocPageProps {
  title: string;
  description: string;
  slug?: string;
  children: ReactNode;
}

export function DocPage({ title, description, slug, children }: DocPageProps) {
  return (
    <div className="flex flex-col gap-8 px-6">
      <div>
        <h1
          className="text-[22px] sm:text-[28px] text-foreground leading-none mb-2"
          style={{ fontVariationSettings: fontWeights.bold }}
        >
          {title}
        </h1>
        <p className="text-[13px] text-muted-foreground">{description}</p>
      </div>
      {slug && (
        <div className="flex flex-col gap-3">
          <h2
            className="text-[16px] text-foreground leading-none"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            Installation
          </h2>
          <pre className="overflow-x-auto rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-[13px] text-foreground">
            <code>npx shadcn@latest add https://fluid-functionalism.vercel.app/r/{slug}.json</code>
          </pre>
        </div>
      )}
      {children}
    </div>
  );
}

interface DocSectionProps {
  title: string;
  children: ReactNode;
}

export function DocSection({ title, children }: DocSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2
        className="text-[16px] text-foreground leading-none"
        style={{ fontVariationSettings: fontWeights.semibold }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}
