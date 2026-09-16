"use client";

import { useState } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxChips,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  type ComboboxItemData,
} from "@/components/flavored/combobox";
import { Switch } from "@/registry/radix/switch";
import { useIcon } from "@/lib/icon-context";
import {
  PLAY_SWITCH,
  PlayField,
  PlaySelect,
  PlaySection,
  PlayDivider,
  PlaygroundPanel,
} from "@/lib/docs/playground";
import {
  COMBOBOX_PRESET_DEF,
  COMBOBOX_DEFAULT_CODE,
  COMBOBOX_COMPONENTS,
  COMBOBOX_COPY,
  encodeComboboxPreset,
  decodeComboboxPreset,
  type ComboboxFieldVariant,
  COMBOBOX_DEFAULT_VALUES,
  deriveCombobox,
  comboboxItemFromQuery,
} from "@/lib/preset/combobox-options";
import {
  usePresetGlobals,
  usePresetUrlSync,
  GetCodeDialog,
} from "@/lib/docs/preset-ui";
import type { PlaygroundProps } from "./types";

// ── Combobox playground ──────────────────────────────────
// A live sandbox: the controls drive a real Combobox — single or multiple,
// framed or borderless — over the library's own component list, with the
// matching code kept in sync in the doc page's Code tab.

function buildPlaygroundCode(o: {
  multiple: boolean;
  variant: ComboboxFieldVariant;
  icon: boolean;
  clearable: boolean;
  error: boolean;
  disabled: boolean;
  creatable: boolean;
  hideSelected: boolean;
}) {
  const Field = o.multiple ? "ComboboxChips" : "ComboboxInput";
  const root = [
    o.creatable ? "items={items}" : "items={components}",
    ...(o.multiple ? ["multiple", "value={values}", "onValueChange={setValues}"] : ["value={value}", "onValueChange={setValue}"]),
    ...(o.hideSelected ? ["hideSelected"] : []),
    ...(o.disabled ? ["disabled"] : []),
  ];
  // The typed label becomes the item; returning it selects it.
  const create = o.creatable
    ? `
  onCreate={(query) => {
    const item = { value: query.toLowerCase().replace(/\\s+/g, "-"), label: query };
    setItems((prev) => [...prev, item]);
    return item;
  }}
`
    : "";
  const empty = o.hideSelected
    ? `<ComboboxEmpty allSelected="${COMBOBOX_COPY.allSelected}">${COMBOBOX_COPY.empty}</ComboboxEmpty>`
    : `<ComboboxEmpty>${COMBOBOX_COPY.empty}</ComboboxEmpty>`;
  const field = [
    `placeholder="${o.multiple ? COMBOBOX_COPY.placeholderMultiple : COMBOBOX_COPY.placeholder}"`,
    ...(o.variant !== "bordered" ? [`variant="${o.variant}"`] : []),
    ...(o.icon ? ["icon={Search}"] : []),
    ...(o.clearable ? ["clearable"] : []),
    ...(o.error ? [`error="${COMBOBOX_COPY.error}"`] : []),
  ];
  const state = [
    ...(o.creatable ? ["const [items, setItems] = useState(components);"] : []),
    o.multiple
      ? `const [values, setValues] = useState<string[]>(${JSON.stringify(COMBOBOX_DEFAULT_VALUES)});`
      : 'const [value, setValue] = useState("");',
  ].join("\n");
  return `${state}

<Combobox ${root.join(" ")}${create}>
  <${Field} ${field.join(" ")} />
  <ComboboxContent>
    ${empty}
    <ComboboxList>
      {(item) => <ComboboxItem key={item.value} value={item.value}>{item.label}</ComboboxItem>}
    </ComboboxList>
  </ComboboxContent>
</Combobox>`;
}

