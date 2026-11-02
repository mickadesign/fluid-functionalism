import { componentList, systemList } from "@/lib/docs/components";
import { installUrl, DUAL_FLAVOR_SLUGS, type Base } from "@/lib/install-url";
import { PROMPT_ENTRIES, type PromptEntry } from "@/lib/docs/prompt-entries";
import { decodePreset, type PresetComponentDef } from "@/lib/preset/components";
import { PRESET_GENERATORS } from "@/lib/preset/generators";
import { SETTING_LABELS, describeSettings } from "@/lib/starter/install";
import { starterSlug, type StarterSettings } from "@/lib/starter/settings";
import type { HeadingFont } from "@/lib/docs/site-settings";
import { googleFontWeights, nearestGoogleFontWeight, type GoogleFont } from "@/lib/docs/google-fonts";
import { ACCENT_PRESETS, DEFAULT_ACCENT, accentCss } from "@/lib/accent";
import {
  SITE,
  OVERWRITE_NOTE,
  SKILL_LINE,
  PROJECT_NEEDS,
  INSTALLED_FILES,
  CHANGELOG_LINE,
  plainDescription,
} from "@/lib/docs/install-brief";

interface BuildInstallPromptOptions {
  /** Doc page slug (matches `componentList` / `systemList`). */
  slug: string;
  /** Registry slug the install command advertises. Defaults to `slug`. */
  installSlug?: string;
  /** Currently selected primitive flavor. Picks the install URL and the
   *  flavor sentence. */
  base: Base;
}

/** Builds the text behind the "Copy prompt" button on every doc page: a
 *  self-contained brief a visitor pastes into an AI coding agent. It carries
 *  the install command, a usage snippet, the main props, a one-line
 *  description, and the docs URL, so the agent can wire the component in
 *  without fetching anything. Per-component usage and props live in
 *  `prompt-entries.ts`; everything else is derived. */
export function buildInstallPrompt({ slug, installSlug, base }: BuildInstallPromptOptions): string {
  const registrySlug = installSlug ?? slug;
  const system = systemList.find((c) => c.slug === slug);
  const entry = system ?? componentList.find((c) => c.slug === slug);
  const name = entry?.name ?? slug;
  const description = plainDescription(entry?.description ?? "");
  const details: PromptEntry | undefined = PROMPT_ENTRIES[slug];
  const dual = DUAL_FLAVOR_SLUGS.has(registrySlug);

  const lines: string[] = [];
  lines.push(
    system
      ? `Add the ${name} system from Fluid Functionalism to my React app.`
      : `Add the ${name} component from Fluid Functionalism to my React app.`,
  );
  lines.push("");
  lines.push("Install (shadcn CLI, pulls the shared libs and npm dependencies on its own):");
  lines.push(`npx shadcn@latest add ${installUrl(registrySlug, base)} --overwrite`);
  lines.push(OVERWRITE_NOTE);

  if (details?.usage) {
    lines.push("");
    lines.push("Usage:");
    lines.push(details.usage.trim());
  }

  if (details?.props?.length) {
    lines.push("");
    lines.push("Props:");
    for (const prop of details.props) lines.push(`- ${prop}`);
  }

  lines.push("");
  lines.push(SKILL_LINE);

  lines.push("");
  const about: string[] = [];
  if (description) about.push(stripTrailingPeriod(description) + ".");
  if (dual) {
    about.push(
      base === "base"
        ? `Base UI flavor. Same API on Radix: ${SITE}/r/${registrySlug}.json.`
        : `Radix flavor. Same API on Base UI: ${SITE}/r/base/${registrySlug}.json.`,
    );
  }
  if (details?.flavorNote) about.push(details.flavorNote);
  about.push(
    `${PROJECT_NEEDS} ${INSTALLED_FILES}`,
  );
  lines.push(about.join(" "));
  lines.push(`Docs: ${SITE}/docs/${slug}`);
  lines.push(CHANGELOG_LINE);

  return lines.join("\n");
}

interface BuildPresetPromptOptions {
  def: PresetComponentDef;
  /** Encoded playground configuration (see lib/preset/codec.ts). */
  code: string;
  base: Base;
}

/** The playground's "Copy prompt": same brief as the doc page, but the
 *  install command is the preset block, and the usage section names the
 *  generated file and its export instead of a hand-written snippet. The
 *  block already composes the component with the chosen options, so the
 *  agent only has to import and render it. */
