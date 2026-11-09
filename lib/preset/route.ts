import { NextResponse } from "next/server";
import { decodePreset } from "@/lib/preset/components";
import { PRESET_GENERATORS } from "@/lib/preset/generators";
// Same flavor rules as the postbuild's resolver — a parity test keeps the
// two in lockstep (tests/preset-route.test.mjs).
import { buildDepResolver, fluidHoverClosure, standardHoverUrl } from "@/lib/registry-urls.mjs";
import registryManifest from "@/registry.json";

const depUrl = buildDepResolver(registryManifest.items);
const closure = fluidHoverClosure(registryManifest.items);
const SITE = "https://www.fluidfunctionalism.com";

// A preset code is a deterministic, stateless encoding of a playground
// configuration (see lib/preset/codec.ts) — the response is immutable.
const CACHE = "public, max-age=31536000, immutable";

/** GET handler for /r/preset/[code], and with standard hover for its twin
 *  /r/standard/preset/[code], whose dependencies install from r/standard/. */
export function presetRoute(hover: "fluid" | "standard" = "fluid") {
  return async function GET(
    _req: Request,
    { params }: { params: Promise<{ code: string }> }
  ) {
    const { code: raw } = await params;
    const code = raw.replace(/\.json$/, "");
    const decoded = decodePreset(code);
    if (!decoded.ok) {
      return NextResponse.json(
        { error: decoded.error },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }
    const { def, preset } = decoded;
    const generator = PRESET_GENERATORS[def.tag];
    if (!def.installable || !generator) {
      return NextResponse.json(
        {
          error: `${def.label} presets are share-only — open ${SITE}${def.docsPath}?preset=${code} instead.`,
        },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }
    const slug = def.docsPath.split("/").pop();
    const flavor = (preset.flavor as string) === "base" ? "base" : "radix";
    const item = {
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name: `${slug}-preset-${code}`,
      type: "registry:block",
      title: generator.title,
      description: generator.description,
      docs: `Reopen or tweak this configuration: ${SITE}${def.docsPath}?preset=${code}`,
      dependencies: generator.npmDeps(preset),
      registryDependencies: generator
        .registryDeps(preset)
        .map((dep) => depUrl(dep, flavor))
        .map((dep) => (hover === "standard" ? standardHoverUrl(dep, closure) : dep)),
      files: generator.files(preset),
    };
    return NextResponse.json(item, {
      headers: { "Cache-Control": CACHE, "Content-Type": "application/json" },
    });
  };
}
