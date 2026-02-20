"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/app/components/sidebar";
import { MobileDrawer } from "@/registry/default/mobile-drawer";

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
      <button
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-lg outline-none focus-visible:ring-1 focus-visible:ring-[#6B97FF] hover:bg-muted/50 transition-colors duration-80"
        onClick={() => setDrawerOpen(true)}
        aria-label="Open navigation"
      >
        <svg
          width={18}
          height={18}
          viewBox="0 0 18 18"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
        >
          <line x1={3} y1={5} x2={15} y2={5} />
          <line x1={3} y1={9} x2={15} y2={9} />
          <line x1={3} y1={13} x2={15} y2={13} />
        </svg>
      </button>

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
