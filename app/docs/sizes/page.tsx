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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/registry/default/table";
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
  {/* the same tree, one step down — 28px */}
</SizeProvider>`;

const TABLE_CODE = `import { SizeProvider } from "@/lib/size-context";

// Table rows sit on the same ladder: 36px default, 28px compact.
// <Table size="compact"> works too.

<SizeProvider size="compact">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Role</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow index={0}>
        <TableCell>Alice</TableCell>
        <TableCell>Engineer</TableCell>
        <TableCell>Active</TableCell>
      </TableRow>
      …
    </TableBody>
  </Table>
</SizeProvider>`;

const REGION_CODE = `import { SizeProvider } from "@/lib/size-context";

// One wrapper makes a whole region compact — filter bars, toolbars,
// table headers. Every control inside follows, popups included.

<SizeProvider size="compact">
  <div className="flex items-center gap-2">
    <Tabs value={view} onValueChange={setView}>…</Tabs>
    <Select value={sort} onValueChange={setSort}>…</Select>
    <Button variant="tertiary" leadingIcon={ListFilter}>Filter</Button>
    <Button leadingIcon={Plus}>New</Button>
  </div>
</SizeProvider>`;

const OVERRIDE_CODE = `// The size prop wins over the provider.

<SizeProvider size="compact">
  <Select …>…</Select>                {/* compact, from the provider */}
  <Button size="default" leadingIcon={Plus}>
    New project                       {/* pinned to 36px */}
  </Button>
</SizeProvider>`;

// ---------------------------------------------------------------------------
// Token reference
// ---------------------------------------------------------------------------

const TOKEN_ROWS: Array<{
  token: string;
  applies: string;
  def: string;
  compact: string;
}> = [
  { token: "control", applies: "Buttons, inputs, select triggers, subtle tabs", def: "h-9 · 36px", compact: "h-7 · 28px" },
  { token: "item", applies: "Menu, select, checkbox, radio and table rows", def: "h-9 · 36px", compact: "h-7 · 28px" },
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
// Table preview — the /docs/table content with a live size toggle
// ---------------------------------------------------------------------------

const PEOPLE = [
  { name: "Alice", role: "Engineer", status: "Active" },
  { name: "Bob", role: "Designer", status: "Away" },
  { name: "Carol", role: "Manager", status: "Active" },
];

function TablePreview() {
  const [size, setSize] = useState<SizeVariant>("default");

  return (
    <div className="flex w-full flex-col items-start gap-5">
      <Tabs value={size} onValueChange={(v) => setSize(v as SizeVariant)}>
        <TabsList>
          <TabItem value="default" label="Default" />
          <TabItem value="compact" label="Compact" />
        </TabsList>
      </Tabs>
      <SizeProvider size={size}>
        <div className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PEOPLE.map((p, i) => (
                <TableRow key={p.name} index={i}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.role}</TableCell>
                  <TableCell>{p.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SizeProvider>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compact region demo — a filter bar
// ---------------------------------------------------------------------------

const SORT_OPTIONS = [
  { value: "updated", label: "Last updated" },
  { value: "created", label: "Created" },
  { value: "name", label: "Name" },
];

function FilterBarDemo() {
  const [view, setView] = useState("all");
  const [sort, setSort] = useState("updated");

  return (
    <SizeProvider size="compact">
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
      "Controlled variant — pins every control in the subtree to one step.",
  },
  {
    name: "defaultSize",
    type: '"default" | "compact"',
    default: '"default"',
    description:
      "Uncontrolled initial variant, switchable via useSizeContext().setSize.",
  },
];

const CONSUMER_PROPS: PropDef[] = [
  {
    name: "size",
    type: '"default" | "compact"',
    default: "from provider",
    description:
      "Per-component override on Button, Select, Tabs, TabsSubtle, Dropdown, DropdownMenu, CheckboxGroup, RadioGroup, InputGroup, InputCopy, and Table. Wins over the surrounding SizeProvider.",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SizesPage() {
  return (
    <DocPage
      title="Sizes"
      description="Two control heights, one system: a 36px default and a 28px compact."
      slug="sizes"
      installSlug="size-context"
    >
      <DocSection title="The ladder">
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Every control sits on one of two heights. <Code>default</Code> is
          36px — room for the 13px label, easy to hit. <Code>compact</Code> is
          28px. It&apos;s not just a shorter box: text drops to 12px, icons to
          14px, checks to 13px, and paddings tighten with them. Nothing in
          between, so any mix of controls stays on the same rhythm.
        </p>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Which step fits depends on the product. Compact is made for
          data-heavy, productivity tools people work in all day — dashboards,
          admin panels, anything where density earns its keep. Default is the
          right call for everything else.
        </p>
        <ComponentPreview
          title="Both steps, every control"
          code={LADDER_CODE}
          minHeightClass="min-h-[280px]"
        >
          <LadderDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Preview">
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Real content is the honest test. Toggle the table below — or flip
          the whole site with the Size control in the right panel (press
          <Code>S</Code>).
        </p>
        <ComponentPreview
          title="Table"
          code={TABLE_CODE}
          minHeightClass="min-h-[240px]"
        >
          <TablePreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Compact regions">
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Density is a region decision, not a per-control one. Wrap the region
          in a<Code>SizeProvider</Code> and everything inside follows — popups
          included, since React context crosses portals.
        </p>
        <ComponentPreview
          title="Filter bar"
          code={REGION_CODE}
          minHeightClass="min-h-[160px]"
        >
          <FilterBarDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Overriding per component">
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          The <Code>size</Code> prop wins over the provider. Pin a primary
          action to default inside a compact toolbar, or drop a single control
          to compact in a default region.
        </p>
        <ComponentPreview
          title="Pinned default in a compact region"
          code={OVERRIDE_CODE}
          minHeightClass="min-h-[140px]"
        >
          <OverrideDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Token reference">
        <TokenTable />
      </DocSection>

      <DocSection title="SizeProvider props">
        <PropsTable props={PROVIDER_PROPS} />
      </DocSection>

      <DocSection title="Component size prop">
        <PropsTable props={CONSUMER_PROPS} />
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Button keeps its old <Code>sm</Code> / <Code>md</Code> /
          <Code>lg</Code> values as aliases (<Code>sm</Code> → compact, the
          rest → default), so existing code keeps compiling. New code uses the
          two canonical steps, with <Code>icon</Code> /{" "}
          <Code>icon-compact</Code> for square buttons.
        </p>
      </DocSection>
    </DocPage>
  );
}
