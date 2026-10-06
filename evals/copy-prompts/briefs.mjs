// Every Copy prompt the site hands out, built by the site's own builders so
// the sweep tests the exact text people copy: one brief per doc page and
// flavor, plus each installable playground's default preset in both flavors.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createJiti } from "jiti";

export const ROOT = fileURLToPath(new URL("../..", import.meta.url));

// The skill page's prompt installs the skill, not a registry item.
const NOT_A_COMPONENT = new Set(["skill"]);

/** Doc pages with an install block, and the registry item each one installs
 *  (`installSlug` on DocPage, e.g. surfaces → elevated). */
export function docPages(root = ROOT) {
  const dir = join(root, "app/docs");
  return readdirSync(dir)
    .filter(
      (name) =>
        !NOT_A_COMPONENT.has(name) &&
        statSync(join(dir, name)).isDirectory() &&
        existsSync(join(dir, name, "page.tsx")),
    )
    .sort()
    .map((slug) => {
      const page = readFileSync(join(dir, slug, "page.tsx"), "utf8");
      return { slug, installSlug: /installSlug="([^"]+)"/.exec(page)?.[1] ?? slug };
    });
}

/** The install line of a brief: the command an agent should run. */
export function parseInstallCommand(prompt) {
  const match = /^npx shadcn@latest add (https:\/\/\S+)(.*)$/m.exec(prompt);
  if (!match) return null;
  return { command: match[0].trim(), url: match[1] };
}

/** Briefs that differ by flavor run in a project of that flavor. The rest
 *  have one payload and run in a Base UI project, the site's default flavor
 *  and the one `shadcn init` picks since 4.21. */
function flavorsFor(installSlug, flavored) {
  return flavored.has(installSlug) ? ["base", "radix"] : ["base"];
}

const COMPONENT = /export (default )?function (\w+)/;
const ROUTE = /^app\/(?:(.+)\/)?page\.(t|j)sx$/;

function presetRender(files) {
  const page = files.find((f) => ROUTE.test(f.target));
  if (page) return { route: `/${ROUTE.exec(page.target)[1] ?? ""}` };
  const file = files.find((f) => COMPONENT.test(f.content));
  if (!file) return null;
  const [, isDefault, exportName] = COMPONENT.exec(file.content);
  return { importPath: "@/" + file.target.replace(/\.(t|j)sx?$/, ""), exportName, isDefault: !!isDefault };
}

export async function listBriefs(root = ROOT) {
  const jiti = createJiti(import.meta.url, { alias: { "@/": root }, jsx: true });
  const { buildInstallPrompt, buildPresetPrompt } = await jiti.import(
    join(root, "lib/docs/install-prompt.ts"),
  );
  const { systemList, componentList } = await jiti.import(join(root, "lib/docs/components.ts"));
  const presets = await jiti.import(join(root, "lib/preset/components.ts"));
  const { PRESET_GENERATORS } = await jiti.import(join(root, "lib/preset/generators.ts"));
  const { DUAL_FLAVOR_SLUGS, FLAVORED_SINGLE_SOURCE_SLUGS } = await import(
    pathToFileURL(join(root, "lib/dual-flavor-slugs.mjs")).href
  );
  const flavored = new Set([...DUAL_FLAVOR_SLUGS, ...FLAVORED_SINGLE_SOURCE_SLUGS]);
  const systems = new Set(systemList.map((s) => s.slug));
  const names = new Map([...systemList, ...componentList].map((e) => [e.slug, e.name]));

  const briefs = [];
  for (const { slug, installSlug } of docPages(root)) {
    for (const flavor of flavorsFor(installSlug, flavored)) {
      const prompt = buildInstallPrompt({ slug, installSlug, base: flavor });
      briefs.push({
        id: `${slug}@${flavor}`,
        kind: "doc",
        slug,
        name: names.get(slug) ?? slug,
        installSlug,
        flavor,
        system: systems.has(slug),
        prompt,
        install: parseInstallCommand(prompt),
        docsUrl: `https://www.fluidfunctionalism.com/docs/${slug}`,
      });
    }
  }

  const defs = Object.entries(presets)
    .filter(([key, def]) => key.endsWith("_PRESET_DEF") && def.installable)
    .map(([, def]) => def)
    .sort((a, b) => a.docsPath.localeCompare(b.docsPath));
  for (const def of defs) {
    const slug = def.docsPath.split("/").pop();
    for (const flavor of ["base", "radix"]) {
      const code = presets.encodePreset(def, { flavor });
      const decoded = presets.decodePreset(code);
      const files = decoded.ok ? PRESET_GENERATORS[def.tag].files(decoded.preset) : [];
      const prompt = buildPresetPrompt({ def, code, base: flavor });
      briefs.push({
        id: `preset:${slug}@${flavor}`,
        kind: "preset",
        slug,
        name: `${names.get(slug) ?? def.label} preset`,
        installSlug: `preset/${code}`,
        flavor,
        system: false,
        prompt,
        install: parseInstallCommand(prompt),
        docsUrl: `https://www.fluidfunctionalism.com${def.docsPath}?preset=${code}`,
        // How the no-agent run shows the block the way the brief says to:
        // import its component and render it, or open the route it ships.
        render: presetRender(files),
      });
    }
  }
  return briefs;
}
