import type { Metadata } from "next";
import "./globals.css";
import { ShapeProvider } from "@/registry/default/lib/shape-context";
import { SidebarLayout } from "@/app/components/sidebar-layout";

export const metadata: Metadata = {
  title: "Fluid Functionalism",
  description: "Fluid components used exclusively in service of functional clarity.",
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
          <SidebarLayout>{children}</SidebarLayout>
        </ShapeProvider>
      </body>
    </html>
  );
}
