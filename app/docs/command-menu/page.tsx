"use client";

import { useMemo, useState } from "react";
import { showSuccessToast } from "@/lib/docs/settings-toast";
import {
  CommandMenu,
  CommandMenuDialog,
  CommandMenuInput,
  CommandMenuTabs,
  CommandMenuFilters,
  CommandMenuList,
  CommandMenuEmpty,
  CommandMenuItem,
  CommandMenuShortcut,
  CommandMenuFooter,
  useIsMac,
  type CommandMenuItemData,
} from "@/registry/default/command-menu";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/flavored/select";
import { Button } from "@/registry/radix/button";
import { Elevated } from "@/lib/elevated";
import { useShape } from "@/lib/shape-context";
import { useIcon } from "@/lib/icon-context";
import { cn } from "@/lib/utils";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { PlaygroundLayout } from "@/lib/docs/playground";
import { CommandMenuPlayground } from "@/lib/docs/playgrounds/command-menu";
import {
  COMMAND_MENU_SUGGESTIONS,
  COMMAND_MENU_TABS,
  COMMAND_MENU_TYPES,
  COMMAND_MENU_SORTS,
  COMMAND_MENU_COPY,
  useCommandMenuItems,
} from "@/lib/docs/command-menu-items";
import { itemDataProps, rootProps, dialogProps, inputProps, listProps, itemProps, tabsProps, footerProps, shortcutProps } from "@/lib/docs/api/command-menu";

// ---------------------------------------------------------------------------
// Code snippets
// ---------------------------------------------------------------------------

const basicCode = `import {
  CommandMenu, CommandMenuInput, CommandMenuList, CommandMenuEmpty,
} from "./components";
import { Plus, Search, Moon, Home, Inbox, Calendar } from "lucide-react";

// Items are data. \`group\` is the heading a row lists under.
const items = [
  { value: "new-file", label: "New file", icon: Plus, group: "Actions" },
  { value: "search", label: "Search everywhere", icon: Search, group: "Actions" },
  { value: "theme", label: "Toggle dark mode", icon: Moon, group: "Actions" },
  { value: "home", label: "Home", icon: Home, group: "Go to" },
  { value: "inbox", label: "Inbox", icon: Inbox, group: "Go to" },
  { value: "calendar", label: "Calendar", icon: Calendar, group: "Go to" },
];

{/* Inline: the panel is yours, the menu fills it */}
<div className="h-[360px] w-[520px] overflow-hidden rounded-xl border border-border">
  <CommandMenu items={items} onSelect={(item) => run(item)}>
    <CommandMenuInput placeholder="Type a command or search…" />
    <CommandMenuList>
      <CommandMenuEmpty>No results.</CommandMenuEmpty>
    </CommandMenuList>
  </CommandMenu>
</div>`;

const detailsCode = `const items = [
  // description: text after the label, 1 contrast step lower. shortcut:
  // caps at the trailing edge, display only. keywords: extra filter terms.
  {
    value: "new-file", label: "New file", description: "Blank document",
    icon: Plus, shortcut: "mod+n", keywords: ["create", "document"], group: "Actions",
  },
  {
    value: "theme", label: "Toggle dark mode", description: "System, light, or dark",
    icon: Moon, shortcut: "mod+shift+l", group: "Actions",
  },
  { value: "settings", label: "Settings", icon: Settings, shortcut: "mod+,", group: "Go to" },
  // disabled: listed, greyed, skipped by the arrows and the pointer.
  { value: "export", label: "Export as PDF", description: "Pro plan", icon: Image, group: "Actions", disabled: true },
];

<CommandMenu items={items} onSelect={run}>
  <CommandMenuInput />
  <CommandMenuList>
    <CommandMenuEmpty>No results.</CommandMenuEmpty>
  </CommandMenuList>
</CommandMenu>`;

const suggestionsCode = `{/* suggestions: values listed first, under "Suggestions", while nothing
    is typed. A suggested row leaves its own group, so nothing repeats. */}
<CommandMenu
  items={items}
  suggestions={["calendar", "new-file", "settings"]}
  suggestionsLabel="Recent"
  onSelect={run}
>
  <CommandMenuInput />
  <CommandMenuList>
    <CommandMenuEmpty>No results.</CommandMenuEmpty>
  </CommandMenuList>
</CommandMenu>`;

