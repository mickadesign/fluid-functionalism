"use client";

import { usePathname } from "next/navigation";
import { NavMenu } from "@/components/ui/nav-menu";
import { NavItem } from "@/components/ui/nav-item";
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
        "shrink-0 w-56 overflow-y-auto p-4 flex flex-col gap-4",
        mobile
          ? "w-full"
          : "sticky top-0 h-screen hidden lg:flex"
      )}
    >
      {/* Top-level navigation */}
      <NavMenu activeSlug={pathname === "/" ? "/" : pathname === "/docs" ? "/docs" : null} aria-label="Main navigation">
        <NavItem index={0} href="/" label="Showcase" />
        <NavItem index={1} href="/docs" label="Introduction" />
      </NavMenu>

      {/* Components section */}
      <div>
        <span className="text-[13px] text-muted-foreground/50 pl-1 pb-1.5 flex items-center gap-2">
          Components
          <span className="text-[11px]">{componentList.length}</span>
        </span>
        <NavMenu activeSlug={pathname} aria-label="Component navigation">
          {componentList.map((c, i) => (
            <NavItem
              key={c.slug}
              index={i}
              href={`/docs/${c.slug}`}
              label={c.name}
              isNew={c.isNew}
            />
          ))}
        </NavMenu>
      </div>

    </aside>
  );
}

export default Sidebar;
