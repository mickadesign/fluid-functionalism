/** The pieces every install brief shares: the Copy prompt on each doc page
 *  (install-prompt.ts) and the Markdown pages agents read (markdown.ts). One
 *  copy here, so the two say the same thing. No imports: route handlers and
 *  client components both use it. */

export const SITE = "https://www.fluidfunctionalism.com";

/** Why the install command carries --overwrite: a stock shadcn project already
 *  has button.tsx, dialog.tsx, tooltip.tsx and friends, and this library's
 *  files install under the same names. Without the flag the CLI asks per
 *  existing file (default No), so a person keeps the stock file next to the
 *  new ones, and an agent's non-interactive shell exits at the question after
 *  the CSS and npm dependencies were already written. */
export const OVERWRITE_NOTE =
  "--overwrite replaces same-named stock shadcn files (button.tsx, dialog.tsx, ...) with this library's versions. Without it the CLI prompts per existing file and exits in a non-interactive shell before any component is written.";

/** The craft (exact behaviors and values) ships in the skill, not in the
 *  brief: one pointer instead of a page of bullets. */
export const SKILL_LINE =
  "For the design details behind it (exact behaviors and values), add the Fluid Functionalism skill: npx skills add mickadesign/fluid-functionalism";

/** Where an agent checks for changes later: every month's release, with an
 *  install URL per entry and migration steps for anything breaking. */
export const CHANGELOG_LINE = `Changelog (what changed each month, how to update): ${SITE}/changelog.md`;

/** The skill page's install: a prompt rather than the bare command, so the
 *  agent goes on to run the skill once on the project. It names the skill,
 *  so an agent that already has it skips the install. Global (-g) keeps the
 *  skill out of the user's repo; -y skips the CLI's prompts, which an agent
 *  shell can't answer. */
export const SKILL_INSTALL_COMMAND = "npx skills add mickadesign/fluid-functionalism -g -y";
export const SKILL_INSTALL_PROMPT = `Install the fluid-functionalism skill with \`${SKILL_INSTALL_COMMAND}\` (skip this if you already have it). Then read its SKILL.md and use it to audit this project.`;

/** What the project has to have before an install works. */
export const PROJECT_NEEDS =
  "Needs a shadcn-style project: Tailwind v4, the `@/` alias, and the Inter variable font loaded for the weight animations.";

/** Where installed files land, and how to change them. */
export const INSTALLED_FILES =
  "Installed files land in components/ui, components, lib, and hooks. Compose with props and className rather than editing them.";

/** Site copy allows a spaced em dash in descriptions; briefs do not. A
 *  pair around an aside becomes parentheses ("a ladder (36px and 28px)
 *  shared by"), a single one a colon. */
export function plainDescription(description: string): string {
  return description
    .replace(/\s+\u2014\s+([^\u2014]+?)\s+\u2014\s+/g, " ($1) ")
    .replace(/\s+\u2014\s+/g, ": ");
}
