import type { MetadataRoute } from "next";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { UNLISTED_SLUGS } from "@/lib/docs/components";

const SITE_URL = "https://www.fluidfunctionalism.com";

// Internal/dev-only routes, plus noindex pages (see robots metadata in
// app/concepts/layout.tsx and app/stars/layout.tsx), kept out of the sitemap.
const EXCLUDE = [
  "/demo",
  "/compare-bases",
  "/slider",
  "/table",
  "/concepts",
  "/stars",
  // Live but not launched yet (see UNLISTED_SLUGS).
  ...[...UNLISTED_SLUGS].map((slug) => `/docs/${slug}`),
];

function collectRoutes(dir: string, base = ""): string[] {
  const routes: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith("_") || entry.name.startsWith("(")) continue;
    const route = `${base}/${entry.name}`;
    const childDir = join(dir, entry.name);
    if (readdirSync(childDir).includes("page.tsx")) routes.push(route);
    routes.push(...collectRoutes(childDir, route));
  }
  return routes;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const appDir = join(process.cwd(), "app");
  const lastModified = new Date();

  const routes = ["/", ...collectRoutes(appDir)].filter(
    (route) =>
      !EXCLUDE.some((prefix) => route === prefix || route.startsWith(`${prefix}/`)),
  );

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified,
    changeFrequency: route.startsWith("/docs") ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route.startsWith("/docs") ? 0.8 : 0.5,
  }));
}
