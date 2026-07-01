import type { Metadata } from "next";

// Concept screens are private, unfinished explorations — keep the whole
// route group out of search indexes and crawler-followed link graphs. They're
// also deliberately absent from the sidebar nav (see lib/docs/components.ts),
// so the only way in is to know the URL.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ConceptsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
