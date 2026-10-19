import { KIND_LABEL, type ChangeEntry, type ChangeRef, type Inline, type Release } from "@/lib/changelog/parse";
import { monthLabel } from "@/lib/changelog/migration-prompt";
import type { EntryInstall } from "@/lib/changelog/install";

// ---------------------------------------------------------------------------
// The whole changelog as one Markdown document, for agents and for anyone
// pasting it into one: served at /changelog.md, and behind the page's Copy
// as Markdown button. Built from the same parsed releases as the page, with
// every link absolute so the text stands on its own.
// ---------------------------------------------------------------------------

const SITE = "https://www.fluidfunctionalism.com";
const REPO = "https://github.com/mickadesign/fluid-functionalism";

function inline(parts: Inline[]): string {
  return parts.map((p) => (p.type === "code" ? `\`${p.value}\`` : p.value)).join("");
}

function ref(r: ChangeRef): string {
  return r.type === "pr" ? `[#${r.number}](${REPO}/pull/${r.number})` : `[${r.sha}](${REPO}/commit/${r.sha})`;
}

/** What to run to get the change, so an agent never maps a page name to a
 *  registry name by guessing. */
function installLine(install: EntryInstall): string {
  switch (install.kind) {
    case "item":
      return install.base
        ? `Install: \`${SITE}/r/${install.name}.json\`, or \`${SITE}/r/base/${install.name}.json\` for the Base UI flavor.`
        : `Install: \`${SITE}/r/${install.name}.json\` (one source for both flavors).`;
    case "skill":
      return "Install: `npx skills add mickadesign/fluid-functionalism`.";
    case "all":
      return "Install: re-install every Fluid Functionalism item the project uses.";
    case "none":
      return "Install: no single item; the sentence names what it touches.";
  }
}

/** Step 1 of a Breaking entry's migration, by what the entry installs. */
const MIGRATE_STEP: Record<EntryInstall["kind"], string> = {
  item: "  1. Re-install it with `--overwrite`, in the project's flavor (the install line above).",
  skill: "  1. Update the skill (the install line above).",
  all: "  1. Re-install every Fluid Functionalism item the project uses, with `--overwrite`, in its flavor.",
  none: "  1. Re-install the items the sentence names, with `--overwrite`, in the project's flavor.",
};

function entry(e: ChangeEntry, install: EntryInstall): string {
  const label = e.href ? `[${e.name}](${SITE}${e.href})` : `**${e.name}**`;
  const lines = [`- ${label}: ${inline(e.text)} (${e.refs.map(ref).join(", ")})`, "", `  ${installLine(install)}`];
  if (e.diff) {
    lines.push(
      "",
      "  Migrate:",
      "",
      MIGRATE_STEP[install.kind],
      "  2. Find each call site matching the `-` lines below and rewrite it to the `+` lines.",
      "  3. Run the type checker.",
      "",
      "  ```diff",
      ...e.diff.replace(/\n+$/, "").split("\n").map((l) => `  ${l}`),
      "  ```",
    );
  }
  return lines.join("\n") + "\n";
}

function day(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** `install` resolves what each entry installs (lib/changelog/install.ts
 *  reads it from the repo); left out, every entry says "no single item". */
export function releasesToMarkdown(
  releases: Release[],
  install: (entry: ChangeEntry) => EntryInstall = () => ({ kind: "none" }),
): string {
  const out: string[] = [
    "# Fluid Functionalism changelog",
    "",
    "Every change to Fluid Functionalism, a shadcn/ui registry of animated React components, month by month. A release lands on the first Friday of the next month.",
    "",
    `- Page: ${SITE}/changelog`,
    "- New: a component or system that just landed.",
    "- Breaking: an API change that needs a migration. Each one carries a diff of the call site, before and after.",
    "- Updated: a change to something already here.",
    `- Install or update a component: \`npx shadcn@latest add ${SITE}/r/<name>.json --overwrite\`, or \`${SITE}/r/base/<name>.json\` for the Base UI flavor. Each entry names its own install line. Diff a file before overwriting it: \`--overwrite\` replaces local edits.`,
    "- Upgrade a whole project: the Fluid Functionalism agent skill (`npx skills add mickadesign/fluid-functionalism`) reads the project's flavor, compares every installed item with the registry, and applies this changelog. Ask it to update Fluid Functionalism.",
  ];

  for (const release of releases) {
    out.push("", `## ${monthLabel(release.month)}`, "");
    if (release.released) out.push(`Released ${day(release.released)}.`, "");
    out.push(`Highlights: ${release.title}`);
    if (release.intro) out.push("", inline(release.intro));
    for (const group of release.groups) {
      out.push("", `### ${KIND_LABEL[group.kind]}`, "", ...group.entries.map((e) => entry(e, install(e))));
    }
  }

  // Entries end on their own blank line; collapse the doubles that leaves
  // before each group heading.
  return out.join("\n").replace(/\n{3,}/g, "\n\n") + "\n";
}
