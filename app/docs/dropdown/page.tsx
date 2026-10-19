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
  DropdownSub,
  DropdownSubTrigger,
  DropdownSubContent,
  DropdownSearch,
  DropdownEmpty,
} from "@/components/flavored/dropdown";
import { MenuItem } from "@/registry/default/menu-item";
import { Button } from "@/registry/radix/button";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { PlaygroundLayout } from "@/lib/docs/playground";
import { DropdownPlayground } from "@/lib/docs/playgrounds/dropdown";
import { dropdownProps, dropdownMenuProps, dropdownTriggerProps, dropdownContentProps, subProps, subTriggerProps, subContentProps, searchProps, emptyProps, labelProps, separatorProps, menuItemProps } from "@/lib/docs/api/dropdown";

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
  <DropdownTrigger render={<Button variant="ghost">Open menu</Button>} />
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

const submenuCode = `import {
  DropdownMenu, DropdownTrigger, DropdownContent,
  DropdownSub, DropdownSubTrigger, DropdownSubContent,
  MenuItem, Button,
} from "./components";
import { Folder, Link, Mail, Pencil } from "lucide-react";

const FOLDERS = ["Inbox", "Design", "Engineering", "Marketing", "Archive"];

<DropdownMenu>
  <DropdownTrigger render={<Button variant="ghost">Q3 report.pdf</Button>} />
  <DropdownContent>
    <DropdownSub>
      <DropdownSubTrigger index={0} icon={Folder} label="Move to" />
      <DropdownSubContent>
        {FOLDERS.map((folder, i) => (
          <MenuItem key={folder} index={i} label={folder} onSelect={() => move(folder)} />
        ))}
      </DropdownSubContent>
    </DropdownSub>
    <DropdownSub>
      <DropdownSubTrigger index={1} icon={Link} label="Share" />
      <DropdownSubContent>
        <MenuItem index={0} icon={Link} label="Copy link" onSelect={copyLink} />
        <MenuItem index={1} icon={Mail} label="Email" onSelect={email} />
      </DropdownSubContent>
    </DropdownSub>
    <MenuItem index={2} icon={Pencil} label="Rename" onSelect={rename} />
  </DropdownContent>
</DropdownMenu>`;

const FOLDERS = ["Inbox", "Design", "Engineering", "Marketing", "Archive"];

const searchableCode = `import {
  DropdownMenu, DropdownTrigger, DropdownContent,
  DropdownSearch, DropdownEmpty, MenuItem, Button,
} from "./components";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const LANGUAGES = ["Auto detect", "Albanian (Albania)", "Arabic", "Bengali", /* … */];
const [language, setLanguage] = useState("Auto detect");
const [query, setQuery] = useState("");

// Filter the rows you render; the popup re-indexes from 0 each time.
const matches = LANGUAGES.filter((l) =>
  l.toLowerCase().includes(query.toLowerCase())
);

<DropdownMenu>
  <DropdownTrigger
    render={
      <Button variant="ghost" trailingIcon={ChevronDown}>
        {language}
      </Button>
    }
  />
  <DropdownContent checkedIndex={matches.indexOf(language)}>
    <DropdownSearch
      value={query}
      onValueChange={setQuery}
      placeholder="Search languages"
    />
    {matches.map((l, i) => (
      <MenuItem
        key={l}
        index={i}
        label={l}
        checked={language === l}
        onSelect={() => setLanguage(l)}
      />
    ))}
    {matches.length === 0 && <DropdownEmpty>No languages found</DropdownEmpty>}
  </DropdownContent>
</DropdownMenu>`;

const multipleCode = `import { DropdownMenu, DropdownTrigger, DropdownContent, MenuItem, Button } from "./components";
import { useState } from "react";

const STATUSES = ["Open", "In progress", "In review", "Blocked", "Done", "Archived"];

const [checked, setChecked] = useState<number[]>([0, 1, 2]);
const toggle = (i: number) =>
  setChecked((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]));

{/* checkedIndices turns rows into checkbox items that keep the menu open,
    and contiguous checked rows share one merged background. */}
<DropdownMenu>
  <DropdownTrigger render={<Button variant="ghost">Status</Button>} />
  <DropdownContent checkedIndices={checked}>
    {STATUSES.map((s, i) => (
      <MenuItem
        key={s}
        index={i}
        label={s}
        checked={checked.includes(i)}
        onSelect={() => toggle(i)}
      />
    ))}
  </DropdownContent>
</DropdownMenu>`;

const STATUSES = ["Open", "In progress", "In review", "Blocked", "Done", "Archived"];

