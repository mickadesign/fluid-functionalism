// Generates skills/fluid-functionalism/references/craft.md from the craft
// arrays in lib/docs/prompt-entries.ts, so the skill ships the same craft
// the Copy-prompt briefs carry, without a second hand-maintained copy.
// Run after editing any craft entry:  node scripts/build-skill-craft.mjs
import { readFileSync, writeFileSync } from "node:fs";

const SRC = new URL("../lib/docs/prompt-entries.ts", import.meta.url);
const OUT = new URL(
  "../skills/fluid-functionalism/references/craft.md",
  import.meta.url,
);

// Section order: the five systems first (one adopted system lifts every
// surface), then components alphabetically. Display names match the docs.
const SYSTEMS = [
  ["motion", "Motion (springs)"],
  ["fluid-hover", "Fluid Hover (use-fluid-hover)"],
  ["surfaces", "Surfaces (elevated)"],
  ["sizes", "Sizes (size-context)"],
  ["scrollbars", "Scrollbars (scroll-area)"],
];
const COMPONENTS = [
  ["accordion", "Accordion"],
  ["ask-user-questions", "AskUserQuestions"],
  ["badge", "Badge"],
  ["button", "Button"],
  ["card", "Card"],
  ["chat-message", "ChatMessage"],
  ["checkbox-group", "CheckboxGroup"],
  ["color-picker", "ColorPicker"],
  ["combobox", "Combobox"],
  ["command-menu", "CommandMenu"],
  ["dialog", "Dialog"],
  ["dropdown", "Dropdown"],
  ["input-copy", "InputCopy"],
  ["input-group", "InputGroup"],
  ["input-message", "InputMessage"],
  ["radio-group", "RadioGroup"],
  ["select", "Select"],
  ["sidebar", "Sidebar"],
  ["slider", "Slider"],
  ["switch", "Switch"],
  ["table", "Table"],
  ["tabs", "Tabs"],
  ["tabs-subtle", "TabsSubtle"],
  ["thinking-indicator", "ThinkingIndicator"],
  ["thinking-steps", "ThinkingSteps"],
  ["tooltip", "Tooltip"],
];

const src = readFileSync(SRC, "utf8");

function craftOf(slug) {
  const entry = new RegExp(
    `^  ("?)${slug}\\1: \\{\\n    craft: \\[\\n((?:      ".*",\\n)+)    \\],`,
    "m",
  ).exec(src);
  if (!entry) throw new Error(`no craft array found for "${slug}"`);
  return entry[2]
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line.trim().replace(/,$/, "")));
}

const lines = [
  "# Fluid Functionalism — per-component craft",
  "",
  "<!-- GENERATED from lib/docs/prompt-entries.ts by scripts/build-skill-craft.mjs.",
  "     Do not edit by hand: change the craft entry there and regenerate. -->",
  "",
  "The interaction-design decisions built into each component and system —",
  "exact behaviors, exact values, and the why. Read the relevant section",
  "before composing with, wrapping, extending, or imitating that component:",
  "these are constraints to compose around, not suggestions. The installed",
  "source (and its comments) remains the final word; the live demos are at",
  "`https://www.fluidfunctionalism.com/docs/<slug>`.",
  "",
  "Systems first — their craft applies across every component below.",
  "",
  "## Contents",
  "",
];
for (const [slug, name] of [...SYSTEMS, ...COMPONENTS]) {
  lines.push(`- [${name}](#${slug})`);
}
for (const [group, list] of [
  ["# Systems", SYSTEMS],
  ["# Components", COMPONENTS],
]) {
  lines.push("", group);
  for (const [slug, name] of list) {
    lines.push("", `## ${name} {#${slug}}`, "");
    for (const bullet of craftOf(slug)) lines.push(`- ${bullet}`);
  }
}
lines.push("");

writeFileSync(OUT, lines.join("\n"));
console.log(
  `wrote ${SYSTEMS.length + COMPONENTS.length} sections to`,
  OUT.pathname,
);