const tabsCode = `import {
  CommandMenu, CommandMenuInput, CommandMenuTabs, CommandMenuList, CommandMenuEmpty,
} from "./components";

const [tab, setTab] = useState("all");
// The tabs are your state; derive the rows from them. ← and → in the
// field switch tabs, wrapping.
const visible = tab === "all" ? items : items.filter((item) => item.group === tab);

<CommandMenu items={visible} onSelect={run}>
  <CommandMenuInput />
  <CommandMenuTabs
    tabs={[
      { value: "all", label: "All" },
      { value: "Actions", label: "Actions" },
      { value: "Go to", label: "Go to" },
      { value: "Help", label: "Help" },
    ]}
    value={tab}
    onValueChange={setTab}
  />
  <CommandMenuList>
    <CommandMenuEmpty>No results.</CommandMenuEmpty>
  </CommandMenuList>
</CommandMenu>`;

const filtersCode = `import {
  CommandMenu, CommandMenuInput, CommandMenuFilters, CommandMenuList, CommandMenuEmpty,
  Select, SelectTrigger, SelectContent, SelectItem,
} from "./components";

const [type, setType] = useState("all");
const [sort, setSort] = useState("default");
const visible = useMemo(() => {
  const rows = type === "all" ? items : items.filter((item) => item.group === type);
  return sort === "az" ? [...rows].sort((a, b) => a.label.localeCompare(b.label)) : rows;
}, [type, sort]);

{/* CommandMenuFilters: a compact, borderless row under the field.
    Compose borderless Selects or ghost Buttons; the list's divider closes it. */}
<CommandMenu items={visible} onSelect={run}>
  <CommandMenuInput />
  <CommandMenuFilters>
    <Select value={type} onValueChange={setType}>
      <SelectTrigger variant="borderless" />
      <SelectContent>
        <SelectItem value="all" index={0}>All types</SelectItem>
        <SelectItem value="Actions" index={1}>Actions</SelectItem>
        <SelectItem value="Go to" index={2}>Go to</SelectItem>
        <SelectItem value="Help" index={3}>Help</SelectItem>
      </SelectContent>
    </Select>
    <Select value={sort} onValueChange={setSort}>
      <SelectTrigger variant="borderless" />
      <SelectContent>
        <SelectItem value="default" index={0}>Default order</SelectItem>
        <SelectItem value="az" index={1}>A to Z</SelectItem>
      </SelectContent>
    </Select>
  </CommandMenuFilters>
  <CommandMenuList>
    <CommandMenuEmpty>No results.</CommandMenuEmpty>
  </CommandMenuList>
</CommandMenu>`;

const dialogCode = `import {
  CommandMenuDialog, CommandMenu, CommandMenuInput, CommandMenuList,
  CommandMenuEmpty, CommandMenuShortcut, Button,
} from "./components";

const [open, setOpen] = useState(false);

<Button variant="secondary" onClick={() => setOpen(true)}>
  Open <CommandMenuShortcut keys="mod+k" />
</Button>

{/* shortcut toggles the dialog from anywhere on the page. Default "mod+k":
    ⌘K on a Mac, Ctrl+K elsewhere. Pass null to bind nothing. A pick closes
    the dialog (closeOnSelect on CommandMenu). */}
<CommandMenuDialog open={open} onOpenChange={setOpen} shortcut="mod+k">
  <CommandMenu items={items} suggestions={["calendar", "new-file"]} onSelect={run}>
    <CommandMenuInput />
    <CommandMenuList>
      <CommandMenuEmpty>No results.</CommandMenuEmpty>
    </CommandMenuList>
  </CommandMenu>
</CommandMenuDialog>`;

