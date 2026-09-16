import { componentList, systemList } from "@/lib/docs/components";
import { installUrl, DUAL_FLAVOR_SLUGS, type Base } from "@/lib/base-context";
import { PROMPT_ENTRIES, type PromptEntry } from "@/lib/docs/prompt-entries";
import { decodePreset, type PresetComponentDef } from "@/lib/preset/components";
import { PRESET_GENERATORS } from "@/lib/preset/generators";

const SITE = "https://www.fluidfunctionalism.com";

/** Why the install command carries --overwrite: a stock shadcn project already
 *  has button.tsx, dialog.tsx, tooltip.tsx and friends, and this library's
 *  files install under the same names. Without the flag the CLI asks per
 *  existing file (default No), so a person keeps the stock file next to the
 *  new ones, and an agent's non-interactive shell exits at the question after
 *  the CSS and npm dependencies were already written. */
const OVERWRITE_NOTE =
  "--overwrite replaces same-named stock shadcn files (button.tsx, dialog.tsx, ...) with this library's versions. Without it the CLI prompts per existing file and exits in a non-interactive shell before any component is written.";

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
  // Site copy allows a spaced em dash in descriptions; the prompt does not.
  const description = (entry?.description ?? "").replace(/\s+\u2014\s+/g, ": ");
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

  if (details?.craft?.length) {
    lines.push("");
    lines.push("Craft (built-in behaviors — compose around them, don't re-implement or fight them):");
    for (const point of details.craft) lines.push(`- ${point}`);
  }

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
    "Needs a shadcn-style project: Tailwind v4, the `@/` alias, and the Inter variable font loaded for the weight animations. Installed files land in components/ui, lib, and hooks. Compose with props and className rather than editing them.",
  );
  lines.push(about.join(" "));
  lines.push(`Docs: ${SITE}/docs/${slug}`);

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
  const description = (entry?.description ?? "").replace(/\s+\u2014\s+/g, ": ");
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
  const about: string[] = [];
  if (description) about.push(stripTrailingPeriod(description) + ".");
  if (dual) about.push(base === "base" ? "Base UI flavor." : "Radix flavor.");
  about.push(
    "Needs a shadcn-style project: Tailwind v4, the `@/` alias, and the Inter variable font loaded for the weight animations.",
  );
  lines.push(about.join(" "));
  lines.push(`Reopen or tweak this configuration: ${SITE}${def.docsPath}?preset=${code}`);
  lines.push(`Docs: ${SITE}/docs/${slug}`);

  return lines.join("\n");
}

function stripTrailingPeriod(s: string): string {
  return s.replace(/[.\s]+$/, "");
}
