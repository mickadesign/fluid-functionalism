import { NextResponse } from "next/server";
// Same flavor rules as the postbuild's resolver; tests/preset-route.test.mjs
// keeps the two in lockstep.
import { buildDepResolver, fluidHoverClosure, standardHoverUrl } from "@/lib/registry-urls.mjs";
import registryManifest from "@/registry.json";
import { parseStarterSlug } from "./settings";
import { buildSetupItem, buildStarterItem } from "./install";

const depUrl = buildDepResolver(registryManifest.items);
const closure = fluidHoverClosure(registryManifest.items);

/** A slug is a stateless spelling of the settings, but the payload embeds
 *  the current registry, so it changes with every deploy: cache for an hour
 *  at the edge, not forever like a preset. */
const CACHE = "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";

/** GET handler for /r/starter/[slug] and /r/setup/[slug], and their
 *  standard-hover twins under /r/standard/. */
export function starterRoute(kind: "starter" | "setup", hover: "fluid" | "standard" = "fluid") {
  return async function GET(
    _req: Request,
    { params }: { params: Promise<{ slug: string }> },
  ) {
    const { slug: raw } = await params;
    const parsed = parseStarterSlug(raw.replace(/\.json$/, ""));
    if (!parsed.ok) {
      return NextResponse.json(
        { error: parsed.error },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    const build = kind === "starter" ? buildStarterItem : buildSetupItem;
    const item = build(parsed.settings, registryManifest.items, depUrl);
    if (hover === "standard") {
      item.registryDependencies = item.registryDependencies.map((dep) => standardHoverUrl(dep, closure));
    }
    return NextResponse.json(item, {
      headers: { "Cache-Control": CACHE, "Content-Type": "application/json" },
    });
  };
}
