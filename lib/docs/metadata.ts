import type { Metadata } from "next";
import { MARKDOWN_PAGES } from "@/lib/docs/markdown";
import { plainDescription } from "@/lib/docs/install-brief";

const INDEX_DESCRIPTION =
  "Animated React components for shadcn/ui, in Radix and Base UI flavors, with one shared motion system. Install, flavors, and every component.";

/** Title, description, canonical URL and Markdown alternate for a doc page.
 *  The pages are client components, so each doc folder exports this from a
 *  small layout.tsx (tests/docs-markdown.test.ts checks every folder has
 *  one). Without a slug: the /docs index. */
export function docMetadata(slug?: string): Metadata {
  const entry = slug ? MARKDOWN_PAGES.find((page) => page.slug === slug) : undefined;
  if (slug && !entry) throw new Error(`docMetadata: no doc page "${slug}" in lib/docs/components.ts`);

  const title = `${entry?.name ?? "Introduction"} · Fluid Functionalism`;
  const description = entry ? plainDescription(entry.description) : INDEX_DESCRIPTION;
  const path = entry ? `/docs/${entry.slug}` : "/docs";
  const images = [{ url: "/metadata/og.png", width: 1200, height: 630 }];

  return {
    title,
    description,
    alternates: {
      canonical: path,
      types: { "text/markdown": `${path}.md` },
    },
    // Replaced wholesale, not merged, over the root layout's: repeat the image.
    openGraph: { title, description, url: path, images },
    twitter: { card: "summary_large_image", title, description, images: ["/metadata/og.png"] },
  };
}
