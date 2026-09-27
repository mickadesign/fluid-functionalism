"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { spring } from "@/registry/default/lib/springs";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/flavored/sidebar";
import { SiteSidebar } from "@/app/components/sidebar";
import { SiteCommandMenu, SiteCommandMenuProvider } from "@/app/components/site-command-menu";
import { RightPanel } from "@/app/components/right-panel";
import { RightRailProvider } from "@/lib/right-rail";
import { showShortcutToast } from "@/lib/docs/settings-toast";
import { systemList, componentList } from "@/lib/docs/components";

const pageOrder = [
  "/",
  "/docs",
  ...systemList.map((s) => `/docs/${s.slug}`),
  ...componentList.map((c) => `/docs/${c.slug}`),
];

/** Toasts the sidebar's "[" toggle the way the settings shortcuts toast
 *  theirs: a bare "[" press arms a short window, and the provider's own
 *  open-state change within it surfaces the result. Pointer-driven toggles
 *  (trigger clicks, the rail) stay silent, like every other setting. */
function SidebarShortcutToast() {
  const { open } = useSidebar();
  const pendingAtRef = useRef<number | null>(null);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "[") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      )
        return;
      pendingAtRef.current = e.timeStamp;
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
  const prevOpenRef = useRef<boolean | null>(null);
  useEffect(() => {
    const prev = prevOpenRef.current;
    prevOpenRef.current = open;
    if (prev === null || prev === open) return;
    const at = pendingAtRef.current;
    if (at === null || performance.now() - at > 300) return;
    pendingAtRef.current = null;
    showShortcutToast("[", open ? "Sidebar expanded" : "Sidebar collapsed");
  }, [open]);
  return null;
}

/** Desktop reopen affordance: collapsing the rail (the "[" key, the rail
 *  click) would otherwise leave NO visible way back — the layout's only
 *  trigger is the xl:hidden mobile one. The trigger fades in at the rail's
 *  top-left, carrying its own "Expand sidebar [" tooltip, and fades away
 *  once the rail is open again — the mirror of the right panel's
 *  "Properties panel" reopen button. */
function DesktopReopenTrigger() {
  const { open } = useSidebar();
  const reduceMotion = useReducedMotion() ?? false;
  return (
    <AnimatePresence>
      {!open && (
        <motion.div
          className="max-xl:hidden fixed top-4 left-4 z-50"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{
            opacity: 0,
            transition: reduceMotion ? { duration: 0 } : spring.fast.exit,
          }}
          transition={reduceMotion ? { duration: 0 } : spring.fast}
        >
          <SidebarTrigger />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Closes the mobile sheet whenever the route changes. */
function CloseSheetOnNavigate() {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);
  return null;
}

interface SidebarLayoutProps {
  children: ReactNode;
  /** Server-read sidebar_state cookie value (see app/layout.tsx). */
  defaultOpen?: boolean;
}

export function SidebarLayout({ children, defaultOpen = true }: SidebarLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isFullscreen =
    pathname === "/demo" ||
    pathname === "/compare" ||
    pathname === "/stars" ||
    pathname.startsWith("/concepts");

  // Arrow key navigation between pages — ref-based so held keys keep advancing
  // (closures over `pathname` would re-bind per nav and lose key-repeat events).
  const expectedIndexRef = useRef(pageOrder.indexOf(pathname));
  useEffect(() => {
    expectedIndexRef.current = pageOrder.indexOf(pathname);
  }, [pathname]);

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

      const currentIndex = expectedIndexRef.current;
      if (currentIndex === -1) return;

      const nextIndex = e.key === "ArrowLeft" ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex < 0 || nextIndex >= pageOrder.length) return;

      e.preventDefault();
      expectedIndexRef.current = nextIndex;
      router.push(pageOrder[nextIndex]);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  if (isFullscreen) {
    return (
      <SiteCommandMenuProvider>
        <SiteCommandMenu />
        <main className="min-h-screen">
          {children}
        </main>
      </SiteCommandMenuProvider>
    );
  }

  return (
    <SiteCommandMenuProvider>
    {/* ⌘K anywhere: every page and setting in one field. */}
    <SiteCommandMenu />
    <RightRailProvider>
      {/* The Sidebar component, dogfooded: the provider owns the desktop
          collapse (⌘B + cookie persistence via app/layout.tsx) and the
          mobile sheet. The site switches rail ↔ sheet at xl, so the
          breakpoint is 1280 instead of the component's 768 default. */}
      <SidebarProvider defaultOpen={defaultOpen} mobileBreakpoint={1280} className="min-h-screen [&:has([data-not-found])_[data-site-right-panel]]:hidden">
        <SiteSidebar />
        <CloseSheetOnNavigate />

        {/* Mobile trigger for the sheet; desktop collapse uses [ or the rail */}
        <SidebarTrigger
          className="xl:hidden fixed top-4 left-4 z-50"
          aria-label="Open navigation"
        />
        <DesktopReopenTrigger />
        <SidebarShortcutToast />

        {/* Main content */}
        <SidebarInset className="min-w-0">
          {children}
        </SidebarInset>

        {/* Desktop right panel */}
        <div data-site-right-panel className="contents">
          <RightPanel />
        </div>
      </SidebarProvider>
    </RightRailProvider>
    </SiteCommandMenuProvider>
  );
}

export default SidebarLayout;