const footerCode = `import {
  CommandMenu, CommandMenuInput, CommandMenuList, CommandMenuEmpty, CommandMenuFooter,
} from "./components";

{/* Default hints follow the menu: Select ↑↓, Tabs ← → when tabs are
    mounted, Close Esc in a dialog, and at the trailing edge the highlighted
    row's action ↵ (its label, unless the item sets action). Pass hints, or
    children, to replace. */}
<CommandMenu items={items} onSelect={run}>
  <CommandMenuInput />
  <CommandMenuList>
    <CommandMenuEmpty>No results.</CommandMenuEmpty>
  </CommandMenuList>
  <CommandMenuFooter />
</CommandMenu>

<CommandMenuFooter
  hints={[
    { label: "Select", keys: ["up", "down"] },
    { label: "Open", keys: "enter" },
    { label: "Open menu", keys: "mod+k" },
  ]}
/>`;

const customRowsCode = `import { CommandMenu, CommandMenuInput, CommandMenuList, CommandMenuItem } from "./components";

{/* renderItem: one CommandMenuItem per visible row. Props set here override
    the item's data; children replace the label and description. */}
<CommandMenu items={items} onSelect={run}>
  <CommandMenuInput />
  <CommandMenuList
    renderItem={(item) => (
      <CommandMenuItem key={item.value} value={item.value}>
        <span className="flex min-w-0 flex-1 items-baseline gap-2">
          <span className="truncate">{item.label}</span>
          <span className="truncate text-muted-foreground">{item.group}</span>
        </span>
      </CommandMenuItem>
    )}
  >
    <CommandMenuEmpty>No results.</CommandMenuEmpty>
  </CommandMenuList>
</CommandMenu>`;

// ---------------------------------------------------------------------------
// Doc page
// ---------------------------------------------------------------------------

function CommandMenuPlaygroundSection() {
  return (
    <CommandMenuPlayground>
      {({ preview, controls, code }) => (
        <PlaygroundLayout
          controls={controls}
          preview={
            <ComponentPreview code={code} minHeightClass="min-h-[480px]" align="top">
              <div className="w-full pt-2">{preview}</div>
            </ComponentPreview>
          }
        />
      )}
    </CommandMenuPlayground>
  );
}

/** The inline frame every example sits in: a surface the rows size, up to
 *  a cap the list scrolls past. */
function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  const shape = useShape();
  return (
    <Elevated
      offset={2}
      shadowLevel={3}
      className={cn("flex max-h-[360px] w-full max-w-[520px] flex-col overflow-hidden", shape.container, className)}
    >
      {children}
    </Elevated>
  );
}

const TABS = COMMAND_MENU_TABS;

