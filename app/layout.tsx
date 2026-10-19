import type { Metadata } from "next";
import { cookies } from "next/headers";
import { MotionConfig } from "motion/react";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ShapeProvider } from "@/registry/default/lib/shape-context";
import { SizeProvider } from "@/registry/default/lib/size-context";
import { ThemeProvider } from "@/registry/default/lib/theme-context";
import { IconPlaygroundProvider } from "@/lib/docs/icon-playground";
import { ShapeShortcut } from "@/lib/docs/shape-shortcut";
import { SizeShortcut } from "@/lib/docs/size-shortcut";
import { SizeAttribute } from "@/lib/docs/size-attribute";
import { SettingsToast } from "@/lib/docs/settings-toast";
import { SettingsPersistence } from "@/lib/docs/settings-persistence";
import { readSettings } from "@/lib/docs/site-settings";
import { BaseProvider } from "@/lib/base-context";
import { SidebarLayout } from "@/app/components/sidebar-layout";
import { latestMarks } from "@/lib/changelog/load";

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
    images: [{ url: "/metadata/og.png", width: 2400, height: 1260 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fluid Functionalism",
    description: "Open Source UI components created by @micka_design",
    images: ["/metadata/og.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-side read of the sidebar's persisted open state so the rail
  // renders in its last position with no post-hydration flicker. A missing
  // cookie means open — the component's own default.
  const cookieStore = await cookies();
  const sidebarDefaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  // The "Make them yours" settings, saved one cookie each by
  // SettingsPersistence: rendering them here means a reload paints the
  // visitor's theme, radius, size, icons and primitive from the first frame.
  const settings = readSettings((name) => cookieStore.get(name)?.value);

  return (
    <html
      lang="en"
      // Mirrors what ThemeProvider and SizeAttribute apply on the client, so
      // a saved dark theme or compact size never paints the default first.
      className={settings.theme === "system" ? undefined : settings.theme}
      data-size={settings.size}
    >
      {/* Font smoothing (antialiased/grayscale) is set globally in globals.css */}
      <body>
        {/* reducedMotion="user" makes every Motion component honor the
            OS "reduce motion" setting: transform / scale / position / layout
            animations are dropped, opacity and color fades are kept. One switch
            for the whole system — see motion-guidelines.md. */}
        <MotionConfig reducedMotion="user">
          <ShapeProvider defaultShape={settings.shape}>
            <ShapeShortcut />
            <SizeProvider defaultSize={settings.size}>
              <SizeShortcut />
              <SizeAttribute />
              <ThemeProvider defaultTheme={settings.theme}>
                <IconPlaygroundProvider defaultLibrary={settings.icons}>
                  <BaseProvider defaultBase={settings.base}>
                    <SettingsPersistence />
                    {/* The sidebar's New dots: what the latest changelog
                        release lists as New, read from content/changelog. */}
                    <SidebarLayout defaultOpen={sidebarDefaultOpen} marks={latestMarks()}>
                      {children}
                    </SidebarLayout>
                    <SettingsToast />
                    <Analytics />
                    <SpeedInsights />
                  </BaseProvider>
                </IconPlaygroundProvider>
              </ThemeProvider>
            </SizeProvider>
          </ShapeProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
