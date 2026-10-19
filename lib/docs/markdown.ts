// The docs as Markdown, for coding agents: /llms.txt, /llms-full.txt, and
// /docs/<slug>.md (app/md/[slug]/route.ts, reached through the rewrites in
// next.config.ts). An agent reading the HTML pages gets the headings and the
// props tables, but no install command and no code: installation is a Copy
// prompt button and code renders on a click. These pages carry both, built
// from the sources the site already renders, so they cannot drift:
//   - lib/docs/components.ts: names, descriptions, system install items
//   - lib/docs/prompt-entries.ts: usage snippets, props, flavor notes
//   - lib/docs/api/*: the PropsTables, the same arrays the pages render
//   - lib/docs/install-brief.ts: the lines every install brief shares
// Server-safe on purpose: no React, no "use client" imports.
import {
  componentList,
  systemList,
  skillEntry,
  type ComponentEntry,
  type SystemEntry,
} from "@/lib/docs/components";
import { PROMPT_ENTRIES } from "@/lib/docs/prompt-entries";
import { API_REFERENCE } from "@/lib/docs/api";
import type { ApiTable } from "@/lib/docs/api/types";
import {
  DUAL_FLAVOR_SLUGS,
  FLAVORED_SINGLE_SOURCE_SLUGS,
  installUrl,
} from "@/lib/install-url";
import {
  SITE,
  OVERWRITE_NOTE,
  PROJECT_NEEDS,
  INSTALLED_FILES,
  SKILL_INSTALL_COMMAND,
  plainDescription,
} from "@/lib/docs/install-brief";
import { DEFAULT_SLUG } from "@/lib/starter/settings";

const REPO = "https://github.com/mickadesign/fluid-functionalism";
const CRAFT = `${REPO}/blob/main/skills/fluid-functionalism/references/craft.md`;

const SUMMARY =
  "Animated React components for shadcn/ui, in Radix and Base UI flavors, sharing one motion system: three spring speeds, a hover highlight that glides to the item nearest the cursor, and labels that change weight without layout shift.";

const FONT_LINE =
  'Load Inter with its `opsz` axis as well as `wght` (with next/font: `Inter({ subsets: ["latin"], axes: ["opsz"] })`), so labels change weight without changing width.';

type DocEntry = (SystemEntry | ComponentEntry) & { kind: "system" | "component" | "skill" };

/** Every doc page that has a Markdown version, in sidebar order. */
export const MARKDOWN_PAGES: DocEntry[] = [
  ...[...systemList, skillEntry]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((e) => ({ ...e, kind: e === skillEntry ? ("skill" as const) : ("system" as const) })),
  ...componentList.map((e) => ({ ...e, kind: "component" as const })),
];

export function markdownUrl(slug: string): string {
  return `${SITE}/docs/${slug}.md`;
}

/** The Markdown of one doc page, or null for an unknown slug. */
export function docMarkdown(slug: string): string | null {
  const entry = MARKDOWN_PAGES.find((e) => e.slug === slug);
  if (!entry) return null;
  return entry.kind === "skill" ? skillMarkdown(entry) : pageMarkdown(entry);
}

/** /llms.txt, and /docs.md: what the library is, how to install it, and
 *  every page with a one-line description (https://llmstxt.org). */
