import type { Metadata } from "next";
import "./globals.css";
import "dialkit/styles.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ShapeProvider } from "@/registry/default/lib/shape-context";
import { ThemeProvider } from "@/registry/default/lib/theme-context";
import { IconProvider } from "@/registry/default/lib/icon-context";
import { BaseProvider } from "@/lib/base-context";
import { SidebarLayout } from "@/app/components/sidebar-layout";
import { DialRoot } from "dialkit";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.fluidfunctionalism.com"),
  title: "Fluid Functionalism",
  description: "Open Source UI components created by @micka_design",
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
    description: "Open Source UI components created by @micka_design",
    images: [{ url: "/metadata/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fluid Functionalism",
    description: "Open Source UI components created by @micka_design",
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
              <BaseProvider>
                <SidebarLayout>{children}</SidebarLayout>
                <DialRoot />
                <Analytics />
                <SpeedInsights />
              </BaseProvider>
            </IconProvider>
          </ThemeProvider>
        </ShapeProvider>
      </body>
    </html>
  );
}
