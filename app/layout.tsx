import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ShapeProvider } from "@/registry/default/lib/shape-context";
import { ThemeProvider } from "@/registry/default/lib/theme-context";
import { SidebarLayout } from "@/app/components/sidebar-layout";

export const metadata: Metadata = {
  title: "Fluid Functionalism",
  description: "Shadcn components used in service of functional clarity.",
  openGraph: {
    title: "Fluid Functionalism",
    description: "Shadcn components used in service of functional clarity.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fluid Functionalism",
    description: "Shadcn components used in service of functional clarity.",
    images: ["/og.png"],
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
        <ShapeProvider defaultShape="rounded">
          <ThemeProvider>
            <SidebarLayout>{children}</SidebarLayout>
            <Analytics />
            <SpeedInsights />
          </ThemeProvider>
        </ShapeProvider>
      </body>
    </html>
  );
}
