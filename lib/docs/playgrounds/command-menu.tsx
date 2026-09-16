"use client";

import { useMemo, useState, useRef } from "react";
import { showSuccessToast } from "@/lib/docs/settings-toast";
import {
  CommandMenu,
  CommandMenuDialog,
  CommandMenuInput,
  CommandMenuTabs,
  CommandMenuFilters,
  CommandMenuList,
  CommandMenuEmpty,
  CommandMenuFooter,
  CommandMenuShortcut,
  formatShortcut,
  useIsMac,
  type CommandMenuItemData,
} from "@/registry/default/command-menu";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/flavored/select";
import { Button } from "@/registry/radix/button";
import { Switch } from "@/registry/radix/switch";
import { Elevated } from "@/lib/elevated";
import { useShape } from "@/lib/shape-context";
import { cn } from "@/lib/utils";
import {
  PLAY_SWITCH,
  PlayField,
  PlaySelect,
  PlaySection,
  PlayDivider,
  PlaygroundPanel,
} from "@/lib/docs/playground";
import {
  COMMAND_MENU_SUGGESTIONS,
  COMMAND_MENU_TABS,
  COMMAND_MENU_TYPES,
  COMMAND_MENU_SORTS,
  COMMAND_MENU_COPY,
  useCommandMenuItems,
} from "@/lib/docs/command-menu-items";
import {
  COMMAND_MENU_PRESET_DEF,
  COMMAND_MENU_DEFAULT_CODE,
  COMMAND_MENU_TRIGGERS,
  DEFAULT_COMMAND_MENU_STATE,
  encodeCommandMenuPreset,
  decodeCommandMenuPreset,
  type CommandMenuPlayState,
  type CommandMenuTrigger,
} from "@/lib/preset/command-menu-options";
import {
  usePresetGlobals,
  usePresetUrlSync,
  GetCodeDialog,
} from "@/lib/docs/preset-ui";
import type { PlaygroundProps } from "./types";

// ── Command menu playground ──────────────────────────────
// One palette, two homes: inline in the preview, and as the dialog the
// trigger shortcut opens. The rail controls drive both plus the code.

type PlayState = CommandMenuPlayState;

// The rail's combo labels draw the platform's own modifier, like the caps
// in the rows. ⌘K, the component's default, leads; on the docs page the
// playground's dialog then answers it ahead of the site's own menu, which
// the sidebar's Search row still opens.
function shortcutLabel(value: CommandMenuTrigger, mac: boolean): string {
  return formatShortcut(value, mac).join(mac ? "" : "+");
}

const TABS = COMMAND_MENU_TABS;

