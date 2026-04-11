"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { InputCopy } from "@/registry/default/input-copy";
import { Button } from "@/registry/default/button";
import { useIcon } from "@/lib/icon-context";
import { componentList } from "@/lib/docs/components";

interface DocPageProps {
  title: string;
  description: string;
  slug?: string;
  children: ReactNode;
}

export function DocPage({ title, description, slug, children }: DocPageProps) {
  const ArrowRight = useIcon("arrow-right");

  const currentIndex = slug ? componentList.findIndex((c) => c.slug === slug) : -1;
  const prev = currentIndex > 0
    ? componentList[currentIndex - 1]
    : currentIndex === 0
      ? { slug: "", name: "Introduction" }
      : null;
  const next = currentIndex >= 0 && currentIndex < componentList.length - 1 ? componentList[currentIndex + 1] : null;

  return (
    <div className="flex flex-col gap-8 px-6">
      <div className="flex items-start justify-between gap-4">
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
          <div className="flex items-center gap-1 shrink-0">
            {prev ? (
              <Link href={`/docs/${prev.slug}`} aria-label={`Previous: ${prev.name}`} className="outline-none" tabIndex={-1}>
                <Button variant="ghost" size="icon">
                  <ArrowRight className="rotate-180" />
                </Button>
              </Link>
            ) : (
              <Button variant="ghost" size="icon" disabled aria-label="No previous component">
                <ArrowRight className="rotate-180" />
              </Button>
            )}
            {next ? (
              <Link href={`/docs/${next.slug}`} aria-label={`Next: ${next.name}`} className="outline-none" tabIndex={-1}>
                <Button variant="ghost" size="icon">
                  <ArrowRight />
                </Button>
              </Link>
            ) : (
              <Button variant="ghost" size="icon" disabled aria-label="No next component">
                <ArrowRight />
              </Button>
            )}
          </div>
        )}
      </div>
      {slug && (
        <div className="flex flex-col gap-3">
          <h2
            className="text-[16px] text-foreground leading-none"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            Installation
          </h2>
          <InputCopy value={`npx shadcn@latest add https://www.fluidfunctionalism.com/r/${slug}.json`} />
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
