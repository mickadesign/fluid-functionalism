"use client";

import { useState, type ReactNode } from "react";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { fontWeights } from "@/registry/default/lib/font-weight";
import {
  SizeProvider,
  typeScale,
  type SizeVariant,
  type TypeScaleRole,
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
import {
  TabsSubtle,
  TabsSubtleItem,
  TabsSubtlePanel,
} from "@/components/flavored/tabs-subtle";
import { useIcon } from "@/lib/icon-context";
import { useSize } from "@/lib/size-context";
import { cn } from "@/registry/default/lib/utils";
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

// The whole view — category tabs and table rows — takes the compact
// step from one provider. <Table size="compact"> works too.

<SizeProvider size="compact">
  <TabsSubtle selectedIndex={tab} onSelect={setTab}>
    {categories.map((c, i) => (
      <TabsSubtleItem key={c.label} index={i} icon={c.icon} label={c.label} />
    ))}
  </TabsSubtle>

  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-[50px] text-center">Saved</TableHead>
        <TableHead className="w-[180px]">Author</TableHead>
        <TableHead>Quote</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {quotes.map((q, i) => (
        <TableRow key={q.id} index={i}>
          <TableCell className="text-center">…</TableCell>
          <TableCell>{q.author}</TableCell>
          <TableCell>{q.text}</TableCell>
        </TableRow>
      ))}
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
// Typography scale — live specimen rendered from the typeScale tokens
// ---------------------------------------------------------------------------

const TYPE_ROLES: Array<{
  role: TypeScaleRole;
  label: string;
  usage: string;
  weight: string;
  sample: string;
  uppercase?: boolean;
  muted?: boolean;
}> = [
  { role: "display", label: "Display", usage: "Page titles", weight: fontWeights.bold, sample: "Fluid Functionalism" },
  { role: "title", label: "Title", usage: "Section headings, dialog titles", weight: fontWeights.semibold, sample: "Create teamspace" },
  { role: "subtitle", label: "Subtitle", usage: "Card titles, chat bubbles", weight: fontWeights.medium, sample: "Weekly design review" },
  { role: "body", label: "Body", usage: "Control labels, body copy", weight: fontWeights.normal, sample: "The quick brown fox jumps over the lazy dog" },
  { role: "caption", label: "Caption", usage: "Descriptions, meta rows, errors", weight: fontWeights.normal, sample: "Last updated 4 minutes ago", muted: true },
  { role: "overline", label: "Overline", usage: "Eyebrows, group labels", weight: fontWeights.medium, sample: "Workspace", uppercase: true, muted: true },
];

function TypeScaleSpecimen() {
  return (
    <div className="flex flex-col">
      {TYPE_ROLES.map(({ role, label, usage, weight, sample, uppercase, muted }) => (
        <div
          key={role}
          className="flex flex-col gap-3 border-b border-border/50 py-4 last:border-b-0 sm:flex-row sm:items-baseline"
        >
          <div className="flex w-40 shrink-0 flex-col gap-0.5">
            <span
              className="text-[13px] text-foreground"
              style={{ fontVariationSettings: fontWeights.medium }}
            >
              {label}
              <span className="ml-2 tabular-nums text-muted-foreground">
                {typeScale[role].default}px · {typeScale[role].compact}px
              </span>
            </span>
            <span className="text-[12px] text-muted-foreground">{usage}</span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {(["default", "compact"] as const).map((step) => (
              <span
                key={step}
                className={
                  (muted ? "text-muted-foreground" : "text-foreground") +
                  " truncate leading-snug" +
                  (uppercase ? " uppercase tracking-wide" : "")
                }
                style={{
                  fontSize: typeScale[role][step],
                  fontVariationSettings: weight,
                }}
              >
                {sample}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

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
// Table preview — the /table Quotes example with a live size toggle
// ---------------------------------------------------------------------------

interface Quote {
  id: string;
  author: string;
  text: string;
}

const QUOTES: Record<string, Quote[]> = {
  Wisdom: [
    { id: "w1", author: "Marcus Aurelius", text: "The happiness of your life depends upon the quality of your thoughts." },
    { id: "w2", author: "Seneca", text: "We suffer more often in imagination than in reality." },
    { id: "w3", author: "Epictetus", text: "It is not what happens to you, but how you react to it that matters." },
    { id: "w4", author: "Lao Tzu", text: "A journey of a thousand miles begins with a single step." },
    { id: "w5", author: "Confucius", text: "It does not matter how slowly you go as long as you do not stop." },
  ],
  Ambition: [
    { id: "a1", author: "Steve Jobs", text: "Stay hungry, stay foolish." },
    { id: "a2", author: "Elon Musk", text: "When something is important enough, you do it even if the odds are not in your favor." },
    { id: "a3", author: "Naval Ravikant", text: "Seek wealth, not money or status. Wealth is having assets that earn while you sleep." },
    { id: "a4", author: "Jeff Bezos", text: "I knew that if I failed I wouldn't regret that, but I knew the one thing I might regret is not trying." },
    { id: "a5", author: "Peter Thiel", text: "Competition is for losers. If you want to create and capture lasting value, build a monopoly." },
  ],
  "Love & Life": [
    { id: "l1", author: "Antoine de Saint-Exupéry", text: "It is only with the heart that one can see rightly; what is essential is invisible to the eye." },
    { id: "l2", author: "Victor Hugo", text: "Life is the flower for which love is the honey." },
    { id: "l3", author: "Maya Angelou", text: "There is no greater agony than bearing an untold story inside you." },
    { id: "l4", author: "Khalil Gibran", text: "You talk when you cease to be at peace with your thoughts." },
    { id: "l5", author: "Oscar Wilde", text: "To live is the rarest thing in the world. Most people exist, that is all." },
  ],
  Creativity: [
    { id: "c1", author: "Dieter Rams", text: "Less, but better." },
    { id: "c2", author: "Jony Ive", text: "Simplicity is not the absence of clutter; that's a consequence of simplicity." },
    { id: "c3", author: "Pablo Picasso", text: "Every child is an artist. The problem is how to remain an artist once we grow up." },
    { id: "c4", author: "Steve Jobs", text: "Design is not just what it looks like and feels like. Design is how it works." },
    { id: "c5", author: "Paul Rand", text: "Design is the silent ambassador of your brand." },
  ],
  Philosophy: [
    { id: "p1", author: "Friedrich Nietzsche", text: "He who has a why to live can bear almost any how." },
    { id: "p2", author: "Albert Camus", text: "In the depth of winter, I finally learned that within me there lay an invincible summer." },
    { id: "p3", author: "Simone de Beauvoir", text: "One is not born, but rather becomes, a woman." },
    { id: "p4", author: "Jean-Paul Sartre", text: "Man is condemned to be free; because once thrown into the world, he is responsible for everything he does." },
    { id: "p5", author: "Hannah Arendt", text: "The sad truth is that most evil is done by people who never make up their minds to be good or evil." },
  ],
};

/** The /table page's inline row checkbox, riding the size ladder (18px → 15px). */
function RowCheckbox({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  const sizeClasses = useSize();
  const compact = sizeClasses.variant === "compact";
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label="Save quote"
      onClick={onToggle}
      className={cn(
        "relative shrink-0 appearance-none bg-transparent p-0 border-0 outline-none cursor-pointer",
        "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] rounded-[5px]",
        compact ? "w-[15px] h-[15px]" : "w-[18px] h-[18px]"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 border-solid transition-all duration-80",
          compact ? "rounded-[4px]" : "rounded-[5px]",
          checked
            ? "border-[1.5px] border-transparent"
            : "border-[1.5px] border-border"
        )}
      />
      {checked && (
        <svg
          width={compact ? 15 : 18}
          height={compact ? 15 : 18}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute inset-0 text-foreground"
        >
          <path d="M6 12L10 16L18 8" />
        </svg>
      )}
    </button>
  );
}

function TablePreview() {
  const [size, setSize] = useState<SizeVariant>("default");
  const [category, setCategory] = useState(0);
  const [saved, setSaved] = useState<Set<string>>(new Set(["w1"]));

  const Lightbulb = useIcon("lightbulb");
  const Rocket = useIcon("rocket");
  const Heart = useIcon("heart");
  const Paintbrush = useIcon("paintbrush");
  const Brain = useIcon("brain");

  const categories = [
    { icon: Lightbulb, label: "Wisdom" },
    { icon: Rocket, label: "Ambition" },
    { icon: Heart, label: "Love & Life" },
    { icon: Paintbrush, label: "Creativity" },
    { icon: Brain, label: "Philosophy" },
  ];

  const rows = QUOTES[categories[category].label] ?? [];

  const toggleSaved = (id: string) =>
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex w-full flex-col items-start gap-5">
      <Tabs value={size} onValueChange={(v) => setSize(v as SizeVariant)}>
        <TabsList>
          <TabItem value="default" label="Default" />
          <TabItem value="compact" label="Compact" />
        </TabsList>
      </Tabs>
      <SizeProvider size={size}>
        <div className="flex w-full flex-col gap-3">
          <TabsSubtle
            idPrefix="sizes-quotes"
            selectedIndex={category}
            onSelect={setCategory}
          >
            {categories.map((c, i) => (
              <TabsSubtleItem
                key={c.label}
                index={i}
                icon={c.icon}
                label={c.label}
              />
            ))}
          </TabsSubtle>
          {categories.map((c, i) => (
            <TabsSubtlePanel
              key={c.label}
              index={i}
              selectedIndex={category}
              idPrefix="sizes-quotes"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] text-center">Saved</TableHead>
                    <TableHead className="w-[180px]">Author</TableHead>
                    <TableHead>Quote</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((q, idx) => (
                    <TableRow key={q.id} index={idx}>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <RowCheckbox
                            checked={saved.has(q.id)}
                            onToggle={() => toggleSaved(q.id)}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {q.author}
                      </TableCell>
                      <TableCell>{q.text}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsSubtlePanel>
          ))}
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
      "Per-component override on Button, Badge, Select, Tabs, TabsSubtle, Dropdown, DropdownMenu, CheckboxGroup, RadioGroup, InputGroup, InputCopy, Table, Switch, Slider, Accordion, AccordionGroup, AskUserQuestions, Card, ChatMessage, and ColorPicker. Wins over the surrounding SizeProvider.",
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

      <DocSection title="Typography scale">
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Six roles, two steps each. The default column is the system as it
          ships today; compact drops every role one notch so a dense screen
          keeps the same hierarchy at a smaller size. Components already
          render <Code>subtitle</Code>, <Code>body</Code>, and
          <Code>caption</Code> through the ladder — <Code>display</Code>,
          <Code>title</Code>, and <Code>overline</Code> are for composing
          your own screens, exported as <Code>typeScale</Code> from
          <Code>size-context</Code>.
        </p>
        <TypeScaleSpecimen />
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
          Button and Badge keep their old <Code>sm</Code> / <Code>md</Code> /
          <Code>lg</Code> values as aliases (<Code>sm</Code> → compact, the
          rest → default), so existing code keeps compiling. New code uses the
          two canonical steps, with <Code>icon</Code> /{" "}
          <Code>icon-compact</Code> for square buttons.
        </p>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Three components follow the ladder in their own way: Switch scales
          its track and thumb (34×20 → 28×16), Slider switches design — the
          pip/scrubber layout at the default step, the dense range-capable one
          at compact — and Dialog narrows one notch in width, padding
          untouched.
        </p>
      </DocSection>
    </DocPage>
  );
}
