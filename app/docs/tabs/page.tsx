"use client";

import { useState } from "react";
import { SquareLibrary, Clock, Star, Settings } from "lucide-react";
import { Tabs, TabsList, TabItem, TabPanel } from "@/registry/default/tabs";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";

/* ────────── Code snippets ────────── */

const basicCode = `import { Tabs, TabsList, TabItem, TabPanel } from "./components";

<Tabs defaultValue="library">
  <TabsList>
    <TabItem value="library" label="Library" />
    <TabItem value="recents" label="Recents" />
    <TabItem value="favorites" label="Favorites" />
    <TabItem value="settings" label="Settings" />
  </TabsList>
  <TabPanel value="library">Library content.</TabPanel>
  <TabPanel value="recents">Recents content.</TabPanel>
  <TabPanel value="favorites">Favorites content.</TabPanel>
  <TabPanel value="settings">Settings content.</TabPanel>
</Tabs>`;

const iconsCode = `import { Tabs, TabsList, TabItem, TabPanel } from "./components";
import { SquareLibrary, Clock, Star, Settings } from "lucide-react";

<Tabs defaultValue="library">
  <TabsList>
    <TabItem value="library" icon={SquareLibrary} label="Library" />
    <TabItem value="recents" icon={Clock} label="Recents" />
    <TabItem value="favorites" icon={Star} label="Favorites" />
    <TabItem value="settings" icon={Settings} label="Settings" />
  </TabsList>
  <TabPanel value="library">Library content.</TabPanel>
  <TabPanel value="recents">Recents content.</TabPanel>
  <TabPanel value="favorites">Favorites content.</TabPanel>
  <TabPanel value="settings">Settings content.</TabPanel>
</Tabs>`;

const controlledCode = `import { Tabs, TabsList, TabItem, TabPanel } from "./components";
import { useState } from "react";

const [value, setValue] = useState("library");

<Tabs value={value} onValueChange={setValue}>
  <TabsList>
    <TabItem value="library" label="Library" />
    <TabItem value="recents" label="Recents" />
    <TabItem value="favorites" label="Favorites" />
  </TabsList>
  <TabPanel value="library">Library content.</TabPanel>
  <TabPanel value="recents">Recents content.</TabPanel>
  <TabPanel value="favorites">Favorites content.</TabPanel>
</Tabs>`;

/* ────────── Props data ────────── */

const tabsProps: PropDef[] = [
  { name: "value", type: "string", description: "Controlled active tab value. Takes precedence over selectedIndex." },
  { name: "onValueChange", type: "(value: string) => void", description: "Called when the active tab changes." },
  { name: "selectedIndex", type: "number", description: "Index-based controlled alternative." },
  { name: "onSelect", type: "(index: number) => void", description: "Called with the new index when the active tab changes." },
  { name: "defaultValue", type: "string", description: "Default active tab for uncontrolled usage." },
  { name: "children", type: "ReactNode", description: "TabsList and TabPanel children." },
];

const tabsListProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "TabItem children." },
  { name: "className", type: "string", description: "Additional CSS classes for the container." },
];

const tabItemProps: PropDef[] = [
  { name: "value", type: "string", description: "Unique value identifying this tab." },
  { name: "icon", type: "LucideIcon", description: "Optional leading icon." },
  { name: "label", type: "string", description: "Text label for the tab." },
];

const tabPanelProps: PropDef[] = [
  { name: "value", type: "string", description: "Must match a TabItem value." },
  { name: "children", type: "ReactNode", description: "Panel content, rendered when the matching tab is active." },
];

/* ────────── Page ────────── */

export default function TabsDoc() {
  const [controlled, setControlled] = useState("library");

  return (
    <DocPage
      title="Tabs"
      slug="tabs"
      description="Segmented control tabs with sliding active indicator, proximity hover, and spring animations."
    >
      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <div className="flex flex-col gap-4 w-full">
            <Tabs defaultValue="library">
              <TabsList>
                <TabItem value="library" label="Library" />
                <TabItem value="recents" label="Recents" />
                <TabItem value="favorites" label="Favorites" />
                <TabItem value="settings" label="Settings" />
              </TabsList>
              <TabPanel value="library">
                <p className="text-[13px] text-muted-foreground pt-3">
                  Library content.
                </p>
              </TabPanel>
              <TabPanel value="recents">
                <p className="text-[13px] text-muted-foreground pt-3">
                  Recents content.
                </p>
              </TabPanel>
              <TabPanel value="favorites">
                <p className="text-[13px] text-muted-foreground pt-3">
                  Favorites content.
                </p>
              </TabPanel>
              <TabPanel value="settings">
                <p className="text-[13px] text-muted-foreground pt-3">
                  Settings content.
                </p>
              </TabPanel>
            </Tabs>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="With Icons">
        <ComponentPreview code={iconsCode}>
          <div className="flex flex-col gap-4 w-full">
            <Tabs defaultValue="library">
              <TabsList>
                <TabItem value="library" icon={SquareLibrary} label="Library" />
                <TabItem value="recents" icon={Clock} label="Recents" />
                <TabItem value="favorites" icon={Star} label="Favorites" />
                <TabItem value="settings" icon={Settings} label="Settings" />
              </TabsList>
              <TabPanel value="library">
                <p className="text-[13px] text-muted-foreground pt-3">
                  Library content.
                </p>
              </TabPanel>
              <TabPanel value="recents">
                <p className="text-[13px] text-muted-foreground pt-3">
                  Recents content.
                </p>
              </TabPanel>
              <TabPanel value="favorites">
                <p className="text-[13px] text-muted-foreground pt-3">
                  Favorites content.
                </p>
              </TabPanel>
              <TabPanel value="settings">
                <p className="text-[13px] text-muted-foreground pt-3">
                  Settings content.
                </p>
              </TabPanel>
            </Tabs>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Controlled">
        <ComponentPreview code={controlledCode}>
          <div className="flex flex-col gap-4 w-full">
            <Tabs value={controlled} onValueChange={setControlled}>
              <TabsList>
                <TabItem value="library" label="Library" />
                <TabItem value="recents" label="Recents" />
                <TabItem value="favorites" label="Favorites" />
              </TabsList>
              <TabPanel value="library">
                <p className="text-[13px] text-muted-foreground pt-3">
                  Library content.
                </p>
              </TabPanel>
              <TabPanel value="recents">
                <p className="text-[13px] text-muted-foreground pt-3">
                  Recents content.
                </p>
              </TabPanel>
              <TabPanel value="favorites">
                <p className="text-[13px] text-muted-foreground pt-3">
                  Favorites content.
                </p>
              </TabPanel>
            </Tabs>
            <p className="text-[12px] text-muted-foreground">
              Active: <span className="text-foreground">{controlled}</span>
            </p>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference — Tabs">
        <PropsTable props={tabsProps} />
      </DocSection>

      <DocSection title="API Reference — TabsList">
        <PropsTable props={tabsListProps} />
      </DocSection>

      <DocSection title="API Reference — TabItem">
        <PropsTable props={tabItemProps} />
      </DocSection>

      <DocSection title="API Reference — TabPanel">
        <PropsTable props={tabPanelProps} />
      </DocSection>
    </DocPage>
  );
}
