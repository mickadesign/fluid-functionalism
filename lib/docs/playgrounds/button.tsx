"use client";

import { useState } from "react";
import { useIcon } from "@/lib/icon-context";
import { useSizeVariant } from "@/lib/size-context";
import { Button } from "@/registry/radix/button";
import { Switch } from "@/registry/radix/switch";
import {
  PLAY_SWITCH,
  PlayField,
  PlaySelect,
  PlaySection,
  PlayDivider,
  PlaygroundPanel,
} from "@/lib/docs/playground";
import type { PlaygroundProps } from "./types";

// ── Button playground ────────────────────────────────────
// A live sandbox: the controls drive a single real Button so every
// combination of the props can be previewed, with the matching code kept in
// sync in the doc page's Code tab.

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
      className="h-7 w-[124px] rounded-md bg-transparent px-2 text-right text-body text-foreground transition-colors duration-80 hover:bg-hover focus:bg-hover outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
    />
  );
}

const LABELS = ["Get started", "Learn more", "Deploy", "Continue", "Ship it"] as const;

export function ButtonPlayground({ children }: PlaygroundProps) {
  const Plus = useIcon("plus");
  const ArrowRight = useIcon("arrow-right");

  const [variant, setVariant] = useState<PlayVariant>("primary");
  // The Size control follows the site-wide step (right panel / S) until the
  // user picks a value here — then the explicit choice pins it.
  const globalSize = useSizeVariant();
  const [sizeOverride, setSizeOverride] = useState<PlaySize | null>(null);
  const size = sizeOverride ?? globalSize;
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
    setSizeOverride(pick(["compact", "default"] as const));
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
            onChange={(v) => setSizeOverride(v as PlaySize)}
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

  const preview = (
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
  );

  // A single button reads the same at card scale — the canonical preview IS
  // the compact one.
  return children({ preview, demoPreview: preview, controls, code });
}
