"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { useSizeVariant } from "@/lib/size-context";
import { CopyPromptButton } from "@/lib/docs/copy-prompt-button";
import { buildInstallPrompt } from "@/lib/docs/install-prompt";
import { Button } from "@/registry/radix/button";
import { useIcon } from "@/lib/icon-context";
import { docOrder } from "@/lib/docs/components";
import { Tooltip } from "@/registry/radix/tooltip";
import { useBase, DUAL_FLAVOR_SLUGS } from "@/lib/base-context";
import {
  badgeForSection,
  sectionId,
  STATUS_DOT,
  type UpdateKind,
} from "@/lib/docs/updates";

interface DocPageProps {
  title: string;
  description: ReactNode;
  /** A short paragraph under the description, read before the install. */
  intro?: ReactNode;
  /** Slug used for prev/next navigation (must match a `componentList` entry). */
  slug?: string;
  /** Registry slug used for the auto-injected Installation snippet. Defaults to `slug`.
   *  Set when the install advertises a bundled registry item different from the page slug
   *  (e.g. `slug="surfaces"` but `installSlug="elevated"`). */
  installSlug?: string;
  /** Set to false to skip the auto-injected Installation block (when the page provides its own). */
  showInstall?: boolean;
  /** Replaces the flavor note under the install command with a short
   *  description of what the command actually adds — for system pages,
   *  where "which primitive flavor" is the wrong question. */
  installNote?: string;
  /** Replaces the generated install brief, for a page whose install is not a
   *  registry item (the skill page installs an agent skill). */
  installPrompt?: string;
  /** Runs after the install prompt is copied, e.g. for analytics. */
  onInstallCopy?: () => void;
  children: ReactNode;
}

export function DocPage({
  title,
  description,
  intro,
  slug,
  installSlug,
  showInstall = true,
  installNote,
  installPrompt,
  onInstallCopy,
  children,
}: DocPageProps) {
  const ArrowRight = useIcon("arrow-right");
  const { base } = useBase();
  // Square buttons have no provider-following value, so the prev/next arrows
  // derive their step explicitly (see /docs/sizes).
  const iconSize =
    useSizeVariant() === "compact" ? ("icon-compact" as const) : ("icon" as const);

  const currentIndex = slug ? docOrder.findIndex((c) => c.slug === slug) : -1;
  const prev = currentIndex > 0
    ? docOrder[currentIndex - 1]
    : currentIndex === 0
      ? { slug: "", name: "Introduction" }
      : null;
  const next = currentIndex >= 0 && currentIndex < docOrder.length - 1 ? docOrder[currentIndex + 1] : null;

  return (
    <div className="flex flex-col gap-8 px-6">
      <div>
        {/* The title and the arrows share a row, centered on each other; the
            description runs full width below them. */}
        <div className="flex items-center justify-between gap-4">
          {/* Page chrome rides the type-scale roles (see /docs/sizes):
              display for the h1, body for the description. */}
          <h1
            className="text-site-display text-foreground leading-none"
            style={{ fontVariationSettings: fontWeights.bold }}
          >
            {title}
          </h1>
          {slug && (
            // -my-2: the 36px buttons (28px compact) overhang the title's
            // line box instead of stretching the row, so the description
            // stays 8px under the title at every size.
            <div className="flex items-center gap-1 shrink-0 -my-2">
              {prev ? (
                <Tooltip content={<span>{prev.name} &ensp;<kbd className="font-mono opacity-50">&larr;</kbd></span>}>
                  <Button asChild variant="ghost" size={iconSize}>
                    <Link href={`/docs/${prev.slug}`} aria-label={`Previous: ${prev.name}`}>
                      <ArrowRight className="rotate-180" />
                    </Link>
                  </Button>
                </Tooltip>
              ) : (
                <Button variant="ghost" size={iconSize} disabled aria-label="No previous component">
                  <ArrowRight className="rotate-180" />
                </Button>
              )}
              {next ? (
                <Tooltip content={<span>{next.name} &ensp;<kbd className="font-mono opacity-50">&rarr;</kbd></span>}>
                  <Button asChild variant="ghost" size={iconSize}>
                    <Link href={`/docs/${next.slug}`} aria-label={`Next: ${next.name}`}>
                      <ArrowRight />
                    </Link>
                  </Button>
                </Tooltip>
              ) : (
                <Button variant="ghost" size={iconSize} disabled aria-label="No next component">
                  <ArrowRight />
                </Button>
              )}
            </div>
          )}
        </div>
        <p className="mt-2 text-site-body text-muted-foreground">{description}</p>
        {intro && <p className="mt-4 text-site-body text-muted-foreground">{intro}</p>}
      </div>
      {slug && showInstall && (
        // Two columns: title with its note on the left, the copy button
        // vertically centered on the right. The note wraps plainly (no
        // balance) so its lines run up to the button instead of leaving a
        // wide gap beside it on narrow screens.
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <h2
              className="text-site-title text-foreground leading-none"
              style={{ fontVariationSettings: fontWeights.semibold }}
            >
              Installation
            </h2>
            {installNote ? (
              <p className="text-site-body text-muted-foreground">{installNote}</p>
            ) : DUAL_FLAVOR_SLUGS.has(installSlug ?? slug) ? (
              <p className="text-site-body text-muted-foreground">
                {base === "base"
                  ? "Base UI flavor. Switch in the right panel."
                  : "Radix flavor. Switch in the right panel."}
              </p>
            ) : base === "base" ? (
              // User has Base UI selected globally, but this component has no
              // Base flavour. Surface that so the toggle doesn't feel inert.
              <p className="text-site-body text-muted-foreground">
                Same source under both flavors.
              </p>
            ) : (
              <p className="text-site-body text-muted-foreground">
                One prompt for your coding agent: install command, usage, props.
              </p>
            )}
          </div>
          <CopyPromptButton
            prompt={installPrompt ?? buildInstallPrompt({ slug, installSlug, base })}
            onCopy={onInstallCopy}
          />
        </div>
      )}
      {children}
    </div>
  );
}

interface DocSectionProps {
  title: string;
  /** Override the changelog-derived New / Updated dot. Prefer an `updates` entry. */
  badge?: UpdateKind;
  children: ReactNode;
}

export function DocSection({ title, badge, children }: DocSectionProps) {
  const pathname = usePathname();
  // Same source as the sidebar: an `updates` row with matching href + section.
  const resolved = badge ?? badgeForSection(pathname, title);

  // Section headings are the title role of the type scale (see /docs/sizes).
  // The extra top padding (over the page's gap-8) lets each section breathe
  // and makes the title read as a fresh start rather than a caption for
  // whatever sat above it. The heading's negative margin tucks the
  // description against its title (8px) while the gap gives the content
  // below the description a fuller 16px.
  //
  // `id` matches `sectionId` in updates.ts so announcement links can land
  // on the highlighted section (`/docs/dropdown#submenus`).
  return (
    <div id={sectionId(title)} className="flex flex-col gap-4 pt-6 scroll-mt-24">
      <h2
        className="-mb-2 flex items-center gap-2 text-site-title text-foreground leading-none"
        style={{ fontVariationSettings: fontWeights.semibold }}
      >
        {title}
        {resolved && (
          <span
            className={`inline-block size-1.5 shrink-0 rounded-full ${STATUS_DOT[resolved]}`}
            aria-label={resolved}
          />
        )}
      </h2>
      {children}
    </div>
  );
}
