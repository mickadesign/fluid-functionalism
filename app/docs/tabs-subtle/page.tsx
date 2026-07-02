"use client";

import { useState } from "react";
import { useIcon } from "@/lib/icon-context";
import {
  TabsSubtle,
  TabsSubtleItem,
  TabsSubtlePanel,
} from "@/components/flavored/tabs-subtle";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";

const basicCode = `import { TabsSubtle, TabsSubtleItem, TabsSubtlePanel } from "./components";
import { useState } from "react";

const tabs = ["Teamspaces", "Recents", "Favorites", "Shared"];
const [selected, setSelected] = useState(0);

<TabsSubtle
  idPrefix="demo"
  selectedIndex={selected}
  onSelect={setSelected}
>
  {tabs.map((label, i) => (
    <TabsSubtleItem key={label} index={i} label={label} />
  ))}
</TabsSubtle>
{tabs.map((label, i) => (
  <TabsSubtlePanel
    key={label}
    index={i}
    selectedIndex={selected}
    idPrefix="demo"
  >
    <p>{label} content</p>
  </TabsSubtlePanel>
))}`;

const iconsCode = `import { TabsSubtle, TabsSubtleItem, TabsSubtlePanel } from "./components";
import { SquareLibrary, Clock, Star, Users } from "lucide-react";
import { useState } from "react";

const tabs = [
  { icon: SquareLibrary, label: "Teamspaces" },
  { icon: Clock, label: "Recents" },
  { icon: Star, label: "Favorites" },
  { icon: Users, label: "Shared" },
];
const [selected, setSelected] = useState(0);

<TabsSubtle
  idPrefix="demo"
  selectedIndex={selected}
  onSelect={setSelected}
>
  {tabs.map((tab, i) => (
    <TabsSubtleItem
      key={tab.label}
      index={i}
      icon={tab.icon}
      label={tab.label}
    />
  ))}
</TabsSubtle>
{tabs.map((tab, i) => (
  <TabsSubtlePanel
    key={tab.label}
    index={i}
    selectedIndex={selected}
    idPrefix="demo"
  >
    <p>{tab.label} content</p>
  </TabsSubtlePanel>
))}`;

const activeLabelCode = `import { TabsSubtle, TabsSubtleItem, TabsSubtlePanel } from "./components";
import { SquareLibrary, Clock, Star, Users } from "lucide-react";
import { useState } from "react";

const tabs = [
  { icon: SquareLibrary, label: "Teamspaces" },
  { icon: Clock, label: "Recents" },
  { icon: Star, label: "Favorites" },
  { icon: Users, label: "Shared" },
];
const [selected, setSelected] = useState(0);

<TabsSubtle
  activeLabel
  idPrefix="demo"
  selectedIndex={selected}
  onSelect={setSelected}
>
  {tabs.map((tab, i) => (
    <TabsSubtleItem
      key={tab.label}
      index={i}
      icon={tab.icon}
      label={tab.label}
    />
  ))}
</TabsSubtle>`;

const tabProps: PropDef[] = [
  { name: "selectedIndex", type: "number", description: "Index of the currently selected tab." },
  { name: "onSelect", type: "(index: number) => void", description: "Called when a tab is selected." },
  { name: "idPrefix", type: "string", description: "Prefix for ARIA IDs linking tabs to panels." },
  { name: "activeLabel", type: "boolean", default: "false", description: "When true, only the selected tab shows its text label. Requires icons on tabs." },
  { name: "children", type: "ReactNode", description: "TabsSubtleItem children." },
];

const tabItemProps: PropDef[] = [
  { name: "icon", type: "IconComponent", description: "Icon displayed in the tab.", default: "—" },
  { name: "label", type: "string", description: "Text label for the tab." },
  { name: "index", type: "number", description: "Position index within the tab list." },
];

