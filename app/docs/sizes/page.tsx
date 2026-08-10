"use client";

import { useRef, useState, type ReactNode } from "react";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { InspectOverlay } from "@/lib/docs/InspectOverlay";
import { useShape } from "@/registry/default/lib/shape-context";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { fontWeights } from "@/registry/default/lib/font-weight";
import {
  SizeProvider,
  sizeMap,
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
import { TabsSubtle, TabsSubtleItem } from "@/components/flavored/tabs-subtle";
import { InputGroup, InputField } from "@/registry/default/input-group";
import { CheckboxGroup, CheckboxItem } from "@/registry/radix/checkbox-group";
import { cn } from "@/registry/default/lib/utils";
import { ListFilter, Plus, Search, SquareKanban, Table2 } from "lucide-react";

/** Inline code chip used throughout the prose. */
function Code({ children }: { children: ReactNode }) {
  return (
    <code className="mx-1 rounded bg-muted px-1 py-0.5 text-caption">
      {children}
    </code>
  );
}

// ---------------------------------------------------------------------------
// Typography scale — live specimen rendered from the typeScale tokens
// ---------------------------------------------------------------------------

const TYPE_ROLES: Array<{
  role: TypeScaleRole;
  tag: string;
  label: string;
  weight: string;
  sample: string;
  muted?: boolean;
}> = [
  { role: "display", tag: "h1", label: "Display", weight: fontWeights.bold, sample: "Fluid Functionalism" },
  { role: "title", tag: "h2", label: "Title", weight: fontWeights.semibold, sample: "Create teamspace" },
  { role: "subtitle", tag: "h3", label: "Subtitle", weight: fontWeights.medium, sample: "Weekly design review" },
  { role: "body", tag: "p", label: "Body", weight: fontWeights.normal, sample: "The quick brown fox jumps over the lazy dog" },
  { role: "caption", tag: "small", label: "Caption", weight: fontWeights.normal, sample: "Last updated 4 minutes ago", muted: true },
];

function TypeScaleTable({ step }: { step: SizeVariant }) {
  return (
    <div className="flex flex-col gap-2">
      <span
        className="text-body text-foreground"
        style={{ fontVariationSettings: fontWeights.semibold }}
      >
        {step === "default" ? "Default" : "Compact"}
      </span>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-body">
          <thead>
            <tr className="border-b border-border">
              {["Role", "Size", "Sample"].map((h) => (
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
            {TYPE_ROLES.map(({ role, tag, label, weight, sample, muted }) => (
              <tr key={role} className="border-b border-border/50">
                <td className="px-3 py-2.5">
                  <code className="rounded bg-muted px-1 py-0.5 text-caption">
                    {tag}
                  </code>
                </td>
                <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                  {typeScale[role][step]}px
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={cn(
                      muted ? "text-muted-foreground" : "text-foreground",
                      "block truncate leading-snug max-w-[360px]"
                    )}
                    style={{
                      fontSize: typeScale[role][step],
                      fontVariationSettings: weight,
                    }}
                  >
                    {sample}
                  </span>
                  <span className="sr-only">{label}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
  { token: "control", applies: "Controls and rows — shared so popup rows line up with their trigger", def: "h-9 · 36px", compact: "h-7 · 28px" },
  { token: "segmentItem + segmentPad", applies: "Segmented tabs inside their padded list", def: "28px + 4px = 36px", compact: "24px + 2px = 28px" },
  { token: "text", applies: "Labels inside controls", def: "13px", compact: "12px" },
  { token: "icon", applies: "Leading/trailing icons, checkbox square, radio circle", def: "16px", compact: "14px" },
  { token: "px / itemPx", applies: "Control / row horizontal padding", def: "12px / 8px", compact: "10px / 6px" },
  { token: "gap", applies: "Icon-to-label and control-to-control gap", def: "8px", compact: "4px" },
];

function TokenTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-body border-collapse">
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
                <code className="rounded bg-muted px-1 py-0.5 text-caption">
                  {row.token}
                </code>
              </td>
              <td className="px-3 py-2 text-muted-foreground">{row.applies}</td>
              <td className="px-3 py-2 text-foreground whitespace-nowrap">
                {row.def}
              </td>
              <td className="px-3 py-2 text-foreground whitespace-nowrap">
                {row.compact}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ladder demo — the same B2B toolbar line at both steps
// ---------------------------------------------------------------------------

const TOOLBAR_CODE = `// The same toolbar line at each step. One SizeProvider pins the
// row; every control inside follows. activeLabel collapses inactive
// tabs to their icon, saving room for the search field.

const { gap } = useSize(); // icon-to-label and control-to-control gap: 8px / 4px

<SizeProvider size="compact">
  <div className={cn("flex items-center", gap)}>
    <TabsSubtle activeLabel selectedIndex={view} onSelect={setView}>
      <TabsSubtleItem index={0} icon={Table2} label="Table" />
      <TabsSubtleItem index={1} icon={SquareKanban} label="Board" />
    </TabsSubtle>
    <div className={cn("ml-auto flex items-center", gap)}>
      <InputGroup className="w-28">
        <InputField index={0} label="Search" labelHidden icon={Search}
          placeholder="Search…" value={query} onChange={setQuery} />
      </InputGroup>
      <Select value={sort} onValueChange={setSort}>…</Select>
      <Button variant="tertiary" size="icon-compact" aria-label="Filter">
        <ListFilter />
      </Button>
      <Button leadingIcon={Plus}>New</Button>
    </div>
  </div>
</SizeProvider>`;

const SORT_OPTIONS = [
  { value: "updated", label: "Last updated" },
  { value: "created", label: "Created" },
  { value: "name", label: "Name" },
];

/** Toolbar search — the real InputGroup field, label hidden for inline use.
 *  Hover, focus and sizing all come from the component. */
function SearchField({ variant }: { variant: SizeVariant }) {
  const [query, setQuery] = useState("");

  return (
    <InputGroup className={variant === "compact" ? "w-28" : "w-32"}>
      <InputField
        index={0}
        label="Search"
        labelHidden
        icon={Search}
        placeholder="Search…"
        value={query}
        onChange={setQuery}
      />
    </InputGroup>
  );
}

function ToolbarRow({ variant }: { variant: SizeVariant }) {
  const [view, setView] = useState(0);
  const [sort, setSort] = useState("updated");
  const compactStep = variant === "compact";
  // Control-to-control spacing comes from the ladder: gap is 8px at the
  // default step and 4px at compact — density is spacing as much as height.
  const gap = sizeMap[variant].gap;

  return (
    <SizeProvider size={variant}>
      <div className="flex w-full flex-col items-start gap-3">
        <span className="text-caption text-muted-foreground select-none">
          {variant === "default" ? "Default · 36px" : "Compact · 28px"}
        </span>
        <div className={cn("flex w-full flex-wrap items-center", gap)}>
          <TabsSubtle activeLabel selectedIndex={view} onSelect={setView}>
            <TabsSubtleItem index={0} icon={Table2} label="Table" />
            <TabsSubtleItem index={1} icon={SquareKanban} label="Board" />
          </TabsSubtle>
          <div className={cn("ml-auto flex items-center", gap)}>
            <SearchField variant={variant} />
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
            <Button
              variant="tertiary"
              size={compactStep ? "icon-compact" : "icon"}
              aria-label="Filter"
            >
              <ListFilter />
            </Button>
            <Button leadingIcon={Plus}>New</Button>
          </div>
        </div>
      </div>
    </SizeProvider>
  );
}

function ToolbarDemo() {
  return (
    <div className="flex w-full flex-col gap-8">
      <ToolbarRow variant="default" />
      <ToolbarRow variant="compact" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Token inspector — the reference table, measured live
// ---------------------------------------------------------------------------

function TokenInspectorDemo() {
  const [step, setStep] = useState<SizeVariant>("default");
  const [sort, setSort] = useState("updated");
  const [checked, setChecked] = useState<Set<number>>(new Set([0]));
  const shape = useShape();
  const frameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    // A stripped-down preview frame: no Preview/Code tabs, no Inspect
    // switch — the overlay is permanently on and the header holds the step
    // toggle instead. The header keeps z-40 so it sits above the overlay
    // (z-30) and stays clickable while the content is frozen.
    <div
      ref={frameRef}
      className={`relative flex flex-col w-full border border-border/60 ${shape.container}`}
    >
      <div
        className="relative z-40 flex items-center px-3 py-3 min-h-[52px] border-b border-border/60 bg-background"
        style={{ borderTopLeftRadius: "inherit", borderTopRightRadius: "inherit" }}
      >
        <TabsSubtle
          selectedIndex={step === "default" ? 0 : 1}
          onSelect={(i) => setStep(i === 0 ? "default" : "compact")}
        >
          <TabsSubtleItem index={0} label="Default" />
          <TabsSubtleItem index={1} label="Compact" />
        </TabsSubtle>
      </div>
      <div
        className="overflow-hidden"
        style={{
          borderBottomLeftRadius: "inherit",
          borderBottomRightRadius: "inherit",
        }}
      >
        <div
          ref={contentRef}
          className="relative flex items-center justify-center min-h-[200px] bg-background px-8 py-12"
        >
          <SizeProvider size={step}>
            <div className="flex flex-col items-start gap-4">
              <div
                className={cn("flex flex-wrap items-center", sizeMap[step].gap)}
              >
                <Button leadingIcon={Plus}>New project</Button>
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
              </div>
              <CheckboxGroup checkedIndices={checked} className="w-44">
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
            </div>
          </SizeProvider>
        </div>
      </div>
      <InspectOverlay frameRef={frameRef} contentRef={contentRef} />
    </div>
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
      "Per-component override on Button, Badge, Select, Tabs, TabsSubtle, Dropdown, DropdownMenu, CheckboxGroup, RadioGroup, InputGroup, InputCopy, InputMessage, Table, Switch, Slider, Accordion, AccordionGroup, AskUserQuestions, Card, ChatMessage, ColorPicker, ThinkingIndicator, and ThinkingSteps. Wins over the surrounding SizeProvider.",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SizesPage() {
  return (
    <DocPage
      title="Sizes"
      description="Two component sizes: a 36px default and a 28px compact."
      slug="sizes"
      installSlug="size-context"
    >
      <DocSection title="The principle">
        <p className="text-body text-muted-foreground leading-relaxed">
          An interface reads as one product when its controls share a sizing
          rhythm. A button next to a select next to a tab should land on the
          same height.
        </p>
        <p className="text-body text-muted-foreground leading-relaxed">
          Each size scales text, icons, and padding together.
        </p>
        <p className="text-body text-muted-foreground leading-relaxed">
          Compact is for dense, data-heavy tools; default is the right call
          for everything else.
        </p>
        <ComponentPreview code={TOOLBAR_CODE} minHeightClass="min-h-[220px]">
          <ToolbarDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Typography scale">
        <p className="text-body text-muted-foreground leading-relaxed">
          Type follows the ladder. Compact drops each role one notch, so a
          dense screen keeps the same hierarchy at a smaller size.
        </p>
        <div className="flex flex-col gap-10">
          <TypeScaleTable step="default" />
          <TypeScaleTable step="compact" />
        </div>
      </DocSection>

      <DocSection title="Compact regions">
        <p className="text-body text-muted-foreground leading-relaxed">
          Density is a region decision, not a per-control one. Wrap the region
          in a<Code>SizeProvider</Code> and everything inside follows — popups
          included, since React context crosses portals.
        </p>
      </DocSection>

      <DocSection title="Token reference">
        <p className="text-body text-muted-foreground leading-relaxed">
          The table, measured live: hover a control below and every number in
          the readout is a token from this table. Flip the step and the
          element re-measures under your cursor.
        </p>
        <TokenInspectorDemo />
        <TokenTable />
      </DocSection>

      <DocSection title="SizeProvider props">
        <PropsTable props={PROVIDER_PROPS} />
      </DocSection>

      <DocSection title="Component size prop">
        <PropsTable props={CONSUMER_PROPS} />
      </DocSection>
    </DocPage>
  );
}
