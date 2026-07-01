import type { Metadata } from "next";
import type { ReactNode } from "react";

// Hidden easter-egg page: kept out of search indexes and off the sidebar nav
// (SidebarLayout treats /stars as a fullscreen route).
export const metadata: Metadata = {
  title: "★ Stars",
  robots: { index: false, follow: false },
};

export default function StarsLayout({ children }: { children: ReactNode }) {
  return children;
}