export function buildPresetPrompt({ def, code, base }: BuildPresetPromptOptions): string {
  const slug = def.docsPath.split("/").pop() ?? "";
  const entry = componentList.find((c) => c.slug === slug);
  const name = entry?.name ?? def.label;
  const description = plainDescription(entry?.description ?? "");
  const details = PROMPT_ENTRIES[slug];
  const dual = DUAL_FLAVOR_SLUGS.has(slug);

  // The generator is pure, so the exact file list is available client-side.
  const decoded = decodePreset(code);
  const generator = PRESET_GENERATORS[def.tag];
  const files = decoded.ok && generator ? generator.files(decoded.preset) : [];

  const lines: string[] = [];
  lines.push(`Add the ${name} I configured on Fluid Functionalism to my React app.`);
  lines.push("");
  lines.push("Install (shadcn CLI, one block with the component, its shared libs, and npm dependencies):");
  lines.push(`npx shadcn@latest add ${SITE}/r/preset/${code}.json --overwrite`);
  lines.push(OVERWRITE_NOTE);

  if (files.length) {
    lines.push("");
    lines.push("Usage:");
    for (const file of files) {
      const exportName = file.content.match(/export (?:default )?function (\w+)/)?.[1];
      lines.push(
        exportName
          ? `- ${file.target} exports ${exportName}. Import it and render it where the ${name.toLowerCase()} belongs.`
          : `- ${file.target}`,
      );
    }
    lines.push(
      `The block already composes the ${name} with the options I picked. Change props in that file, not in components/ui.`,
    );
  }

  if (details?.props?.length) {
    lines.push("");
    lines.push(`Props of the underlying ${name}:`);
    for (const prop of details.props) lines.push(`- ${prop}`);
  }

  lines.push("");
  lines.push(SKILL_LINE);

  lines.push("");
  const about: string[] = [];
  if (description) about.push(stripTrailingPeriod(description) + ".");
  if (dual) about.push(base === "base" ? "Base UI flavor." : "Radix flavor.");
  about.push(
    PROJECT_NEEDS,
  );
  lines.push(about.join(" "));
  lines.push(`Reopen or tweak this configuration: ${SITE}${def.docsPath}?preset=${code}`);
  lines.push(`Docs: ${SITE}/docs/${slug}`);
  lines.push(CHANGELOG_LINE);

  return lines.join("\n");
}

/** The one command that scaffolds a new app from the starter. */
export function starterCommand(settings: StarterSettings): string {
  return `npx shadcn@latest create -n my-app -t next ${SITE}/r/starter/${starterSlug(settings)}.json`;
}

/** The heading font the visitor picked on the site (right panel > Heading
 *  font). Not a starter setting: the starter always ships Inter, so the
 *  brief carries it as a step for the agent. */
export interface StarterHeading {
  font: HeadingFont;
  /** The Google Fonts family, when `font` is "custom". */
  custom: GoogleFont | null;
  /** The custom family's one heading weight; `null` keeps the role
   *  weights (550, display 700). */
  weight: number | null;
}

/** The family a heading choice names, or null for Inter (nothing to do). */
function headingFamily(heading: StarterHeading | undefined): string | null {
  if (!heading || heading.font === "inter") return null;
  if (heading.font === "geist-serif") return "Geist Serif";
  return heading.custom?.n ?? null;
}

/** next/font/google's export for a family: spaces become underscores. */
const nextFontExport = (family: string) => family.replace(/[^A-Za-z0-9]+/g, "_");

/** The step that sets the headings' font, as the site renders it. */
function headingLines(heading: StarterHeading): string[] {
  const css = "app/globals.css";
  if (heading.font === "geist-serif") {
    return [
      "Either way, set the headings in Geist Serif, as picked on the site (body text and components stay Inter):",
      `- Run npm i geist. app/layout.tsx: import { GeistSerifRegular } from "geist/font/serif/regular" and add its .variable class (--font-geist-serif-regular) to <html> next to Inter's.`,
      `- ${css}: h1, h2, h3 { font-family: var(--font-geist-serif-regular), "Times New Roman", serif; font-variation-settings: normal !important; font-weight: 400 !important; font-synthesis-weight: none; }. Geist Serif has one Regular cut so far, so every heading is 400. !important because component titles set Inter's weight inline.`,
      `- Also in ${css}, the display role runs 4px larger for the serif: :root { --fs-display: 32px; --lh-display: 38px; --fs-display-compact: 28px; --lh-display-compact: 34px; } after the type scale.`,
    ];
  }
  const font = heading.custom!;
  const variable = !!font.a?.wght;
  const title = heading.weight ?? 550;
  const display = heading.weight ?? 700;
  // Static families load named cuts only: the ones the headings use.
  const cuts = [...new Set([title, display].map((w) => nearestGoogleFontWeight(font, w)))].sort((a, b) => a - b);
  const load = variable
    ? `{ subsets: ["latin"],${font.a?.opsz ? ` axes: ["opsz"],` : ""} variable: "--font-heading" }`
    : `{ subsets: ["latin"], weight: [${cuts.map((w) => `"${w}"`).join(", ")}], variable: "--font-heading" }`;
  const weights =
    heading.weight === null
      ? `font-weight: 550 !important; } and h1 { font-weight: 700 !important; }`
      : `font-weight: ${heading.weight} !important; }`;
  const available = googleFontWeights(font);
  return [
    `Either way, set the headings in ${font.n} (Google Fonts), as picked on the site (body text and components stay Inter):`,
    `- app/layout.tsx: import { ${nextFontExport(font.n)} } from "next/font/google", load it with ${load} and add its .variable class to <html> next to Inter's.`,
    `- ${css}: h1, h2, h3 { font-family: var(--font-heading), sans-serif; font-variation-settings: normal !important; font-synthesis-weight: none; ${weights} (!important because component titles set Inter's weight axis inline.)`,
    heading.weight === null
      ? `- Headings keep Inter's role weights, 550 and 700 for h1${variable ? "" : `; ${font.n} draws the nearest of its weights (${available.join(", ")})`}.`
      : `- One weight, ${heading.weight}, for every heading, as picked on the site.`,
  ];
}

