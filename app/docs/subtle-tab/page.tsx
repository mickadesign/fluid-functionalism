"use client";

import { useState } from "react";
import { SquareLibrary, Clock, Star, Users } from "lucide-react";
import {
  SubtleTab,
  SubtleTabItem,
  SubtleTabPanel,
} from "@/registry/default/subtle-tab";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";

const basicCode = `import { SubtleTab, SubtleTabItem, SubtleTabPanel } from "./components";
import { SquareLibrary, Clock, Star, Users } from "lucide-react";
import { useState } from "react";

const tabs = [
  { icon: SquareLibrary, label: "Teamspaces" },
  { icon: Clock, label: "Recents" },
  { icon: Star, label: "Favorites" },
  { icon: Users, label: "Shared" },
];
const [selected, setSelected] = useState(0);

<SubtleTab
  idPrefix="demo"
  selectedIndex={selected}
  onSelect={setSelected}
>
  {tabs.map((tab, i) => (
    <SubtleTabItem
      key={tab.label}
      index={i}
      icon={tab.icon}
      label={tab.label}
    />
  ))}
</SubtleTab>
{tabs.map((tab, i) => (
  <SubtleTabPanel
    key={tab.label}
    index={i}
    selectedIndex={selected}
    idPrefix="demo"
  >
    <p>{tab.label} content</p>
  </SubtleTabPanel>
))}`;

const tabProps: PropDef[] = [
  { name: "selectedIndex", type: "number", description: "Index of the currently selected tab." },
  { name: "onSelect", type: "(index: number) => void", description: "Called when a tab is selected." },
  { name: "idPrefix", type: "string", description: "Prefix for ARIA IDs linking tabs to panels." },
  { name: "children", type: "ReactNode", description: "SubtleTabItem children." },
];

const tabItemProps: PropDef[] = [
  { name: "icon", type: "LucideIcon", description: "Icon displayed in the tab." },
  { name: "label", type: "string", description: "Text label for the tab." },
  { name: "index", type: "number", description: "Position index within the tab list." },
];

const tabPanelProps: PropDef[] = [
  { name: "index", type: "number", description: "Index of this panel." },
  { name: "selectedIndex", type: "number", description: "Currently selected tab index." },
  { name: "idPrefix", type: "string", description: "Must match the SubtleTab idPrefix." },
  { name: "children", type: "ReactNode", description: "Panel content, only rendered when selected." },
];

export default function SubtleTabDoc() {
  const tabs = [
    { icon: SquareLibrary, label: "Teamspaces" },
    { icon: Clock, label: "Recents" },
    { icon: Star, label: "Favorites" },
    { icon: Users, label: "Shared" },
  ];
  const [selected, setSelected] = useState(0);

  return (
    <DocPage
      title="SubtleTab"
      slug="subtle-tab"
      description="Tab navigation with smooth pill animations."
    >
      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <div className="flex flex-col gap-4 w-full">
            <SubtleTab
              idPrefix="demo"
              selectedIndex={selected}
              onSelect={setSelected}
            >
              {tabs.map((tab, i) => (
                <SubtleTabItem
                  key={tab.label}
                  index={i}
                  icon={tab.icon}
                  label={tab.label}
                />
              ))}
            </SubtleTab>
            {tabs.map((tab, i) => (
              <SubtleTabPanel
                key={tab.label}
                index={i}
                selectedIndex={selected}
                idPrefix="demo"
              >
                <p className="text-[13px] text-muted-foreground px-3">
                  {tab.label} content goes here.
                </p>
              </SubtleTabPanel>
            ))}
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference — SubtleTab">
        <PropsTable props={tabProps} />
      </DocSection>

      <DocSection title="API Reference — SubtleTabItem">
        <PropsTable props={tabItemProps} />
      </DocSection>

      <DocSection title="API Reference — SubtleTabPanel">
        <PropsTable props={tabPanelProps} />
      </DocSection>
    </DocPage>
  );
}