const searchableMultipleCode = `import {
  DropdownMenu, DropdownTrigger, DropdownContent,
  DropdownSearch, DropdownEmpty, MenuItem, Button,
} from "./components";
import { useState } from "react";

const LABELS = ["Bug", "Feature", "Docs", "Design", "Performance", /* … */];
const [labels, setLabels] = useState<string[]>(["Bug", "Design"]);
const [query, setQuery] = useState("");
const matches = LABELS.filter((l) => l.toLowerCase().includes(query.toLowerCase()));
const toggle = (l: string) =>
  setLabels((c) => (c.includes(l) ? c.filter((x) => x !== l) : [...c, l]));

// Both checked rows and indices are read off the FILTERED list.
<DropdownMenu>
  <DropdownTrigger render={<Button variant="ghost">Labels · {labels.length}</Button>} />
  <DropdownContent
    checkedIndices={matches.flatMap((l, i) => (labels.includes(l) ? [i] : []))}
  >
    <DropdownSearch value={query} onValueChange={setQuery} placeholder="Search labels" />
    {matches.map((l, i) => (
      <MenuItem key={l} index={i} label={l} checked={labels.includes(l)} onSelect={() => toggle(l)} />
    ))}
    {matches.length === 0 && <DropdownEmpty>No labels found</DropdownEmpty>}
  </DropdownContent>
</DropdownMenu>`;

const creatableCode = `import {
  DropdownMenu, DropdownTrigger, DropdownContent,
  DropdownSearch, DropdownEmpty, MenuItem, Button,
} from "./components";
import { Plus } from "lucide-react";
import { useState } from "react";

// The library's own components; a created row joins them.
const [components, setComponents] = useState(["Accordion", "Badge", "Button", /* … */]);
const [used, setUsed] = useState<string[]>(["Button", "Combobox"]);
const [query, setQuery] = useState("");
const matches = components.filter((c) => c.toLowerCase().includes(query.toLowerCase()));
const toggle = (c: string) =>
  setUsed((u) => (u.includes(c) ? u.filter((x) => x !== c) : [...u, c]));

// A create row while the query matches no label exactly. Last, after the
// real matches, so ↑ from the search field reaches it in one press.
const q = query.trim();
const canCreate = q !== "" && !components.some((c) => c.toLowerCase() === q.toLowerCase());

<DropdownMenu>
  <DropdownTrigger render={<Button variant="ghost">Components · {used.length}</Button>} />
  <DropdownContent checkedIndices={matches.flatMap((c, i) => (used.includes(c) ? [i] : []))}>
    <DropdownSearch value={query} onValueChange={setQuery} placeholder="Search components" />
    {matches.map((c, i) => (
      <MenuItem key={c} index={i} label={c} checked={used.includes(c)} onSelect={() => toggle(c)} />
    ))}
    {canCreate && (
      <MenuItem
        index={matches.length}
        icon={Plus}
        label={\`Create “\${q}”\`}
        closeOnClick={false}
        onSelect={() => {
          setComponents((c) => [...c, q]);
          toggle(q);
          setQuery("");
        }}
      />
    )}
    {matches.length === 0 && !canCreate && <DropdownEmpty>No components found</DropdownEmpty>}
  </DropdownContent>
</DropdownMenu>`;

const COMPONENTS = [
  "Accordion",
  "Badge",
  "Button",
  "Card",
  "CheckboxGroup",
  "ColorPicker",
  "Combobox",
  "Dialog",
  "Dropdown",
  "InputGroup",
  "RadioGroup",
  "Select",
  "Sidebar",
  "Slider",
  "Switch",
  "Table",
  "Tabs",
];

const LABELS = [
  "Bug",
  "Feature",
  "Docs",
  "Design",
  "Performance",
  "Accessibility",
  "Refactor",
  "Testing",
  "Infrastructure",
  "Security",
  "Good first issue",
  "Help wanted",
];

const LANGUAGES = [
  "Auto detect",
  "Albanian (Albania)",
  "Arabic",
  "Bengali",
  "Chinese (Simplified)",
  "Chinese (Traditional)",
  "Czech",
  "Danish",
  "Dutch",
  "English (UK)",
  "English (US)",
  "Finnish",
  "French",
  "German",
  "Greek",
  "Hebrew",
  "Hindi",
  "Hungarian",
  "Indonesian",
  "Italian",
  "Japanese",
  "Korean",
  "Norwegian",
  "Polish",
  "Portuguese (Brazil)",
  "Portuguese (Portugal)",
  "Romanian",
  "Russian",
  "Spanish",
  "Swedish",
  "Thai",
  "Turkish",
  "Ukrainian",
  "Vietnamese",
];

