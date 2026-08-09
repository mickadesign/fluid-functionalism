"use client";

import { useState } from "react";
import { useIcon } from "@/lib/icon-context";
import { Button } from "@/registry/radix/button";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { Switch } from "@/registry/radix/switch";
import {
  PLAY_SWITCH,
  PlayField,
  PlaySelect,
  PlaySection,
  PlayDivider,
  PlaygroundPanel,
  PlaygroundLayout,
} from "@/lib/docs/playground";

const variantsCode = `import { Button } from "./components";

<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="tertiary">Tertiary</Button>
<Button variant="ghost">Ghost</Button>`;

const sizesCode = `import { Button } from "./components";
import { Plus } from "lucide-react";

// Two steps on the shared size ladder — see /docs/sizes.
<Button size="compact">Compact</Button>
<Button>Default</Button>
<Button size="icon-compact"><Plus /></Button>
<Button size="icon"><Plus /></Button>`;

const iconsCode = `import { Button } from "./components";
import { Plus, ArrowRight, Search } from "lucide-react";

<Button leadingIcon={Plus}>Create</Button>
<Button variant="secondary" trailingIcon={ArrowRight}>Next</Button>
<Button variant="tertiary" leadingIcon={Search} trailingIcon={ArrowRight}>
  Search
</Button>`;

const loadingCode = `import { Button } from "./components";
import { Loader } from "lucide-react";

<Button loading>Loading</Button>
<Button variant="secondary" loading leadingIcon={Loader}>Saving</Button>
<Button disabled>Disabled</Button>`;