/** Builds the home page's "Copy prompt": a brief that has an agent start a
 *  new app from the starter with the visitor's "Make them yours" settings,
 *  or, in a folder that already holds an app, install the same components
 *  and settings into it. A heading font other than Inter adds a step that
 *  sets it up the way the site draws it. */
export function buildStarterPrompt(
  settings: StarterSettings,
  heading?: StarterHeading,
  customAccent: string | null = null,
): string {
  const slug = starterSlug(settings);
  const flavor = settings.base === "base" ? "Base UI" : "Radix";
  const family = headingFamily(heading);
  // A custom accent replaces the preset in words; the slug keeps the preset.
  const summary = describeSettings(settings, customAccent);
  // The color an existing app has to set itself: the tokens item installs
  // the default blue.
  const accent = accentCss(settings.accent, customAccent);
  const setAccent = accent !== accentCss(DEFAULT_ACCENT, null);
  const lines: string[] = [];
  lines.push(
    `Start a new React app with Fluid Functionalism: every component installed, every system wired, set to ${summary}${family ? `, ${family} headings` : ""}.`,
  );
  lines.push("");
  lines.push("Run (shadcn CLI, Next.js template, asks nothing):");
  lines.push(starterCommand(settings));
  lines.push("It creates the app in ./my-app; use the project's name instead. Then run npm run dev in it.");
  lines.push("");
  lines.push("What it sets up:");
  lines.push(`- Every component in components/ui (${flavor} flavor), with the libs and hooks they share in lib and hooks.`);
  lines.push("- app/layout.tsx loads Inter with its opsz axis, so labels change weight without changing width.");
  lines.push(
    `- components/providers.tsx holds the settings: next-themes (${settings.theme} by default, D flips light and dark) and FluidProvider (${settings.shape} corners, ${settings.size} size step, ${SETTING_LABELS.icons[settings.icons]} icons, reduced motion that follows the OS). Change a value there and every component follows.`,
  );
  lines.push(
    customAccent
      ? `- app/layout.tsx sets the accent on <html> as --fluid-accent (focus rings, the switch track and every accented detail read it). Change its value to "${customAccent}", the color picked on the site.`
      : `- app/layout.tsx sets the accent on <html> as --fluid-accent (${ACCENT_PRESETS[settings.accent].label.toLowerCase()}, ${accent}): focus rings, the switch track and every accented detail read it.`,
  );
  lines.push("- app/page.tsx: an app shell (sidebar and topbar) around a home screen to replace.");
  lines.push(
    settings.base === "base"
      ? "- components.json registers @fluid, so a later add is short: npx shadcn@latest add @fluid/base/<name> (drop base/ for components with one flavor)."
      : "- components.json registers @fluid, so a later add is short: npx shadcn@latest add @fluid/<name>.",
  );
  lines.push("");
  lines.push("Already in an app with components.json? Install the same components and settings into it instead:");
  lines.push(`npx shadcn@latest add ${SITE}/r/setup/${slug}.json --overwrite`);
  lines.push(OVERWRITE_NOTE);
  lines.push(
    `Then wrap the root layout's children in <FluidRoot> from components/fluid-root.tsx (inside the theme provider, if any), load Inter with axes: ["opsz"], and default the theme to ${settings.theme}.${setAccent ? ` For the accent, put style={{ "--fluid-accent": "${accent}" }} on <html>.` : ""}`,
  );
  lines.push("");
  if (family && heading) {
    lines.push(...headingLines(heading));
    lines.push("");
  }
  lines.push(SKILL_LINE);
  lines.push(`Docs: ${SITE}/docs`);
  lines.push(CHANGELOG_LINE);
  return lines.join("\n");
}

function stripTrailingPeriod(s: string): string {
  return s.replace(/[.\s]+$/, "");
}
