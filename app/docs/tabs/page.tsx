"use client";

import { useState } from "react";
import { useIcon } from "@/lib/icon-context";
import {
  Tabs,
  TabsItem,
  TabsPanel,
} from "@/components/flavored/tabs";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { tabProps, tabItemProps, tabPanelProps } from "@/lib/docs/api/tabs";

const basicCode = `import { Tabs, TabsItem, TabsPanel } from "./components";
import { useState } from "react";

const tabs = ["Teamspaces", "Recents", "Favorites", "Shared"];
const [selected, setSelected] = useState(0);

<Tabs
  idPrefix="demo"
  selectedIndex={selected}
  onSelect={setSelected}
>
  {tabs.map((label, i) => (
    <TabsItem key={label} index={i} label={label} />
  ))}
</Tabs>
{tabs.map((label, i) => (
  <TabsPanel
    key={label}
    index={i}
    selectedIndex={selected}
    idPrefix="demo"
  >
    <p>{label} content</p>
  </TabsPanel>
))}`;

const iconsCode = `import { Tabs, TabsItem, TabsPanel } from "./components";
import { SquareLibrary, Clock, Star, Users } from "lucide-react";
import { useState } from "react";

const tabs = [
  { icon: SquareLibrary, label: "Teamspaces" },
  { icon: Clock, label: "Recents" },
  { icon: Star, label: "Favorites" },
  { icon: Users, label: "Shared" },
];
const [selected, setSelected] = useState(0);

<Tabs
  idPrefix="demo"
  selectedIndex={selected}
  onSelect={setSelected}
>
  {tabs.map((tab, i) => (
    <TabsItem
      key={tab.label}
      index={i}
      icon={tab.icon}
      label={tab.label}
    />
  ))}
</Tabs>
{tabs.map((tab, i) => (
  <TabsPanel
    key={tab.label}
    index={i}
    selectedIndex={selected}
    idPrefix="demo"
  >
    <p>{tab.label} content</p>
  </TabsPanel>
))}`;

const activeLabelCode = `import { Tabs, TabsItem, TabsPanel } from "./components";
import { SquareLibrary, Clock, Star, Users } from "lucide-react";
import { useState } from "react";

const tabs = [
  { icon: SquareLibrary, label: "Teamspaces" },
  { icon: Clock, label: "Recents" },
  { icon: Star, label: "Favorites" },
  { icon: Users, label: "Shared" },
];
const [selected, setSelected] = useState(0);

<Tabs
  activeLabel
  idPrefix="demo"
  selectedIndex={selected}
  onSelect={setSelected}
>
  {tabs.map((tab, i) => (
    <TabsItem
      key={tab.label}
      index={i}
      icon={tab.icon}
      label={tab.label}
    />
  ))}
</Tabs>`;

export default function TabsDoc() {
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
      title="Tabs"
      slug="tabs"
      description="Tab navigation with smooth pill animations."
    >
      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <div className="flex flex-col gap-4 w-full">
            <Tabs
              idPrefix="basic-demo"
              selectedIndex={basicSelected}
              onSelect={setBasicSelected}
            >
              {basicTabs.map((label, i) => (
                <TabsItem key={label} index={i} label={label} />
              ))}
            </Tabs>
            {basicTabs.map((label, i) => (
              <TabsPanel
                key={label}
                index={i}
                selectedIndex={basicSelected}
                idPrefix="basic-demo"
              >
                <p className="text-site-body text-muted-foreground px-3">
                  {label} content goes here.
                </p>
              </TabsPanel>
            ))}
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="With Icons">
        <ComponentPreview code={iconsCode}>
          <div className="flex flex-col gap-4 w-full">
            <Tabs
              idPrefix="icons-demo"
              selectedIndex={iconsSelected}
              onSelect={setIconsSelected}
            >
              {tabs.map((tab, i) => (
                <TabsItem
                  key={tab.label}
                  index={i}
                  icon={tab.icon}
                  label={tab.label}
                />
              ))}
            </Tabs>
            {tabs.map((tab, i) => (
              <TabsPanel
                key={tab.label}
                index={i}
                selectedIndex={iconsSelected}
                idPrefix="icons-demo"
              >
                <p className="text-site-body text-muted-foreground px-3">
                  {tab.label} content goes here.
                </p>
              </TabsPanel>
            ))}
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Active Label">
        <ComponentPreview code={activeLabelCode}>
          <div className="flex flex-col gap-4 w-full">
            <Tabs
              activeLabel
              idPrefix="active-label-demo"
              selectedIndex={activeLabelSelected}
              onSelect={setActiveLabelSelected}
            >
              {tabs.map((tab, i) => (
                <TabsItem
                  key={tab.label}
                  index={i}
                  icon={tab.icon}
                  label={tab.label}
                />
              ))}
            </Tabs>
            {tabs.map((tab, i) => (
              <TabsPanel
                key={tab.label}
                index={i}
                selectedIndex={activeLabelSelected}
                idPrefix="active-label-demo"
              >
                <p className="text-site-body text-muted-foreground px-3">
                  {tab.label} content goes here.
                </p>
              </TabsPanel>
            ))}
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference — Tabs">
        <PropsTable props={tabProps} />
      </DocSection>

      <DocSection title="API Reference — TabsItem">
        <PropsTable props={tabItemProps} />
      </DocSection>

      <DocSection title="API Reference — TabsPanel">
        <PropsTable props={tabPanelProps} />
      </DocSection>
    </DocPage>
  );
}
