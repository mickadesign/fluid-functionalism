import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
