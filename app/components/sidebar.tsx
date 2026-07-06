"use client";

import { usePathname } from "next/navigation";
import { NavMenu } from "@/components/ui/nav-menu";
import { NavItem } from "@/components/ui/nav-item";
import { componentList, systemList } from "@/lib/docs/components";
import { ScrollArea } from "@/registry/base/scroll-area";


interface SidebarProps {
  mobile?: boolean;
}

export function Sidebar({ mobile }: SidebarProps) {
  const pathname = usePathname();

  const sections = (
    <>
      {/* Top-level navigation */}
      <NavMenu activeSlug={pathname === "/" ? "/" : pathname === "/docs" ? "/docs" : null} aria-label="Main navigation">
        <NavItem index={0} href="/" label="Showcase" />
        <NavItem index={1} href="/docs" label="Introduction" />
      </NavMenu>

      {/* System section */}
      <div>
        <span className="text-[13px] text-muted-foreground/50 pl-1 pb-1.5 flex items-center gap-2">
          System
          <span className="text-[11px]">{systemList.length}</span>
        </span>
        <NavMenu activeSlug={pathname} aria-label="System navigation">
          {systemList.map((s, i) => (
            <NavItem
              key={s.slug}
              index={i}
              href={`/docs/${s.slug}`}
              label={s.name}
              isNew={s.isNew}
              isUpdated={s.isUpdated}
            />
          ))}
        </NavMenu>
      </div>

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
              isUpdated={c.isUpdated}
              dotColorClass={c.dotColor}
            />
          ))}
        </NavMenu>
      </div>
    </>
  );

  // Inside the mobile drawer, which owns the scroll (overflow-y-auto): the
  // sidebar just flows as a plain column — a nested ScrollArea would
  // double-scroll and needs a bounded height the drawer doesn't hand it.
  if (mobile) {
    return <aside className="flex w-full flex-col gap-4 p-4">{sections}</aside>;
  }

  // Desktop: the aside is the sticky, full-height rail. ScrollArea gives it the
  // shape-system scrollbar on hover + a scroll-fade edge — the same trick the
  // /docs/scrollbars page ships, dogfooded on our own nav.
  return (
    <aside
      // max-xl:fixed — same trick as the right panel: while xl-fade-flex holds
      // display:flex through the fade-out (allow-discrete), fixed positioning
      // takes the sidebar out of flow at the breakpoint so the content reflows
      // once, not again when display flips to none. ml-2 mirrors the right
      // panel's mr-2 inset so both sides land on the same 8px gap.
      className="shrink-0 w-64 ml-2 flex-col sticky top-0 h-screen xl-fade-flex max-xl:fixed max-xl:top-0 max-xl:left-0 max-xl:z-40 max-xl:pointer-events-none"
    >
      <ScrollArea className="min-h-0 w-full flex-1" viewportClassName="scroll-fade">
        <div className="flex flex-col gap-4 p-4">{sections}</div>
      </ScrollArea>
    </aside>
  );
}

export default Sidebar;
