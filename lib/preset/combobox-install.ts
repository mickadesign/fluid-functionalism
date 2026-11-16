// ---------------------------------------------------------------------------
// Install-grade code generation for combobox presets. Emits ONE compilable
// component reproducing what the playground preview renders for the encoded
// state — same list, same field, same selection model. tests/preset-combobox
// .test.mjs compiles the output across the state space through a real
// ts.createProgram over the project tsconfig.
// ---------------------------------------------------------------------------

import type { PresetFile } from "./sidebar-install";
import type { PresetGenerator } from "./light-generators";
import {
  type ComboboxPreset,
  COMBOBOX_COMPONENTS,
  COMBOBOX_COPY,
  COMBOBOX_DEFAULT_VALUES,
  deriveCombobox,
} from "./combobox-options";

function comboboxDemoFile(p: ComboboxPreset): string {
  const l: string[] = [];
  const d = deriveCombobox(p);

  l.push(`"use client";`);
  l.push(``);
  l.push(`import { useState } from "react";`);
  const parts = [
    "Combobox",
    p.multiple ? "ComboboxChips" : "ComboboxInput",
    "ComboboxContent",
    "ComboboxList",
    "ComboboxItem",
    "ComboboxEmpty",
  ];
  l.push(`import {`);
  l.push(`  ${parts.join(",\n  ")},`);
  l.push(`} from "@/components/ui/combobox";`);
  if (p.icon) l.push(`import { useIcons } from "@/lib/icon-context";`);
  l.push(``);

  // ── Demo content ──
  l.push(`// Seed options for the generated combobox — replace with your own.`);
  l.push(`const ITEMS = [`);
  for (const c of COMBOBOX_COMPONENTS) {
    l.push(`  { value: ${JSON.stringify(c.value)}, label: ${JSON.stringify(c.label)} },`);
  }
  l.push(`];`);
  l.push(``);

  // ── Component ──
  l.push(`export function ComboboxDemo() {`);
  if (p.icon) {
    l.push(`  const icons = useIcons();`);
    l.push(`  const SearchIcon = icons.search;`);
  }
  // Creatable: the list is state, so a created row can join it.
  if (p.creatable) l.push(`  const [items, setItems] = useState(ITEMS);`);
  if (p.multiple) l.push(`  const [values, setValues] = useState<string[]>(${JSON.stringify(COMBOBOX_DEFAULT_VALUES)});`);
  else l.push(`  const [value, setValue] = useState("");`);
  l.push(`  return (`);

  const rootProps: string[] = [p.creatable ? "items={items}" : "items={ITEMS}"];
  if (p.multiple) rootProps.push("multiple", "value={values}", "onValueChange={setValues}");
  else rootProps.push("value={value}", "onValueChange={setValue}");
  if (d.hideSelected) rootProps.push("hideSelected");
  if (p.disabled) rootProps.push("disabled");
  if (p.creatable) {
    l.push(`    <Combobox`);
    for (const rp of rootProps) l.push(`      ${rp}`);
    l.push(`      // The typed label becomes the item; returning it selects it.`);
    l.push(`      onCreate={(query) => {`);
    l.push(`        const item = { value: query.toLowerCase().replace(/\\s+/g, "-"), label: query };`);
    l.push(`        setItems((prev) => [...prev, item]);`);
    l.push(`        return item;`);
    l.push(`      }}`);
    l.push(`    >`);
  } else {
    l.push(`    <Combobox ${rootProps.join(" ")}>`);
  }

  const Field = p.multiple ? "ComboboxChips" : "ComboboxInput";
  const fieldProps: string[] = [
    `placeholder=${JSON.stringify(p.multiple ? COMBOBOX_COPY.placeholderMultiple : COMBOBOX_COPY.placeholder)}`,
  ];
  if (p.variant !== "bordered") fieldProps.push(`variant="${p.variant}"`);
  if (p.icon) fieldProps.push("icon={SearchIcon}");
  if (p.clearable) fieldProps.push("clearable");
  if (p.error) fieldProps.push(`error=${JSON.stringify(COMBOBOX_COPY.error)}`);
  fieldProps.push(`className="w-[280px] max-w-full"`);
  l.push(`      <${Field}`);
  for (const fp of fieldProps) l.push(`        ${fp}`);
  l.push(`      />`);

  l.push(`      <ComboboxContent>`);
  if (d.hideSelected) {
    l.push(`        <ComboboxEmpty allSelected=${JSON.stringify(COMBOBOX_COPY.allSelected)}>${COMBOBOX_COPY.empty}</ComboboxEmpty>`);
  } else {
    l.push(`        <ComboboxEmpty>${COMBOBOX_COPY.empty}</ComboboxEmpty>`);
  }
  l.push(`        <ComboboxList>`);
  l.push(`          {(item) => {`);
  l.push(`            const { value, label } = item as (typeof ITEMS)[number];`);
  l.push(`            return (`);
  l.push(`              <ComboboxItem key={value} value={value}>`);
  l.push(`                {label}`);
  l.push(`              </ComboboxItem>`);
  l.push(`            );`);
  l.push(`          }}`);
  l.push(`        </ComboboxList>`);
  l.push(`      </ComboboxContent>`);
  l.push(`    </Combobox>`);
  l.push(`  );`);
  l.push(`}`);
  return l.join("\n") + "\n";
}

export function generateComboboxPresetFiles(p: ComboboxPreset): PresetFile[] {
  return [
    {
      path: "components/combobox-demo.tsx",
      type: "registry:component",
      target: "components/combobox-demo.tsx",
      content: comboboxDemoFile(p),
    },
  ];
}

/** Registry dependencies the generated file needs, as plain names — the
 *  route flavors them with the same helpers postbuild uses. */
export function comboboxPresetRegistryDeps(p: ComboboxPreset): string[] {
  const deps = new Set<string>(["utils", "combobox"]);
  if (p.icon) deps.add("icon-context");
  return [...deps];
}

/** npm dependencies beyond what registryDependencies pull transitively. */
export function comboboxPresetNpmDeps(_p: ComboboxPreset): string[] {
  return ["lucide-react"];
}

export const COMBOBOX_PRESET_GENERATOR: PresetGenerator = {
  title: "Combobox (playground preset)",
  description:
    "A combobox generated from a fluidfunctionalism.com playground configuration — the exact variant you built, installable.",
  files: (p) => generateComboboxPresetFiles(p as unknown as ComboboxPreset),
  registryDeps: (p) => comboboxPresetRegistryDeps(p as unknown as ComboboxPreset),
  npmDeps: (p) => comboboxPresetNpmDeps(p as unknown as ComboboxPreset),
};
