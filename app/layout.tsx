import type { Metadata } from "next";
import "./globals.css";
import "dialkit/styles.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ShapeProvider } from "@/registry/default/lib/shape-context";
import { ThemeProvider } from "@/registry/default/lib/theme-context";
import { IconProvider } from "@/registry/default/lib/icon-context";
import { SidebarLayout } from "@/app/components/sidebar-layout";
import { DialRoot } from "dialkit";

export const metadata: Metadata = {
  title: "Fluid Functionalism",
  description: "Shadcn components used in service of functional clarity.",
  icons: {
    icon: [
      { url: "/metadata/favicon.svg", type: "image/svg+xml" },
      { url: "/metadata/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/metadata/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/metadata/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/metadata/favicon.ico",
    apple: "/metadata/apple-touch-icon.png",
  },
  manifest: "/metadata/site.webmanifest",
  openGraph: {
    title: "Fluid Functionalism",
    description: "Shadcn components used in service of functional clarity.",
    images: [{ url: "/metadata/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fluid Functionalism",
    description: "Shadcn components used in service of functional clarity.",
    images: ["/metadata/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ShapeProvider defaultShape="pill">
          <ThemeProvider>
            <IconProvider>
              <SidebarLayout>{children}</SidebarLayout>
              <DialRoot />
              <Analytics />
              <SpeedInsights />
            </IconProvider>
          </ThemeProvider>
        </ShapeProvider>
      </body>
    </html>
  );
}