const buttonProps: PropDef[] = [
  { name: "variant", type: '"primary" | "secondary" | "tertiary" | "ghost"', default: '"primary"', description: "Visual style of the button." },
  { name: "size", type: '"default" | "compact" | "icon" | "icon-compact"', default: "from SizeProvider", description: "Step on the size ladder (36px default, 28px compact — see /docs/sizes). Legacy sm/md/lg values resolve as aliases." },
  { name: "loading", type: "boolean", default: "false", description: "Shows a spinner and disables the button." },
  { name: "active", type: "boolean", default: "false", description: "Forces the pressed/held visual — e.g. while a dropdown or popover the button opened is showing." },
  { name: "leadingIcon", type: "IconComponent", description: "Icon displayed before the label." },
  { name: "trailingIcon", type: "IconComponent", description: "Icon displayed after the label." },
  { name: "asChild", type: "boolean", default: "false", description: "Merge props onto the child element instead of rendering a <button>." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the button." },
];

// ── Playground ───────────────────────────────────────────
// A live sandbox: the controls on the right drive a single real Button so
// every combination of the props can be previewed, with the matching code
// kept in sync in the Code tab.

type PlayVariant = "primary" | "secondary" | "tertiary" | "ghost";
type PlaySize = "compact" | "default";

// "Icon only" swaps the text sizes for their square counterparts.
const ICON_ONLY_SIZE: Record<PlaySize, "icon-compact" | "icon"> = {
  compact: "icon-compact",
  default: "icon",
};

function buildButtonCode(o: {
  variant: PlayVariant;
  size: PlaySize;
  iconOnly: boolean;
  leading: boolean;
  trailing: boolean;
  label: string;
  loading: boolean;
  active: boolean;
  disabled: boolean;
}) {
  const size = o.iconOnly ? ICON_ONLY_SIZE[o.size] : o.size;
  const props: string[] = [];
  if (o.variant !== "primary") props.push(`variant="${o.variant}"`);
  if (size !== "default") props.push(`size="${size}"`);
  if (!o.iconOnly && o.leading) props.push("leadingIcon={Plus}");
  if (!o.iconOnly && o.trailing) props.push("trailingIcon={ArrowRight}");
  if (o.loading) props.push("loading");
  if (o.active) props.push("active");
  if (o.disabled) props.push("disabled");
  // Icon-only buttons have no visible text, so the label becomes the
  // accessible name instead.
  if (o.iconOnly) props.push(`aria-label="${o.label}"`);
  const child = o.iconOnly ? "<Plus />" : o.label;

  const oneLine = `<Button${props.length ? " " + props.join(" ") : ""}>${child}</Button>`;
  if (oneLine.length <= 60) return oneLine;
  return `<Button\n${props.map((p) => "  " + p).join("\n")}\n>\n  ${child}\n</Button>`;
}

// A borderless text input styled to match the select rows.
function PlayText({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Button label"
      className="h-7 w-[124px] rounded-md bg-transparent px-2 text-right text-[13px] text-foreground transition-colors duration-80 hover:bg-hover focus:bg-hover outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
    />
  );
}

const LABELS = ["Get started", "Learn more", "Deploy", "Continue", "Ship it"] as const;

function ButtonPlayground() {
  const Plus = useIcon("plus");
  const ArrowRight = useIcon("arrow-right");

  const [variant, setVariant] = useState<PlayVariant>("primary");
  const [size, setSize] = useState<PlaySize>("default");
  const [iconOnly, setIconOnly] = useState(false);
  const [leading, setLeading] = useState(false);
  const [trailing, setTrailing] = useState(false);
  const [label, setLabel] = useState<string>(LABELS[0]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(false);
  const [disabled, setDisabled] = useState(false);

  // An emptied label field would render a collapsed button (and an empty
  // accessible name when icon-only) — fall back to the default label instead.
  const labelText = label.trim() === "" ? LABELS[0] : label;

  const code = buildButtonCode({
    variant,
    size,
    iconOnly,
    leading,
    trailing,
    label: labelText,
    loading,
    active,
    disabled,
  });

  const randomize = () => {
    const pick = <T,>(arr: readonly T[]) =>
      arr[Math.floor(Math.random() * arr.length)];
    setVariant(pick(["primary", "secondary", "tertiary", "ghost"] as const));
    setSize(pick(["compact", "default"] as const));
    setIconOnly(Math.random() > 0.85);
    setLeading(Math.random() > 0.5);
    setTrailing(Math.random() > 0.75);
    setLabel(pick(LABELS));
    setLoading(Math.random() > 0.85);
    setActive(Math.random() > 0.85);
    setDisabled(Math.random() > 0.9);
  };

  const controls = (
    <PlaygroundPanel onShuffle={randomize}>
      <PlaySection label="Button" />
      <div>
        <PlayField label="Variant">
          <PlaySelect
            value={variant}
            onChange={(v) => setVariant(v as PlayVariant)}
            options={[
              { value: "primary", label: "Primary" },
              { value: "secondary", label: "Secondary" },
              { value: "tertiary", label: "Tertiary" },
              { value: "ghost", label: "Ghost" },
            ]}
          />
        </PlayField>
        <PlayField label="Size">
          <PlaySelect
            value={size}
            onChange={(v) => setSize(v as PlaySize)}
            options={[
              { value: "compact", label: "Compact" },
              { value: "default", label: "Default" },
            ]}
          />
        </PlayField>
        <PlayField label="Label" disabled={iconOnly}>
          <PlayText value={label} onChange={setLabel} />
        </PlayField>
        <Switch
          label="Icon only"
          checked={iconOnly}
          onToggle={() => setIconOnly((v) => !v)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Leading icon"
          checked={leading}
          onToggle={() => setLeading((v) => !v)}
          disabled={iconOnly}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Trailing icon"
          checked={trailing}
          onToggle={() => setTrailing((v) => !v)}
          disabled={iconOnly}
          className={PLAY_SWITCH}
        />
      </div>

      <PlayDivider />

      <PlaySection label="State" />
      <div>
        <Switch
          label="Loading"
          checked={loading}
          onToggle={() => setLoading((v) => !v)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Active"
          checked={active}
          onToggle={() => setActive((v) => !v)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Disabled"
          checked={disabled}
          onToggle={() => setDisabled((v) => !v)}
          className={PLAY_SWITCH}
        />
      </div>
    </PlaygroundPanel>
  );

  return (
    <PlaygroundLayout
      controls={controls}
      preview={
        <ComponentPreview code={code} minHeightClass="min-h-[280px]">
          <Button
            variant={variant}
            size={iconOnly ? ICON_ONLY_SIZE[size] : size}
            leadingIcon={!iconOnly && leading ? Plus : undefined}
            trailingIcon={!iconOnly && trailing ? ArrowRight : undefined}
            loading={loading}
            active={active}
            disabled={disabled}
            aria-label={iconOnly ? labelText : undefined}
          >
            {iconOnly ? <Plus /> : labelText}
          </Button>
        </ComponentPreview>
      }
    />
  );
}

export default function ButtonDoc() {
  const Plus = useIcon("plus");
  const ArrowRight = useIcon("arrow-right");
  const Search = useIcon("search");
  const Loader = useIcon("loader");

  const [loading, setLoading] = useState(false);

  return (
    <DocPage
      title="Button"
      slug="button"
      description="Versatile button with variants, sizes, loading state, and icon support."
    >
      <DocSection title="Playground">
        <ButtonPlayground />
      </DocSection>

      <DocSection title="Variants">
        <ComponentPreview code={variantsCode}>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="tertiary">Tertiary</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Sizes">
        <ComponentPreview code={sizesCode}>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="compact">Compact</Button>
            <Button>Default</Button>
            <Button size="icon-compact"><Plus /></Button>
            <Button size="icon"><Plus /></Button>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="With Icons">
        <ComponentPreview code={iconsCode}>
          <div className="flex flex-wrap items-center gap-2">
            <Button leadingIcon={Plus}>Create</Button>
            <Button variant="secondary" trailingIcon={ArrowRight}>Next</Button>
            <Button variant="tertiary" leadingIcon={Search} trailingIcon={ArrowRight}>Search</Button>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Loading & Disabled">
        <ComponentPreview code={loadingCode}>
          <div className="flex flex-wrap items-center gap-2">
            <Button loading={loading} onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 2000);
            }}>
              {loading ? "Loading" : "Click me"}
            </Button>
            <Button variant="secondary" loading leadingIcon={Loader}>Saving</Button>
            <Button disabled>Disabled</Button>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <PropsTable props={buttonProps} />
      </DocSection>
    </DocPage>
  );
}