export function llmsTxt(): string {
  const lines: string[] = [];
  lines.push("# Fluid Functionalism", "", `> ${SUMMARY}`, "");
  lines.push(
    "Every page below is Markdown with the install command, a usage example, and the full props reference. Add `.md` to any docs URL to get this version of it.",
    "",
  );
  lines.push("## Install", "");
  lines.push(
    "Install one component with the shadcn CLI. The bare URL installs the Radix flavor; put `base/` before the name for Base UI. Components without a Base UI flavor have one URL that works in both kinds of project. Dependencies, shared libs, and hooks resolve on their own.",
    "",
    "```bash",
    `npx shadcn@latest add ${SITE}/r/button.json --overwrite`,
    `npx shadcn@latest add ${SITE}/r/base/button.json --overwrite`,
    "```",
    "",
    "Or register the namespace once, then install by name:",
    "",
    "```bash",
    "npx shadcn@latest registry add @fluid",
    "npx shadcn@latest add @fluid/button --overwrite",
    "npx shadcn@latest add @fluid/base/button --overwrite",
    "```",
    "",
    "Or start a new Next.js app with every component installed and every system wired (Base UI flavor; use `radix.json` for Radix):",
    "",
    "```bash",
    `npx shadcn@latest create -n my-app -t next ${SITE}/r/starter/${DEFAULT_SLUG}.json`,
    "```",
    "",
  );
  lines.push(`- ${OVERWRITE_NOTE}`);
  lines.push(`- ${PROJECT_NEEDS} ${FONT_LINE}`);
  lines.push(
    "- Icons render through named slots with Lucide defaults, so `lucide-react` is the only icon dependency. Wrap the app in `IconProvider` from `@/lib/icon-context` and pass `icons={{ \"chevron-right\": MyIcon }}` to swap any slot.",
  );
  lines.push(`- Registry index: ${SITE}/r/registry.json`);
  lines.push(
    `- Changelog: every change, month by month, with an install URL per entry and migration steps for breaking changes: ${SITE}/changelog.md`,
  );
  lines.push(
    `- For a whole project, the agent skill carries the craft behind every component: \`npx skills add mickadesign/fluid-functionalism\` (${SITE}/docs/skill.md)`,
  );
  lines.push("");

  lines.push("## System", "");
  for (const e of MARKDOWN_PAGES.filter((p) => p.kind !== "component")) {
    lines.push(`- [${e.name}](${markdownUrl(e.slug)}): ${plainDescription(e.description)}`);
  }
  lines.push("", "## Components", "");
  for (const e of MARKDOWN_PAGES.filter((p) => p.kind === "component")) {
    lines.push(`- [${e.name}](${markdownUrl(e.slug)}): ${plainDescription(e.description)}`);
  }
  lines.push("", "## Optional", "");
  lines.push(`- [Every page in one file](${SITE}/llms-full.txt): this index followed by every page above`);
  lines.push(`- [Compare with shadcn/ui](${SITE}/compare): each component next to the shadcn original`);
  lines.push(`- [Source on GitHub](${REPO})`);
  return lines.join("\n") + "\n";
}

/** /llms-full.txt: the index, then every page, for agents that want the
 *  whole library in one request. */
export function llmsFullTxt(): string {
  const pages = MARKDOWN_PAGES.map((e) => docMarkdown(e.slug)!.trimEnd());
  return [llmsTxt().trimEnd(), ...pages].join("\n\n---\n\n") + "\n";
}

// ---------------------------------------------------------------------------

function pageMarkdown(entry: DocEntry): string {
  const { slug, name } = entry;
  const system = entry.kind === "system" ? (entry as SystemEntry) : undefined;
  const registrySlug = system?.installSlug ?? slug;
  const prompt = PROMPT_ENTRIES[slug];
  const api = API_REFERENCE[slug] ?? [];

  const lines: string[] = [];
  lines.push(`# ${name}`, "", `> ${plainDescription(entry.description)}`, "");
  lines.push(
    `${entry.kind === "system" ? "A system" : "A component"} of Fluid Functionalism, a shadcn/ui registry of animated React components. Live demos and playground: ${SITE}/docs/${slug}. Every page: ${SITE}/llms.txt`,
    "",
  );

  lines.push(...installSection(registrySlug, system?.installNote, prompt?.flavorNote));

  if (prompt?.usage) {
    lines.push("## Usage", "", "```tsx", prompt.usage.trim(), "```", "");
  }

  if (api.length) {
    lines.push("## API reference", "");
    for (const table of api) lines.push(...apiTable(table, api.length > 1));
  } else if (prompt?.props?.length) {
    // Pages without a PropsTable (Motion, Surfaces, Typography) still have
    // the Copy prompt's one-line API.
    lines.push("## API reference", "");
    for (const prop of prompt.props) lines.push(`- ${prop}`);
    lines.push("");
  }

  lines.push("## Design details", "");
  lines.push(
    `The exact behaviors and values behind ${name} ship in the Fluid Functionalism skill: \`npx skills add mickadesign/fluid-functionalism\`. Read them without installing: ${CRAFT}#${slug}`,
  );
  return lines.join("\n") + "\n";
}

