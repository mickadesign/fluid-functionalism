import type { Metadata } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import { MotionConfig } from "motion/react";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ShapeProvider } from "@/registry/default/lib/shape-context";
import { OG_IMAGES, OG_VIDEOS } from "@/lib/og-media";
import { SizeProvider } from "@/registry/default/lib/size-context";
import { ThemeProvider } from "@/registry/default/lib/theme-context";
import { IconPlaygroundProvider } from "@/lib/docs/icon-playground";
import { ShapeShortcut } from "@/lib/docs/shape-shortcut";
import { SizeShortcut } from "@/lib/docs/size-shortcut";
import { SizeAttribute } from "@/lib/docs/size-attribute";
import { SettingsToast } from "@/lib/docs/settings-toast";
import { SettingsPersistence } from "@/lib/docs/settings-persistence";
import { readCustomAccent, readHeadingFont, readSettings } from "@/lib/docs/site-settings";
import { AccentProvider, AccentShortcut } from "@/lib/docs/accent";
import { accentCss } from "@/lib/accent";
import { HeadingFontProvider, HeadingFontShortcut } from "@/lib/docs/heading-font";
import googleFonts from "@/lib/docs/google-fonts.json";
import { customHeadingVars, googleFontWeights, type GoogleFont } from "@/lib/docs/google-fonts";
import { BaseProvider } from "@/lib/base-context";
import { SidebarLayout } from "@/app/components/sidebar-layout";
import { GitHubStarsProvider } from "@/app/components/right-panel";
import { getGitHubStars } from "@/lib/github-stars";
import { latestMarks } from "@/lib/changelog/load";

// The optional serif for headings (right panel > Heading font, or F):
// Vercel's display serif, one Regular cut so far and not on Google Fonts, so
// the file is vendored from the geist package (OFL, app/fonts). Not
// preloaded: only visitors who pick it download it.
const geistSerif = localFont({
  src: "./fonts/GeistSerif-Regular.woff2",
  weight: "400",
  display: "swap",
  preload: false,
  fallback: ["Times New Roman", "Times", "serif"],
  adjustFontFallback: "Times New Roman",
  variable: "--font-geist-serif",
});

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
    images: OG_IMAGES,
    videos: OG_VIDEOS,
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
  // The star count rides along so the panel's GitHub button paints with
  // its number instead of widening when a client fetch lands.
  const [cookieStore, stars] = await Promise.all([cookies(), getGitHubStars()]);
  const sidebarDefaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  // The "Make them yours" settings, saved one cookie each by
  // SettingsPersistence: rendering them here means a reload paints the
  // visitor's theme, radius, size, icons and primitive from the first frame.
  const settings = readSettings((name) => cookieStore.get(name)?.value);
  // A custom accent overrides the preset; either way the color goes inline
  // on <html>, so focus rings paint in it from the first frame.
  const customAccent = readCustomAccent((name) => cookieStore.get(name)?.value);
  // The heading font, and the Google Fonts family behind "custom": unknown
  // to the catalog, it falls back to Inter.
  const saved = readHeadingFont((name) => cookieStore.get(name)?.value);
  const customFont = saved.customFamily
    ? ((googleFonts as GoogleFont[]).find((f) => f.n === saved.customFamily) ?? null)
    : null;
  const headingFont = saved.font === "custom" && !customFont ? "inter" : saved.font;
  // A saved weight the family doesn't have reads as Auto.
  const customWeight =
    customFont && saved.customWeight !== null && googleFontWeights(customFont).includes(saved.customWeight)
      ? saved.customWeight
      : null;

  return (
    <html
      lang="en"
      // Mirrors what ThemeProvider and SizeAttribute apply on the client, so
      // a saved dark theme or compact size never paints the default first.
      className={settings.theme === "system" ? geistSerif.variable : `${settings.theme} ${geistSerif.variable}`}
      data-size={settings.size}
      data-font={headingFont}
      style={
        {
          "--fluid-accent": accentCss(settings.accent, customAccent),
          ...(customFont ? customHeadingVars(customFont, customWeight) : {}),
        } as React.CSSProperties
      }
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
                    <AccentProvider defaultPreset={settings.accent} defaultCustom={customAccent}>
                      <AccentShortcut />
                      <HeadingFontProvider defaultFont={headingFont} defaultCustom={customFont} defaultWeight={customWeight}>
                        <HeadingFontShortcut />
                        <SettingsPersistence />
                        {/* The sidebar's New dots: what the latest changelog
                            release lists as New, read from content/changelog. */}
                        <GitHubStarsProvider stars={stars}>
                          <SidebarLayout defaultOpen={sidebarDefaultOpen} marks={latestMarks()}>
                            {children}
                          </SidebarLayout>
                        </GitHubStarsProvider>
                        <SettingsToast />
                        <Analytics />
                        <SpeedInsights />
                      </HeadingFontProvider>
                    </AccentProvider>
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
