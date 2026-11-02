import type { Metadata } from "next";
import type { ReactNode } from "react";

// Temp page that builds the OG image in code: `npm run og` screenshots the
// stage into public/metadata/og.png. Off the nav (SidebarLayout treats /og
// as fullscreen) and out of search indexes.
export const metadata: Metadata = {
  title: "OG image",
  robots: { index: false, follow: false },
};

export default function OgLayout({ children }: { children: ReactNode }) {
  return children;
}
