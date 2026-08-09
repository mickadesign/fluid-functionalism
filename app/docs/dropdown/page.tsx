"use client";

import { useState } from "react";
import { useIcon } from "@/lib/icon-context";
import {
  Dropdown,
  DropdownLabel,
  DropdownSeparator,
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
} from "@/components/flavored/dropdown";
import { MenuItem } from "@/registry/default/menu-item";
import { Button } from "@/registry/radix/button";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";

const basicCode = `import { Dropdown, MenuItem } from "./components";
import { SquareLibrary, Clock, Star, Users, Lock } from "lucide-react";
import { useState } from "react";

const items = [
  { icon: SquareLibrary, label: "Teamspaces" },
  { icon: Clock, label: "Recents" },
  { icon: Star, label: "Favorites" },
  { icon: Users, label: "Shared" },
  { icon: Lock, label: "Private" },
];
const [selected, setSelected] = useState<number | null>(0);

<Dropdown checkedIndex={selected ?? undefined}>
  {items.map((item, i) => (
    <MenuItem
      key={item.label}
      index={i}
      icon={item.icon}
      label={item.label}
      checked={selected === i}
      onSelect={() => setSelected(selected === i ? null : i)}
    />
  ))}
</Dropdown>`;

const groupsCode = `import { Dropdown, DropdownLabel, DropdownSeparator, MenuItem } from "./components";
import { Mail, Bell, Shield, Settings, Palette, Monitor } from "lucide-react";

<Dropdown>
  <DropdownLabel>Account</DropdownLabel>
  <MenuItem index={0} icon={Mail} label="Email" />
  <MenuItem index={1} icon={Bell} label="Notifications" />
  <MenuItem index={2} icon={Shield} label="Privacy" />
  <DropdownSeparator />
  <DropdownLabel>Appearance</DropdownLabel>
  <MenuItem index={3} icon={Settings} label="General" />
  <MenuItem index={4} icon={Palette} label="Theme" />
  <MenuItem index={5} icon={Monitor} label="Display" />
</Dropdown>`;

const triggeredCode = `import { DropdownMenu, DropdownTrigger, DropdownContent, MenuItem, Button } from "./components";
import { SquareLibrary, Clock, Star, Users, Lock } from "lucide-react";
import { useState } from "react";

const items = [
  { icon: SquareLibrary, label: "Teamspaces" },
  { icon: Clock, label: "Recents" },
  { icon: Star, label: "Favorites" },
  { icon: Users, label: "Shared" },
  { icon: Lock, label: "Private" },
];
const [view, setView] = useState(0);

<DropdownMenu>
  <DropdownTrigger render={<Button variant="secondary">Open menu</Button>} />
  <DropdownContent checkedIndex={view}>
    {items.map((item, i) => (
      <MenuItem
        key={item.label}
        index={i}
        icon={item.icon}
        label={item.label}
        checked={view === i}
        onSelect={() => setView(i)}
      />
    ))}
  </DropdownContent>
</DropdownMenu>`;

const dropdownProps: PropDef[] = [
  { name: "checkedIndex", type: "number", description: "Index of the currently checked item." },
  { name: "children", type: "ReactNode", description: "MenuItem children." },
  { name: "aria-label", type: "string", description: "Accessible name for the inline panel. The always-visible panel renders as a plain role=\"group\" — popup menu semantics (role=\"menu\") belong to the triggered DropdownContent." },
];

const dropdownMenuProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "DropdownTrigger and DropdownContent." },
  { name: "open", type: "boolean", description: "Controlled open state." },
  { name: "defaultOpen", type: "boolean", default: "false", description: "Initial open state (uncontrolled)." },
  { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when the menu opens or closes." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables opening the menu." },
];

const dropdownTriggerProps: PropDef[] = [
  { name: "render", type: "ReactElement", description: "Element to render as the trigger (Base UI composition), e.g. a Button." },
  { name: "children", type: "ReactNode", description: "Trigger content when no render element is given." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the trigger." },
];

const dropdownContentProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "MenuItem, DropdownLabel, and DropdownSeparator children." },
  { name: "checkedIndex", type: "number", description: "Index of the checked item — drives the animated selected background and the radio-group value." },
  { name: "side", type: "\"top\" | \"bottom\" | \"left\" | \"right\"", default: "\"bottom\"", description: "Preferred side of the trigger to place the popup." },
  { name: "align", type: "\"start\" | \"center\" | \"end\"", default: "\"start\"", description: "Alignment against the trigger." },
  { name: "sideOffset", type: "number", default: "6", description: "Gap between trigger and popup, in pixels." },
];

const labelProps: PropDef[] = [
  {
    name: "children",
    type: "ReactNode",
    description: "Label text content.",
  },
];

