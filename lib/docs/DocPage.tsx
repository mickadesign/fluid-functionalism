"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { InputCopy } from "@/registry/default/input-copy";
import { Button } from "@/registry/radix/button";
import { useIcon } from "@/lib/icon-context";
import { docOrder } from "@/lib/docs/components";
import { Tooltip } from "@/registry/radix/tooltip";
import { useBase, installUrl, DUAL_FLAVOR_SLUGS, FLAVOR_AWARE_SLUGS } from "@/lib/base-context";

interface DocPageProps {
  title: string;
  description: ReactNode;
  /** Slug used for prev/next navigation (must match a `componentList` entry). */
  slug?: string;
  /** Registry slug used for the auto-injected Installation snippet. Defaults to `slug`.
   *  Set when the install advertises a bundled registry item different from the page slug
   *  (e.g. `slug="surfaces"` but `installSlug="elevated"`). */
  installSlug?: string;
  /** Set to false to skip the auto-injected Installation block (when the page provides its own). */
  showInstall?: boolean;
  children: ReactNode;
}

export function DocPage({
  title,
  description,
  slug,
  installSlug,
  showInstall = true,
  children,
}: DocPageProps) {
  const ArrowRight = useIcon("arrow-right");
  const { base } = useBase();

  const currentIndex = slug ? docOrder.findIndex((c) => c.slug === slug) : -1;
  const prev = currentIndex > 0
    ? docOrder[currentIndex - 1]
    : currentIndex === 0
      ? { slug: "", name: "Introduction" }
      : null;
  const next = currentIndex >= 0 && currentIndex < docOrder.length - 1 ? docOrder[currentIndex + 1] : null;

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
              <Tooltip content={<span>{prev.name} &ensp;<kbd className="font-mono opacity-50">&larr;</kbd></span>}>
                <Link href={`/docs/${prev.slug}`} aria-label={`Previous: ${prev.name}`} className="outline-none" tabIndex={-1}>
                  <Button variant="ghost" size="icon">
                    <ArrowRight className="rotate-180" />
                  </Button>
                </Link>
              </Tooltip>
            ) : (
              <Button variant="ghost" size="icon" disabled aria-label="No previous component">
                <ArrowRight className="rotate-180" />
              </Button>
            )}
            {next ? (
              <Tooltip content={<span>{next.name} &ensp;<kbd className="font-mono opacity-50">&rarr;</kbd></span>}>
                <Link href={`/docs/${next.slug}`} aria-label={`Next: ${next.name}`} className="outline-none" tabIndex={-1}>
                  <Button variant="ghost" size="icon">
                    <ArrowRight />
                  </Button>
                </Link>
              </Tooltip>
            ) : (
              <Button variant="ghost" size="icon" disabled aria-label="No next component">
                <ArrowRight />
              </Button>
            )}
          </div>
        )}
      </div>
      {slug && showInstall && (
        <div className="flex flex-col gap-3">
          <h2
            className="text-[16px] text-foreground leading-none"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            Installation
          </h2>
          <InputCopy
            value={`npx shadcn@latest add ${installUrl(installSlug ?? slug, base)}`}
          />
          {DUAL_FLAVOR_SLUGS.has(installSlug ?? slug) ? (
            <p className="text-[12px] text-muted-foreground">
              {base === "base"
                ? "Installs the Base UI flavor. Switch in the right panel."
                : "Installs the Radix flavor. Switch in the right panel."}
            </p>
          ) : FLAVOR_AWARE_SLUGS.has(installSlug ?? slug) ? (
            // Single source, but its registry deps include dual-flavour
            // primitives, so the install URL is still flavour-specific.
            <p className="text-[12px] text-muted-foreground">
              {base === "base"
                ? "Installs with Base UI primitives. Switch in the right panel."
                : "Installs with Radix primitives. Switch in the right panel."}
            </p>
          ) : base === "base" ? (
            // User has Base UI selected globally, but this component has no
            // Base flavour. Surface that so the toggle doesn't feel inert.
            <p className="text-[12px] text-muted-foreground">
              This component is primitive-agnostic — same source under both
              flavors.
            </p>
          ) : null}
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
