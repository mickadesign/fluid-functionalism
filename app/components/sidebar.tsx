"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavMenu } from "@/components/ui/nav-menu";
import { NavItem } from "@/components/ui/nav-item";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { componentList } from "@/lib/docs/components";
import { cn } from "@/registry/default/lib/utils";

interface SidebarProps {
  mobile?: boolean;
}

export function Sidebar({ mobile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "shrink-0 w-56 border-r border-border/60 overflow-y-auto p-4 flex flex-col gap-4",
        mobile
          ? "w-full border-r-0"
          : "sticky top-0 h-screen hidden md:flex"
      )}
    >
      <Link
        href="/"
        className="block text-[16px] text-foreground mb-2 px-2 rounded outline-none focus-visible:ring-1 focus-visible:ring-[#6B97FF]"
        style={{ fontVariationSettings: fontWeights.bold }}
      >
        Fluid Functionalism
      </Link>

      {/* Top-level navigation */}
      <NavMenu activeSlug={pathname === "/" ? "/" : null} aria-label="Main navigation">
        <NavItem index={0} href="/" label="Showcase" />
      </NavMenu>

      {/* Components section */}
      <div>
        <span className="text-[13px] text-muted-foreground pl-1 py-4 block">
          Components
        </span>
        <NavMenu activeSlug={pathname} aria-label="Component navigation">
          {componentList.map((c, i) => (
            <NavItem
              key={c.slug}
              index={i}
              href={`/docs/${c.slug}`}
              label={c.name}
            />
          ))}
        </NavMenu>
      </div>

      <p className="mt-auto text-[13px] text-muted-foreground px-2">
        Designed by{" "}
        <a
          href="https://x.com/micka_design"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded text-muted-foreground hover:text-foreground transition-colors duration-80 outline-none focus-visible:ring-1 focus-visible:ring-[#6B97FF] focus-visible:ring-offset-2"
        >
          @micka_design
        </a>
      </p>
    </aside>
  );
}

export default Sidebar;