export default function CommandMenuDoc() {
  const PlusIcon = useIcon("plus");
  const mac = useIsMac();
  const plain = useCommandMenuItems({ descriptions: false, shortcuts: false });
  const full = useCommandMenuItems();
  const run = (item: CommandMenuItemData) => showSuccessToast(`Ran “${item.label}”`);

  const [tab, setTab] = useState("all");
  const [footerTab, setFooterTab] = useState("all");
  const tabbed = useMemo(
    () => (tab === "all" ? full : full.filter((item) => item.group === tab)),
    [full, tab]
  );

  const [type, setType] = useState("all");
  const [sort, setSort] = useState("default");
  const filtered = useMemo(() => {
    const rows = type === "all" ? full : full.filter((item) => item.group === type);
    return sort === "az" ? [...rows].sort((a, b) => a.label.localeCompare(b.label)) : rows;
  }, [full, type, sort]);

  const [open, setOpen] = useState(false);
  const [openNoKey, setOpenNoKey] = useState(false);

  return (
    <DocPage
      title="CommandMenu"
      slug="command-menu"
      description="1 field over every action. Type, arrow, Enter."
    >
      <DocSection title="Playground">
        <CommandMenuPlaygroundSection />
      </DocSection>

      <DocSection title="Basic">
        <p className="text-site-body text-muted-foreground">
          Type to filter, press ↓ ↑ to move, Enter to run. Rows come from{" "}
          <code>items</code>, grouped by <code>group</code>.
        </p>
        <ComponentPreview code={basicCode} minHeightClass="min-h-[400px]">
          <Panel>
            <CommandMenu items={plain} onSelect={run}>
              <CommandMenuInput placeholder={COMMAND_MENU_COPY.placeholder} />
              <CommandMenuList>
                <CommandMenuEmpty>{COMMAND_MENU_COPY.empty}</CommandMenuEmpty>
              </CommandMenuList>
            </CommandMenu>
          </Panel>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Descriptions, shortcuts, disabled rows">
        <p className="text-site-body text-muted-foreground">
          3 more fields per row: <code>description</code>, <code>shortcut</code>{" "}
          caps, and <code>disabled</code>, which the arrows skip. Type{" "}
          <code>clipboard</code>: keywords match too.
        </p>
        <ComponentPreview code={detailsCode} minHeightClass="min-h-[400px]">
          <Panel>
            <CommandMenu items={full} onSelect={run}>
              <CommandMenuInput placeholder={COMMAND_MENU_COPY.placeholder} />
              <CommandMenuList>
                <CommandMenuEmpty>{COMMAND_MENU_COPY.empty}</CommandMenuEmpty>
              </CommandMenuList>
            </CommandMenu>
          </Panel>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Suggestions">
        <p className="text-site-body text-muted-foreground">
          3 suggested rows lead until you type 1 letter, then the groups take
          over.
        </p>
        <ComponentPreview code={suggestionsCode} minHeightClass="min-h-[400px]">
          <Panel>
            <CommandMenu
              items={full}
              suggestions={COMMAND_MENU_SUGGESTIONS}
              suggestionsLabel="Recent"
              onSelect={run}
            >
              <CommandMenuInput placeholder={COMMAND_MENU_COPY.placeholder} />
              <CommandMenuList>
                <CommandMenuEmpty>{COMMAND_MENU_COPY.empty}</CommandMenuEmpty>
              </CommandMenuList>
            </CommandMenu>
          </Panel>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Tabs">
        <p className="text-site-body text-muted-foreground">
          Click a tab or press ← →, then derive <code>items</code> from the
          value. Children hug the row&apos;s end: put{" "}
          <code>CommandMenuFilters</code> there to share the line.
        </p>
        <ComponentPreview code={tabsCode} minHeightClass="min-h-[400px]">
          <Panel>
            <CommandMenu items={tabbed} onSelect={run}>
              <CommandMenuInput placeholder={COMMAND_MENU_COPY.placeholder} />
              <CommandMenuTabs tabs={TABS} value={tab} onValueChange={setTab} />
              <CommandMenuList>
                <CommandMenuEmpty>{COMMAND_MENU_COPY.empty}</CommandMenuEmpty>
              </CommandMenuList>
            </CommandMenu>
          </Panel>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Filters">
        <p className="text-site-body text-muted-foreground">
          A frameless compact row under the field: drop borderless Selects or
          ghost Buttons in.
        </p>
        <ComponentPreview code={filtersCode} minHeightClass="min-h-[400px]">
          <Panel>
            <CommandMenu items={filtered} onSelect={run}>
              <CommandMenuInput placeholder={COMMAND_MENU_COPY.placeholder} />
              <CommandMenuFilters>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger variant="borderless" aria-label="Type" />
                  <SelectContent>
                    {COMMAND_MENU_TYPES.map((option, i) => (
                      <SelectItem key={option.value} value={option.value} index={i}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger variant="borderless" aria-label="Sort" />
                  <SelectContent>
                    {COMMAND_MENU_SORTS.map((option, i) => (
                      <SelectItem key={option.value} value={option.value} index={i}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CommandMenuFilters>
              <CommandMenuList>
                <CommandMenuEmpty>{COMMAND_MENU_COPY.empty}</CommandMenuEmpty>
              </CommandMenuList>
            </CommandMenu>
          </Panel>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Dialog and trigger shortcut">
        <p className="text-site-body text-muted-foreground">
          Press {mac ? "⌘P" : "Ctrl+P"} anywhere on this page: this demo binds its
          own combo, and the default {mac ? "⌘K" : "Ctrl+K"} opens the playground
          above. A pick or Escape closes it.
        </p>
        <ComponentPreview code={dialogCode}>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => setOpen(true)} className="pr-3">
              Open
              <CommandMenuShortcut keys="mod+p" className="ml-1" />
            </Button>
            <CommandMenuDialog open={open} onOpenChange={setOpen} shortcut="mod+p">
              <CommandMenu
                items={full}
                suggestions={COMMAND_MENU_SUGGESTIONS}
                onSelect={run}
              >
                <CommandMenuInput placeholder={COMMAND_MENU_COPY.placeholder} />
                <CommandMenuList>
                  <CommandMenuEmpty>{COMMAND_MENU_COPY.empty}</CommandMenuEmpty>
                </CommandMenuList>
              </CommandMenu>
            </CommandMenuDialog>
            <Button variant="ghost" onClick={() => setOpenNoKey(true)}>
              Open, no shortcut
            </Button>
            <CommandMenuDialog open={openNoKey} onOpenChange={setOpenNoKey} shortcut={null}>
              <CommandMenu items={full} onSelect={run}>
                <CommandMenuInput placeholder={COMMAND_MENU_COPY.placeholder} />
                <CommandMenuList>
                  <CommandMenuEmpty>{COMMAND_MENU_COPY.empty}</CommandMenuEmpty>
                </CommandMenuList>
              </CommandMenu>
            </CommandMenuDialog>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Footer hints">
        <p className="text-site-body text-muted-foreground">
          4 hints at most, following the menu: ← → with tabs, Esc in a
          dialog, and ↵ named after the highlighted row (its{" "}
          <code>action</code>, or its label). Pass <code>hints</code> for
          your own.
        </p>
        <ComponentPreview code={footerCode} minHeightClass="min-h-[400px]">
          <Panel>
            <CommandMenu items={full} suggestions={COMMAND_MENU_SUGGESTIONS} onSelect={run}>
              <CommandMenuInput placeholder={COMMAND_MENU_COPY.placeholder} />
              <CommandMenuTabs tabs={TABS} value={footerTab} onValueChange={setFooterTab} />
              <CommandMenuList>
                <CommandMenuEmpty>{COMMAND_MENU_COPY.empty}</CommandMenuEmpty>
              </CommandMenuList>
              <CommandMenuFooter />
            </CommandMenu>
          </Panel>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Custom rows">
        <p className="text-site-body text-muted-foreground">
          1 <code>CommandMenuItem</code> per row from <code>renderItem</code>:
          children replace the label, the icon and caps stay.
        </p>
        <ComponentPreview code={customRowsCode} minHeightClass="min-h-[400px]">
          <Panel>
            <CommandMenu items={full} onSelect={run}>
              <CommandMenuInput placeholder={COMMAND_MENU_COPY.placeholder} />
              <CommandMenuList
                renderItem={(item) => (
                  <CommandMenuItem key={item.value} value={item.value} icon={item.icon ?? PlusIcon}>
                    <span className="flex min-w-0 flex-1 items-baseline gap-2">
                      <span className="truncate [text-box:trim-both_cap_alphabetic] py-1 -my-1">
                        {item.label}
                      </span>
                      <span className="truncate text-muted-foreground [text-box:trim-both_cap_alphabetic] py-1 -my-1">
                        {item.group}
                      </span>
                    </span>
                  </CommandMenuItem>
                )}
              >
                <CommandMenuEmpty>{COMMAND_MENU_COPY.empty}</CommandMenuEmpty>
              </CommandMenuList>
            </CommandMenu>
          </Panel>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference: Item data">
        <PropsTable props={itemDataProps} />
      </DocSection>

      <DocSection title="API Reference: CommandMenu">
        <PropsTable props={rootProps} />
      </DocSection>

      <DocSection title="API Reference: CommandMenuDialog">
        <PropsTable props={dialogProps} />
      </DocSection>

      <DocSection title="API Reference: CommandMenuInput">
        <PropsTable props={inputProps} />
      </DocSection>

      <DocSection title="API Reference: CommandMenuTabs">
        <PropsTable props={tabsProps} />
      </DocSection>

      <DocSection title="API Reference: CommandMenuList">
        <PropsTable props={listProps} />
      </DocSection>

      <DocSection title="API Reference: CommandMenuItem">
        <PropsTable props={itemProps} />
      </DocSection>

      <DocSection title="API Reference: CommandMenuFooter">
        <PropsTable props={footerProps} />
      </DocSection>

      <DocSection title="API Reference: CommandMenuShortcut">
        <PropsTable props={shortcutProps} />
      </DocSection>
    </DocPage>
  );
}