export function ComboboxPlayground({ children }: PlaygroundProps) {
  const SearchIcon = useIcon("search");

  const [multiple, setMultiple] = useState(true);
  const [variant, setVariant] = useState<ComboboxFieldVariant>("bordered");
  const [icon, setIcon] = useState(false);
  const [clearable, setClearable] = useState(false);
  const [error, setError] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [creatable, setCreatable] = useState(false);
  const [hideSelected, setHideSelected] = useState(false);

  const [value, setValue] = useState("");
  const [values, setValues] = useState<string[]>(COMBOBOX_DEFAULT_VALUES);
  // Widened from the tuple: the root's generic wants one element type. State,
  // so a created row can join the list.
  const [items, setItems] = useState<readonly ComboboxItemData[]>(COMBOBOX_COMPONENTS);

  const d = deriveCombobox({ multiple, variant, icon, clearable, error, disabled, creatable, hideSelected });
  const code = buildPlaygroundCode({
    multiple,
    variant,
    icon,
    clearable,
    error,
    disabled,
    creatable,
    hideSelected: d.hideSelected,
  });

  // ── Get code (presets) ─────────────────────────────────
  const globals = usePresetGlobals();
  const presetCode = encodeComboboxPreset({
    multiple,
    variant,
    icon,
    clearable,
    error,
    disabled,
    creatable,
    hideSelected,
    ...globals,
  });
  usePresetUrlSync(presetCode, COMBOBOX_DEFAULT_CODE, (raw) => {
    const res = decodeComboboxPreset(raw);
    if (res.ok) {
      const p = res.preset;
      setMultiple(p.multiple);
      setVariant(p.variant);
      setIcon(p.icon);
      setClearable(p.clearable);
      setError(p.error);
      setDisabled(p.disabled);
      setCreatable(p.creatable);
      setHideSelected(p.hideSelected);
    }
  });

  const randomize = () => {
    const pick = <T,>(arr: readonly T[]) =>
      arr[Math.floor(Math.random() * arr.length)];
    setMultiple(Math.random() > 0.6);
    setVariant(pick(["bordered", "borderless"] as const));
    setIcon(Math.random() > 0.5);
    setClearable(Math.random() > 0.6);
    setError(Math.random() > 0.85);
    setDisabled(Math.random() > 0.9);
    setCreatable(Math.random() > 0.6);
    setHideSelected(Math.random() > 0.6);
    setValue("");
    setValues([]);
  };

  // The typed label becomes the item; returning it selects it.
  const onCreate = creatable
    ? (query: string) => {
        const item = comboboxItemFromQuery(query);
        setItems((prev) => [...prev, item]);
        return item;
      }
    : undefined;
  const empty = d.hideSelected ? (
    <ComboboxEmpty allSelected={COMBOBOX_COPY.allSelected}>{COMBOBOX_COPY.empty}</ComboboxEmpty>
  ) : (
    <ComboboxEmpty>{COMBOBOX_COPY.empty}</ComboboxEmpty>
  );
  const fieldProps = {
    placeholder: multiple ? COMBOBOX_COPY.placeholderMultiple : COMBOBOX_COPY.placeholder,
    variant,
    icon: icon ? SearchIcon : undefined,
    clearable,
    error: error ? COMBOBOX_COPY.error : undefined,
    className: "w-[280px] max-w-full",
  };
  const rows = (
    <ComboboxList>
      {(item) => {
        const v = typeof item === "string" ? item : item.value;
        const label = typeof item === "string" ? item : item.label;
        return (
          <ComboboxItem key={v} value={v}>
            {label}
          </ComboboxItem>
        );
      }}
    </ComboboxList>
  );
  // Two roots rather than one with a conditional `multiple`: the value shape
  // differs, and the primitive resets when it flips anyway.
  const preview = multiple ? (
    <Combobox
      multiple
      items={items}
      value={values}
      onValueChange={setValues}
      onCreate={onCreate}
      hideSelected={d.hideSelected}
      disabled={disabled}
    >
      <ComboboxChips {...fieldProps} />
      <ComboboxContent>
        {empty}
        {rows}
      </ComboboxContent>
    </Combobox>
  ) : (
    <Combobox
      items={items}
      value={value}
      onValueChange={setValue}
      onCreate={onCreate}
      disabled={disabled}
    >
      <ComboboxInput {...fieldProps} />
      <ComboboxContent>
        {empty}
        {rows}
      </ComboboxContent>
    </Combobox>
  );

  const controls = (
    <PlaygroundPanel onShuffle={randomize}>
      <PlaySection label="Combobox" />
      <div>
        <Switch
          label="Multiple"
          checked={multiple}
          onToggle={() => setMultiple((v) => !v)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Create from query"
          checked={creatable}
          onToggle={() => setCreatable((v) => !v)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Hide picked rows"
          checked={d.hideSelected}
          onToggle={() => setHideSelected((v) => !v)}
          disabled={!multiple}
          className={PLAY_SWITCH}
        />
      </div>

      <PlayDivider />
      <PlaySection label="Field" />
      <div>
        <PlayField label="Variant">
          <PlaySelect
            value={variant}
            onChange={(v) => setVariant(v as ComboboxFieldVariant)}
            options={[
              { value: "bordered", label: "Bordered" },
              { value: "borderless", label: "Borderless" },
            ]}
          />
        </PlayField>
        <Switch
          label="Leading icon"
          checked={icon}
          onToggle={() => setIcon((v) => !v)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Clear button"
          checked={clearable}
          onToggle={() => setClearable((v) => !v)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Error"
          checked={error}
          onToggle={() => setError((v) => !v)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Disabled"
          checked={disabled}
          onToggle={() => setDisabled((v) => !v)}
          className={PLAY_SWITCH}
        />
      </div>

      <PlayDivider />
      {/* shadcn's preset principle: the exact configuration above, as a
          stateless code the registry can turn into an installable block. */}
      <GetCodeDialog def={COMBOBOX_PRESET_DEF} code={presetCode} />
    </PlaygroundPanel>
  );

  return children({
    preview,
    // Top-anchored in a box tall enough for the open list (field + 6px
    // offset + 300px popup cap), so the field sits high and the rows have
    // room to drop below instead of flipping above a centered field.
    demoPreview: (
      <div className="flex h-[350px] w-full items-start justify-center">
        {preview}
      </div>
    ),
    controls,
    code,
  });
}
