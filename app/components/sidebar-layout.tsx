"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sidebar } from "@/app/components/sidebar";
import { MobileDrawer } from "@/registry/default/mobile-drawer";
import { Button } from "@/registry/default/button";
import { GitHubButton } from "@/app/components/github-button";

interface SidebarLayoutProps {
  children: ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
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
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setDrawerOpen(true)}
        aria-label="Open navigation"
      >
        <Menu />
      </Button>

      {/* GitHub star button */}
      <GitHubButton />

      {/* Mobile drawer */}
      <MobileDrawer open={drawerOpen} onClose={handleClose}>
        <Sidebar mobile />
      </MobileDrawer>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}

export default SidebarLayout;
