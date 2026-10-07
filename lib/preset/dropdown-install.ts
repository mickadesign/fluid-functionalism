// ---------------------------------------------------------------------------
// Install-grade code generation for dropdown presets. Emits ONE compilable
// component reproducing what the playground preview renders for the encoded
// state — same rows, same derived constraints (search and the submenu live
// in the popup only, and search replaces groups), same selection model.
// tests/preset-dropdown.test.mjs compiles the output across the state space
// through a real ts.createProgram over the project tsconfig.
// ---------------------------------------------------------------------------

import type { PresetFile } from "./sidebar-install";
import type { PresetGenerator } from "./generators";
import {
  type DropdownPreset,
  deriveDropdown,
  DROPDOWN_ITEMS,
  DROPDOWN_GROUPS,
  DROPDOWN_DISABLED_LABEL,
  DROPDOWN_DEFAULT_SELECTED,
  DROPDOWN_DEFAULT_PICKED,
  DROPDOWN_CREATED_ICON,
  DROPDOWN_SUBMENU_LABEL,
  DROPDOWN_THEMES,
  DROPDOWN_DEFAULT_THEME,
} from "./dropdown-options";

function dropdownDemoFile(p: DropdownPreset): string {
  const d = deriveDropdown(p);
  const isMenu = p.mode === "menu";
  const l: string[] = [];

  l.push(`"use client";`);
  l.push(``);
  const reactImports = [
    ...(d.groups ? ["Fragment"] : []),
    ...(p.selection !== "none" || d.search || d.submenu ? ["useState"] : []),
  ];
  if (reactImports.length) l.push(`import { ${reactImports.join(", ")} } from "react";`);
  const parts = isMenu
    ? ["DropdownMenu", "DropdownTrigger", "DropdownContent"]
    : ["Dropdown"];
  if (d.groups) parts.push("DropdownLabel", "DropdownSeparator");
  if (d.search) parts.push("DropdownSearch", "DropdownEmpty");
  if (d.submenu) parts.push("DropdownSub", "DropdownSubTrigger", "DropdownSubContent");
  l.push(`import {`);
  l.push(`  ${parts.join(",\n  ")},`);
  l.push(`} from "@/components/ui/dropdown";`);
  l.push(`import { MenuItem } from "@/components/ui/menu-item";`);
  if (isMenu) l.push(`import { Button } from "@/components/ui/button";`);
  // The trigger's chevron and the row icons both come from the icon slots.
  if (isMenu || p.icons) {
    l.push(
      p.icons
        ? `import { useIcons, type IconName } from "@/lib/icon-context";`
        : `import { useIcons } from "@/lib/icon-context";`
    );
  }
  l.push(``);

  // ── Demo content ──
  l.push(`// Seed rows for the generated menu — replace with your own.`);
  const rowType = [
    ...(p.icons ? ["icon: IconName"] : []),
    "label: string",
    ...(d.groups ? ["group: string"] : []),
    ...(p.disabledRow ? ["disabled?: boolean"] : []),
  ].join("; ");
  l.push(`const ITEMS: { ${rowType} }[] = [`);
  for (const item of DROPDOWN_ITEMS) {
    const fields = [
      ...(p.icons ? [`icon: ${JSON.stringify(item.icon)}`] : []),
      `label: ${JSON.stringify(item.label)}`,
      ...(d.groups ? [`group: ${JSON.stringify(item.group)}`] : []),
      ...(p.disabledRow && item.label === DROPDOWN_DISABLED_LABEL ? ["disabled: true"] : []),
    ];
    l.push(`  { ${fields.join(", ")} },`);
  }
  l.push(`];`);
  if (d.groups) l.push(`const GROUPS = ${JSON.stringify([...DROPDOWN_GROUPS])};`);
  if (d.submenu) {
    l.push(`// The ${DROPDOWN_SUBMENU_LABEL} row opens a submenu of these.`);
    l.push(`const THEMES: { ${p.icons ? "icon: IconName; " : ""}label: string }[] = [`);
    for (const t of DROPDOWN_THEMES) {
      const fields = [
        ...(p.icons ? [`icon: ${JSON.stringify(t.icon)}`] : []),
        `label: ${JSON.stringify(t.label)}`,
      ];
      l.push(`  { ${fields.join(", ")} },`);
    }
    l.push(`];`);
  }
  l.push(``);

  // ── Component ──
  l.push(`export function DropdownDemo() {`);
  if (isMenu || p.icons) l.push(`  const icons = useIcons();`);
  if (isMenu && !p.icons) l.push(`  const ChevronDown = icons["chevron-down"];`);
  if (p.selection === "single") {
    l.push(`  const [selected, setSelected] = useState<string | null>(${JSON.stringify(DROPDOWN_DEFAULT_SELECTED)});`);
  } else if (p.selection === "multiple") {
    l.push(`  const [picked, setPicked] = useState<string[]>(${JSON.stringify([...DROPDOWN_DEFAULT_PICKED])});`);
    l.push(`  const toggle = (label: string) =>`);
    l.push(`    setPicked((c) => (c.includes(label) ? c.filter((x) => x !== label) : [...c, label]));`);
  }
  if (d.submenu) {
    l.push(`  const [theme, setTheme] = useState(${JSON.stringify(DROPDOWN_DEFAULT_THEME)});`);
  }
  if (d.search) {
    l.push(`  const [query, setQuery] = useState("");`);
    // Creatable: the list is state, so a created row can join it.
    if (d.creatable) l.push(`  const [items, setItems] = useState(ITEMS);`);
    l.push(`  // Filter the rows you render; the popup re-indexes from 0 each time.`);
    l.push(`  const rows = ${d.creatable ? "items" : "ITEMS"}.filter((item) =>`);
    l.push(`    item.label.toLowerCase().includes(query.toLowerCase())`);
    l.push(`  );`);
    if (d.creatable) {
      l.push(`  // A create row while the query matches no label exactly.`);
      l.push(`  const q = query.trim();`);
      l.push(`  const canCreate =`);
      l.push(`    q !== "" && !items.some((item) => item.label.toLowerCase() === q.toLowerCase());`);
    }
  } else {
    l.push(`  const rows = ITEMS;`);
  }
  if (p.selection === "single") {
    l.push(`  const checkedIndex = rows.findIndex((item) => item.label === selected);`);
  } else if (p.selection === "multiple") {
    l.push(`  const checkedIndices = rows.flatMap((item, i) => (picked.includes(item.label) ? [i] : []));`);
  }
  l.push(``);
  // A submenu row opens the THEMES list; its rows index from 0 again.
  const ind = d.submenu ? "  " : "";
  l.push(`  const renderRow = (item: (typeof ITEMS)[number], index: number) =>`);
  if (d.submenu) {
    l.push(`    item.label === ${JSON.stringify(DROPDOWN_SUBMENU_LABEL)} ? (`);
    l.push(`      <DropdownSub key={item.label}>`);
    l.push(`        <DropdownSubTrigger`);
    l.push(`          index={index}`);
    if (p.icons) l.push(`          icon={icons[item.icon]}`);
    l.push(`          label={item.label}`);
    if (p.disabledRow) l.push(`          disabled={item.disabled}`);
    l.push(`        />`);
    l.push(`        <DropdownSubContent checkedIndex={THEMES.findIndex((t) => t.label === theme)}>`);
    l.push(`          {THEMES.map((t, i) => (`);
    l.push(`            <MenuItem`);
    l.push(`              key={t.label}`);
    l.push(`              index={i}`);
    if (p.icons) l.push(`              icon={icons[t.icon]}`);
    l.push(`              label={t.label}`);
    l.push(`              checked={theme === t.label}`);
    l.push(`              onSelect={() => setTheme(t.label)}`);
    l.push(`            />`);
    l.push(`          ))}`);
    l.push(`        </DropdownSubContent>`);
    l.push(`      </DropdownSub>`);
    l.push(`    ) : (`);
  } else {
    l.push(`    (`);
  }
  l.push(`${ind}    <MenuItem`);
  l.push(`${ind}      key={item.label}`);
  l.push(`${ind}      index={index}`);
  if (p.icons) l.push(`${ind}      icon={icons[item.icon]}`);
  l.push(`${ind}      label={item.label}`);
  if (p.disabledRow) l.push(`${ind}      disabled={item.disabled}`);
  if (p.selection === "single") {
    l.push(`${ind}      checked={selected === item.label}`);
    l.push(`${ind}      onSelect={() => setSelected(item.label)}`);
  } else if (p.selection === "multiple") {
    l.push(`${ind}      checked={picked.includes(item.label)}`);
    l.push(`${ind}      onSelect={() => toggle(item.label)}`);
  } else {
    l.push(`${ind}      onSelect={() => console.log(item.label)}`);
  }
  l.push(`${ind}    />`);
  l.push(`    );`);
  l.push(``);

  // Rows (grouped or flat) as one expression.
  l.push(`  const content = (`);
  l.push(`    <>`);
  if (d.groups) {
    l.push(`      {GROUPS.map((group) => {`);
    l.push(`        // Indices run through the whole list, not per group.`);
    l.push(`        const first = rows.findIndex((item) => item.group === group);`);
    l.push(`        return (`);
    l.push(`          <Fragment key={group}>`);
    l.push(`            {first > 0 && <DropdownSeparator />}`);
    l.push(`            <DropdownLabel>{group}</DropdownLabel>`);
    l.push(`            {rows`);
    l.push(`              .filter((item) => item.group === group)`);
    l.push(`              .map((item, i) => renderRow(item, first + i))}`);
    l.push(`          </Fragment>`);
    l.push(`        );`);
    l.push(`      })}`);
  } else {
    l.push(`      {rows.map(renderRow)}`);
  }
  if (d.creatable) {
    // Last, after the real matches, so ↑ from the search field reaches it
    // in one press.
    const created = [
      ...(p.icons ? [`icon: ${JSON.stringify(DROPDOWN_CREATED_ICON)}`] : []),
      "label: q",
    ].join(", ");
    l.push(`      {canCreate && (`);
    l.push(`        <MenuItem`);
    l.push(`          index={rows.length}`);
    if (p.icons) l.push(`          icon={icons.plus}`);
    l.push(`          label={\`Create “\${q}”\`}`);
    if (p.selection === "multiple") l.push(`          closeOnClick={false}`);
    l.push(`          onSelect={() => {`);
    l.push(`            setItems((c) => [...c, { ${created} }]);`);
    if (p.selection === "single") l.push(`            setSelected(q);`);
    else if (p.selection === "multiple") l.push(`            toggle(q);`);
    l.push(`            setQuery("");`);
    l.push(`          }}`);
    l.push(`        />`);
    l.push(`      )}`);
  }
  if (d.search) {
    l.push(`      {rows.length === 0${d.creatable ? " && !canCreate" : ""} && <DropdownEmpty>No results</DropdownEmpty>}`);
  }
  l.push(`    </>`);
  l.push(`  );`);
  l.push(``);

  const containerProps: string[] = [];
  if (p.selection === "single") {
    containerProps.push(`checkedIndex={checkedIndex === -1 ? undefined : checkedIndex}`);
  } else if (p.selection === "multiple") {
    containerProps.push(`checkedIndices={checkedIndices}`);
  }
  const props = containerProps.length ? " " + containerProps.join(" ") : "";

  l.push(`  return (`);
  if (isMenu) {
    const triggerLabel =
      p.selection === "single"
        ? `{selected ?? "Choose"}`
        : p.selection === "multiple"
          ? "{`Filters · ${picked.length}`}"
          : "Open menu";
    const chevron = p.icons ? `icons["chevron-down"]` : "ChevronDown";
    l.push(`    <DropdownMenu>`);
    l.push(`      <DropdownTrigger`);
    l.push(`        render={`);
    l.push(`          <Button variant="ghost" trailingIcon={${chevron}}>`);
    l.push(`            ${triggerLabel}`);
    l.push(`          </Button>`);
    l.push(`        }`);
    l.push(`      />`);
    l.push(`      <DropdownContent${props}>`);
    if (d.search) {
      l.push(`        <DropdownSearch value={query} onValueChange={setQuery} placeholder="Search…" />`);
    }
    l.push(`        {content}`);
    l.push(`      </DropdownContent>`);
    l.push(`    </DropdownMenu>`);
  } else {
    l.push(`    <Dropdown${props} aria-label="Settings">`);
    l.push(`      {content}`);
    l.push(`    </Dropdown>`);
  }
  l.push(`  );`);
  l.push(`}`);
  return l.join("\n") + "\n";
}