const tabPanelProps: PropDef[] = [
  { name: "index", type: "number", description: "Index of this panel." },
  { name: "selectedIndex", type: "number", description: "Currently selected tab index." },
  { name: "idPrefix", type: "string", description: "Must match the TabsSubtle idPrefix." },
  { name: "children", type: "ReactNode", description: "Panel content, only rendered when selected." },
];

export default function TabsSubtleDoc() {
  const SquareLibrary = useIcon("square-library");
  const Clock = useIcon("clock");
  const Star = useIcon("star");
  const Users = useIcon("users");

  const tabs = [
    { icon: SquareLibrary, label: "Teamspaces" },
    { icon: Clock, label: "Recents" },
    { icon: Star, label: "Favorites" },
    { icon: Users, label: "Shared" },
  ];
  const basicTabs = ["Teamspaces", "Recents", "Favorites", "Shared"];
  const [basicSelected, setBasicSelected] = useState(0);
  const [iconsSelected, setIconsSelected] = useState(0);
  const [activeLabelSelected, setActiveLabelSelected] = useState(0);

  return (
    <DocPage
      title="TabsSubtle"
      slug="tabs-subtle"
      description="Tab navigation with smooth pill animations."
    >
      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <div className="flex flex-col gap-4 w-full">
            <TabsSubtle
              idPrefix="basic-demo"
              selectedIndex={basicSelected}
              onSelect={setBasicSelected}
            >
              {basicTabs.map((label, i) => (
                <TabsSubtleItem key={label} index={i} label={label} />
              ))}
            </TabsSubtle>
            {basicTabs.map((label, i) => (
              <TabsSubtlePanel
                key={label}
                index={i}
                selectedIndex={basicSelected}
                idPrefix="basic-demo"
              >
                <p className="text-[13px] text-muted-foreground px-3">
                  {label} content goes here.
                </p>
              </TabsSubtlePanel>
            ))}
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="With Icons">
        <ComponentPreview code={iconsCode}>
          <div className="flex flex-col gap-4 w-full">
            <TabsSubtle
              idPrefix="icons-demo"
              selectedIndex={iconsSelected}
              onSelect={setIconsSelected}
            >
              {tabs.map((tab, i) => (
                <TabsSubtleItem
                  key={tab.label}
                  index={i}
                  icon={tab.icon}
                  label={tab.label}
                />
              ))}
            </TabsSubtle>
            {tabs.map((tab, i) => (
              <TabsSubtlePanel
                key={tab.label}
                index={i}
                selectedIndex={iconsSelected}
                idPrefix="icons-demo"
              >
                <p className="text-[13px] text-muted-foreground px-3">
                  {tab.label} content goes here.
                </p>
              </TabsSubtlePanel>
            ))}
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Active Label">
        <ComponentPreview code={activeLabelCode}>
          <div className="flex flex-col gap-4 w-full">
            <TabsSubtle
              activeLabel
              idPrefix="active-label-demo"
              selectedIndex={activeLabelSelected}
              onSelect={setActiveLabelSelected}
            >
              {tabs.map((tab, i) => (
                <TabsSubtleItem
                  key={tab.label}
                  index={i}
                  icon={tab.icon}
                  label={tab.label}
                />
              ))}
            </TabsSubtle>
            {tabs.map((tab, i) => (
              <TabsSubtlePanel
                key={tab.label}
                index={i}
                selectedIndex={activeLabelSelected}
                idPrefix="active-label-demo"
              >
                <p className="text-[13px] text-muted-foreground px-3">
                  {tab.label} content goes here.
                </p>
              </TabsSubtlePanel>
            ))}
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference — TabsSubtle">
        <PropsTable props={tabProps} />
      </DocSection>

      <DocSection title="API Reference — TabsSubtleItem">
        <PropsTable props={tabItemProps} />
      </DocSection>

      <DocSection title="API Reference — TabsSubtlePanel">
        <PropsTable props={tabPanelProps} />
      </DocSection>
    </DocPage>
  );
}
