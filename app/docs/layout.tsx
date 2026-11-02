import { docMetadata } from "@/lib/docs/metadata";

// The /docs index's metadata. Every doc folder below sets its own in a
// layout.tsx of its own, so none of these fields leak onto a child page.
export const metadata = docMetadata();

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-20 sm:py-28 w-full max-w-[680px] mx-auto mt-12 lg:mt-0">
      {children}
    </div>
  );
}
