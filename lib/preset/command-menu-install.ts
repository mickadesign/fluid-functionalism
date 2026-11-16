// ---------------------------------------------------------------------------
// Install-grade code generation for command menu presets. Emits ONE
// compilable component reproducing what the playground preview renders for
// the encoded state — the same rows, the same header, the same dialog and
// trigger combo. tests/preset-command-menu.test.mjs compiles the output
// across the state space through a real ts.createProgram over the project
// tsconfig.
// ---------------------------------------------------------------------------

import type { PresetFile } from "./sidebar-install";
import type { PresetGenerator } from "./light-generators";
import {
  type CommandMenuPreset,
  COMMAND_MENU_ITEMS,
  COMMAND_MENU_TABS,
  COMMAND_MENU_TYPES,
  COMMAND_MENU_SORTS,
  COMMAND_MENU_SUGGESTIONS,
  COMMAND_MENU_COPY,
} from "./command-menu-options";

function commandMenuDemoFile(p: CommandMenuPreset): string {
  const l: string[] = [];
  const scoped = p.tabs || p.filters;

  l.push(`"use client";`);
  l.push(``);
  l.push(`import { useMemo, useState } from "react";`);
  const parts = [
    "CommandMenu",
    "CommandMenuDialog",
    "CommandMenuInput",
    ...(p.tabs ? ["CommandMenuTabs"] : []),
    ...(p.filters ? ["CommandMenuFilters"] : []),
    "CommandMenuList",
    "CommandMenuEmpty",
    ...(p.footer ? ["CommandMenuFooter"] : []),
    "CommandMenuShortcut",
    "type CommandMenuItemData",
  ];
  l.push(`import {`);
  l.push(`  ${parts.join(",\n  ")},`);
  l.push(`} from "@/components/ui/command-menu";`);
  l.push(`import { Button } from "@/components/ui/button";`);
  if (p.filters) {
    l.push(`import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";`);
  }
  l.push(`import { useIcons, type IconName } from "@/lib/icon-context";`);
  l.push(``);

  // ── Demo content ──
  l.push(`// Seed actions for the generated menu, replace with your own. Icons are`);
  l.push(`// slot names, resolved through the icon context at render.`);
  l.push(`const ITEMS: readonly {`);
  l.push(`  value: string;`);
  l.push(`  label: string;`);
  l.push(`  /** Names Enter in the footer while highlighted; defaults to the label. */`);
  l.push(`  action?: string;`);
  if (p.descriptions) l.push(`  description?: string;`);
  l.push(`  icon: IconName;`);
  if (p.shortcuts) l.push(`  shortcut?: string;`);
  l.push(`  keywords?: readonly string[];`);
  l.push(`  group: string;`);
  l.push(`  disabled?: boolean;`);
  l.push(`}[] = [`);
  for (const item of COMMAND_MENU_ITEMS) {
    const fields = [
      `value: ${JSON.stringify(item.value)}`,
      `label: ${JSON.stringify(item.label)}`,
      ...(item.action ? [`action: ${JSON.stringify(item.action)}`] : []),
      ...(p.descriptions && item.description ? [`description: ${JSON.stringify(item.description)}`] : []),
      `icon: ${JSON.stringify(item.icon)}`,
      ...(p.shortcuts && item.shortcut ? [`shortcut: ${JSON.stringify(item.shortcut)}`] : []),
      ...(item.keywords ? [`keywords: ${JSON.stringify(item.keywords)}`] : []),
      `group: ${JSON.stringify(item.group)}`,
      ...(item.disabled ? ["disabled: true"] : []),
    ];
    l.push(`  { ${fields.join(", ")} },`);
  }
  l.push(`];`);
  l.push(``);
  if (p.suggestions) {
    l.push(`// Listed first while nothing is typed.`);
    l.push(`const SUGGESTIONS = ${JSON.stringify([...COMMAND_MENU_SUGGESTIONS])};`);
    l.push(``);
  }
  if (p.tabs) {
    l.push(`const TABS = [`);
    for (const tab of COMMAND_MENU_TABS) {
      l.push(`  { value: ${JSON.stringify(tab.value)}, label: ${JSON.stringify(tab.label)} },`);
    }
    l.push(`];`);
    l.push(``);
  }
  if (p.filters) {
    l.push(`const TYPES = [`);
    for (const type of COMMAND_MENU_TYPES) {
      l.push(`  { value: ${JSON.stringify(type.value)}, label: ${JSON.stringify(type.label)} },`);
    }
    l.push(`];`);
    l.push(`const SORTS = [`);
    for (const sort of COMMAND_MENU_SORTS) {
      l.push(`  { value: ${JSON.stringify(sort.value)}, label: ${JSON.stringify(sort.label)} },`);
    }
    l.push(`];`);
    l.push(``);
  }

  // ── Component ──
  l.push(`export function CommandMenuDemo() {`);
  l.push(`  const icons = useIcons();`);
  l.push(`  const [open, setOpen] = useState(false);`);
  if (p.tabs) l.push(`  const [tab, setTab] = useState("all");`);
  if (p.filters) {
    l.push(`  const [type, setType] = useState("all");`);
    l.push(`  const [sort, setSort] = useState("default");`);
  }
  l.push(`  // Memoized: the highlight resets to the first row when the rows change.`);
  l.push(`  const items = useMemo<CommandMenuItemData[]>(() => {`);
  l.push(`    const all = ITEMS.map(({ icon, ...item }) => ({ ...item, icon: icons[icon] }));`);
  if (scoped) {
    l.push(`    // The header controls are state; the rows derive from them.`);
    l.push(`    let visible = all;`);
    if (p.tabs) l.push(`    if (tab !== "all") visible = visible.filter((item) => item.group === tab);`);
    if (p.filters) {
      l.push(`    if (type !== "all") visible = visible.filter((item) => item.group === type);`);
      l.push(`    if (sort === "az") visible = [...visible].sort((a, b) => a.label.localeCompare(b.label));`);
    }
    l.push(`    return visible;`);
  } else {
    l.push(`    return all;`);
  }
  const deps = ["icons", ...(p.tabs ? ["tab"] : []), ...(p.filters ? ["type", "sort"] : [])];
  l.push(`  }, [${deps.join(", ")}]);`);
  l.push(``);
  l.push(`  const run = (item: CommandMenuItemData) => {`);
  l.push(`    // Your action here.`);
  l.push(`    console.log("ran", item.value);`);
  l.push(`  };`);
  l.push(``);
  if (p.filters) {
    l.push(`  const filters = (`);
    l.push(`    <CommandMenuFilters>`);
    l.push(`      <Select value={type} onValueChange={setType}>`);
    l.push(`        <SelectTrigger variant="borderless" aria-label="Type" />`);
    l.push(`        <SelectContent>`);
    l.push(`          {TYPES.map((option, i) => (`);
    l.push(`            <SelectItem key={option.value} value={option.value} index={i}>`);
    l.push(`              {option.label}`);
    l.push(`            </SelectItem>`);
    l.push(`          ))}`);
    l.push(`        </SelectContent>`);
    l.push(`      </Select>`);
    l.push(`      <Select value={sort} onValueChange={setSort}>`);
    l.push(`        <SelectTrigger variant="borderless" aria-label="Sort" />`);
    l.push(`        <SelectContent>`);
    l.push(`          {SORTS.map((option, i) => (`);
    l.push(`            <SelectItem key={option.value} value={option.value} index={i}>`);
    l.push(`              {option.label}`);
    l.push(`            </SelectItem>`);
    l.push(`          ))}`);
    l.push(`        </SelectContent>`);
    l.push(`      </Select>`);
    l.push(`    </CommandMenuFilters>`);
    l.push(`  );`);
    l.push(``);
  }
  l.push(`  return (`);
  l.push(`    <>`);
  l.push(`      <Button variant="secondary" onClick={() => setOpen(true)} className="pr-3">`);
  l.push(`        ${COMMAND_MENU_COPY.trigger}`);
  l.push(`        <CommandMenuShortcut keys=${JSON.stringify(p.shortcut)} className="ml-1" />`);
  l.push(`      </Button>`);
  l.push(`      {/* shortcut: mod is ⌘ on a Mac, Ctrl elsewhere. A pick closes the dialog. */}`);
  l.push(`      <CommandMenuDialog open={open} onOpenChange={setOpen} shortcut=${JSON.stringify(p.shortcut)}>`);
  const rootProps = [
    "items={items}",
    ...(p.suggestions ? ["suggestions={SUGGESTIONS}"] : []),
    "onSelect={run}",
  ];
  l.push(`        <CommandMenu ${rootProps.join(" ")}>`);
  l.push(`          <CommandMenuInput placeholder=${JSON.stringify(COMMAND_MENU_COPY.placeholder)} />`);
  if (p.tabs) {
    if (p.filters) {
      l.push(`          {/* Filters inside the tabs share the row, hugging their controls. */}`);
      l.push(`          <CommandMenuTabs tabs={TABS} value={tab} onValueChange={setTab}>`);
      l.push(`            {filters}`);
      l.push(`          </CommandMenuTabs>`);
    } else {
      l.push(`          <CommandMenuTabs tabs={TABS} value={tab} onValueChange={setTab} />`);
    }
  } else if (p.filters) {
    l.push(`          {filters}`);
  }
  l.push(`          <CommandMenuList>`);
  l.push(`            <CommandMenuEmpty>${COMMAND_MENU_COPY.empty}</CommandMenuEmpty>`);
  l.push(`          </CommandMenuList>`);
  if (p.footer) l.push(`          <CommandMenuFooter />`);
  l.push(`        </CommandMenu>`);
  l.push(`      </CommandMenuDialog>`);
  l.push(`    </>`);
  l.push(`  );`);
  l.push(`}`);
  return l.join("\n") + "\n";
}