const separatorProps: PropDef[] = [
  {
    name: "className",
    type: "string",
    description: "Additional CSS classes.",
  },
];

const menuItemProps: PropDef[] = [
  { name: "icon", type: "IconComponent", description: "Icon displayed in the menu item." },
  { name: "label", type: "string", description: "Text label for the menu item." },
  { name: "index", type: "number", description: "Position index within the dropdown." },
  { name: "checked", type: "boolean", default: "false", description: "Whether this item is checked. When set (even false), the item is a radio-style option; when undefined it is a plain action item." },
  { name: "onSelect", type: "() => void", description: "Called when this item is selected." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the item." },
  { name: "closeOnClick", type: "boolean", default: "true", description: "Popup-only: whether selecting the item closes the menu. Ignored in the inline panel." },
];

export default function DropdownDoc() {
  const SquareLibrary = useIcon("square-library");
  const Clock = useIcon("clock");
  const Star = useIcon("star");
  const Users = useIcon("users");
  const Lock = useIcon("lock");
  const Mail = useIcon("mail");
  const Bell = useIcon("bell");
  const Shield = useIcon("shield");
  const Settings = useIcon("settings");
  const Palette = useIcon("palette");
  const Monitor = useIcon("monitor");

  const items = [
    { icon: SquareLibrary, label: "Teamspaces" },
    { icon: Clock, label: "Recents" },
    { icon: Star, label: "Favorites" },
    { icon: Users, label: "Shared" },
    { icon: Lock, label: "Private" },
  ];
  const [selected, setSelected] = useState<number | null>(0);
  const [view, setView] = useState(0);

  return (
    <DocPage
      title="Dropdown"
      slug="dropdown"
      description="Menu-style dropdown with proximity hover and animated backgrounds — as an always-visible inline panel or a triggered popup built on Base UI Menu."
    >
      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <Dropdown checkedIndex={selected ?? undefined}>
            {items.map((item, i) => (
              <MenuItem
                key={item.label}
                index={i}
                icon={item.icon}
                label={item.label}
                checked={selected === i}
                onSelect={() => setSelected(selected === i ? null : i)}
              />
            ))}
          </Dropdown>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Groups">
        <ComponentPreview code={groupsCode}>
          <Dropdown>
            <DropdownLabel>Account</DropdownLabel>
            <MenuItem index={0} icon={Mail} label="Email" />
            <MenuItem index={1} icon={Bell} label="Notifications" />
            <MenuItem index={2} icon={Shield} label="Privacy" />
            <DropdownSeparator />
            <DropdownLabel>Appearance</DropdownLabel>
            <MenuItem index={3} icon={Settings} label="General" />
            <MenuItem index={4} icon={Palette} label="Theme" />
            <MenuItem index={5} icon={Monitor} label="Display" />
          </Dropdown>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Triggered menu">
        <p className="text-subtitle text-muted-foreground">
          The inline panels above are always visible and render as a plain
          group. For a real popup menu — trigger button, positioning,
          dismissal, typeahead, and close-on-select, built on Base UI&apos;s
          Menu — compose <code>DropdownMenu</code>,{" "}
          <code>DropdownTrigger</code>, and <code>DropdownContent</code>. Any
          element can be the trigger via the <code>render</code> prop.
        </p>
        <ComponentPreview code={triggeredCode}>
          <DropdownMenu>
            <DropdownTrigger
              render={<Button variant="secondary">Open menu</Button>}
            />
            <DropdownContent checkedIndex={view}>
              {items.map((item, i) => (
                <MenuItem
                  key={item.label}
                  index={i}
                  icon={item.icon}
                  label={item.label}
                  checked={view === i}
                  onSelect={() => setView(i)}
                />
              ))}
            </DropdownContent>
          </DropdownMenu>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference — Dropdown">
        <PropsTable props={dropdownProps} />
      </DocSection>

      <DocSection title="API Reference — MenuItem">
        <PropsTable props={menuItemProps} />
      </DocSection>

      <DocSection title="API Reference — DropdownMenu">
        <PropsTable props={dropdownMenuProps} />
      </DocSection>

      <DocSection title="API Reference — DropdownTrigger">
        <PropsTable props={dropdownTriggerProps} />
      </DocSection>

      <DocSection title="API Reference — DropdownContent">
        <PropsTable props={dropdownContentProps} />
      </DocSection>

      <DocSection title="API Reference — DropdownLabel">
        <PropsTable props={labelProps} />
      </DocSection>

      <DocSection title="API Reference — DropdownSeparator">
        <PropsTable props={separatorProps} />
      </DocSection>
    </DocPage>
  );
}
