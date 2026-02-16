import { type ReactNode } from "react";
import { fontWeights } from "../lib/font-weight";

interface DocPageProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function DocPage({ title, description, children }: DocPageProps) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1
          className="text-[22px] sm:text-[28px] text-foreground leading-none mb-2"
          style={{ fontVariationSettings: fontWeights.bold }}
        >
          {title}
        </h1>
        <p className="text-[13px] text-muted-foreground">{description}</p>
      </div>
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
