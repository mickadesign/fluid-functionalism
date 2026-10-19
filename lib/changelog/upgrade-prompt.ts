// The text behind /changelog's "Copy upgrade prompt": a brief any coding
// agent can follow to bring a project's Fluid Functionalism items up to the
// latest release. The skill does the whole job, so the brief leads with it;
// the steps after it are the same job by hand, for an agent without it.

const SITE = "https://www.fluidfunctionalism.com";
const SKILL_INSTALL = "npx skills add mickadesign/fluid-functionalism";

export function buildUpgradePrompt(): string {
  return [
    "Update the Fluid Functionalism components in my project to the latest release.",
    "",
    "The fast way: add the Fluid Functionalism skill if it isn't installed yet, then ask it to update Fluid Functionalism. It reads the project's flavor (Radix or Base UI), compares every installed item with the registry, shows local edits before overwriting anything, and applies the changelog.",
    SKILL_INSTALL,
    "",
    "Without the skill:",
    `1. Read the changelog: ${SITE}/changelog.md. Every entry names its install URL, and every Breaking entry carries migration steps and a before/after diff.`,
    "2. Find the installed items: files in components/ui, components, hooks, and lib that import springs, use-fluid-hover, font-weight, or size-context are Fluid Functionalism code. Note the flavor: @base-ui/react imports mean the /r/base/ URLs, @radix-ui imports mean the bare /r/ ones.",
    `3. For each installed item, fetch ${SITE}/r/<name>.json (or /r/base/<name>.json) and compare its files with the local ones. Same: leave it. Different: if the local file has edits of its own, show me the diff and ask; otherwise re-install it with npx shadcn@latest add <url> --overwrite. That also rewrites the item's registryDependencies, so check those for local edits first.`,
    "4. Apply every Breaking entry that changes an item the project uses: rewrite each call site from the diff's - lines to its + lines.",
    "5. Run the type checker and the build, then list what changed, item by item.",
  ].join("\n");
}