// ── Playground ───────────────────────────────────────────
// The state + controls live in the shared module (lib/docs/playgrounds) so
// the /demo slide can drive the same sandbox from its pen menu.

function DropdownPlaygroundSection() {
  return (
    <DropdownPlayground>
      {({ preview, controls, code }) => (
        <PlaygroundLayout
          controls={controls}
          preview={
            <ComponentPreview code={code} minHeightClass="min-h-[360px]" align="top">
              <div className="pt-6">{preview}</div>
            </ComponentPreview>
          }
        />
      )}
    </DropdownPlayground>
  );
}

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
  const ChevronDown = useIcon("chevron-down");
  const Plus = useIcon("plus");
  const Folder = useIcon("folder");
  const Link = useIcon("link");
  const Pencil = useIcon("pencil");

  const items = [
    { icon: SquareLibrary, label: "Teamspaces" },
    { icon: Clock, label: "Recents" },
    { icon: Star, label: "Favorites" },
    { icon: Users, label: "Shared" },
    { icon: Lock, label: "Private" },
  ];
  const [selected, setSelected] = useState<number | null>(0);
  const [view, setView] = useState(0);
  const [language, setLanguage] = useState("Auto detect");
  const [statuses, setStatuses] = useState<number[]>([0, 1, 2]);
  const [labels, setLabels] = useState<string[]>(["Bug", "Design"]);
  const [labelQuery, setLabelQuery] = useState("");
  const labelMatches = LABELS.filter((l) =>
    l.toLowerCase().includes(labelQuery.toLowerCase())
  );
  const toggleLabel = (l: string) =>
    setLabels((c) => (c.includes(l) ? c.filter((x) => x !== l) : [...c, l]));
  const toggleStatus = (i: number) =>
    setStatuses((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]));
  const [components, setComponents] = useState<string[]>(COMPONENTS);
  const [used, setUsed] = useState<string[]>(["Button", "Combobox"]);
  const [componentQuery, setComponentQuery] = useState("");
  const componentMatches = components.filter((c) =>
    c.toLowerCase().includes(componentQuery.toLowerCase())
  );
  const toggleUsed = (c: string) =>
    setUsed((u) => (u.includes(c) ? u.filter((x) => x !== c) : [...u, c]));
  const componentQ = componentQuery.trim();
  const canCreateComponent =
    componentQ !== "" &&
    !components.some((c) => c.toLowerCase() === componentQ.toLowerCase());
  const [query, setQuery] = useState("");
  const matches = LANGUAGES.filter((l) =>
    l.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <DocPage
      title="Dropdown"
      slug="dropdown"
      description="2 forms: an inline panel, or a popup on any trigger."
    >
      <DocSection title="Playground">
        <DropdownPlaygroundSection />
      </DocSection>

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
        <p className="text-site-body text-muted-foreground">
          3 parts: <code>DropdownMenu</code>, <code>DropdownTrigger</code>,{" "}
          <code>DropdownContent</code>. Any element goes in <code>render</code>.
        </p>
        <ComponentPreview code={triggeredCode}>
          <DropdownMenu>
            <DropdownTrigger
              render={<Button variant="ghost">Open menu</Button>}
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

      <DocSection title="Submenus">
        <p className="text-site-body text-muted-foreground">
          Hover Move to, then cut across Share to its submenu: the highlight
          stays on Move to until you stop on another row.
        </p>
        <ComponentPreview code={submenuCode} minHeightClass="min-h-[160px]">
          <DropdownMenu>
            <DropdownTrigger
              render={<Button variant="ghost">Q3 report.pdf</Button>}
            />
            <DropdownContent>
              <DropdownSub>
                <DropdownSubTrigger index={0} icon={Folder} label="Move to" />
                <DropdownSubContent>
                  {FOLDERS.map((folder, i) => (
                    <MenuItem key={folder} index={i} label={folder} onSelect={() => {}} />
                  ))}
                </DropdownSubContent>
              </DropdownSub>
              <DropdownSub>
                <DropdownSubTrigger index={1} icon={Link} label="Share" />
                <DropdownSubContent>
                  <MenuItem index={0} icon={Link} label="Copy link" onSelect={() => {}} />
                  <MenuItem index={1} icon={Mail} label="Email" onSelect={() => {}} />
                </DropdownSubContent>
              </DropdownSub>
              <MenuItem index={2} icon={Pencil} label="Rename" onSelect={() => {}} />
            </DropdownContent>
          </DropdownMenu>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Multiple selection">
        <p className="text-site-body text-muted-foreground">
          Pass <code>checkedIndices</code>: rows become checkboxes, the menu
          stays open, and touching picks share one background.
        </p>
        <ComponentPreview code={multipleCode} minHeightClass="min-h-[160px]">
          <DropdownMenu>
            <DropdownTrigger
              render={<Button variant="ghost">Status</Button>}
            />
            <DropdownContent checkedIndices={statuses}>
              {STATUSES.map((s, i) => (
                <MenuItem
                  key={s}
                  index={i}
                  label={s}
                  checked={statuses.includes(i)}
                  onSelect={() => toggleStatus(i)}
                />
              ))}
            </DropdownContent>
          </DropdownMenu>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Searchable menu">
        <p className="text-site-body text-muted-foreground">
          Put a <code>DropdownSearch</code> first and filter the rows you
          render. Type to filter, arrow down to a row, press Enter.
        </p>
        <ComponentPreview code={searchableCode} minHeightClass="min-h-[160px]">
          <DropdownMenu>
            <DropdownTrigger
              render={
                <Button variant="ghost" trailingIcon={ChevronDown}>
                  {language}
                </Button>
              }
            />
            <DropdownContent checkedIndex={matches.indexOf(language)}>
              <DropdownSearch
                value={query}
                onValueChange={setQuery}
                placeholder="Search languages"
              />
              {matches.map((l, i) => (
                <MenuItem
                  key={l}
                  index={i}
                  label={l}
                  checked={language === l}
                  onSelect={() => setLanguage(l)}
                />
              ))}
              {matches.length === 0 && (
                <DropdownEmpty>No languages found</DropdownEmpty>
              )}
            </DropdownContent>
          </DropdownMenu>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Searchable multiple selection">
        <p className="text-site-body text-muted-foreground">
          Both at once. Compute <code>checkedIndices</code> against the
          filtered rows; Enter toggles the focused row and the menu stays open.
        </p>
        <ComponentPreview code={searchableMultipleCode} minHeightClass="min-h-[160px]">
          <DropdownMenu>
            <DropdownTrigger
              render={
                <Button variant="ghost">Labels · {labels.length}</Button>
              }
            />
            <DropdownContent
              checkedIndices={labelMatches.flatMap((l, i) =>
                labels.includes(l) ? [i] : []
              )}
            >
              <DropdownSearch
                value={labelQuery}
                onValueChange={setLabelQuery}
                placeholder="Search labels"
              />
              {labelMatches.map((l, i) => (
                <MenuItem
                  key={l}
                  index={i}
                  label={l}
                  checked={labels.includes(l)}
                  onSelect={() => toggleLabel(l)}
                />
              ))}
              {labelMatches.length === 0 && (
                <DropdownEmpty>No labels found</DropdownEmpty>
              )}
            </DropdownContent>
          </DropdownMenu>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Create from the query">
        <p className="text-site-body text-muted-foreground">
          1 extra row when nothing matches. Type a component that is not
          there, press ↑ to reach it, then Enter.
        </p>
        <ComponentPreview code={creatableCode} minHeightClass="min-h-[160px]">
          <DropdownMenu>
            <DropdownTrigger
              render={
                <Button variant="ghost">Components · {used.length}</Button>
              }
            />
            <DropdownContent
              checkedIndices={componentMatches.flatMap((c, i) =>
                used.includes(c) ? [i] : []
              )}
            >
              <DropdownSearch
                value={componentQuery}
                onValueChange={setComponentQuery}
                placeholder="Search components"
              />
              {componentMatches.map((c, i) => (
                <MenuItem
                  key={c}
                  index={i}
                  label={c}
                  checked={used.includes(c)}
                  onSelect={() => toggleUsed(c)}
                />
              ))}
              {canCreateComponent && (
                <MenuItem
                  index={componentMatches.length}
                  icon={Plus}
                  label={`Create “${componentQ}”`}
                  closeOnClick={false}
                  onSelect={() => {
                    setComponents((c) => [...c, componentQ]);
                    toggleUsed(componentQ);
                    setComponentQuery("");
                  }}
                />
              )}
              {componentMatches.length === 0 && !canCreateComponent && (
                <DropdownEmpty>No components found</DropdownEmpty>
              )}
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

      <DocSection title="API Reference — DropdownSub">
        <PropsTable props={subProps} />
      </DocSection>

      <DocSection title="API Reference — DropdownSubTrigger">
        <PropsTable props={subTriggerProps} />
      </DocSection>

      <DocSection title="API Reference — DropdownSubContent">
        <PropsTable props={subContentProps} />
      </DocSection>

      <DocSection title="API Reference — DropdownSearch">
        <PropsTable props={searchProps} />
      </DocSection>

      <DocSection title="API Reference — DropdownEmpty">
        <PropsTable props={emptyProps} />
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