function pick<T>(options: readonly T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

export function buildCommandMenuPlaygroundCode(o: PlayState): string {
  const fields = (item: {
    value: string;
    label: string;
    action?: string;
    icon: string;
    description?: string;
    shortcut?: string;
    group: string;
  }) =>
    [
      `value: "${item.value}"`,
      `label: "${item.label}"`,
      ...(item.action ? [`action: "${item.action}"`] : []),
      ...(o.descriptions && item.description ? [`description: "${item.description}"`] : []),
      `icon: ${item.icon}`,
      ...(o.shortcuts && item.shortcut ? [`shortcut: "${item.shortcut}"`] : []),
      `group: "${item.group}"`,
    ].join(", ");
  const sample = [
    { value: "new-file", label: "New file", description: "Blank document", icon: "Plus", shortcut: "mod+n", group: "Actions" },
    { value: "theme", label: "Toggle dark mode", description: "System, light, or dark", icon: "Moon", shortcut: "mod+shift+l", group: "Actions" },
    { value: "calendar", label: "Calendar", action: "Go to Calendar", description: "Today", icon: "Calendar", group: "Go to" },
    { value: "settings", label: "Settings", action: "Go to Settings", description: "Account and workspace", icon: "Settings", shortcut: "mod+,", group: "Go to" },
  ];
  const parts = [
    "CommandMenuDialog",
    "CommandMenu",
    "CommandMenuInput",
    ...(o.tabs ? ["CommandMenuTabs"] : []),
    ...(o.filters ? ["CommandMenuFilters"] : []),
    "CommandMenuList",
    "CommandMenuEmpty",
    ...(o.footer ? ["CommandMenuFooter"] : []),
  ];
  const icons = ["Plus", "Moon", "Calendar", "Settings"];
  const state = [
    "const [open, setOpen] = useState(false);",
    ...(o.tabs ? ['const [tab, setTab] = useState("all");'] : []),
    ...(o.filters
      ? ['const [type, setType] = useState("all");', 'const [sort, setSort] = useState("default");']
      : []),
  ];
  const scoped = o.tabs || o.filters;
  // The same derivation the preview runs: tab, then type, then sort.
  const derived = scoped
    ? [
        "",
        "// The header controls are your state: derive the rows from them.",
        "let visible = items;",
        ...(o.tabs ? [`if (tab !== "all") visible = visible.filter((item) => item.group === tab);`] : []),
        ...(o.filters
          ? [
              `if (type !== "all") visible = visible.filter((item) => item.group === type);`,
              `if (sort === "az") visible = [...visible].sort((a, b) => a.label.localeCompare(b.label));`,
            ]
          : []),
      ]
    : [];
  const list = (name: string, entries: readonly { value: string; label: string }[]) =>
    `const ${name} = [${entries.map((e) => `{ value: "${e.value}", label: "${e.label}" }`).join(", ")}];`;
  const lists = [
    ...(o.tabs ? [list("TABS", COMMAND_MENU_TABS)] : []),
    ...(o.filters ? [list("TYPES", COMMAND_MENU_TYPES), list("SORTS", COMMAND_MENU_SORTS)] : []),
  ];
  const root = [
    `items={${scoped ? "visible" : "items"}}`,
    ...(o.suggestions ? [`suggestions={${JSON.stringify([...COMMAND_MENU_SUGGESTIONS])}}`] : []),
    "onSelect={(item) => run(item)}",
  ].join(" ");
  // Filters inside the tabs share the row (hugging their controls); alone
  // they are a row of their own.
  const indent = o.tabs ? "      " : "    ";
  const select = (value: string, setter: string, entries: string) => [
    `${indent}  <Select value={${value}} onValueChange={${setter}}>`,
    `${indent}    <SelectTrigger variant="borderless" />`,
    `${indent}    <SelectContent>`,
    `${indent}      {${entries}.map((option, i) => (`,
    `${indent}        <SelectItem key={option.value} value={option.value} index={i}>{option.label}</SelectItem>`,
    `${indent}      ))}`,
    `${indent}    </SelectContent>`,
    `${indent}  </Select>`,
  ];
  const filters = o.filters
    ? [
        `${indent}<CommandMenuFilters>`,
        ...select("type", "setType", "TYPES"),
        ...select("sort", "setSort", "SORTS"),
        `${indent}</CommandMenuFilters>`,
      ]
    : [];
  const header = [
    `    <CommandMenuInput placeholder="${COMMAND_MENU_COPY.placeholder}" />`,
    ...(o.tabs
      ? [
          `    <CommandMenuTabs tabs={TABS} value={tab} onValueChange={setTab}${o.filters ? "" : " /"}>`,
          ...(o.filters
            ? [`      {/* Trailing children hug the row's end */}`, ...filters, `    </CommandMenuTabs>`]
            : []),
        ]
      : filters),
  ];
  return [
    `import {`,
    `  ${parts.join(", ")},`,
    `} from "./components";`,
    ...(o.filters ? [`import { Select, SelectTrigger, SelectContent, SelectItem } from "./components";`] : []),
    `import { ${icons.join(", ")} } from "lucide-react";`,
    ``,
    `const items = [`,
    ...sample.map((item) => `  { ${fields(item)} },`),
    `  /* … */`,
    `];`,
    ...lists,
    ...state,
    ...derived,
    ``,
    `{/* shortcut: the combo that toggles the dialog from anywhere ("mod+k" if omitted).`,
    `    mod is ⌘ on a Mac, Ctrl elsewhere. */}`,
    `<CommandMenuDialog open={open} onOpenChange={setOpen}${o.shortcut === "mod+k" ? "" : ` shortcut="${o.shortcut}"`}>`,
    `  <CommandMenu ${root}>`,
    ...header,
    `    <CommandMenuList>`,
    `      <CommandMenuEmpty>${COMMAND_MENU_COPY.empty}</CommandMenuEmpty>`,
    `    </CommandMenuList>`,
    ...(o.footer ? [`    {/* Hints follow the menu: tabs add ← →, a dialog adds Esc */}`, `    <CommandMenuFooter />`] : []),
    `  </CommandMenu>`,
    `</CommandMenuDialog>`,
    ``,
    `{/* Inline instead: drop the dialog and give CommandMenu a height. */}`,
  ].join("\n");
}

export function CommandMenuPlayground({ children }: PlaygroundProps) {
  const mac = useIsMac();
  const shortcutOptions = COMMAND_MENU_TRIGGERS.map((value) => ({
    value,
    label: shortcutLabel(value, mac),
  }));
  const [state, setState] = useState<PlayState>(DEFAULT_COMMAND_MENU_STATE);
  const set = <K extends keyof PlayState>(key: K, value: PlayState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));
  const shape = useShape();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("all");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState("default");
  const previewRef = useRef<HTMLDivElement>(null);

  const all = useCommandMenuItems({
    descriptions: state.descriptions,
    shortcuts: state.shortcuts,
  });
  // The header controls are state; the rows derive from them.
  const items = useMemo(() => {
    let visible = all;
    if (state.tabs && tab !== "all") visible = visible.filter((item) => item.group === tab);
    if (state.filters && type !== "all") visible = visible.filter((item) => item.group === type);
    if (state.filters && sort === "az")
      visible = [...visible].sort((a, b) => a.label.localeCompare(b.label));
    return visible;
  }, [all, state.tabs, tab, state.filters, type, sort]);

  const run = (item: CommandMenuItemData) => showSuccessToast(`Ran “${item.label}”`);

  const randomize = () =>
    setState({
      shortcut: pick(COMMAND_MENU_TRIGGERS),
      descriptions: Math.random() > 0.3,
      shortcuts: Math.random() > 0.3,
      suggestions: Math.random() > 0.4,
      tabs: Math.random() > 0.6,
      filters: Math.random() > 0.7,
      footer: Math.random() > 0.3,
    });

  const code = buildCommandMenuPlaygroundCode(state);

  // ── Get code (presets) ─────────────────────────────────
  const globals = usePresetGlobals();
  const presetCode = encodeCommandMenuPreset({ ...state, ...globals });
  usePresetUrlSync(presetCode, COMMAND_MENU_DEFAULT_CODE, (raw) => {
    const res = decodeCommandMenuPreset(raw);
    if (res.ok) {
      const p = res.preset;
      setState({
        shortcut: p.shortcut,
        descriptions: p.descriptions,
        shortcuts: p.shortcuts,
        suggestions: p.suggestions,
        tabs: p.tabs,
        filters: p.filters,
        footer: p.footer,
      });
    }
  });

  const filters = (
    <CommandMenuFilters>
      <Select value={type} onValueChange={setType}>
        <SelectTrigger variant="borderless" aria-label="Type" />
        <SelectContent>
          {COMMAND_MENU_TYPES.map((option, i) => (
            <SelectItem key={option.value} value={option.value} index={i}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={sort} onValueChange={setSort}>
        <SelectTrigger variant="borderless" aria-label="Sort" />
        <SelectContent>
          {COMMAND_MENU_SORTS.map((option, i) => (
            <SelectItem key={option.value} value={option.value} index={i}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </CommandMenuFilters>
  );

  const menu = (
    <CommandMenu
      items={items}
      suggestions={state.suggestions ? COMMAND_MENU_SUGGESTIONS : undefined}
      onSelect={run}
    >
      <CommandMenuInput placeholder={COMMAND_MENU_COPY.placeholder} />
      {/* Both on: the filters ride the tab row's trailing edge, hugging
          their controls, so the header stays one line. */}
      {state.tabs ? (
        <CommandMenuTabs tabs={TABS} value={tab} onValueChange={setTab}>
          {state.filters && filters}
        </CommandMenuTabs>
      ) : (
        state.filters && filters
      )}
      <CommandMenuList>
        <CommandMenuEmpty>{COMMAND_MENU_COPY.empty}</CommandMenuEmpty>
      </CommandMenuList>
      {state.footer && <CommandMenuFooter />}
    </CommandMenu>
  );

  // The panel is sized by its rows up to a cap; the list scrolls past it.
  const panel = (heightClass: string) => (
    <Elevated
      offset={2}
      shadowLevel={3}
      className={cn("flex w-full max-w-[560px] flex-col overflow-hidden", shape.container, heightClass)}
    >
      {menu}
    </Elevated>
  );

  // The trigger combo fires only while focus is inside the preview: the
  // site's own ⌘K menu keeps the key everywhere else on the page.
  const preview = (
    <div ref={previewRef} className="flex w-full flex-col items-center gap-4">
      {panel("max-h-[400px]")}
      <Button variant="secondary" onClick={() => setOpen(true)} className="pr-3">
        Open as a dialog
        <CommandMenuShortcut keys={state.shortcut} className="ml-1" />
      </Button>
      <CommandMenuDialog
        open={open}
        onOpenChange={setOpen}
        shortcut={state.shortcut}
        shortcutScope={previewRef}
      >
        {menu}
      </CommandMenuDialog>
    </div>
  );

  const controls = (
    <PlaygroundPanel onShuffle={randomize}>
      <PlaySection label="Dialog" />
      <PlayField label="Trigger shortcut">
        <PlaySelect
          value={state.shortcut}
          onChange={(v) => set("shortcut", v as CommandMenuTrigger)}
          options={shortcutOptions}
        />
      </PlayField>
      <p className="px-1 text-caption text-muted-foreground">
        Fires while the preview has focus.
      </p>

      <PlayDivider />
      <PlaySection label="Rows" />
      <div>
        <Switch
          label="Descriptions"
          checked={state.descriptions}
          onToggle={() => set("descriptions", !state.descriptions)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Shortcut caps"
          checked={state.shortcuts}
          onToggle={() => set("shortcuts", !state.shortcuts)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Suggestions first"
          checked={state.suggestions}
          onToggle={() => set("suggestions", !state.suggestions)}
          className={PLAY_SWITCH}
        />
      </div>

      <PlayDivider />
      <PlaySection label="Under the field" />
      <div>
        <Switch
          label="Tabs"
          checked={state.tabs}
          onToggle={() => set("tabs", !state.tabs)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Filters"
          checked={state.filters}
          onToggle={() => set("filters", !state.filters)}
          className={PLAY_SWITCH}
        />
      </div>

      <PlayDivider />
      <PlaySection label="Under the list" />
      <div>
        <Switch
          label="Footer hints"
          checked={state.footer}
          onToggle={() => set("footer", !state.footer)}
          className={PLAY_SWITCH}
        />
      </div>

      <PlayDivider />
      {/* shadcn's preset principle: the exact configuration above, as a
          stateless code the registry can turn into an installable block. */}
      <GetCodeDialog def={COMMAND_MENU_PRESET_DEF} code={presetCode} />
    </PlaygroundPanel>
  );

  return children({
    preview,
    // The dialog's own defaults: 540px wide, capped at 440px, top edge held
    // where a cap-height panel sits centered — the fixed-height box anchors
    // the panel's top so the field stays put while the rows filter down.
    demoPreview: (
      <div className="flex h-[440px] w-full items-start justify-center">
        {panel("max-h-[440px]")}
      </div>
    ),
    demoMaxWidth: 540,
    controls,
    code,
  });
}
