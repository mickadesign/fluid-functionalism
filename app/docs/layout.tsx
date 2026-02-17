"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/registry/default/lib/utils";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { componentList } from "@/lib/docs/components";
import { ShapeProvider } from "@/registry/default/lib/shape-context";

function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 h-screen w-56 shrink-0 border-r border-border/60 overflow-y-auto p-4 hidden md:block">
      <Link
        href="/docs"
        className="block text-[16px] text-foreground mb-6 px-2 rounded outline-none focus-visible:ring-1 focus-visible:ring-[#6B97FF]"
        style={{ fontVariationSettings: fontWeights.bold }}
      >
        Components
      </Link>
      <nav className="flex flex-col gap-0.5">
        {componentList.map((c) => {
          const href = `/docs/${c.slug}`;
          const isActive = pathname === href;
          return (
            <Link
              key={c.slug}
              href={href}
              className={cn(
                "px-2 py-1.5 rounded-lg text-[13px] outline-none transition-colors duration-80",
                "focus-visible:ring-1 focus-visible:ring-[#6B97FF]",
                isActive
                  ? "bg-accent/60 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              style={{
                fontVariationSettings: isActive
                  ? fontWeights.semibold
                  : fontWeights.normal,
              }}
            >
              {c.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ShapeProvider>
      <div className="flex min-h-screen">
        <Sidebar />

        {/* Mobile header */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur border-b border-border/60 px-4 py-3">
          <Link
            href="/docs"
            className="text-[14px] text-foreground outline-none"
            style={{ fontVariationSettings: fontWeights.bold }}
          >
            Components
          </Link>
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-6 py-10 md:px-12 md:py-16 md:max-w-3xl mt-12 md:mt-0">
          {children}
        </main>
      </div>
    </ShapeProvider>
  );
}