export function generateCommandMenuPresetFiles(p: CommandMenuPreset): PresetFile[] {
  return [
    {
      path: "components/command-menu-demo.tsx",
      type: "registry:component",
      target: "components/command-menu-demo.tsx",
      content: commandMenuDemoFile(p),
    },
  ];
}

/** Registry dependencies the generated file needs, as plain names — the
 *  route flavors them with the same helpers postbuild uses. */
export function commandMenuPresetRegistryDeps(p: CommandMenuPreset): string[] {
  const deps = new Set<string>(["utils", "command-menu", "button", "icon-context"]);
  if (p.filters) deps.add("select");
  return [...deps];
}

/** npm dependencies beyond what registryDependencies pull transitively. */
export function commandMenuPresetNpmDeps(_p: CommandMenuPreset): string[] {
  return [];
}

export const COMMAND_MENU_PRESET_GENERATOR: PresetGenerator = {
  title: "Command menu (playground preset)",
  description:
    "A command menu generated from a fluidfunctionalism.com playground configuration: the exact variant you built, installable.",
  files: (p) => generateCommandMenuPresetFiles(p as unknown as CommandMenuPreset),
  registryDeps: (p) => commandMenuPresetRegistryDeps(p as unknown as CommandMenuPreset),
  npmDeps: (p) => commandMenuPresetNpmDeps(p as unknown as CommandMenuPreset),
};
