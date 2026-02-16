import { useState } from "react";
import { SquareLibrary, Clock, Star, Users, Lock } from "lucide-react";
import { Dropdown, MenuItem } from "../../components";
import { ComponentPreview } from "../ComponentPreview";
import { PropsTable, type PropDef } from "../PropsTable";
import { DocPage, DocSection } from "../DocPage";

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

const dropdownProps: PropDef[] = [
  { name: "checkedIndex", type: "number", description: "Index of the currently checked item." },
  { name: "children", type: "ReactNode", description: "MenuItem children." },
];

const menuItemProps: PropDef[] = [
  { name: "icon", type: "LucideIcon", description: "Icon displayed in the menu item." },
  { name: "label", type: "string", description: "Text label for the menu item." },
  { name: "index", type: "number", description: "Position index within the dropdown." },
  { name: "checked", type: "boolean", default: "false", description: "Whether this item is checked." },
  { name: "onSelect", type: "() => void", description: "Called when this item is selected." },
];

export function DropdownDoc() {
  const items = [
    { icon: SquareLibrary, label: "Teamspaces" },
    { icon: Clock, label: "Recents" },
    { icon: Star, label: "Favorites" },
    { icon: Users, label: "Shared" },
    { icon: Lock, label: "Private" },
  ];
  const [selected, setSelected] = useState<number | null>(0);

  return (
    <DocPage
      title="Dropdown"
      description="Menu-style dropdown with proximity hover and animated backgrounds."
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

      <DocSection title="API Reference — Dropdown">
        <PropsTable props={dropdownProps} />
      </DocSection>

      <DocSection title="API Reference — MenuItem">
        <PropsTable props={menuItemProps} />
      </DocSection>
    </DocPage>
  );
}
