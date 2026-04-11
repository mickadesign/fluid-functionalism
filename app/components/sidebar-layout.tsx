"use client";

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/app/components/sidebar";
import { useIcon } from "@/lib/icon-context";
import { MobileDrawer } from "@/registry/default/mobile-drawer";
import { Button } from "@/registry/default/button";
import { RightPanel, SettingsContent } from "@/app/components/right-panel";

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