export function generateDropdownPresetFiles(p: DropdownPreset): PresetFile[] {
  return [
    {
      path: "components/dropdown-demo.tsx",
      type: "registry:component",
      target: "components/dropdown-demo.tsx",
      content: dropdownDemoFile(p),
    },
  ];
}

/** Registry dependencies the generated file needs, as plain names — the
 *  route flavors them with the same helpers postbuild uses. */
export function dropdownPresetRegistryDeps(p: DropdownPreset): string[] {
  const deps = new Set<string>(["utils", "dropdown"]);
  if (p.mode === "menu") deps.add("button");
  if (p.mode === "menu" || p.icons) deps.add("icon-context");
  return [...deps];
}

/** npm dependencies beyond what registryDependencies pull transitively. */
export function dropdownPresetNpmDeps(_p: DropdownPreset): string[] {
  return ["lucide-react"];
}

export const DROPDOWN_PRESET_GENERATOR: PresetGenerator = {
  title: "Dropdown (playground preset)",
  description:
    "A dropdown generated from a fluidfunctionalism.com playground configuration — the exact variant you built, installable.",
  files: (p) => generateDropdownPresetFiles(p as unknown as DropdownPreset),
  registryDeps: (p) => dropdownPresetRegistryDeps(p as unknown as DropdownPreset),
  npmDeps: (p) => dropdownPresetNpmDeps(p as unknown as DropdownPreset),
};
