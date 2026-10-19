import type { Base } from "@/lib/install-url";
import { OVERWRITE_NOTE, SITE } from "@/lib/docs/install-brief";
import type { EntryInstall } from "@/lib/changelog/install";
import type { ChangeEntry, Inline } from "@/lib/changelog/parse";

export function inlineToText(inline: Inline[]): string {
  return inline.map((part) => (part.type === "code" ? `\`${part.value}\`` : part.value)).join("");
}

export function monthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

interface BuildMigrationPromptOptions {
  entry: ChangeEntry;
  month: string;
  /** What the entry installs, from entryInstall() in lib/changelog/install.ts:
   *  the same answer /changelog.md gives. */
  install: EntryInstall;
  base: Base;
}

/** Step 1: get the new code, in the project's flavor. */
function reinstallStep(install: EntryInstall, base: Base): string[] {
  switch (install.kind) {
    case "item": {
      const url = `${SITE}/r/${install.base && base === "base" ? "base/" : ""}${install.name}.json`;
      return ["1. Re-install it (shadcn CLI):", `npx shadcn@latest add ${url} --overwrite`, OVERWRITE_NOTE];
    }
    case "skill":
      return ["1. Update the agent skill:", "npx skills add mickadesign/fluid-functionalism"];
    case "all":
      return [
        `1. Re-install every Fluid Functionalism component this project uses, with the shadcn CLI and --overwrite, from the same URLs they came from (${SITE}/r/<name>.json, or /r/base/<name>.json for the Base UI flavor).`,
        OVERWRITE_NOTE,
      ];
    case "none":
      return [
        `1. Re-install the Fluid Functionalism items the sentence above names, with the shadcn CLI and --overwrite, from the same URLs they came from (${SITE}/r/<name>.json, or /r/base/<name>.json for the Base UI flavor).`,
        OVERWRITE_NOTE,
      ];
  }
}

/** The text behind a Breaking entry's "Copy migration prompt": a brief an
 *  AI coding agent can act on without opening the changelog. It re-installs
 *  the component, then rewrites call sites from the diff's `-` lines to its
 *  `+` lines. */
export function buildMigrationPrompt({ entry, month, install, base }: BuildMigrationPromptOptions): string {
  const lines: string[] = [];
  lines.push(
    `Migrate my React app to the ${monthLabel(month)} release of ${entry.name} from Fluid Functionalism. It has a breaking change.`,
  );
  lines.push("");
  lines.push(`What changed: ${inlineToText(entry.text)}`);
  lines.push("");
  lines.push(...reinstallStep(install, base));
  lines.push("");
  lines.push(
    "2. Find every call site that matches the - lines below and rewrite it to the + lines. Leave everything else as it is, then run the type checker.",
  );
  lines.push("```diff");
  lines.push(entry.diff?.replace(/\n+$/, "") ?? "");
  lines.push("```");
  lines.push("");
  lines.push(`Changelog: ${SITE}/changelog#${month}`);
  if (entry.href) lines.push(`Docs: ${SITE}${entry.href}`);
  return lines.join("\n");
}
