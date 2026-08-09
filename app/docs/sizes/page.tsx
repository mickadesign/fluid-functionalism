"use client";

import { useState, type ReactNode } from "react";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { fontWeights } from "@/registry/default/lib/font-weight";
import {
  SizeProvider,
  type SizeVariant,
} from "@/registry/default/lib/size-context";
import { Button } from "@/registry/radix/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/flavored/select";
import { Tabs, TabsList, TabItem } from "@/registry/radix/tabs";
import { CheckboxGroup, CheckboxItem } from "@/registry/radix/checkbox-group";
import { RadioGroup, RadioItem } from "@/registry/radix/radio-group";
import { InputGroup, InputField } from "@/registry/default/input-group";
import { Switch } from "@/registry/radix/switch";
import { ListFilter, Plus, Flag } from "lucide-react";

/** Inline code chip used throughout the prose. */
function Code({ children }: { children: ReactNode }) {
  return (
    <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[12px]">
      {children}
    </code>
  );
}

// ---------------------------------------------------------------------------
// Code snippets (shown in the Code tab of each ComponentPreview)
// ---------------------------------------------------------------------------

const LADDER_CODE = `// Every control resolves its size the same way:
//   explicit size prop  >  surrounding SizeProvider  >  "default"
//
// default — 36px control height, 13px text, 16px icons
// compact — 28px control height, 12px text, 14px icons

<Button>New project</Button>              {/* h-9  · 36px */}
<Select>…</Select>                        {/* h-9  · 36px */}
<InputField label="Name" … />             {/* h-9  · 36px */}
<Tabs>…</Tabs>                            {/* 28px tab + 4px pad = 36px */}
<CheckboxItem … />                        {/* h-9 rows */}

<SizeProvider size="compact">
  {/* the same tree, one step down the ladder — 28px */}
</SizeProvider>`;

const REGION_CODE = `import { SizeProvider } from "@/lib/size-context";

// Dense surfaces — filter bars, toolbars, table headers — opt a whole
// region into the compact step. Every control inside follows; no
// per-component wiring.

<SizeProvider size="compact">
  <div className="flex items-center gap-2">
    <Tabs value={view} onValueChange={setView}>
      <TabsList>
        <TabItem value="all" label="All" />
        <TabItem value="active" label="Active" />
        <TabItem value="archived" label="Archived" />
      </TabsList>
    </Tabs>
    <Select value={sort} onValueChange={setSort}>
      <SelectTrigger placeholder="Sort by" />
      <SelectContent>…</SelectContent>
    </Select>
    <Button variant="tertiary" leadingIcon={ListFilter}>Filter</Button>
    <Button leadingIcon={Plus}>New</Button>
  </div>
</SizeProvider>`;

const OVERRIDE_CODE = `// The size prop wins over the provider — pin one control while the
// region supplies the rest.

<SizeProvider size="compact">
  <Select …>…</Select>                {/* compact, from the provider */}
  <Button size="default" leadingIcon={Plus}>
    New project                       {/* pinned to 36px */}
  </Button>
</SizeProvider>

// Works the other way too — a compact control in a default region:
<Button size="compact">Clear all</Button>`;

// ---------------------------------------------------------------------------
// Token reference — the full ladder, both steps side by side
// ---------------------------------------------------------------------------

const TOKEN_ROWS: Array<{
  token: string;
  applies: string;
  def: string;
  compact: string;
}> = [
  { token: "control", applies: "Buttons, inputs, select triggers, subtle tabs", def: "h-9 · 36px", compact: "h-7 · 28px" },
  { token: "item", applies: "Menu, select, checkbox and radio rows", def: "h-9 · 36px", compact: "h-7 · 28px" },
  { token: "segmentItem + segmentPad", applies: "Segmented tabs inside their padded list", def: "28px + 4px = 36px", compact: "24px + 2px = 28px" },
  { token: "text", applies: "Labels inside controls", def: "13px", compact: "12px" },
  { token: "icon", applies: "Leading/trailing icons", def: "16px", compact: "14px" },
  { token: "check", applies: "Checkbox square, radio circle", def: "15px", compact: "13px" },
  { token: "px / itemPx", applies: "Control / row horizontal padding", def: "12px / 8px", compact: "10px / 6px" },
  { token: "gap", applies: "Icon-to-label gap", def: "8px", compact: "6px" },
];

function TokenTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-[13px] border-collapse">
        <thead>
          <tr className="border-b border-border">
            {["Token", "Applies to", "Default", "Compact"].map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-left text-foreground"
                style={{ fontVariationSettings: fontWeights.semibold }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TOKEN_ROWS.map((row) => (
            <tr key={row.token} className="border-b border-border/50">
              <td className="px-3 py-2">
                <code className="rounded bg-muted px-1 py-0.5 text-[12px]">
                  {row.token}
                </code>
              </td>
              <td className="px-3 py-2 text-muted-foreground">{row.applies}</td>
              <td className="px-3 py-2 text-foreground">{row.def}</td>
              <td className="px-3 py-2 text-foreground">{row.compact}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ladder demo — the same control set at both steps, side by side
// ---------------------------------------------------------------------------

const FRUIT = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
];

function ControlColumn({ variant }: { variant: SizeVariant }) {
  const [fruit, setFruit] = useState("apple");
  const [tab, setTab] = useState("overview");
  const [checked, setChecked] = useState<Set<number>>(new Set([0]));
  const [priority, setPriority] = useState("medium");
  const [name, setName] = useState("");

  return (
    <SizeProvider size={variant}>
      <div className="flex flex-col items-start gap-4">
        <span className="text-[12px] text-muted-foreground select-none">
          {variant === "default" ? "Default · 36px" : "Compact · 28px"}
        </span>

        <div className="flex items-center gap-2">
          <Button leadingIcon={Plus}>New project</Button>
          <Button variant="tertiary">Cancel</Button>
        </div>

        <Select value={fruit} onValueChange={setFruit}>
          <SelectTrigger placeholder="Pick a fruit" />
          <SelectContent>
            {FRUIT.map((f, i) => (
              <SelectItem key={f.value} value={f.value} index={i}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabItem value="overview" label="Overview" />
            <TabItem value="activity" label="Activity" />
            <TabItem value="settings" label="Settings" />
          </TabsList>
        </Tabs>

        <InputGroup className="w-56">
          <InputField
            index={0}
            label="Project name"
            placeholder="Acme redesign"
            value={name}
            onChange={setName}
          />
        </InputGroup>

        <div className="flex gap-6">
          <CheckboxGroup checkedIndices={checked} className="w-40">
            {["Design", "Engineering"].map((label, i) => (
              <CheckboxItem
                key={label}
                index={i}
                label={label}
                checked={checked.has(i)}
                onToggle={() =>
                  setChecked((prev) => {
                    const next = new Set(prev);
                    if (next.has(i)) next.delete(i);
                    else next.add(i);
                    return next;
                  })
                }
              />
            ))}
          </CheckboxGroup>

          <RadioGroup value={priority} onValueChange={setPriority} className="w-40">
            <RadioItem index={0} value="high" label="High" />
            <RadioItem index={1} value="medium" label="Medium" />
          </RadioGroup>
        </div>
      </div>
    </SizeProvider>
  );
}

function LadderDemo() {
  return (
    <div className="flex flex-wrap gap-10">
      <ControlColumn variant="default" />
      <ControlColumn variant="compact" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compact region demo — a filter bar with a live density toggle
// ---------------------------------------------------------------------------

const SORT_OPTIONS = [
  { value: "updated", label: "Last updated" },
  { value: "created", label: "Created" },
  { value: "name", label: "Name" },
];

function FilterBarDemo() {
  const [compact, setCompact] = useState(true);
  const [view, setView] = useState("all");
  const [sort, setSort] = useState("updated");

  return (
    <div className="flex w-full flex-col items-start gap-5">
      <Switch
        label="Compact region"
        checked={compact}
        onToggle={() => setCompact((v) => !v)}
      />
      <SizeProvider size={compact ? "compact" : "default"}>
        <div className="flex w-full flex-wrap items-center gap-2">
          <Tabs value={view} onValueChange={setView}>
            <TabsList>
              <TabItem value="all" label="All" />
              <TabItem value="active" label="Active" />
              <TabItem value="archived" label="Archived" />
            </TabsList>
          </Tabs>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger placeholder="Sort by" />
            <SelectContent>
              {SORT_OPTIONS.map((o, i) => (
                <SelectItem key={o.value} value={o.value} index={i}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="tertiary" leadingIcon={ListFilter}>
            Filter
          </Button>
          <Button leadingIcon={Plus}>New</Button>
        </div>
      </SizeProvider>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Override demo — a pinned control inside a compact region
// ---------------------------------------------------------------------------

function OverrideDemo() {
  const [status, setStatus] = useState("open");

  return (
    <SizeProvider size="compact">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger icon={Flag} placeholder="Status" />
          <SelectContent>
            {[
              { value: "open", label: "Open" },
              { value: "closed", label: "Closed" },
            ].map((o, i) => (
              <SelectItem key={o.value} value={o.value} index={i}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="tertiary">Clear</Button>
        <Button size="default" leadingIcon={Plus}>
          New project
        </Button>
      </div>
    </SizeProvider>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

const PROVIDER_PROPS: PropDef[] = [
  {
    name: "size",
    type: '"default" | "compact"',
    description:
      "Controlled variant — pins every control in the subtree to one step of the ladder.",
  },
  {
    name: "defaultSize",
    type: '"default" | "compact"',
    default: '"default"',
    description:
      "Uncontrolled initial variant, switchable later through useSizeContext().setSize.",
  },
];

const CONSUMER_PROPS: PropDef[] = [
  {
    name: "size",
    type: '"default" | "compact"',
    default: "from provider",
    description:
      "Per-component override on Button, Select, Tabs, TabsSubtle, Dropdown, DropdownMenu, CheckboxGroup, RadioGroup, InputGroup, and InputCopy. Wins over the surrounding SizeProvider.",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SizesPage() {
  return (
    <DocPage
      title="Sizes"
      description="A two-step size ladder — a 36px default and a 28px compact — shared by every control."
      slug="sizes"
      installSlug="size-context"
    >
      <DocSection title="The ladder">
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Every interactive control sits on one of two heights.
          <Code>default</Code> is 36px: enough room for the system&apos;s 13px
          label with comfortable breathing space, and a workable pointer
          target. <Code>compact</Code> is 28px, one deliberate step down for
          dense surfaces — filter bars, toolbars, table headers, sidebars —
          where controls support the content rather than being it. There is
          nothing in between: two steps keep any mix of controls on a shared
          rhythm, and a whole region switches steps at once.
        </p>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          A step is more than a height. Text drops 13px → 12px, icons 16px →
          14px, check controls 15px → 13px, and paddings tighten in
          proportion, so a compact control reads as a smaller sibling — not a
          cropped one. Composite controls stay on the ladder too: a segmented
          tab is 28px inside a 4px-padded list, so the whole control lands on
          exactly 36px next to a button or select.
        </p>
        <ComponentPreview
          title="Both steps, every control"
          code={LADDER_CODE}
          minHeightClass="min-h-[280px]"
        >
          <LadderDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Token reference">
        <TokenTable />
      </DocSection>

      <DocSection title="Compact regions">
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Density is a property of a region, not of a control. Wrap the region
          in a<Code>SizeProvider</Code> and everything inside — including
          portalled popups, which inherit React context — takes the compact
          step together. Components never need individual wiring.
        </p>
        <ComponentPreview
          title="Filter bar"
          code={REGION_CODE}
          minHeightClass="min-h-[180px]"
        >
          <FilterBarDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Overriding per component">
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Each sized component also takes a <Code>size</Code> prop that wins
          over the provider: pin a primary action to the default step inside a
          compact toolbar, or drop a single control to compact in a default
          region. Compound components (Select, Tabs, Dropdown, the groups)
          accept it on their root and pass it to every part, popup included.
        </p>
        <ComponentPreview
          title="Pinned default in a compact region"
          code={OVERRIDE_CODE}
          minHeightClass="min-h-[140px]"
        >
          <OverrideDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="SizeProvider props">
        <PropsTable props={PROVIDER_PROPS} />
      </DocSection>

      <DocSection title="Component size prop">
        <PropsTable props={CONSUMER_PROPS} />
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Button keeps its earlier <Code>sm</Code> / <Code>md</Code> /
          <Code>lg</Code> values as aliases — <Code>sm</Code> resolves to
          compact, <Code>md</Code> and <Code>lg</Code> to default — so
          existing call sites keep compiling while new code uses the two
          canonical steps (<Code>icon</Code> / <Code>icon-compact</Code> for
          square buttons).
        </p>
      </DocSection>
    </DocPage>
  );
}
