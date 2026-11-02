import type { NextConfig } from "next";

// A request that asks for Markdown first (coding agents send
// `Accept: text/markdown`) gets the page's Markdown at the same URL.
const acceptsMarkdown = [{ type: "header" as const, key: "accept", value: "(.*)text/markdown(.*)" }];

const nextConfig: NextConfig = {
  // The root layout reads content/changelog/ on every route (the site's New
  // and Updated markers, lib/changelog/load.ts). File tracing only finds
  // those files for /changelog itself, so every route ships them explicitly.
  outputFileTracingIncludes: {
    "/**": ["./content/changelog/**/*"],
  },
  // The docs render on demand (the root layout reads the settings cookies),
  // and Next then streams <title> and <link rel="alternate"> to the end of
  // the body for any user agent it doesn't list as a bot, including agents
  // like Claude-User and ChatGPT-User. Every page's metadata is static, so
  // waiting for it costs nothing: keep it in <head> for everyone.
  htmlLimitedBots: /.*/,
  async rewrites() {
    // Every doc page as Markdown, for coding agents (app/md/[slug]/route.ts,
    // built from lib/docs/markdown.ts). beforeFiles, so the negotiated
    // versions win over the HTML pages at the same paths.
    return {
      beforeFiles: [
        { source: "/docs.md", destination: "/md/index" },
        { source: "/docs/:slug.md", destination: "/md/:slug" },
        { source: "/docs", has: acceptsMarkdown, destination: "/md/index" },
        { source: "/docs/:slug", has: acceptsMarkdown, destination: "/md/:slug" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  // Caching: /docs/<slug> answers HTML or Markdown by Accept. The Markdown
  // (static, cacheable) carries `Vary: Accept` from app/md/[slug]/route.ts.
  // The HTML can't: Next replaces a rendered page's Vary with its router
  // headers. It doesn't need to either: it is sent `private, no-store` (the
  // root layout reads cookies), so no shared cache keeps it.
  async redirects() {
    return [
      // The fluid hover hook was published as `use-proximity-hover` until
      // 2026-09-07. Installed components still list it as a registry
      // dependency, so the old URL must keep resolving.
      {
        source: "/r/use-proximity-hover.json",
        destination: "/r/use-fluid-hover.json",
        permanent: true,
      },
      // TabsSubtle was renamed Tabs on 2026-10-28 (the segmented Tabs it
      // replaced was removed). Old install URLs, registry dependencies and
      // doc links keep resolving.
      ...["", "base/", "radix/"].map((dir) => ({
        source: `/r/${dir}tabs-subtle.json`,
        destination: `/r/${dir}tabs.json`,
        permanent: true,
      })),
      { source: "/docs/tabs-subtle", destination: "/docs/tabs", permanent: true },
      { source: "/docs/tabs-subtle.md", destination: "/docs/tabs.md", permanent: true },
      // Short link to the agent skill page, for sharing.
      {
        source: "/skill",
        destination: "/docs/skill",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
