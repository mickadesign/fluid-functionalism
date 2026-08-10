"use client";

import { useRef, useState, type ReactNode } from "react";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { InspectOverlay, type InspectRaw } from "@/lib/docs/InspectOverlay";
import { useShape } from "@/registry/default/lib/shape-context";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { ScrollArea } from "@/registry/base/scroll-area";
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
import { Dropdown } from "@/components/flavored/dropdown";
import { MenuItem } from "@/registry/default/menu-item";
import { cn } from "@/registry/default/lib/utils";
import { ChevronDown, ListFilter, Plus, Search, SquareKanban, Table2 } from "lucide-react";

/** Inline code chip used throughout the prose. */
function Code({ children }: { children: ReactNode }) {
  return (
    <code className="mx-1 rounded bg-[light-dark(#EBEBED,#2C2C2C)] px-1 py-0.5 text-caption text-foreground">
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
      <ScrollArea
        orientation="horizontal"
        viewportClassName="scroll-fade-x"
        className="w-full"
      >
        <table className="w-full min-w-[480px] border-collapse text-body [&_th:first-child]:pl-0 [&_td:first-child]:pl-0">
          {/* Column labels stay for screen readers only — the samples are
              self-describing and the header row just added chrome. */}
          <thead className="sr-only">
            <tr>
              {["Size", "Sample", "Role"].map((h) => (
                <th key={h} className="text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TYPE_ROLES.map(({ role, tag, label, weight, sample, muted }) => (
              <tr key={role} className="border-b border-border/50">
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
                <td className="px-3 py-2.5">
                  <code className="rounded bg-[light-dark(#EBEBED,#2C2C2C)] px-1 py-0.5 text-caption text-foreground">
                    {tag}
                  </code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
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
  { token: "control", applies: "Controls and rows — shared so menu rows line up with their trigger", def: "h-9 · 36px", compact: "h-7 · 28px" },
  { token: "segmentItem + segmentPad", applies: "Segmented tabs inside their padded list", def: "28px + 4px = 36px", compact: "24px + 2px = 28px" },
  { token: "text", applies: "Labels inside controls", def: "13px", compact: "12px" },
  { token: "icon", applies: "Leading/trailing icons, checkbox square, radio circle", def: "16px", compact: "14px" },
  { token: "px / itemPx", applies: "Control / row horizontal padding", def: "12px / 8px", compact: "10px / 6px" },
  { token: "gap", applies: "Icon-to-label and control-to-control gap", def: "8px", compact: "4px" },
];

function TokenTable() {
  return (
    <ScrollArea
      orientation="horizontal"
      viewportClassName="scroll-fade-x"
      className="w-full"
    >
      <table className="w-full min-w-[560px] text-body border-collapse [&_th:first-child]:pl-0 [&_td:first-child]:pl-0">
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
                <code className="rounded bg-[light-dark(#EBEBED,#2C2C2C)] px-1 py-0.5 text-caption text-foreground">
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
    </ScrollArea>
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
function SearchField() {
  const [query, setQuery] = useState("");

  return (
    <InputGroup className="w-24">
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

/** Spec-sheet height guides for a toolbar row: a blue line along the row's
 *  top and bottom edges, and a double-headed arrow with the height on the
 *  right. Desktop-only decoration — on phones it would collide with the
 *  wrapped controls. */
function HeightGuides({ height }: { height: number }) {
  const line = { backgroundColor: "#6B97FF", opacity: 0.5 };
  return (
    <div aria-hidden className="pointer-events-none hidden sm:block">
      <div className="absolute inset-x-0 top-0 h-px" style={line} />
      <div className="absolute inset-x-0 bottom-0 h-px" style={line} />
      <div className="absolute right-0 inset-y-0 flex items-center gap-1">
        <svg
          width={8}
          height={height}
          viewBox={`0 0 8 ${height}`}
          fill="none"
        >
          <path
            d={`M4,1.5 V${height - 1.5}`}
            stroke="#6B97FF"
            strokeWidth={1.25}
            strokeLinecap="round"
          />
          <path
            d={`M1.5,5 L4,1.5 L6.5,5`}
            stroke="#6B97FF"
            strokeWidth={1.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={`M1.5,${height - 5} L4,${height - 1.5} L6.5,${height - 5}`}
            stroke="#6B97FF"
            strokeWidth={1.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          className="text-caption tabular-nums"
          style={{ color: "#6B97FF", fontVariationSettings: fontWeights.semibold }}
        >
          {height}px
        </span>
      </div>
    </div>
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
        <div className="relative w-full">
          <div
            className={cn("flex w-full flex-wrap items-center sm:pr-[44px]", gap)}
          >
            <TabsSubtle activeLabel selectedIndex={view} onSelect={setView}>
              <TabsSubtleItem index={0} icon={Table2} label="Table" />
              <TabsSubtleItem index={1} icon={SquareKanban} label="Board" />
            </TabsSubtle>
            <div className={cn("ml-auto flex items-center", gap)}>
              {/* Mobile shows the trimmed toolbar — tabs, filter, primary
                  action; search and sort return at sm. display:contents keeps
                  the row's gap running through the wrapper at sm+. */}
              <div className="hidden sm:contents">
                <SearchField />
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger placeholder="Sort by" className="min-w-36 w-36" />
                  <SelectContent>
                    {SORT_OPTIONS.map((o, i) => (
                      <SelectItem key={o.value} value={o.value} index={i}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
          <HeightGuides height={compactStep ? 28 : 36} />
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
// Compact region demo — one provider pins the bar AND the menu it opens
// ---------------------------------------------------------------------------

const REGION_CODE = `import { SizeProvider } from "@/lib/size-context";

// One wrapper pins the whole region — the buttons AND the menu their
// trigger opens. React context crosses portals, so the menu's rows
// come back compact too.

<SizeProvider size="compact">
  <div className={cn("flex items-center", gap)}>
    <Button variant="tertiary" trailingIcon={ChevronDown}>
      Last updated
    </Button>
    <Button variant="tertiary" size="icon-compact" aria-label="Filter">
      <ListFilter />
    </Button>
    <Button leadingIcon={Plus}>New</Button>
  </div>
</SizeProvider>`;

function CompactRegionDemo() {
  const [sort, setSort] = useState(0);

  return (
    // Extra right padding reserves room for the annotation; the arrow and
    // label are absolutely positioned against this wrapper.
    <div className="relative w-fit sm:pr-64">
      <SizeProvider size="compact">
        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-1">
            <Button variant="tertiary" active trailingIcon={ChevronDown}>
              {SORT_OPTIONS[sort].label}
            </Button>
            <Button variant="tertiary" size="icon-compact" aria-label="Filter">
              <ListFilter />
            </Button>
            <Button leadingIcon={Plus}>New</Button>
          </div>
          {/* The trigger's menu, frozen open (the inline Dropdown panel —
              same trick as the surfaces page) so the inherited step is
              visible without fighting a real portal in the docs. */}
          {/* inert: the frozen-open menu is an illustration — it should
              neither take clicks/focus nor be announced. */}
          <div inert className="select-none">
            <Dropdown checkedIndex={sort} className="!w-48">
              {SORT_OPTIONS.map((o, i) => (
                <MenuItem
                  key={o.value}
                  index={i}
                  label={o.label}
                  checked={sort === i}
                  onSelect={() => setSort(i)}
                />
              ))}
            </Dropdown>
          </div>
        </div>
      </SizeProvider>

      {/* Blue callout — same annotation language as the surfaces page. The
          label's top-left corner sits at the arrow's tail. Annotation is
          desktop-only; on phones it would collide with the panel. */}
      <svg
        className="absolute pointer-events-none hidden sm:block"
        style={{ left: 200, top: 8 }}
        width={130}
        height={100}
        viewBox="0 0 130 100"
        fill="none"
        aria-hidden
      >
        <defs>
          <marker
            id="ff-sizes-annotation-arrow"
            viewBox="0 0 12 12"
            markerWidth="12"
            markerHeight="12"
            refX="8.5"
            refY="6"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path
              d="M3,2.5 L8.5,6 L3,9.5"
              fill="none"
              stroke="context-stroke"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
        </defs>
        <path
          d="M112,20 Q70,26 22,66"
          stroke="#6B97FF"
          strokeWidth={1.5}
          strokeLinecap="round"
          markerEnd="url(#ff-sizes-annotation-arrow)"
        />
      </svg>
      <span
        className="absolute text-caption leading-snug select-none hidden sm:block"
        style={{
          left: 318,
          top: 18,
          color: "#6B97FF",
          fontVariationSettings: fontWeights.semibold,
        }}
      >
        The menu inherits
        <br />
        the region&apos;s step
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Token inspector — the reference table, measured live
// ---------------------------------------------------------------------------

/** Maps an inspected element's raw measurements to the ladder tokens they
 *  came from, resolved for the active step — the inspector's tooltip shows
 *  the token table, not generic CSS. */
function tokenReadout(raw: InspectRaw, step: SizeVariant) {
  const t = sizeMap[step];
  const eq = (a: number, b: number) => Math.abs(a - b) < 0.6;
  const px = step === "default" ? 12 : 10;
  const itemPx = step === "default" ? 8 : 6;
  const gap = step === "default" ? 8 : 4;
  const text = typeScale.body[step];

  const rows: Array<[string, string]> = [];
  if (eq(raw.height, t.controlHeight))
    rows.push(["control", `${t.controlHeight}px`]);
  if (eq(raw.width, t.icon) && eq(raw.height, t.icon))
    rows.push(["icon", `${t.icon}px`]);
  if (raw.fontSize !== null && eq(raw.fontSize, text))
    rows.push(["text", `${text}px`]);
  if (eq(raw.pl, px) || eq(raw.pr, px)) rows.push(["px", `${px}px`]);
  else if (eq(raw.pl, itemPx) || eq(raw.pr, itemPx))
    rows.push(["itemPx", `${itemPx}px`]);
  if (eq(raw.gap, gap)) rows.push(["gap", `${gap}px`]);
  return rows;
}

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
      <InspectOverlay
        frameRef={frameRef}
        contentRef={contentRef}
        renderTooltip={(raw) => {
          const rows = tokenReadout(raw, step);
          return (
            <div className="font-mono text-[11px] leading-[1.55] normal-case tracking-normal">
              {rows.length > 0 ? (
                rows.map(([token, value]) => (
                  <div key={token}>
                    <span
                      className="font-semibold"
                      style={{ color: "#6B97FF" }}
                    >
                      {token}
                    </span>{" "}
                    {value}
                  </div>
                ))
              ) : (
                <div>
                  outside the ladder · {Math.round(raw.width)} ×{" "}
                  {Math.round(raw.height)}
                </div>
              )}
            </div>
          );
        }}
      />
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
      description={
        <>
          Two component sizes: a 36px default and a 28px compact. Press
          <Code>S</Code> to toggle on the website.
        </>
      }
      slug="sizes"
      installSlug="size-context"
      installNote="Installs the size-context lib: SizeProvider, the useSize and useTypeScale hooks, and the token maps behind both steps."
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
        <div className="flex flex-col gap-10 pt-3">
          <TypeScaleTable step="default" />
          <TypeScaleTable step="compact" />
        </div>
      </DocSection>

      <DocSection title="Compact regions">
        <p className="text-body text-muted-foreground leading-relaxed">
          Density is a region decision, not a per-control one. Wrap the region
          in a<Code>SizeProvider</Code> and everything inside follows — menus
          included, since React context crosses portals.
        </p>
        <ComponentPreview code={REGION_CODE} minHeightClass="min-h-[260px]">
          <CompactRegionDemo />
        </ComponentPreview>
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