function skillMarkdown(entry: DocEntry): string {
  return [
    "# Fluid Functionalism skill",
    "",
    `> ${plainDescription(entry.description)}`,
    "",
    `An agent skill (SKILL.md) for coding agents. It reads the project's stack, suggests 2 to 5 upgrades ranked by what users will notice, then installs what fits and matches the rest to the same system. It writes no files of its own into the project. Live page: ${SITE}/docs/skill`,
    "",
    "## Install",
    "",
    "```bash",
    SKILL_INSTALL_COMMAND,
    "```",
    "",
    "`-g` installs it for the user rather than into the repo; `-y` skips the CLI's questions. Then read its SKILL.md and use it to audit the project.",
    "",
    "## What it ships",
    "",
    `- SKILL.md: when to use it and the workflow. ${REPO}/blob/main/skills/fluid-functionalism/SKILL.md`,
    `- references/components.md: the component catalog with registry names. ${REPO}/blob/main/skills/fluid-functionalism/references/components.md`,
    `- references/craft.md: the interaction-design decisions built into each component and system. ${CRAFT}`,
    `- references/custom-motion.md: writing custom UI that fits the system. ${REPO}/blob/main/skills/fluid-functionalism/references/custom-motion.md`,
    `- references/stack-audit.md: the project stack read and audit. ${REPO}/blob/main/skills/fluid-functionalism/references/stack-audit.md`,
    "",
  ].join("\n");
}

function installSection(
  registrySlug: string,
  installNote: string | undefined,
  flavorNote: string | undefined,
): string[] {
  const flavored = DUAL_FLAVOR_SLUGS.has(registrySlug) || FLAVORED_SINGLE_SOURCE_SLUGS.has(registrySlug);
  const lines: string[] = ["## Install", ""];
  if (installNote) lines.push(plainDescription(installNote), "");

  if (flavored) {
    lines.push(
      "Pick the flavor that matches the project's primitives: Radix when package.json has `radix-ui` or `@radix-ui/*`, Base UI when it has `@base-ui/react`. Dependencies follow the flavor.",
      "",
      "```bash",
      "# Radix",
      `npx shadcn@latest add ${installUrl(registrySlug, "radix")} --overwrite`,
      "# Base UI",
      `npx shadcn@latest add ${installUrl(registrySlug, "base")} --overwrite`,
      "```",
      "",
    );
    if (flavorNote) lines.push(flavorNote, "");
    lines.push(
      `With the \`@fluid\` namespace registered: \`npx shadcn@latest add @fluid/${registrySlug}\` (Radix) or \`@fluid/base/${registrySlug}\` (Base UI).`,
      "",
    );
  } else {
    lines.push(
      "One source for both Radix and Base UI projects.",
      "",
      "```bash",
      `npx shadcn@latest add ${installUrl(registrySlug, "radix")} --overwrite`,
      "```",
      "",
    );
    if (flavorNote) lines.push(flavorNote, "");
    lines.push(`With the \`@fluid\` namespace registered: \`npx shadcn@latest add @fluid/${registrySlug}\`.`, "");
  }

  lines.push(`- ${OVERWRITE_NOTE}`, `- ${PROJECT_NEEDS} ${FONT_LINE}`, `- ${INSTALLED_FILES}`, "");
  return lines;
}

function apiTable(table: ApiTable, withHeading: boolean): string[] {
  const lines: string[] = [];
  if (withHeading) lines.push(`### ${table.title}`, "");
  const withDefault = table.props.some((p) => p.default !== undefined);
  lines.push(withDefault ? "| Prop | Type | Default | Description |" : "| Prop | Type | Description |");
  lines.push(withDefault ? "| --- | --- | --- | --- |" : "| --- | --- | --- |");
  for (const p of table.props) {
    const cells = [code(p.name), code(p.type)];
    if (withDefault) cells.push(p.default === undefined ? "" : formatDefault(p.default));
    cells.push(cell(p.description));
    lines.push(`| ${cells.join(" | ")} |`);
  }
  lines.push("");
  return lines;
}

/** Table-safe text: pipes escaped, newlines flattened. */
function escapeCell(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ").trim();
}

/** A prose cell. Tags the descriptions mention ("a <button>") go in code
 *  spans, so a Markdown viewer shows them instead of rendering them. */
function cell(s: string): string {
  return escapeCell(s).replace(/<\/?[A-Za-z][^<>]*>/g, (tag) => `\`${tag}\``);
}

/** Inline code that survives a table cell (GFM wants pipes escaped even
 *  inside code spans) and values that contain a backtick. */
function code(s: string): string {
  const body = escapeCell(s);
  return body.includes("`") ? `\`\` ${body} \`\`` : `\`${body}\``;
}

/** Literal defaults read as code; prose defaults ("from SizeProvider") as text. */
function formatDefault(d: string): string {
  return /^(["'`[{(\-\d]|true$|false$|null$|undefined$)/.test(d) ? code(d) : cell(d);
}
