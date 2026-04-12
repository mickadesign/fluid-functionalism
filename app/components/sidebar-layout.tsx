"use client";

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/app/components/sidebar";
import { useIcon } from "@/lib/icon-context";
import { MobileDrawer } from "@/registry/default/mobile-drawer";
import { Button } from "@/registry/default/button";
import { RightPanel, SettingsContent } from "@/app/components/right-panel";
import { componentList } from "@/lib/docs/components";

const pageOrder = [
  "/",
  "/docs",
  ...componentList.map((c) => `/docs/${c.slug}`),
];

interface SidebarLayoutProps {
  children: ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const MenuIcon = useIcon("menu");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const handleClose = useCallback(() => setDrawerOpen(false), []);
  const router = useRouter();
  const isFullscreen = pathname === "/demo";

  // Arrow key navigation between pages
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      const tag = (e.target as HTMLElement).tagName;
      const role = (e.target as HTMLElement).getAttribute("role");
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (e.target as HTMLElement).isContentEditable ||
        role === "slider" ||
        role === "tablist" ||
        role === "radiogroup" ||
        role === "listbox" ||
        role === "menu"
      ) return;

      // Also skip if focus is inside a component that uses arrow keys
      const closest = (e.target as HTMLElement).closest(
        "[role=slider],[role=tablist],[role=radiogroup],[role=listbox],[role=menu],[role=menubar]"
      );
      if (closest) return;

      const currentIndex = pageOrder.indexOf(pathname);
      if (currentIndex === -1) return;

      const nextIndex = e.key === "ArrowLeft" ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex < 0 || nextIndex >= pageOrder.length) return;

      e.preventDefault();
      router.push(pageOrder[nextIndex]);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pathname, router]);

  if (isFullscreen) {
    return (
      <main className="min-h-screen">
        {children}
      </main>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile hamburger */}
      <Button
        ref={menuButtonRef}
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setDrawerOpen(true)}
        aria-label="Open navigation"
      >
        <MenuIcon />
      </Button>

      {/* Mobile drawer */}
      <MobileDrawer
        open={drawerOpen}
        onClose={handleClose}
        triggerRef={menuButtonRef}
      >
        <Sidebar mobile />
        <div className="mt-auto pt-4">
          <SettingsContent tooltipSide="right" />
        </div>
      </MobileDrawer>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>

      {/* Desktop right panel */}
      <RightPanel />
    </div>
  );
}

export default SidebarLayout;
